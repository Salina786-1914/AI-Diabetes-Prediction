# 🧬 AI Diabetes Risk Prediction

An AI-powered healthcare application that estimates diabetes risk using an Artificial Neural Network trained on the Pima Indians Diabetes Dataset.

The project combines **Deep Learning, TensorFlow/Keras, FastAPI and a modern web interface** to provide an interactive diabetes risk prediction system.

> ⚠️ This project is developed for academic and educational purposes. The prediction is an AI-based statistical risk estimate and is not a medical diagnosis.

---

## 📌 Project Overview

Diabetes is a common chronic condition that can be influenced by multiple clinical and demographic factors.

This project demonstrates how Artificial Intelligence can be used to analyze patient health parameters and generate an estimated diabetes risk.

The system accepts 8 patient parameters, preprocesses the data using a trained scaler, and passes the processed values through a trained Artificial Neural Network.

### Workflow

```text
Patient Input
      ↓
Data Validation
      ↓
Missing Value Handling
      ↓
Feature Scaling
      ↓
Artificial Neural Network
      ↓
Risk Probability
      ↓
Higher / Lower Predicted Risk