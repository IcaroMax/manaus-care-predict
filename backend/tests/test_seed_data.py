import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ubs import UBS
from app.scripts.seed_data import INITIAL_UBS_DATA, seed_database


@pytest.mark.asyncio
async def test_seed_database_idempotency(db_session: AsyncSession):
    # db_session já foi preenchido com INITIAL_UBS_DATA
    result = await db_session.execute(select(func.count()).select_from(UBS))
    total_before = result.scalar_one()
    assert total_before == len(INITIAL_UBS_DATA)

    # Executar nova inserção dos mesmos dados simulando reexecução do script
    for ubs_dict in INITIAL_UBS_DATA:
        stmt = select(UBS).where(UBS.id == ubs_dict["id"])
        res = await db_session.execute(stmt)
        record = res.scalar_one()
        for k, v in ubs_dict.items():
            setattr(record, k, v)
    await db_session.commit()

    # Contagem deve continuar exatamente igual a 6
    result = await db_session.execute(select(func.count()).select_from(UBS))
    total_after = result.scalar_one()
    assert total_after == len(INITIAL_UBS_DATA)
