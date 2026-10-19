const fs = require('node:fs');
const path = require('node:path');

const TIME_ZONE = 'Asia/Kolkata';
const people = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'birthdays.json'), 'utf8')
);

function dateParts(date) {
    const values = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    return Object.fromEntries(values.map(({ type, value }) => [type, value]));
}

function getTomorrowInIndia() {
    const parts = dateParts(new Date());
    const tomorrow = new Date(Date.UTC(
        Number(parts.year), Number(parts.month) - 1, Number(parts.day) + 1
    ));
    return {
        month: String(tomorrow.getUTCMonth() + 1).padStart(2, '0'),
        day: String(tomorrow.getUTCDate()).padStart(2, '0'),
        label: new Intl.DateTimeFormat('en-IN', {
            timeZone: TIME_ZONE,
            day: 'numeric',
            month: 'long'
        }).format(tomorrow)
    };
}

function parseBirthday(dob) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dob);
    if (!match) throw new Error(`Invalid birthday date: ${dob}`);
    return { day: match[1].padStart(2, '0'), month: match[2].padStart(2, '0') };
}

function twilioConfigured(sender) {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && sender);
}

async function sendTwilioMessage(to, from, body, template) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const form = new URLSearchParams({ To: to, From: from });
    if (template) {
        form.set('ContentSid', template.contentSid);
        form.set('ContentVariables', JSON.stringify(template.variables));
    } else {
        form.set('Body', body);
    }
    const authorization = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${authorization}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(`Twilio returned ${response.status}: ${result.message || 'message could not be sent'}`);
    }
}

async function sendEmail(subject, body) {
    const { RESEND_API_KEY, REMINDER_EMAIL_TO, REMINDER_EMAIL_FROM } = process.env;
    if (!RESEND_API_KEY || !REMINDER_EMAIL_TO || !REMINDER_EMAIL_FROM) {
        throw new Error('Email fallback is not configured (RESEND_API_KEY, REMINDER_EMAIL_TO, REMINDER_EMAIL_FROM).');
    }
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: REMINDER_EMAIL_FROM, to: [REMINDER_EMAIL_TO], subject, text: body })
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Email provider returned ${response.status}: ${detail}`);
    }
}

async function main() {
    const tomorrow = getTomorrowInIndia();
    const birthdayPeople = people.filter((person) => {
        const birthday = parseBirthday(person.dob);
        return birthday.day === tomorrow.day && birthday.month === tomorrow.month;
    });

    if (birthdayPeople.length === 0) {
        console.log(`No birthdays on ${tomorrow.label} (${TIME_ZONE}).`);
        return;
    }

    const names = birthdayPeople.map(({ name }) => name);
    const siteUrl = 'https://akkuagney55.github.io/btech/';
    const body = `Tomorrow (${tomorrow.label}) is ${names.length === 1 ? 'the birthday' : 'the birthdays'} of ${names.join(', ')}.\n\n${siteUrl}`;
    const subject = `Birthday reminder for ${tomorrow.label}`;
    const phone = process.env.RECIPIENT_PHONE;
    const validPhone = phone && /^\+[1-9]\d{7,14}$/.test(phone);
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
    const smsFrom = process.env.TWILIO_SMS_FROM;
    const whatsappContentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;
    const whatsappTemplate = whatsappContentSid ? {
        contentSid: whatsappContentSid,
        variables: { '1': names.join(', '), '2': tomorrow.label, '3': siteUrl }
    } : null;

    if (twilioConfigured(whatsappFrom) && validPhone) {
        try {
            await sendTwilioMessage(`whatsapp:${phone}`, whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`, body, whatsappTemplate);
            console.log('Birthday reminder sent via WhatsApp.');
            return;
        } catch (error) {
            console.error(`WhatsApp delivery failed: ${error.message}`);
        }
    } else if (twilioConfigured(whatsappFrom) && !validPhone) {
        console.error('WhatsApp delivery skipped: BIRTHDAY_RECIPIENT_PHONE is missing or not E.164 formatted.');
    }

    if (twilioConfigured(smsFrom) && validPhone) {
        try {
            await sendTwilioMessage(phone, smsFrom, body);
            console.log('Birthday reminder sent via SMS.');
            return;
        } catch (error) {
            console.error(`SMS delivery failed: ${error.message}`);
        }
    } else if (twilioConfigured(smsFrom) && !validPhone) {
        console.error('SMS delivery skipped: BIRTHDAY_RECIPIENT_PHONE is missing or not E.164 formatted.');
    }

    await sendEmail(subject, body);
    console.log('Birthday reminder sent via email.');
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
