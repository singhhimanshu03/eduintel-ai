"""Generate synthetic student data for training all AI models."""
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)
N = 3000

def generate():
    attendance = np.random.uniform(40, 100, N)
    fee_status = np.random.choice([0.0, 0.5, 1.0], N, p=[0.15, 0.10, 0.75])
    internal_marks = np.random.uniform(20, 100, N)
    prev_gpa = np.random.uniform(3.0, 10.0, N)
    backlog_count = np.random.choice([0, 1, 2, 3, 4], N, p=[0.55, 0.25, 0.12, 0.05, 0.03])

    # Eligibility risk label: High if att<60 OR fee=unpaid OR marks<35
    risk_score_val = (
        (1 - attendance / 100) * 0.4 +
        (1 - fee_status) * 0.3 +
        (1 - internal_marks / 100) * 0.2 +
        (1 - prev_gpa / 10) * 0.1
    )
    eligibility_risk = pd.cut(
        risk_score_val, bins=[0, 0.33, 0.55, 1.0], labels=[0, 1, 2]
    ).astype(int)  # 0=Low, 1=Medium, 2=High

    # GPA prediction target
    predicted_gpa = (
        internal_marks * 0.04 +
        attendance * 0.02 +
        prev_gpa * 0.40 +
        np.random.normal(0, 0.3, N)
    ).clip(0, 10)

    # Backlog binary (per student average)
    backlog_label = ((internal_marks < 40) | (attendance < 55)).astype(int)

    # Dropout
    dropout_att1 = np.random.uniform(40, 100, N)
    dropout_att2 = np.random.uniform(40, 100, N)
    dropout_att3 = attendance
    dropout_gpa1 = np.random.uniform(3, 10, N)
    dropout_gpa2 = np.random.uniform(3, 10, N)
    dropout_gpa3 = prev_gpa
    fee_paid_ratio = np.random.uniform(0, 1, N)
    dropout_label = (
        ((dropout_att1 + dropout_att2 + dropout_att3) / 3 < 55) |
        ((dropout_gpa1 + dropout_gpa2 + dropout_gpa3) / 3 < 4.5) |
        (fee_paid_ratio < 0.4)
    ).astype(int)

    df = pd.DataFrame({
        "attendance": attendance,
        "fee_status": fee_status,
        "internal_marks": internal_marks,
        "prev_gpa": prev_gpa,
        "backlog_count": backlog_count,
        "eligibility_risk": eligibility_risk,
        "predicted_gpa": predicted_gpa,
        "backlog_label": backlog_label,
        "dropout_att1": dropout_att1, "dropout_att2": dropout_att2, "dropout_att3": dropout_att3,
        "dropout_gpa1": dropout_gpa1, "dropout_gpa2": dropout_gpa2, "dropout_gpa3": dropout_gpa3,
        "fee_paid_ratio": fee_paid_ratio,
        "dropout_label": dropout_label,
    })

    out = Path("training/data")
    out.mkdir(exist_ok=True)
    df.to_csv(out / "synthetic_students.csv", index=False)
    print(f"Generated {N} synthetic student records → training/data/synthetic_students.csv")
    return df


if __name__ == "__main__":
    generate()
