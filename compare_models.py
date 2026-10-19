
import os
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

# 1. Load dataset
DATA_PATH = "dataset/diabetes.csv"
data = pd.read_csv(DATA_PATH)

X = data.drop(columns=["Outcome"]).copy()
y = data["Outcome"].astype(int)

# Treat impossible zero measurements as missing
zero_columns = [
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
]

X[zero_columns] = X[zero_columns].replace(0, float("nan"))

# 2. Split data before preprocessing
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

# 3. Create lightweight models
models = {
    "Logistic Regression": Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", LogisticRegression(max_iter=1000)),
    ]),
    "Decision Tree": Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", DecisionTreeClassifier(
            max_depth=5,
            random_state=42,
        )),
    ]),
    "Random Forest": Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42,
        )),
    ]),
}

results = []
os.makedirs("reports", exist_ok=True)

# 4. Train and evaluate on unseen test data
for name, pipeline in models.items():
    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)[:, 1]

    results.append({
        "Model": name,
        "Accuracy": round(accuracy_score(y_test, predictions), 4),
        "Precision": round(
            precision_score(y_test, predictions, zero_division=0), 4
        ),
        "Recall": round(
            recall_score(y_test, predictions, zero_division=0), 4
        ),
        "F1 Score": round(
            f1_score(y_test, predictions, zero_division=0), 4
        ),
        "ROC-AUC": round(roc_auc_score(y_test, probabilities), 4),
    })

    print(f"\n{name}")
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, predictions))

# 5. Save comparison report
comparison = pd.DataFrame(results)
comparison.to_csv("reports/model_comparison.csv", index=False)

print("\nMODEL COMPARISON")
print(comparison.to_string(index=False))

# 6. Save separate testing samples with known outcomes
# Impute using training data only, not the test data.
imputer = SimpleImputer(strategy="median")
imputer.fit(X_train)

X_test_clean = pd.DataFrame(
    imputer.transform(X_test),
    columns=X.columns,
    index=X_test.index,
)

test_samples = X_test_clean.copy()
test_samples["Outcome"] = y_test

test_samples.to_csv("dataset/test_samples.csv", index=False)

print("\nSaved: reports/model_comparison.csv")
print("Saved: dataset/test_samples.csv")
print(f"Testing samples: {len(test_samples)}")

from sklearn.model_selection import StratifiedKFold, cross_validate

print("\n5-FOLD CROSS-VALIDATION RESULTS")

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

for name, pipeline in models.items():
    scores = cross_validate(
        pipeline,
        X_train,
        y_train,
        cv=cv,
        scoring={
            "accuracy": "accuracy",
            "recall": "recall",
            "f1": "f1",
            "roc_auc": "roc_auc"
        }
    )

    print(f"\n{name}")
    print(f"Accuracy: {scores['test_accuracy'].mean():.4f}")
    print(f"Recall:   {scores['test_recall'].mean():.4f}")
    print(f"F1 Score: {scores['test_f1'].mean():.4f}")
    print(f"ROC-AUC:  {scores['test_roc_auc'].mean():.4f}")