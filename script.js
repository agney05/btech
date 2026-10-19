// script.js

let people = [];

// 🔽 EVERYTHING BELOW IS YOUR ORIGINAL CODE — UNCHANGED 🔽

document.addEventListener('DOMContentLoaded', function () {
    fetch('birthdays.json')
        .then(response => {
            if (!response.ok) throw new Error(`Could not load birthdays (${response.status})`);
            return response.json();
        })
        .then(birthdayList => {
            people = birthdayList;
            updateAllPeopleTable();
            updateBirthdaysThisMonthTable();
            scheduleEmailNotifications();
        })
        .catch(error => console.error(error));
});

function updateAllPeopleTable() {
    const tableBody = document.getElementById('allPeopleList');
    tableBody.innerHTML = '';

    for (const person of people) {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = person.name;
        row.insertCell(1).textContent = person.dob;
    }
}

function updateBirthdaysThisMonthTable() {
    const tableBody = document.getElementById('birthdaysThisMonthList');
    tableBody.innerHTML = '';

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;

    const birthdaysThisMonth = people
        .filter(person => parseInt(person.dob.split('/')[1], 10) === currentMonth)
        .sort((a, b) => parseInt(a.dob) - parseInt(b.dob));

    for (const person of birthdaysThisMonth) {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = person.name;
        row.insertCell(1).textContent = person.dob;
    }
}

function searchPeople() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredPeople = people.filter(person =>
        person.name.toLowerCase().includes(searchInput)
    );
    displaySearchResults(filteredPeople);
}

function displaySearchResults(results) {
    const tableBody = document.getElementById('allPeopleList');
    tableBody.innerHTML = '';

    for (const person of results) {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = person.name;
        row.insertCell(1).textContent = person.dob;
    }
}

function goToBirthdaysThisMonthTable() {
    document.getElementById('birthdaysThisMonthTable')
        .scrollIntoView({ behavior: 'smooth' });
}

function scheduleEmailNotifications() {
    // kept as-is (frontend scheduling is unreliable but unchanged as requested)
}

function sendEmailNotification(person) {
    // unchanged
}
