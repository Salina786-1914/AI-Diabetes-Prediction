
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = BASE_DIR / "dataset" / "diabetes.csv"
MODEL_PATH = BASE_DIR / "model" / "diabetes_ann.keras"
SCALER_PATH = BASE_DIR / "model" / "scaler.pkl"

# Load original dataset
df = pd.read_csv(DATA_PATH)

X = df.drop(columns="Outcome")
y = df["Outcome"].astype(int)

# Recreate the original 80/20 split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Load saved model and scaler
model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# Use the saved scaler on the held-out test data
X_test_scaled = scaler.transform(X_test)

probabilities = model.predict(X_test_scaled, verbose=0).ravel()
y_predicted = (probabilities >= 0.5).astype(int)

print("\n===== HELD-OUT TEST RESULTS =====")
print("Samples tested:", len(y_test))
print(f"Accuracy:  {accuracy_score(y_test, y_predicted):.4f}")
print(f"Precision: {precision_score(y_test, y_predicted, zero_division=0):.4f}")
print(f"Recall:    {recall_score(y_test, y_predicted, zero_division=0):.4f}")
print(f"F1 Score:  {f1_score(y_test, y_predicted, zero_division=0):.4f}")

print("\n===== CONFUSION MATRIX =====")
print(confusion_matrix(y_test, y_predicted))

print("\n===== CLASSIFICATION REPORT =====")
print(classification_report(y_test, y_predicted, zero_division=0))

# Save test predictions and actual outcomes
results = X_test.copy()
results["Actual_Outcome"] = y_test.values
results["Predicted_Probability_%"] = np.round(
    probabilities * 100, 2
)
results["Predicted_Outcome"] = y_predicted
results["Correct"] = (
    results["Actual_Outcome"] == results["Predicted_Outcome"]
)

output_path = BASE_DIR / "reports" / "held_out_test_results.csv"
output_path.parent.mkdir(parents=True, exist_ok=True)
results.to_csv(output_path, index=False)

print(f"\nDetailed test results saved to: {output_path}")

sample = pd.DataFrame([{
    "Pregnancies": 2,
    "Glucose": 100,
    "BloodPressure": 70,
    "SkinThickness": 20,
    "Insulin": 79,
    "BMI": 25.0,
    "DiabetesPedigreeFunction": 0.351,
    "Age": 31
}])

sample_scaled = scaler.transform(sample)
probability = model.predict(sample_scaled, verbose=0)[0][0]

print(f"\nWebsite test input risk: {probability * 100:.2f}%")

