from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import joblib
import numpy as np
import os


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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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