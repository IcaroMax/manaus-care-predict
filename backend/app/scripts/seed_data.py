import asyncio
import logging
from typing import Any, Dict, List

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, Base, engine
from app.models.ubs import UBS

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

INITIAL_UBS_DATA: List[Dict[str, Any]] = [
    {
        "id": "ubs-dr-jose-rayol-dos-santos",
        "cnes": "2013897",
        "name": "UBS Dr. José Rayol dos Santos",
        "address": "Av. Constantino Nery, s/n — Flores",
        "neighborhood": "Flores",
        "zone": "Centro-Sul",
        "hours_description": "Segunda a sexta, 07h às 21h | Sábado, 08h às 12h",
        "has_extended_hours": True,
        "latitude": -3.0905,
        "longitude": -60.0264,
        "schedule_data": {
            "segunda": {"start": 7, "end": 21},
            "terca": {"start": 7, "end": 21},
            "quarta": {"start": 7, "end": 21},
            "quinta": {"start": 7, "end": 21},
            "sexta": {"start": 7, "end": 21},
            "sabado": {"start": 8, "end": 12},
            "domingo": None,
        },
    },
    {
        "id": "ubs-nilton-lins",
        "cnes": "7612341",
        "name": "UBS Nilton Lins",
        "address": "Av. Prof. Nilton Lins, 3220 — Flores",
        "neighborhood": "Flores",
        "zone": "Centro-Sul",
        "hours_description": "Segunda a sexta, 07h às 19h | Sábado, 08h às 12h",
        "has_extended_hours": True,
        "latitude": -3.0875,
        "longitude": -60.0180,
        "schedule_data": {
            "segunda": {"start": 7, "end": 19},
            "terca": {"start": 7, "end": 19},
            "quarta": {"start": 7, "end": 19},
            "quinta": {"start": 7, "end": 19},
            "sexta": {"start": 7, "end": 19},
            "sabado": {"start": 8, "end": 12},
            "domingo": None,
        },
    },
    {
        "id": "ubs-arthur-virgilio-filho",
        "cnes": "2014125",
        "name": "UBS Arthur Virgílio Filho",
        "address": "Av. Nossa Senhora da Conceição, s/n — Santa Etelvina",
        "neighborhood": "Santa Etelvina",
        "zone": "Norte",
        "hours_description": "Segunda a sexta, 07h às 17h",
        "has_extended_hours": False,
        "latitude": -3.0031,
        "longitude": -60.0225,
        "schedule_data": {
            "segunda": {"start": 7, "end": 17},
            "terca": {"start": 7, "end": 17},
            "quarta": {"start": 7, "end": 17},
            "quinta": {"start": 7, "end": 17},
            "sexta": {"start": 7, "end": 17},
            "sabado": None,
            "domingo": None,
        },
    },
    {
        "id": "ubs-alfredo-campos",
        "cnes": "2014389",
        "name": "UBS Alfredo Campos",
        "address": "Rua Jacamim, s/n — Zumbi dos Palmares",
        "neighborhood": "Zumbi dos Palmares",
        "zone": "Leste",
        "hours_description": "Segunda a sexta, 07h às 17h",
        "has_extended_hours": False,
        "latitude": -3.0847,
        "longitude": -59.9572,
        "schedule_data": {
            "segunda": {"start": 7, "end": 17},
            "terca": {"start": 7, "end": 17},
            "quarta": {"start": 7, "end": 17},
            "quinta": {"start": 7, "end": 17},
            "sexta": {"start": 7, "end": 17},
            "sabado": None,
            "domingo": None,
        },
    },
    {
        "id": "ubs-deodato-de-miranda-leao",
        "cnes": "2013919",
        "name": "UBS Deodato de Miranda Leão",
        "address": "Rua Belém, s/n — Glória",
        "neighborhood": "Glória",
        "zone": "Oeste",
        "hours_description": "Segunda a sexta, 07h às 19h",
        "has_extended_hours": True,
        "latitude": -3.1250,
        "longitude": -60.0380,
        "schedule_data": {
            "segunda": {"start": 7, "end": 19},
            "terca": {"start": 7, "end": 19},
            "quarta": {"start": 7, "end": 19},
            "quinta": {"start": 7, "end": 19},
            "sexta": {"start": 7, "end": 19},
            "sabado": None,
            "domingo": None,
        },
    },
    {
        "id": "ubs-megumo-kado",
        "cnes": "2014028",
        "name": "UBS Megumo Kado",
        "address": "Rua Amâncio de Miranda, s/n — Educandos",
        "neighborhood": "Educandos",
        "zone": "Sul",
        "hours_description": "Segunda a sexta, 07h às 17h",
        "has_extended_hours": False,
        "latitude": -3.1415,
        "longitude": -60.0110,
        "schedule_data": {
            "segunda": {"start": 7, "end": 17},
            "terca": {"start": 7, "end": 17},
            "quarta": {"start": 7, "end": 17},
            "quinta": {"start": 7, "end": 17},
            "sexta": {"start": 7, "end": 17},
            "sabado": None,
            "domingo": None,
        },
    },
]


async def seed_database() -> None:
    """
    Executa a inicialização do esquema e o seed de dados das UBS de Manaus de forma idempotente.
    """
    logger.info("Verificando/Criando tabelas no banco de dados...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Iniciando carga de dados das UBS...")
    async with AsyncSessionLocal() as session:
        count_inserted = 0
        count_updated = 0

        for ubs_dict in INITIAL_UBS_DATA:
            stmt = select(UBS).where(UBS.id == ubs_dict["id"])
            result = await session.execute(stmt)
            existing_ubs = result.scalar_one_or_none()

            if existing_ubs:
                for key, value in ubs_dict.items():
                    setattr(existing_ubs, key, value)
                count_updated += 1
            else:
                new_ubs = UBS(**ubs_dict)
                session.add(new_ubs)
                count_inserted += 1

        await session.commit()
        logger.info(
            "Carga concluída com sucesso! %d unidades inseridas, %d unidades atualizadas.",
            count_inserted,
            count_updated,
        )


if __name__ == "__main__":
    asyncio.run(seed_database())
