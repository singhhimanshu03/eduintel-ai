"""Train all EduIntel AI ML models and save to app/models/."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
from xgboost import XGBRegressor

from training.generate_synthetic_data import generate

MODEL_DIR = Path("app/models")
MODEL_DIR.mkdir(exist_ok=True)

print("=" * 60)
print("EduIntel AI — Model Training Pipeline")
print("=" * 60)

# ─── Load / generate data ─────────────────────────────────────────
data_path = Path("training/data/synthetic_students.csv")
if data_path.exists():
    df = pd.read_csv(data_path)
    print(f"Loaded existing data: {len(df)} records")
else:
    df = generate()

# ─── 1. Eligibility Risk Classifier (Random Forest) ──────────────
print("\n[1/4] Training Eligibility Risk model (Random Forest)...")
X_elig = df[["attendance", "fee_status", "internal_marks", "prev_gpa"]].values
y_elig = df["eligibility_risk"].values
X_tr, X_te, y_tr, y_te = train_test_split(X_elig, y_elig, test_size=0.2, random_state=42)

rf_elig = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced")
rf_elig.fit(X_tr, y_tr)
cv_acc = cross_val_score(rf_elig, X_elig, y_elig, cv=5, scoring="accuracy").mean()
test_acc = accuracy_score(y_te, rf_elig.predict(X_te))
print(f"  CV Accuracy: {cv_acc:.3f}  |  Test Accuracy: {test_acc:.3f}  (target ≥ 0.80)")
assert cv_acc >= 0.70, f"Eligibility model CV accuracy too low: {cv_acc:.3f}"
joblib.dump(rf_elig, MODEL_DIR / "eligibility_risk_model.pkl")
print("  ✓ Saved eligibility_risk_model.pkl")

# ─── 2. Performance GPA (XGBoost Regressor) ──────────────────────
print("\n[2/4] Training Performance GPA model (XGBoost)...")
X_gpa = df[["internal_marks", "attendance", "prev_gpa", "backlog_count"]].values
y_gpa = df["predicted_gpa"].values
X_tr, X_te, y_tr, y_te = train_test_split(X_gpa, y_gpa, test_size=0.2, random_state=42)

xgb_gpa = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42, verbosity=0)
xgb_gpa.fit(X_tr, y_tr)
rmse = np.sqrt(mean_squared_error(y_te, xgb_gpa.predict(X_te)))
print(f"  Test RMSE: {rmse:.3f}  (target ≤ 0.50)")
assert rmse <= 1.0, f"GPA model RMSE too high: {rmse:.3f}"
joblib.dump(xgb_gpa, MODEL_DIR / "performance_gpa_model.pkl")
print("  ✓ Saved performance_gpa_model.pkl")

# ─── 3. Performance Backlog Classifier (Random Forest) ───────────
print("\n[3/4] Training Performance Backlog model (Random Forest)...")
X_back = df[["internal_marks", "attendance", "prev_gpa", "backlog_count"]].values
y_back = df["backlog_label"].values
X_tr, X_te, y_tr, y_te = train_test_split(X_back, y_back, test_size=0.2, random_state=42)

rf_back = RandomForestClassifier(n_estimators=200, max_depth=7, random_state=42, class_weight="balanced")
rf_back.fit(X_tr, y_tr)
back_acc = accuracy_score(y_te, rf_back.predict(X_te))
print(f"  Test Accuracy: {back_acc:.3f}  (target ≥ 0.78)")
joblib.dump(rf_back, MODEL_DIR / "performance_backlog_model.pkl")
print("  ✓ Saved performance_backlog_model.pkl")

# ─── 4. Dropout Risk Classifier (Random Forest) ──────────────────
print("\n[4/4] Training Dropout Risk model (Random Forest)...")
X_drop = df[["dropout_att1","dropout_att2","dropout_att3",
             "dropout_gpa1","dropout_gpa2","dropout_gpa3",
             "fee_paid_ratio","prev_gpa"]].values
# Build engineered features
avg_att  = X_drop[:, :3].mean(axis=1, keepdims=True)
avg_gpa  = X_drop[:, 3:6].mean(axis=1, keepdims=True)
att_slope= (X_drop[:,2] - X_drop[:,0]).reshape(-1,1)
gpa_slope= (X_drop[:,5] - X_drop[:,3]).reshape(-1,1)
fee_col  = X_drop[:,6:7]
cur_gpa  = X_drop[:,7:8]
X_drop_eng = np.hstack([avg_att, avg_gpa, att_slope, gpa_slope, fee_col, cur_gpa])
y_drop = df["dropout_label"].values
X_tr, X_te, y_tr, y_te = train_test_split(X_drop_eng, y_drop, test_size=0.2, random_state=42)

from sklearn.metrics import roc_auc_score
rf_drop = RandomForestClassifier(n_estimators=300, max_depth=8, random_state=42, class_weight="balanced")
rf_drop.fit(X_tr, y_tr)
auc = roc_auc_score(y_te, rf_drop.predict_proba(X_te)[:,1])
print(f"  Test AUC-ROC: {auc:.3f}  (target ≥ 0.82)")
joblib.dump(rf_drop, MODEL_DIR / "dropout_risk_model.pkl")
print("  ✓ Saved dropout_risk_model.pkl")

print("\n" + "=" * 60)
print("All models trained and saved successfully!")
print("=" * 60)
