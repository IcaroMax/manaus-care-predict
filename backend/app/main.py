from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.health import health_check
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.ml.predictor import predictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciamento do ciclo de vida da aplicação:
    1. Cria as tabelas do banco de dados na inicialização se ainda não existirem.
    2. Inicializa e carrega em memória o modelo preditivo XGBoost e matriz amostral (RNF03).
    """
    logger.info("Iniciando %s...", settings.PROJECT_NAME)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Tabelas verificadas/criadas com sucesso no banco de dados.")
    except Exception as exc:
        logger.warning(
            "Não foi possível conectar ao banco de dados no startup: %s. Aguardando inicialização do container...",
            exc,
        )

    # Carregar modelo XGBoost e metadados amostrais em memória
    if not predictor.is_ready:
        logger.info("Carregando modelo preditivo XGBoost e metadados amostrais...")
        predictor.load_artifacts()

    yield
    logger.info("Encerrando conexões do pool de banco de dados...")
    await engine.dispose()
    logger.info("Aplicação finalizada.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API do PrevSUS — Sistema de Previsão de Demanda e Ocupação em UBS de Manaus (TCC Fametro).",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configuração de CORS para permitir consumo pelo frontend (React / Vite / Lovable)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint direto de Health Check na raiz
app.add_api_route(
    "/health",
    health_check,
    methods=["GET"],
    tags=["Health"],
    summary="Health check raiz",
)

# Roteador da API v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"], summary="Raiz do serviço")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "api_v1": f"{settings.API_V1_STR}/ubs",
    }
