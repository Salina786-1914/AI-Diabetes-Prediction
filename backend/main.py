import csv
import os
import sys
from pathlib import Path

import tensorflow as tf
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from nlp_assistant import ask_health_assistant



# --------------------------------------------------
# FastAPI App
# --------------------------------------------------

app = FastAPI(
    title="AI Diabetes Risk Prediction API",
    description="Deep learning based diabetes risk prediction system",
    version="1.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Load trained model and scaler
# --------------------------------------------------



MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "diabetes_ann.keras"
)

SCALER_PATH = os.path.join(
    BASE_DIR,
    "model",
    "scaler.pkl"
)

model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)


# --------------------------------------------------
# Patient Input Schema
# --------------------------------------------------

class PatientData(BaseModel):

    pregnancies: float
    glucose: float
    blood_pressure: float
    skin_thickness: float
    insulin: float
    bmi: float
    diabetes_pedigree: float
    age: float


# --------------------------------------------------
# Home Route
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "AI Diabetes Risk Prediction API is running",
        "status": "success"
    }


# --------------------------------------------------
# Prediction Route
# --------------------------------------------------

@app.post("/predict")
def predict(data: PatientData):

    input_data = np.array([[
        data.pregnancies,
        data.glucose,
        data.blood_pressure,
        data.skin_thickness,
        data.insulin,
        data.bmi,
        data.diabetes_pedigree,
        data.age
    ]])

    
# --------------------------------------------------
# Testing Dataset Verification
# --------------------------------------------------

TEST_RESULTS_PATH = BASE_DIR / "reports" / "held_out_test_results.csv"

FEATURE_COLUMNS = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age"
]


@app.get("/test-samples")
def get_test_samples():

    if not TEST_RESULTS_PATH.exists():
        return {
            "status": "error",
            "message": "Testing results CSV was not found."
        }

    with open(TEST_RESULTS_PATH, newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    if not rows:
        return {"status": "error", "message": "No test samples found."}

    # Read the actual test inputs
    inputs = np.array([
        [float(row[column]) for column in FEATURE_COLUMNS]
        for row in rows
    ])

    actual_outcomes = [
        int(row["Actual_Outcome"]) for row in rows
    ]

    # Use the same trained scaler and ANN model
    scaled_inputs = scaler.transform(inputs)
    probabilities = model.predict(scaled_inputs, verbose=0).reshape(-1)

    samples = []

    for index, row in enumerate(rows):
        probability = float(probabilities[index])
        predicted = int(probability >= 0.5)
        actual = actual_outcomes[index]

        samples.append({
            "sample_id": index + 1,
            "inputs": {
                column: float(row[column])
                for column in FEATURE_COLUMNS
            },
            "actual_outcome": actual,
            "probability": round(probability * 100, 2),
            "predicted_outcome": predicted,
            "correct": actual == predicted
        })

    return {
        "status": "success",
        "total_samples": len(samples),
        "model": "Trained ANN",
        "samples": samples
    }


    # Apply the same scaler used during training
    input_scaled = scaler.transform(input_data)

    # ANN prediction
    probability = float(
        model.predict(input_scaled, verbose=0)[0][0]
    )

    # Current classification threshold
    threshold = 0.5

    prediction = 1 if probability >= threshold else 0

    if prediction == 1:
        result = "Higher Predicted Risk"
    else:
        result = "Lower Predicted Risk"

    return {
        "prediction": prediction,
        "probability": round(probability * 100, 2),
        "result": result,
        "message": "This result is an AI-based risk estimate and is not a medical diagnosis."
    }


# Health Assistant Input
class HealthQuestion(BaseModel):
    question: str


# NLP Health Assistant Endpoint
@app.post("/health-assistant")
def health_assistant(data: HealthQuestion):
    return ask_health_assistant(data.question)
