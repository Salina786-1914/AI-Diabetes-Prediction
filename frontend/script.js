const API_URL = "https://ai-diabetes-api.onrender.com/predict";

/* ================= NAVIGATION ================= */

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".section");
const pageTitle = document.getElementById("pageTitle");

const titles = {
    overview: "Overview",
    prediction: "Risk Prediction",
    analytics: "Model Analytics",
    history: "Prediction History",
    about: "About AI"
};

function showSection(sectionName) {

    sections.forEach(section => {
        section.classList.remove("active-section");
    });

    const selected = document.getElementById(sectionName);

    if (selected) {
        selected.classList.add("active-section");
    }

    navItems.forEach(item => {
        item.classList.remove("active");

        if (item.dataset.section === sectionName) {
            item.classList.add("active");
        }
    });

    pageTitle.textContent = titles[sectionName] || "Overview";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (sectionName === "history") {
        loadHistory();
    }
}


navItems.forEach(item => {

    item.addEventListener("click", () => {

        showSection(item.dataset.section);

    });

});


function openPrediction() {
    showSection("prediction");
}


/* ================= FORM ================= */

const form = document.getElementById("predictionForm");

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const button = document.querySelector(".analyze-btn");
    const buttonText = document.getElementById("buttonText");

    button.disabled = true;
    buttonText.textContent = "Analyzing...";

    const data = {

        pregnancies:
            Number(document.getElementById("pregnancies").value),

        glucose:
            Number(document.getElementById("glucose").value),

        blood_pressure:
            Number(document.getElementById("blood_pressure").value),

        skin_thickness:
            Number(document.getElementById("skin_thickness").value),

        insulin:
            Number(document.getElementById("insulin").value),

        bmi:
            Number(document.getElementById("bmi").value),

        diabetes_pedigree:
            Number(document.getElementById("diabetes_pedigree").value),

        age:
            Number(document.getElementById("age").value)

    };


    updatePreview(data);


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });


        if (!response.ok) {
            throw new Error("Prediction API error");
        }


        const result = await response.json();

        displayResult(result);

        saveHistory(data, result);

    }

    catch(error) {

        console.error(error);

        document.getElementById("riskStatus").textContent =
            "Connection Error";

        document.getElementById("riskMessage").textContent =
            "Could not connect to the FastAPI backend. Make sure the backend server is running.";

        document.getElementById("riskProbability").textContent =
            "--";

        resetRiskCircle();

    }

    finally {

        button.disabled = false;

        buttonText.textContent = "Run AI Analysis";

    }

});


/* ================= DISPLAY RESULT ================= */

function displayResult(result) {

    const probability = Number(result.probability);

    const riskProbability =
        document.getElementById("riskProbability");

    const riskStatus =
        document.getElementById("riskStatus");

    const riskMessage =
        document.getElementById("riskMessage");


    animateNumber(
        riskProbability,
        0,
        probability,
        900
    );


    updateRiskCircle(probability);


    if (result.prediction === 1) {

        riskStatus.textContent =
            "Higher Predicted Risk";

        riskStatus.style.color = "#f9a8d4";

        riskStatus.style.background =
            "rgba(236,72,153,.08)";

        riskStatus.style.borderColor =
            "rgba(236,72,153,.18)";

        riskMessage.textContent =
            "The model estimates a higher probability of diabetes based on the entered parameters.";

    }

    else {

        riskStatus.textContent =
            "Lower Predicted Risk";

        riskStatus.style.color =
            "#72e5bd";

        riskStatus.style.background =
            "rgba(49,213,155,.07)";

        riskStatus.style.borderColor =
            "rgba(49,213,155,.18)";

        riskMessage.textContent =
            "The model estimates a lower probability of diabetes based on the entered parameters.";

    }

}


/* ================= RISK CIRCLE ================= */

