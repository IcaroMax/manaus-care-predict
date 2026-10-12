from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()


@router.get(
    "/health",
    summary="Verificação de integridade e conectividade",
    status_code=status.HTTP_200_OK,
)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Executa verificação de integridade da API e da conexão com o banco PostgreSQL.
    """
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "prevsus-backend",
                "database": f"disconnected: {str(exc)}",
            },
        )

    return {
        "status": "healthy",
        "service": "prevsus-backend",
        "database": db_status,
    }
