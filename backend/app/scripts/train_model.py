import json
import os
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
import xgboost as xgb

ARTIFACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts")
)
DATASET_PATH = os.path.join(ARTIFACTS_DIR, "demand_dataset.csv")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "xgboost_demand_model.json")
METADATA_PATH = os.path.join(ARTIFACTS_DIR, "model_metadata.json")

DEMAND_CLASSES = {
    0: "baixa",
    1: "moderada",
    2: "alta",
}


def train() -> None:
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset não encontrado em {DATASET_PATH}. Execute generate_dataset.py primeiro.")

    print(f"[Treinamento] Lendo dataset de {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)

    # Mapear ubs_id para índices numéricos ordenados
    unique_ubs = sorted(df["ubs_id"].unique().tolist())
    ubs_to_idx = {ubs_id: idx for idx, ubs_id in enumerate(unique_ubs)}
    df["ubs_idx"] = df["ubs_id"].map(ubs_to_idx)

    feature_cols = ["ubs_idx", "day_of_week", "start_hour", "is_extended_hours"]
    X = df[feature_cols]
    y = df["target_demand"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"[Treinamento] Treinando XGBClassifier ({len(X_train)} amostras de treino, {len(X_test)} de validação)...")
    model = xgb.XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=42,
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[Treinamento] Acurácia no conjunto de teste: {acc * 100:.2f}%")
    print("\n[Treinamento] Relatório de Classificação:\n", classification_report(y_test, y_pred, target_names=["baixa", "moderada", "alta"]))

    # Salvar artefato do modelo no formato nativo JSON do XGBoost
    model.save_model(MODEL_PATH)
    print(f"[Treinamento] Modelo XGBoost persistido com sucesso em {MODEL_PATH}.")

    # Salvar metadados para inferência
    metadata = {
        "features": feature_cols,
        "ubs_to_idx": ubs_to_idx,
        "idx_to_demand": DEMAND_CLASSES,
        "min_sample_threshold": 15,
        "accuracy": float(acc),
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"[Treinamento] Metadados da inferência salvos em {METADATA_PATH}.")


if __name__ == "__main__":
    train()