function updateRiskCircle(probability) {

    const circle =
        document.getElementById("riskCircle");

    const circumference = 553;

    const percentage =
        Math.min(Math.max(probability, 0), 100);

    const offset =
        circumference -
        (percentage / 100) * circumference;

    circle.style.strokeDashoffset = offset;

}


function resetRiskCircle() {

    document.getElementById("riskCircle")
        .style.strokeDashoffset = 553;

}


/* ================= NUMBER ANIMATION ================= */

function animateNumber(element, start, end, duration) {

    const startTime = performance.now();

    function update(currentTime) {

        const progress =
            Math.min(
                (currentTime - startTime) / duration,
                1
            );

        const value =
            start + (end - start) * progress;

        element.textContent =
            value.toFixed(1) + "%";

        if (progress < 1) {
            requestAnimationFrame(update);
        }

    }

    requestAnimationFrame(update);

}


/* ================= PREVIEW ================= */

function updatePreview(data) {

    document.getElementById("previewGlucose")
        .textContent = data.glucose;

    document.getElementById("previewBMI")
        .textContent = data.bmi;

    document.getElementById("previewBP")
        .textContent = data.blood_pressure;

}


/* ================= RESET ================= */

function resetForm() {

    document.getElementById("predictionForm").reset();

    document.getElementById("pregnancies").value = 2;
    document.getElementById("age").value = 25;
    document.getElementById("glucose").value = 120;
    document.getElementById("blood_pressure").value = 80;
    document.getElementById("skin_thickness").value = 25;
    document.getElementById("insulin").value = 100;
    document.getElementById("bmi").value = 28.5;
    document.getElementById("diabetes_pedigree").value = 0.45;

    document.getElementById("riskProbability")
        .textContent = "--";

    document.getElementById("riskStatus")
        .textContent = "Awaiting Analysis";

    document.getElementById("riskMessage")
        .textContent =
        "Enter patient information and run the AI model to generate a prediction.";

    resetRiskCircle();

    updatePreview({

        glucose: 120,
        bmi: 28.5,
        blood_pressure: 80

    });

}


/* ================= HISTORY ================= */

function saveHistory(data, result) {

    let history =
        JSON.parse(localStorage.getItem("medaiHistory")) || [];

    const record = {

        date: new Date().toLocaleString(),

        glucose: data.glucose,

        bmi: data.bmi,

        age: data.age,

        probability: result.probability,

        result: result.result

    };

    history.unshift(record);

    history = history.slice(0, 10);

    localStorage.setItem(
        "medaiHistory",
        JSON.stringify(history)
    );

}


/* ================= LOAD HISTORY ================= */

function loadHistory() {

    const container =
        document.getElementById("historyList");

    const history =
        JSON.parse(localStorage.getItem("medaiHistory")) || [];


    if (history.length === 0) {

        container.innerHTML = `

            <div class="empty-history">

                <div>◷</div>

                <h3>No predictions yet</h3>

                <p>
                    Your completed AI assessments will appear here.
                </p>

                <button
                    class="primary-btn"
                    onclick="openPrediction()">

                    Run First Assessment →

                </button>

            </div>

        `;

        return;

    }


    container.innerHTML = history.map(item => `

        <div class="history-item">

            <div>

                <strong>
                    Glucose ${item.glucose}
                </strong>

                <div class="history-date">
                    ${item.date}
                </div>

            </div>

            <div>
                <span class="history-risk">
                    ${item.probability}%
                </span>
            </div>

            <div>
                <span>
                    BMI ${item.bmi}
                </span>
            </div>

            <div>
                <span class="history-result">
                    ${item.result}
                </span>
            </div>

        </div>

    `).join("");

}


/* ================= CLEAR HISTORY ================= */

function clearHistory() {

    localStorage.removeItem("medaiHistory");

    loadHistory();

}


/* ================= STARTUP ================= */

document.addEventListener("DOMContentLoaded", () => {

    loadHistory();

});