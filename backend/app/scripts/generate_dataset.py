import json
import os
import random
from typing import Any, Dict, List

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

ARTIFACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts")
)
DATASET_PATH = os.path.join(ARTIFACTS_DIR, "demand_dataset.csv")
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

DEMAND_MAP = {
    "baixa": 0,
    "moderada": 1,
    "alta": 2,
}

# Configurações calibradas para as 6 unidades de Manaus
UBS_CONFIGS = [
    {
        "id": "ubs-dr-jose-rayol-dos-santos",
        "has_extended_hours": 1,
        "base_patterns": {
            "segunda": {"08-10": "alta", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "moderada", "19-21": "baixa"},
            "terca": {"08-10": "alta", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "moderada", "19-21": "baixa"},
            "quarta": {"08-10": "alta", "10-12": "moderada", "13-15": None, "15-17": "baixa", "17-19": "moderada", "19-21": "baixa"},
            "quinta": {"08-10": "alta", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "moderada", "19-21": "baixa"},
            "sexta": {"08-10": "alta", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "moderada", "19-21": None},
            "sabado": {"08-10": "moderada", "10-12": "baixa"},
        },
    },
    {
        "id": "ubs-nilton-lins",
        "has_extended_hours": 1,
        "base_patterns": {
            "segunda": {"08-10": "alta", "10-12": "alta", "13-15": "moderada", "15-17": "moderada", "17-19": "baixa"},
            "terca": {"08-10": "alta", "10-12": "alta", "13-15": "moderada", "15-17": "moderada", "17-19": "baixa"},
            "quarta": {"08-10": "alta", "10-12": "alta", "13-15": "moderada", "15-17": "moderada", "17-19": "baixa"},
            "quinta": {"08-10": "baixa", "10-12": "moderada", "13-15": "moderada", "15-17": "moderada", "17-19": "baixa"},
            "sexta": {"08-10": "alta", "10-12": "alta", "13-15": "moderada", "15-17": "moderada", "17-19": "baixa"},
            "sabado": {"08-10": "moderada", "10-12": "baixa"},
        },
    },
    {
        "id": "ubs-arthur-virgilio-filho",
        "has_extended_hours": 0,
        "base_patterns": {
            "segunda": {"08-10": "moderada", "10-12": "alta", "13-15": "alta", "15-17": "moderada"},
            "terca": {"08-10": "moderada", "10-12": "alta", "13-15": "alta", "15-17": "moderada"},
            "quarta": {"08-10": "baixa", "10-12": "alta", "13-15": "alta", "15-17": None},
            "quinta": {"08-10": "baixa", "10-12": "baixa", "13-15": "baixa", "15-17": "baixa"},
            "sexta": {"08-10": "moderada", "10-12": "alta", "13-15": "alta", "15-17": "moderada"},
        },
    },
    {
        "id": "ubs-alfredo-campos",
        "has_extended_hours": 0,
        "base_patterns": {
            "segunda": {"08-10": "alta", "10-12": "alta", "13-15": "moderada", "15-17": "moderada"},
            "terca": {"08-10": "alta", "10-12": "alta", "13-15": "baixa", "15-17": "moderada"},
            "quarta": {"08-10": "alta", "10-12": "alta", "13-15": "moderada", "15-17": "moderada"},
            "quinta": {"08-10": "moderada", "10-12": "alta", "13-15": "moderada", "15-17": None},
            "sexta": {"08-10": "alta", "10-12": "alta", "13-15": "moderada", "15-17": "moderada"},
        },
    },
    {
        "id": "ubs-deodato-de-miranda-leao",
        "has_extended_hours": 1,
        "base_patterns": {
            "segunda": {"08-10": "baixa", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "baixa"},
            "terca": {"08-10": "baixa", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "baixa"},
            "quarta": {"08-10": "baixa", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "baixa"},
            "quinta": {"08-10": None, "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "baixa"},
            "sexta": {"08-10": "baixa", "10-12": "moderada", "13-15": "moderada", "15-17": "baixa", "17-19": "moderada"},
        },
    },
    {
        "id": "ubs-megumo-kado",
        "has_extended_hours": 0,
        "base_patterns": {
            "segunda": {"08-10": "moderada", "10-12": "alta", "13-15": "moderada", "15-17": "alta"},
            "terca": {"08-10": "moderada", "10-12": "alta", "13-15": "moderada", "15-17": "alta"},
            "quarta": {"08-10": "moderada", "10-12": "alta", "13-15": None, "15-17": "alta"},
            "quinta": {"08-10": "moderada", "10-12": "alta", "13-15": "moderada", "15-17": "alta"},
            "sexta": {"08-10": "moderada", "10-12": "alta", "13-15": "moderada", "15-17": "alta"},
        },
    },
]


def generate_dataset() -> None:
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    rows: List[Dict[str, Any]] = []
    sample_density: Dict[str, int] = {}

    for ubs in UBS_CONFIGS:
        ubs_id = ubs["id"]
        is_ext = ubs["has_extended_hours"]
        patterns = ubs["base_patterns"]

        for day_name, slots_dict in patterns.items():
            day_int = WEEKDAY_NAME_TO_INT[day_name]

            for slot_code, expected_demand in slots_dict.items():
                start_hr = SLOT_START_HOURS[slot_code]
                density_key = f"{ubs_id}:{day_name}:{slot_code}"

                # Caso com dados insuficientes (RB04): simula menos de 15 amostras históricas
                if expected_demand is None:
                    n_samples = random.randint(1, 6)
                    sample_density[density_key] = n_samples

                    for _ in range(n_samples):
                        # Gera pequenas amostras ruidosas
                        target_class = random.choice([0, 1, 2])
                        rows.append(
                            {
                                "ubs_id": ubs_id,
                                "day_of_week": day_int,
                                "day_name": day_name,
                                "slot": slot_code,
                                "start_hour": start_hr,
                                "is_extended_hours": is_ext,
                                "target_demand": target_class,
                            }
                        )
                else:
                    # Amostragem densa regular (entre 45 e 80 registros por combinação)
                    n_samples = random.randint(50, 75)
                    sample_density[density_key] = n_samples
                    base_target = DEMAND_MAP[expected_demand]

                    for _ in range(n_samples):
                        # Ruído estocástico controlado (85% acurácia ao padrão histórico de Manaus)
                        p_noise = random.random()
                        if p_noise < 0.85:
                            target_class = base_target
                        elif p_noise < 0.95:
                            target_class = max(0, min(2, base_target + random.choice([-1, 1])))
                        else:
                            target_class = random.choice([0, 1, 2])

                        rows.append(
                            {
                                "ubs_id": ubs_id,
                                "day_of_week": day_int,
                                "day_name": day_name,
                                "slot": slot_code,
                                "start_hour": start_hr,
                                "is_extended_hours": is_ext,
                                "target_demand": target_class,
                            }
                        )

    df = pd.DataFrame(rows)
    df.to_csv(DATASET_PATH, index=False)
    print(f"[Dataset] Gerados {len(df)} registros sintéticos calibrados em {DATASET_PATH}.")

    with open(SAMPLE_DENSITY_PATH, "w", encoding="utf-8") as f:
        json.dump(sample_density, f, indent=2, ensure_ascii=False)
    print(f"[Dataset] Metadados de densidade amostral (RB04) salvos em {SAMPLE_DENSITY_PATH}.")


if __name__ == "__main__":
    generate_dataset()
