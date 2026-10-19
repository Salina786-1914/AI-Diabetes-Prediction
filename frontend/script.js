
const API_URL = "https://ai-diabetes-api.onrender.com/predict";
const HEALTH_API_URL = "https://ai-diabetes-api.onrender.com/health-assistant";
const TEST_API_URL = "https://ai-diabetes-api.onrender.com/test-samples";
/* ================= NAVIGATION ================= */

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".section");
const pageTitle = document.getElementById("pageTitle");

const titles = {
    overview: "Overview",
    prediction: "Risk Prediction",
    analytics: "Model Analytics",
    history: "Prediction History",
    about: "About AI",
    assistant: "Health Assistant"
};

function showSection(sectionName) {
    sections.forEach(section => section.classList.remove("active-section"));

    const selected = document.getElementById(sectionName);
    if (selected) selected.classList.add("active-section");

    navItems.forEach(item => {
        item.classList.remove("active");
        if (item.dataset.section === sectionName) {
            item.classList.add("active");
        }
    });

    if (pageTitle) pageTitle.textContent = titles[sectionName] || "Overview";
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (sectionName === "history") loadHistory();
}

navItems.forEach(item => {
    item.addEventListener("click", () => showSection(item.dataset.section));
});

function openPrediction() {
    showSection("prediction");
}

/* ================= PREDICTION FORM ================= */

const form = document.getElementById("predictionForm");

if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const button = document.querySelector(".analyze-btn");
        const buttonText = document.getElementById("buttonText");

        if (button) button.disabled = true;
        if (buttonText) buttonText.textContent = "Analyzing...";

        const data = {
            pregnancies: Number(document.getElementById("pregnancies").value),
            glucose: Number(document.getElementById("glucose").value),
            blood_pressure: Number(document.getElementById("blood_pressure").value),
            skin_thickness: Number(document.getElementById("skin_thickness").value),
            insulin: Number(document.getElementById("insulin").value),
            bmi: Number(document.getElementById("bmi").value),
            diabetes_pedigree: Number(document.getElementById("diabetes_pedigree").value),
            age: Number(document.getElementById("age").value)
        };

        updatePreview(data);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error("Prediction API error");

            const result = await response.json();

            displayResult(result);
            saveHistory(data, result);

            // Compare with the currently selected test sample, if any.
            compareSubmittedPrediction(data, result);

        } catch (error) {
            console.error("Prediction error:", error);

            document.getElementById("riskStatus").textContent = "Connection Error";
            document.getElementById("riskMessage").textContent =
                "Could not connect to the prediction API. Please check the connection.";
            document.getElementById("riskProbability").textContent = "--";

            resetRiskCircle();
        } finally {
            if (button) button.disabled = false;
            if (buttonText) buttonText.textContent = "Run AI Analysis";
        }
    });
}

/* ================= DISPLAY PREDICTION ================= */

function displayResult(result) {
    const probability = Number(result.probability);

    const riskProbability = document.getElementById("riskProbability");
    const riskStatus = document.getElementById("riskStatus");
    const riskMessage = document.getElementById("riskMessage");

    animateNumber(riskProbability, 0, probability, 900);
    updateRiskCircle(probability);

    if (Number(result.prediction) === 1) {
        riskStatus.textContent = "Higher Predicted Risk";
        riskStatus.style.color = "#f9a8d4";
        riskStatus.style.background = "rgba(236,72,153,.08)";
        riskStatus.style.borderColor = "rgba(236,72,153,.18)";
        riskMessage.textContent =
            "The model estimates a higher probability of diabetes based on the entered parameters.";
    } else {
        riskStatus.textContent = "Lower Predicted Risk";
        riskStatus.style.color = "#72e5bd";
        riskStatus.style.background = "rgba(49,213,155,.07)";
        riskStatus.style.borderColor = "rgba(49,213,155,.18)";
        riskMessage.textContent =
            "The model estimates a lower probability of diabetes based on the entered parameters.";
    }
}

/* ================= RISK CIRCLE ================= */

function updateRiskCircle(probability) {
    const circle = document.getElementById("riskCircle");
    if (!circle) return;

    const circumference = 553;
    const percentage = Math.min(Math.max(probability, 0), 100);
    circle.style.strokeDashoffset =
        circumference - (percentage / 100) * circumference;
}

function resetRiskCircle() {
    const circle = document.getElementById("riskCircle");
    if (circle) circle.style.strokeDashoffset = 553;
}

/* ================= NUMBER ANIMATION ================= */

