from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.ml.predictor import predictor
from app.schemas.prediction import PredictionResponse
from app.schemas.schedule import SlotAvailabilityResponse
from app.schemas.ubs import UbsResponse
from app.services.schedule_service import ScheduleService
from app.services.ubs_service import UBSService

router = APIRouter()


@router.get(
    "",
    response_model=List[UbsResponse],
    summary="Listar e filtrar Unidades Básicas de Saúde",
    description="Retorna a lista de UBS de Manaus com suporte a busca textual por nome/bairro e filtro por zona.",
)
async def list_ubs(
    query: Optional[str] = Query(
        None,
        description="Termo para busca textual (nome da unidade ou bairro)",
        examples=["Flores", "Arthur"],
    ),
    zone: Optional[str] = Query(
        None,
        description="Filtro por zona distrital (ex: Norte, Sul, Leste, Oeste, Centro-Sul, Todas)",
        examples=["Centro-Sul"],
    ),
    db: AsyncSession = Depends(get_db),
) -> List[UbsResponse]:
    ubs_list = await UBSService.get_all(db=db, query=query, zone=zone)
    return [UbsResponse.model_validate(item) for item in ubs_list]


@router.get(
    "/{id}/slots",
    response_model=SlotAvailabilityResponse,
    summary="Consultar disponibilidade de faixas horárias da UBS (Regra RB02)",
    description="Retorna a disponibilidade operacional de cada faixa horária para a UBS e dia especificados.",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Unidade não encontrada",
            "content": {"application/json": {"example": {"detail": "Unidade não encontrada"}}},
        }
    },
)
async def get_ubs_slots(
    id: str,
    day: str = Query(
        "segunda",
        pattern="^(segunda|terca|quarta|quinta|sexta|sabado|domingo)$",
        description="Dia da semana (segunda, terca, quarta, quinta, sexta, sabado, domingo)",
    ),
    db: AsyncSession = Depends(get_db),
) -> SlotAvailabilityResponse:
    ubs = await UBSService.get_by_id(db=db, ubs_id=id)
    if not ubs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade não encontrada",
        )

    return ScheduleService.calculate_slots_availability(
        ubs_id=ubs.id,
        ubs_schedule_data=ubs.schedule_data,
        day=day,
    )


@router.get(
    "/{id}/predict",
    response_model=PredictionResponse,
    summary="Consultar previsão de demanda via XGBoost (Regras RB03/RB04)",
    description="Classifica o nível de demanda preditiva (Baixa, Moderada, Alta) ou sinaliza dados insuficientes.",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Unidade não encontrada",
            "content": {"application/json": {"example": {"detail": "Unidade não encontrada"}}},
        }
    },
)
async def predict_ubs_demand(
    id: str,
    day: str = Query(
        "segunda",
        pattern="^(segunda|terca|quarta|quinta|sexta|sabado|domingo)$",
        description="Dia da semana da previsão",
    ),
    slot: str = Query(
        ...,
        pattern="^(08-10|10-12|13-15|15-17|17-19|19-21)$",
        description="Faixa horária da previsão",
    ),
    db: AsyncSession = Depends(get_db),
) -> PredictionResponse:
    ubs = await UBSService.get_by_id(db=db, ubs_id=id)
    if not ubs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade não encontrada",
        )

    # Avaliar disponibilidade do slot segundo a regra RB02
    slots_avail = ScheduleService.calculate_slots_availability(
        ubs_id=ubs.id,
        ubs_schedule_data=ubs.schedule_data,
        day=day,
    )
    is_slot_open = any(s.slot == slot and s.is_available for s in slots_avail.slots)

    # Executar inferência preditiva com XGBoost e corte RB04
    return predictor.predict_demand(
        ubs_id=ubs.id,
        day=day,
        slot=slot,
        is_open=is_slot_open,
        is_extended_hours=ubs.has_extended_hours,
    )


@router.get(
    "/{id}",
    response_model=UbsResponse,
    summary="Obter detalhes de uma UBS por ID",
    description="Retorna as informações cadastrais e janelas operacionais da UBS informada pelo ID (slug).",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Unidade não encontrada",
            "content": {"application/json": {"example": {"detail": "Unidade não encontrada"}}},
        }
    },
)
async def get_ubs(
    id: str,
    db: AsyncSession = Depends(get_db),
) -> UbsResponse:
    ubs = await UBSService.get_by_id(db=db, ubs_id=id)
    if not ubs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade não encontrada",
        )
    return UbsResponse.model_validate(ubs)
