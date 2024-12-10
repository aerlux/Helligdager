// Fastsette helligdager i Norge
const baseHolidays = {
    "1-1": "Nyttårsdag",
    "5-1": "Arbeidernes dag",
    "5-17": "Grunnlovsdag",
    "12-25": "Første juledag",
    "12-26": "Andre juledag",
};

// Initialiser nåværende år og aktiveringsstatus
let currentYear = new Date().getFullYear();
let isHighlightActive = false;

// Funksjon for å beregne bevegelige helligdager
function calculateMovableHolidays(year) {
    const holidays = {};
    const easterDate = calculateEasterDate(year);

    holidays[easterDate.format("M-D")] = "Første påskedag";
    holidays[easterDate.clone().subtract(2, "days").format("M-D")] = "Langfredag";
    holidays[easterDate.clone().subtract(1, "days").format("M-D")] = "Skjærtorsdag";
    holidays[easterDate.clone().add(3, "days").format("M-D")] = "Andre påskedag";
    holidays[easterDate.clone().add(39, "days").format("M-D")] = "Kristi himmelfartsdag";
    holidays[easterDate.clone().add(10, "days").format("M-D")] = "Første pinsedag";
    holidays[easterDate.clone().add(11, "days").format("M-D")] = "Andre pinsedag";

    return holidays;
}

// Funksjon for å beregne påskedag
function calculateEasterDate(year) {
    const f = Math.floor,
        G = year % 19,
        C = f(year / 100),
        H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
        I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
        J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
        L = I - J,
        month = 3 + f((L + 40) / 44),
        day = L + 28 - 31 * f(month / 4);
    return moment(`${year}-${month}-${day}`);
}

// Generer kalender
function generateCalendar(year) {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = ""; // Fjern tidligere innhold

    const holidays = { ...baseHolidays, ...calculateMovableHolidays(year) };

    const norwegianMonths = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const monthContainer = document.createElement("div");
        monthContainer.classList.add("month");
        const monthName = norwegianMonths[month];
        monthContainer.innerHTML = `<h3>${monthName}</h3>`;
        calendar.appendChild(monthContainer);

        const grid = document.createElement("div");
        grid.classList.add("grid");

        // Ukedager header
        const daysOfWeek = ["S", "M", "T", "O", "T", "F", "L"];
        daysOfWeek.forEach((day) => {
            const dayHeader = document.createElement("div");
            dayHeader.classList.add("day-header");
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        // Legg til blanke dager for justering
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement("div");
            blank.classList.add("day", "blank");
            if ((firstDay - i) % 7 === 1) {
                blank.classList.add("empty-sunday");
                blank.title = "Tom søndag";
            }
            grid.appendChild(blank);
        }

        // Legg til faktiske dager
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.dataset.month = month;

            const dateKey = `${month + 1}-${day}`;
            if (holidays[dateKey]) {
                dayElement.classList.add("holiday");
                dayElement.title = holidays[dateKey];
            }

            // Marker søndager
            const currentDate = new Date(year, month, day);
            if (currentDate.getDay() === 0) {
                dayElement.classList.add("sunday");
            }

            dayElement.textContent = day;
            grid.appendChild(dayElement);
        }

        monthContainer.appendChild(grid);
    }
}

function highlightVacationDays(year) {
    const calendar = document.getElementById("calendar");
    const days = Array.from(calendar.querySelectorAll(".day"));

    days.forEach((day, index) => {
        if (!day.textContent || day.classList.contains("blank")) {
            return;
        }

        const isHoliday = (day) => day && day.classList.contains("holiday");
        const isWeekend = (day) => {
            if (!day || day.classList.contains("blank") || !day.textContent) {
                return false;
            }
            const currentDate = new Date(year, parseInt(day.dataset.month), parseInt(day.textContent));
            return currentDate.getDay() === 0 || currentDate.getDay() === 6;
        };

        const isWorkday = (day) => {
            return !isHoliday(day) && !isWeekend(day);
        };

        if (
            index > 0 &&
            index < days.length - 1 &&
            (isHoliday(days[index - 1]) || isWeekend(days[index - 1])) &&
            (isHoliday(days[index + 1]) || isWeekend(days[index + 1])) &&
            isWorkday(day)
        ) {
            day.classList.add("vacation");
            day.title = "Inneklemt dag (single)";
        }

        if (
            index > 1 &&
            index < days.length - 2 &&
            (isHoliday(days[index - 1]) || isWeekend(days[index - 1])) &&
            (isHoliday(days[index + 2]) || isWeekend(days[index + 2])) &&
            isWorkday(days[index]) &&
            isWorkday(days[index + 1])
        ) {
            days[index].classList.add("vacation-pair");
            days[index + 1].classList.add("vacation-pair");
            days[index].title = "Inneklemt dag (pair)";
            days[index + 1].title = "Inneklemt dag (pair)";
        }
    });
}

function removeVacationHighlights() {
    const calendar = document.getElementById("calendar");
    calendar.querySelectorAll(".vacation, .vacation-pair").forEach((day) => {
        day.classList.remove("vacation", "vacation-pair");
        day.removeAttribute("title");
    });
}

function toggleInneklemtDag() {
    isHighlightActive = !isHighlightActive;
    const button = document.getElementById("toggleInneklemtBtn");

    if (isHighlightActive) {
        highlightVacationDays(currentYear);
        button.classList.add("active");
        button.textContent = "Skjul inneklemte dager";
    } else {
        removeVacationHighlights();
        button.classList.remove("active");
        button.textContent = "Highlight \"Inneklemt Dag\"";
    }
}

document.getElementById("toggleInneklemtBtn").addEventListener("click", toggleInneklemtDag);


function updateView() {
    document.getElementById("currentYear").textContent = currentYear;
    generateCalendar(currentYear);
    if (isHighlightActive) highlightVacationDays(currentYear);
}

function initialize() {
    document.getElementById("currentYear").textContent = currentYear;
    generateCalendar(currentYear);
    document.getElementById("prevYear").addEventListener("click", () => {
        currentYear -= 1;
        updateView();
    });

    document.getElementById("nextYear").addEventListener("click", () => {
        currentYear += 1;
        updateView();
    });

    document.getElementById("toggleInneklemt").addEventListener("change", toggleInneklemtDag);
}

document.addEventListener("DOMContentLoaded", initialize);
