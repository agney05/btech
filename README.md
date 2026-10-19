# btech

Birthday list for the B.Tech class, with an automated daily reminder for birthdays coming up tomorrow.

## Set up WhatsApp, SMS, and email reminders

The GitHub Pages site is static, so it cannot send a scheduled message on its own. A GitHub Actions workflow checks the list daily at 05:30 India Standard Time and sends one reminder when there is a birthday the next day. It tries WhatsApp first, then SMS, then email.

In the repository's **Settings → Secrets and variables → Actions**, add these repository secrets:

| Secret | Purpose |
| --- | --- |
| `BIRTHDAY_RECIPIENT_PHONE` | Recipient number in international E.164 format, for example `+91...` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender, such as `whatsapp:+14155238886` |
| `TWILIO_WHATSAPP_CONTENT_SID` | Approved WhatsApp template Content SID (needed for scheduled messages outside WhatsApp's 24-hour reply window) |
| `TWILIO_SMS_FROM` | Twilio SMS-enabled sender number, for fallback |
| `RESEND_API_KEY` | Resend API key, for email fallback |
| `REMINDER_EMAIL_TO` | Email address to receive fallback reminders |
| `REMINDER_EMAIL_FROM` | Sender address verified with Resend |

WhatsApp requires an enabled Twilio WhatsApp sender and recipient opt-in. For a reminder sent outside the 24-hour customer service window, WhatsApp requires a pre-approved message template; set its Content SID in `TWILIO_WHATSAPP_CONTENT_SID`. The template should use three variables: `{{1}}` for the birthday name(s), `{{2}}` for the date, and `{{3}}` for the site link. SMS requires an SMS-enabled Twilio sender. Email uses Resend and requires a verified sender domain/address. Add only the channels you have configured; if one delivery attempt fails, the workflow tries the next configured channel. The recipient number and provider credentials belong in GitHub secrets, never in the source files.

Use **Actions → Birthday reminders → Run workflow** to send a reminder immediately for a birthday tomorrow in India. The scheduled workflow requires GitHub Actions to be enabled for the repository.
