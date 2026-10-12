from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field


class DayWindowSchema(BaseModel):
    start: int = Field(..., ge=0, le=24, description="Hora de abertura (ex: 7 para 07h)")
    end: int = Field(..., ge=0, le=24, description="Hora de encerramento (ex: 21 para 21h)")


class UbsBase(BaseModel):
    name: str = Field(..., max_length=255, description="Nome oficial da UBS")
    address: str = Field(..., max_length=255, description="Endereço completo da unidade")
    neighborhood: str = Field(..., max_length=100, description="Bairro em Manaus")
    zone: str = Field(..., max_length=50, description="Zona distrital (Norte, Sul, Leste, Oeste, Centro-Sul)")
    hours_description: str = Field(..., max_length=255, description="Descrição textual dos horários")
    has_extended_hours: bool = Field(default=False, description="Indica se possui horário ampliado (além das 17h ou sábados)")
    latitude: float = Field(..., description="Latitude geográfica")
    longitude: float = Field(..., description="Longitude geográfica")
    schedule_data: Dict[str, Optional[DayWindowSchema]] = Field(
        default_factory=dict,
        description="Janelas operacionais por dia da semana (segunda a domingo)",
    )
    cnes: Optional[str] = Field(default=None, max_length=20, description="Código CNES no DataSUS")


class UbsCreate(UbsBase):
    id: str = Field(..., max_length=100, description="Slug identificador único da UBS")


class UbsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    zone: Optional[str] = None
    hours_description: Optional[str] = None
    has_extended_hours: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    schedule_data: Optional[Dict[str, Optional[DayWindowSchema]]] = None
    cnes: Optional[str] = None


class UbsResponse(UbsBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

    # Propriedades computadas para compatibilidade direta com os tipos do frontend TypeScript
    @computed_field
    @property
    def hours(self) -> str:
        return self.hours_description

    @computed_field
    @property
    def extendedHours(self) -> bool:
        return self.has_extended_hours

    @computed_field
    @property
    def schedule(self) -> Dict[str, Any]:
        return self.schedule_data

    @computed_field
    @property
    def isOpen(self) -> bool:
        from app.services.schedule_service import ScheduleService
        return ScheduleService.is_ubs_open_now(self.schedule_data)

    @computed_field
    @property
    def is_open(self) -> bool:
        return self.isOpen
