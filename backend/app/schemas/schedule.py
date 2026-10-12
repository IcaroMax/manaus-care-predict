from typing import List, Optional
from pydantic import BaseModel, Field


class SlotItem(BaseModel):
    slot: str = Field(..., description="Identificador da faixa horária (ex.: '08-10')")
    label: str = Field(..., description="Rótulo formatado para exibição (ex.: '08h–10h')")
    start_hour: int = Field(..., description="Hora de início da faixa (ex.: 8)")
    end_hour: int = Field(..., description="Hora de término da faixa (ex.: 10)")
    is_available: bool = Field(..., description="Indica se a faixa está dentro da janela de expediente")
    reason: Optional[str] = Field(
        default=None,
        description="Motivo da indisponibilidade (ex.: 'fora do expediente', 'unidade fechada no dia', ou None)",
    )


class SlotAvailabilityResponse(BaseModel):
    ubs_id: str = Field(..., description="Slug identificador da UBS")
    day: str = Field(..., description="Dia da semana consultado")
    is_open_day: bool = Field(..., description="Indica se a unidade possui expediente no dia")
    slots: List[SlotItem] = Field(..., description="Lista de faixas horárias e suas disponibilidades")
