from typing import Literal, Optional
from pydantic import BaseModel, Field

DemandLevelType = Literal["baixa", "moderada", "alta"]
PredictionStatusType = Literal["OPEN", "CLOSED", "INSUFFICIENT_DATA"]


class PredictionResponse(BaseModel):
    ubs_id: str = Field(..., description="Slug identificador da UBS")
    day: str = Field(..., description="Dia da semana consultado (ex: 'segunda')")
    slot: str = Field(..., description="Faixa horária consultada (ex: '08-10')")
    status: PredictionStatusType = Field(
        ...,
        description="Status operacional e amostral: OPEN (atendimento com previsão), CLOSED (fechada) ou INSUFFICIENT_DATA (dados históricos esparsos)",
    )
    demand_level: Optional[DemandLevelType] = Field(
        default=None,
        description="Classificação estimada de demanda (baixa, moderada, alta - Regra RB03)",
    )
    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Grau de confiança estatística da inferência do modelo XGBoost (0.0 a 1.0)",
    )
    sufficient_data: bool = Field(
        ...,
        description="Indica se há densidade amostral suficiente para inferência confiável (Regra RB04)",
    )
    message: str = Field(
        ...,
        description="Mensagem explicativa orientativa para o usuário e transparência algorítmica",
    )
