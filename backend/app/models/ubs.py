from typing import Any, Dict, Optional
from sqlalchemy import Boolean, Float, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.core.database import Base


class UBS(Base):
    __tablename__ = "ubs"

    id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    cnes: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    neighborhood: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    zone: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    hours_description: Mapped[str] = mapped_column(String(255), nullable=False)
    has_extended_hours: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    schedule_data: Mapped[Dict[str, Any]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=False,
        default=dict,
    )

    def __repr__(self) -> str:
        return f"<UBS(id='{self.id}', name='{self.name}', zone='{self.zone}')>"
