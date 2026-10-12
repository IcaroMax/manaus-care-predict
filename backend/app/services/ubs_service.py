from typing import List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ubs import UBS
from app.schemas.ubs import UbsCreate, UbsUpdate


class UBSService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        query: Optional[str] = None,
        zone: Optional[str] = None,
    ) -> List[UBS]:
        """
        Retorna todas as UBS cadastradas com suporte a:
        - Filtro textual (query) no nome ou no bairro (ILIKE).
        - Filtro distrital por zona (ignora se for 'Todas' ou vazio).
        - Ordenação alfabética padrão (A-Z) por nome da unidade.
        """
        stmt = select(UBS)

        if query and query.strip():
            search_term = f"%{query.strip()}%"
            stmt = stmt.where(
                or_(
                    UBS.name.ilike(search_term),
                    UBS.neighborhood.ilike(search_term),
                )
            )

        if zone and zone.strip() and zone.strip().lower() != "todas":
            stmt = stmt.where(UBS.zone.ilike(zone.strip()))

        stmt = stmt.order_by(UBS.name.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, ubs_id: str) -> Optional[UBS]:
        """
        Busca uma UBS pelo seu identificador primário slug (ex: 'ubs-dr-jose-rayol-dos-santos').
        """
        stmt = select(UBS).where(UBS.id == ubs_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, ubs_in: UbsCreate) -> UBS:
        """
        Cadastra uma nova UBS no banco de dados.
        """
        ubs_data = ubs_in.model_dump()
        ubs = UBS(**ubs_data)
        db.add(ubs)
        await db.commit()
        await db.refresh(ubs)
        return ubs

    @staticmethod
    async def update(db: AsyncSession, ubs: UBS, ubs_in: UbsUpdate) -> UBS:
        """
        Atualiza campos específicos de uma UBS.
        """
        update_data = ubs_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ubs, field, value)
        db.add(ubs)
        await db.commit()
        await db.refresh(ubs)
        return ubs