function animateNumber(element, start, end, duration) {
    if (!element) return;

    const startTime = performance.now();

    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = start + (end - start) * progress;

        element.textContent = value.toFixed(1) + "%";

        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

/* ================= OVERVIEW PREVIEW ================= */

function updatePreview(data) {
    const glucose = document.getElementById("previewGlucose");
    const bmi = document.getElementById("previewBMI");
    const bp = document.getElementById("previewBP");

    if (glucose) glucose.textContent = data.glucose;
    if (bmi) bmi.textContent = data.bmi;
    if (bp) bp.textContent = data.blood_pressure;
}

/* ================= RESET FORM ================= */

function resetForm() {
    const predictionForm = document.getElementById("predictionForm");
    if (predictionForm) predictionForm.reset();

    const defaults = {
        pregnancies: 2,
        age: 25,
        glucose: 120,
        blood_pressure: 80,
        skin_thickness: 25,
        insulin: 100,
        bmi: 28.5,
        diabetes_pedigree: 0.45
    };

    Object.entries(defaults).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
    });

    const riskProbability = document.getElementById("riskProbability");
    const riskStatus = document.getElementById("riskStatus");
    const riskMessage = document.getElementById("riskMessage");

    if (riskProbability) riskProbability.textContent = "--";
    if (riskStatus) riskStatus.textContent = "Awaiting Analysis";
    if (riskMessage) {
        riskMessage.textContent =
            "Enter patient information and run the AI model to generate a prediction.";
    }

    resetRiskCircle();
    updatePreview({ glucose: 120, bmi: 28.5, blood_pressure: 80 });
}

/* ================= SAVE HISTORY ================= */

function saveHistory(data, result) {
    let history = [];

    try {
        history = JSON.parse(localStorage.getItem("medaiHistory")) || [];
    } catch (error) {
        console.error("Could not read prediction history:", error);
    }

    history.unshift({
        date: new Date().toLocaleString(),
        glucose: data.glucose,
        bmi: data.bmi,
        age: data.age,
        probability: result.probability,
        result: result.result
    });

    history = history.slice(0, 10);
    localStorage.setItem("medaiHistory", JSON.stringify(history));
}

/* ================= LOAD HISTORY ================= */

function loadHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;

    let history = [];

    try {
        history = JSON.parse(localStorage.getItem("medaiHistory")) || [];
    } catch (error) {
        console.error("Could not load history:", error);
    }

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-history">
                <div>◷</div>
                <h3>No predictions yet</h3>
                <p>Your completed AI assessments will appear here.</p>
                <button class="primary-btn" onclick="openPrediction()">
                    Run First Assessment →
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item">
            <div>
                <strong>Glucose ${item.glucose}</strong>
                <div class="history-date">${item.date}</div>
            </div>
            <div><span class="history-risk">${item.probability}%</span></div>
            <div><span>BMI ${item.bmi}</span></div>
            <div><span class="history-result">${item.result}</span></div>
        </div>
    `).join("");
}

function clearHistory() {
    localStorage.removeItem("medaiHistory");
    loadHistory();
}

/* ================= STARTUP ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
});

/* ================= HEALTH ASSISTANT ================= */

const assistantForm = document.getElementById("assistantForm");

if (assistantForm) {
    assistantForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const questionInput = document.getElementById("assistantQuestion");
        const messages = document.getElementById("assistantMessages");
        const sendButton = document.getElementById("assistantSend");
        const question = questionInput.value.trim();

        if (!question) return;

        const userMessage = document.createElement("div");
        userMessage.className = "user-message";
        userMessage.textContent = question;
        messages.appendChild(userMessage);

        questionInput.value = "";
        sendButton.disabled = true;
        sendButton.textContent = "Thinking...";

        const loadingMessage = document.createElement("div");
        loadingMessage.className = "assistant-message";
        loadingMessage.textContent = "Finding an answer...";
        messages.appendChild(loadingMessage);
        messages.scrollTop = messages.scrollHeight;

        try {
            const response = await fetch(HEALTH_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question })
            });

            if (!response.ok) throw new Error("Health Assistant API error");

            const result = await response.json();
            loadingMessage.textContent =
                result.answer || "Sorry, I could not find an answer.";
        } catch (error) {
            console.error("Health Assistant error:", error);
            loadingMessage.textContent =
                "Unable to connect right now. Please try again in a moment.";
        } finally {
            messages.scrollTop = messages.scrollHeight;
            sendButton.disabled = false;
            sendButton.textContent = "Ask AI →";
            questionInput.focus();
        }
    });
}

/* ================= MULTILINGUAL SUGGESTED QUESTIONS ================= */

const questionSets = {
    en: [
        "What is diabetes?",
        "What are the symptoms of diabetes?",
        "What is normal blood sugar?",
        "How can I reduce diabetes risk?",
        "Can AI diagnose diabetes?"
    ],
    hi: [
        "डायबिटीज क्या है?",
        "डायबिटीज के लक्षण क्या हैं?",
        "सामान्य ब्लड शुगर कितना होता है?",
        "डायबिटीज का खतरा कैसे कम करें?",
        "क्या AI डायबिटीज का निदान कर सकता है?"
    ],
    mr: [
        "मधुमेह म्हणजे काय?",
        "मधुमेहाची लक्षणे कोणती?",
        "रक्तातील साखरेची सामान्य पातळी किती?",
        "मधुमेहाचा धोका कसा कमी करावा?",
        "AI मधुमेहाचे निदान करू शकतो का?"
    ]
};

const languageSelector = document.getElementById("assistantLanguage");
const questionContainer = document.getElementById("suggestedQuestions");

function renderSuggestedQuestions() {
    if (!languageSelector || !questionContainer) return;

    const language = languageSelector.value;
    const questions = questionSets[language] || questionSets.en;
    questionContainer.replaceChildren();

    questions.forEach(question => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "suggestion-btn";
        button.textContent = question;

        button.addEventListener("click", () => {
            const input = document.getElementById("assistantQuestion");
            if (input) {
                input.value = question;
                input.focus();
            }
        });

        questionContainer.appendChild(button);
    });
}

if (languageSelector && questionContainer) {
    languageSelector.addEventListener("change", renderSuggestedQuestions);
    renderSuggestedQuestions();
}

/* ================= TEST SAMPLE VERIFICATION ================= */

let testSamples = [];
let selectedTestSample = null;

const TEST_SAMPLE_FIELDS = [
    {
        key: "Pregnancies",
        label: "Pregnancies",
        inputKey: "pregnancies",
        inputId: "pregnancies",
        unit: "count"
    },
    {
        key: "Glucose",
        label: "Glucose",
        inputKey: "glucose",
        inputId: "glucose",
        unit: "mg/dL"
    },
    {
        key: "BloodPressure",
        label: "Blood Pressure",
        inputKey: "blood_pressure",
        inputId: "blood_pressure",
        unit: "mmHg"
    },
    {
        key: "SkinThickness",
        label: "Skin Thickness",
        inputKey: "skin_thickness",
        inputId: "skin_thickness",
        unit: "mm"
    },
    {
        key: "Insulin",
        label: "Insulin",
        inputKey: "insulin",
        inputId: "insulin",
        unit: "μU/mL"
    },
    {
        key: "BMI",
        label: "BMI",
        inputKey: "bmi",
        inputId: "bmi",
        unit: "kg/m²"
    },
    {
        key: "DiabetesPedigreeFunction",
        label: "Diabetes Pedigree",
        inputKey: "diabetes_pedigree",
        inputId: "diabetes_pedigree",
        unit: "index"
    },
    {
        key: "Age",
        label: "Age",
        inputKey: "age",
        inputId: "age",
        unit: "years"
    }
];

function classDescription(value) {
    return Number(value) === 1
        ? "1 — positive dataset class"
        : "0 — negative dataset class";
}

function renderSelectedTestSample(sample) {
    const parametersContainer = document.getElementById("testSampleParameters");
    const resultContainer = document.getElementById("testVerificationResult");

    if (!parametersContainer || !resultContainer || !sample) return;

    const parameterCards = TEST_SAMPLE_FIELDS.map(field => {
        const value = sample.inputs?.[field.key];

        return `
            <div class="test-parameter-card">
                <span>${field.label}</span>
                <strong>${value ?? "—"}</strong>
                <small>${field.unit}</small>
            </div>
        `;
    }).join("");

    parametersContainer.innerHTML = `
        <div class="test-sample-detail-card">
            <div class="test-detail-heading">
                <div>
                    <p class="panel-label">SELECTED TEST CASE</p>
                    <h3>Sample ${sample.sample_id} · Input Parameters</h3>
                </div>
            </div>

            <div class="test-parameter-grid">
                ${parameterCards}
            </div>

            <div class="test-expected-result">
                <div>
                    <span>Actual dataset outcome</span>
                    <strong>${classDescription(sample.actual_outcome)}</strong>
                </div>
                <div>
                    <span>Expected ANN prediction</span>
                    <strong>${classDescription(sample.predicted_outcome)}</strong>
                </div>
                <div>
                    <span>Expected ANN probability</span>
                    <strong>${Number(sample.probability).toFixed(2)}%</strong>
                </div>
                <div>
                    <span>ANN vs actual label</span>
                    <strong>${sample.correct ? "Match" : "Mismatch"}</strong>
                </div>
            </div>

            <p class="test-instruction">
                Enter these same eight values in the Patient Parameters form above
                and click <strong>Run AI Analysis</strong>. MedAI will compare the
                form's prediction with this selected test sample.
            </p>
        </div>
    `;

    resultContainer.replaceChildren();
}

async function loadTestSamples() {
    const select = document.getElementById("testSampleSelect");
    const parametersContainer = document.getElementById("testSampleParameters");

    if (!select) return;

    select.innerHTML = '<option value="">Loading test samples...</option>';

    try {
        const response = await fetch(TEST_API_URL);
        const data = await response.json();

        if (!response.ok || data.status !== "success" || !Array.isArray(data.samples)) {
            throw new Error(data.message || "Unable to load test samples.");
        }

        testSamples = data.samples;
        select.innerHTML = '<option value="">Choose a sample</option>';

        testSamples.forEach((sample, index) => {
            const option = document.createElement("option");
            option.value = String(index);
            option.textContent =
                `Sample ${sample.sample_id} — Actual Outcome: ${sample.actual_outcome}`;
            select.appendChild(option);
        });

        if (parametersContainer) {
            parametersContainer.innerHTML = `
                <p class="test-empty-state">
                    Choose a sample above to view its eight input values and expected model result.
                </p>
            `;
        }
    } catch (error) {
        console.error("Test samples error:", error);
        select.innerHTML = '<option value="">Could not load samples</option>';

        if (parametersContainer) {
            parametersContainer.textContent =
                "Unable to load test samples. Check that the FastAPI backend is running and /test-samples is available.";
        }
    }
}

function getSelectedTestSample() {
    const select = document.getElementById("testSampleSelect");

    if (!select || select.value === "") return null;

    return testSamples[Number(select.value)] || null;
}

function compareSubmittedPrediction(formData, result) {
    if (!selectedTestSample) return;

    const sample = selectedTestSample;
    const inputDifferences = [];

    TEST_SAMPLE_FIELDS.forEach(field => {
        const expectedValue = Number(sample.inputs?.[field.key]);
        const enteredValue = Number(formData[field.inputKey]);

        // Allow a tiny floating point difference for displayed input values.
        const tolerance =
            field.key === "DiabetesPedigreeFunction" ? 0.00051 : 0.01;

        if (
            !Number.isFinite(expectedValue) ||
            !Number.isFinite(enteredValue) ||
            Math.abs(expectedValue - enteredValue) > tolerance
        ) {
            inputDifferences.push(field.label);
        }
    });

    if (inputDifferences.length > 0) {
        showVerificationModal(
            `Sample ${sample.sample_id} is selected, but some entered values do not match.\n\n` +
            `Please check: ${inputDifferences.join(", ")}.\n\n` +
            `No sample verification was completed.`
        );
        return;
    }

    const formPrediction = Number(result.prediction);
    const expectedPrediction = Number(sample.predicted_outcome);
    const formProbability = Number(result.probability);
    const expectedProbability = Number(sample.probability);

    const classMatches = formPrediction === expectedPrediction;
    const probabilityMatches =
        Number.isFinite(formProbability) &&
        Number.isFinite(expectedProbability) &&
        Math.abs(formProbability - expectedProbability) <= 0.5;

    const actualLabelInfo = sample.correct
        ? "The stored ANN prediction for this sample matches its actual dataset outcome."
        : "Note: the stored ANN prediction for this sample does not match its actual dataset outcome.";

    if (classMatches && probabilityMatches) {
        showVerificationModal(
            `✅ Prediction Verified!\n\n` +
            `Sample: ${sample.sample_id}\n` +
            `All 8 input values match.\n` +
            `Your form prediction: ${classDescription(formPrediction)}\n` +
            `Expected ANN prediction: ${classDescription(expectedPrediction)}\n` +
            `Your probability: ${formProbability.toFixed(2)}%\n` +
            `Expected probability: ${expectedProbability.toFixed(2)}%\n\n` +
            `${actualLabelInfo}\n\n` +
            `This is an educational model check, not a medical diagnosis.`
        );
    } else if (classMatches) {
        showVerificationModal(
            `⚠️ Prediction Class Matches, Probability Differs\n\n` +
            `All 8 input values match Sample ${sample.sample_id}.\n` +
            `Both predictions are class ${formPrediction}, but the probabilities differ.\n` +
            `Your form probability: ${formProbability.toFixed(2)}%\n` +
            `Expected sample probability: ${expectedProbability.toFixed(2)}%\n\n` +
            `Check whether the prediction API and test-sample API use the same trained model version.\n\n` +
            `${actualLabelInfo}`
        );
    } else {
        showVerificationModal(
            `Prediction Does Not Match\n\n` +
            `All 8 input values match Sample ${sample.sample_id}, but the predicted classes differ.\n` +
            `Your form prediction: ${classDescription(formPrediction)}\n` +
            `Expected ANN prediction: ${classDescription(expectedPrediction)}\n` +
            `Your probability: ${formProbability.toFixed(2)}%\n` +
            `Expected probability: ${expectedProbability.toFixed(2)}%\n\n` +
            `Check that both APIs use the same trained model and scaler.\n\n` +
            `This is an educational model check, not a medical diagnosis.`
        );
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadTestSamples();

    const select = document.getElementById("testSampleSelect");
    const verifyButton = document.getElementById("verifyTestSample");
    const resultContainer = document.getElementById("testVerificationResult");

    if (select) {
        select.addEventListener("change", () => {
            selectedTestSample = getSelectedTestSample();

            if (selectedTestSample) {
                renderSelectedTestSample(selectedTestSample);
            } else {
                selectedTestSample = null;

                const parametersContainer =
                    document.getElementById("testSampleParameters");

                if (parametersContainer) {
                    parametersContainer.innerHTML = `
                        <p class="test-empty-state">
                            Choose a sample above to view its eight input values and expected model result.
                        </p>
                    `;
                }

                if (resultContainer) resultContainer.replaceChildren();
            }
        });
    }

    if (verifyButton) {
        verifyButton.addEventListener("click", () => {
            selectedTestSample = getSelectedTestSample();

            if (!selectedTestSample) {
                showVerificationModal("Please select a test sample first.");
                return;
            }

            renderSelectedTestSample(selectedTestSample);

            document.getElementById("testSampleParameters")?.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        });
    }
});


/* ===== CUSTOM VERIFICATION POPUP LOGIC ===== */

function showVerificationModal(message) {
    const overlay = document.getElementById("verificationModal");
    const card = overlay?.querySelector(".verification-modal-card");
    const icon = document.getElementById("verificationModalIcon");
    const title = document.getElementById("verificationModalTitle");
    const messageBox = document.getElementById("verificationModalMessage");

    if (!overlay || !card || !icon || !title || !messageBox) {
        console.error("Verification popup HTML is missing.");
        return;
    }

    const lines = String(message).split("\n");
    const firstLineIndex = lines.findIndex(line => line.trim() !== "");
    const firstLine = firstLineIndex >= 0 ? lines[firstLineIndex].trim() : "Verification Result";

    const body = lines.slice(firstLineIndex + 1).join("\n").trim();

    let type = "info";
    let iconText = "i";
    let heading = firstLine.replace(/^[✅⚠️❌ℹ️]+\s*/, "").trim();

    if (firstLine.includes("Prediction Verified")) {
        type = "success";
        iconText = "✓";
        heading = "Prediction Verified!";
    } else if (
        firstLine.includes("Does Not Match") ||
        firstLine.includes("Prediction Does Not Match")
    ) {
        type = "error";
        iconText = "×";
        heading = "Prediction Mismatch";
    } else if (
        firstLine.includes("Differs") ||
        firstLine.includes("Check Sample") ||
        firstLine.includes("Please select") ||
        firstLine.includes("Could not")
    ) {
        type = "warning";
        iconText = "!";
        heading = firstLine.replace(/^[⚠️]+\s*/, "");
    }

    card.classList.remove("success", "warning", "error", "info");
    card.classList.add(type);

    icon.textContent = iconText;
    title.textContent = heading;
    messageBox.textContent = body || firstLine;

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    document.getElementById("verificationModalClose")?.focus();
}

function closeVerificationModal() {
    const overlay = document.getElementById("verificationModal");

    if (!overlay) return;

    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("verificationModalClose")
        ?.addEventListener("click", closeVerificationModal);

    document.getElementById("verificationModalX")
        ?.addEventListener("click", closeVerificationModal);

    document.getElementById("verificationModal")
        ?.addEventListener("click", event => {
            if (event.target.id === "verificationModal") {
                closeVerificationModal();
            }
        });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeVerificationModal();
        }
    });
});
