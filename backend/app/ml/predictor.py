import json
import logging
import os
from typing import Any, Dict, Optional

import numpy as np
import xgboost as xgb

from app.schemas.prediction import DemandLevelType, PredictionResponse

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "artifacts")
)
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "xgboost_demand_model.json")
METADATA_PATH = os.path.join(ARTIFACTS_DIR, "model_metadata.json")
SAMPLE_DENSITY_PATH = os.path.join(ARTIFACTS_DIR, "sample_density.json")

WEEKDAY_NAME_TO_INT = {
    "segunda": 0,
    "terca": 1,
    "quarta": 2,
    "quinta": 3,
    "sexta": 4,
    "sabado": 5,
    "domingo": 6,
}

SLOT_START_HOURS = {
    "08-10": 8,
    "10-12": 10,
    "13-15": 13,
    "15-17": 15,
    "17-19": 17,
    "19-21": 19,
}

DEMAND_CLASSES = {
    0: "baixa",
    1: "moderada",
    2: "alta",
}


class DemandPredictor:
    """
    Gerenciador de inferência preditiva em memória utilizando XGBoost,
    implementando a classificação em 3 níveis (RB03) e corte por densidade amostral (RB04).
    """

    def __init__(self) -> None:
        self.model: Optional[xgb.XGBClassifier] = None
        self.metadata: Dict[str, Any] = {}
        self.sample_density: Dict[str, int] = {}
        self.ubs_to_idx: Dict[str, int] = {}
        self.idx_to_demand: Dict[int, DemandLevelType] = {
            0: "baixa",
            1: "moderada",
            2: "alta",
        }
        self.min_sample_threshold: int = 15
        self.is_ready: bool = False

        self.load_artifacts()

    def load_artifacts(self) -> None:
        """Carrega modelo e metadados em memória uma única vez."""
        try:
            if not os.path.exists(MODEL_PATH):
                logger.warning("Artefato do modelo XGBoost não encontrado em %s.", MODEL_PATH)
                return

            self.model = xgb.XGBClassifier()
            self.model.load_model(MODEL_PATH)

            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.ubs_to_idx = self.metadata.get("ubs_to_idx", {})
                    self.min_sample_threshold = self.metadata.get("min_sample_threshold", 15)

            if os.path.exists(SAMPLE_DENSITY_PATH):
                with open(SAMPLE_DENSITY_PATH, "r", encoding="utf-8") as f:
                    self.sample_density = json.load(f)

            self.is_ready = True
            logger.info("Modelo XGBoost e matriz de densidade amostral carregados com sucesso em memória.")
        except Exception as exc:
            logger.error("Falha ao inicializar artefatos preditivos: %s", exc)
            self.is_ready = False

    def predict_demand(
        self,
        ubs_id: str,
        day: str,
        slot: str,
        is_open: bool,
        is_extended_hours: bool = False,
    ) -> PredictionResponse:
        """
        Executa a classificação de demanda com validação prévia de funcionamento (RB02)
        e suficiência de dados históricos (RB04).
        """
        # 1. Regra RB02: Se a unidade estiver fechada na faixa ou no dia
        if not is_open:
            return PredictionResponse(
                ubs_id=ubs_id,
                day=day,
                slot=slot,
                status="CLOSED",
                demand_level=None,
                confidence=None,
                sufficient_data=False,
                message="Unidade de saúde fechada neste horário ou dia da semana (Regra RB02).",
            )

        # 2. Regra RB04: Verificação de suficiência amostral histórica
        density_key = f"{ubs_id}:{day}:{slot}"
        sample_count = self.sample_density.get(density_key, 0)

        if sample_count < self.min_sample_threshold:
            return PredictionResponse(
                ubs_id=ubs_id,
                day=day,
                slot=slot,
                status="INSUFFICIENT_DATA",
                demand_level=None,
                confidence=None,
                sufficient_data=False,
                message="Dados históricos insuficientes para esta combinação de dia e horário. Não é possível gerar uma estimativa confiável (Regra RB04).",
            )

        # 3. Regra RB03: Classificação em 3 níveis (Baixa, Moderada, Alta) via XGBoost
        if not self.is_ready or self.model is None:
            # Fallback caso os artefatos de IA ainda não tenham sido treinados
            return PredictionResponse(
                ubs_id=ubs_id,
                day=day,
                slot=slot,
                status="OPEN",
                demand_level="moderada",
                confidence=0.50,
                sufficient_data=True,
                message="Demanda estimada em modo fallback temporário.",
            )

        ubs_idx = self.ubs_to_idx.get(ubs_id, 0)
        day_int = WEEKDAY_NAME_TO_INT.get(day, 0)
        start_hr = SLOT_START_HOURS.get(slot, 8)
        ext_flag = 1 if is_extended_hours else 0

        # Vetor de entrada: ["ubs_idx", "day_of_week", "start_hour", "is_extended_hours"]
        X_input = np.array([[ubs_idx, day_int, start_hr, ext_flag]], dtype=np.float32)

        probabilities = self.model.predict_proba(X_input)[0]
        predicted_class_idx = int(np.argmax(probabilities))
        confidence = round(float(np.max(probabilities)), 4)
        demand_level: DemandLevelType = self.idx_to_demand.get(predicted_class_idx, "moderada")

        return PredictionResponse(
            ubs_id=ubs_id,
            day=day,
            slot=slot,
            status="OPEN",
            demand_level=demand_level,
            confidence=confidence,
            sufficient_data=True,
            message=f"Demanda estimada como {demand_level} com {confidence * 100:.1f}% de confiança estatística (Regra RB03).",
        )


predictor = DemandPredictor()
