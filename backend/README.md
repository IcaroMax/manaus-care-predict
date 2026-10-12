# PrevSUS Backend — Previsão de Demanda em UBS de Manaus

Backend REST assíncrono desenvolvido em **FastAPI**, **SQLAlchemy (AsyncIO)** e **PostgreSQL**, estruturado para alimentar o frontend do projeto **PrevSUS** (Trabalho de Conclusão de Curso - Fametro).

---

## 🏛️ Arquitetura do Projeto

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── health.py        # Health check e status do banco
│   │       │   └── ubs.py           # Endpoints de listagem, busca e detalhes da UBS
│   │       └── router.py            # Agregação das rotas da v1
│   ├── core/
│   │   ├── config.py                # Configurações com Pydantic Settings e CORS
│   │   └── database.py              # Engine assíncrona, sessão e Base declarativa
│   ├── models/
│   │   ├── __init__.py
│   │   └── ubs.py                   # Entidade SQLAlchemy mapeando a tabela 'ubs'
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── ubs.py                   # Schemas Pydantic v2 de validação e serialização
│   ├── services/
│   │   ├── __init__.py
│   │   └── ubs_service.py           # Lógica de negócio e queries assíncronas
│   ├── scripts/
│   │   └── seed_data.py             # Script idempotente de carga inicial das UBS
│   └── main.py                      # Ponto de entrada FastAPI e ciclo de vida
├── .env.example
├── .gitignore
├── Dockerfile                       # Imagem base Python 3.11-slim
├── docker-compose.yml               # Orquestração da API e PostgreSQL
├── requirements.txt
└── README.md
```

---

## 🚀 Como Executar com Docker Compose (Recomendado)

### 1. Clonar e configurar variáveis de ambiente

Na pasta `backend/`:

```bash
cp .env.example .env
```

### 2. Subir os containers (PostgreSQL + FastAPI)

```bash
docker compose up --build -d
```

O serviço do PostgreSQL passará por checagem de saúde (`healthcheck`) e a API subirá automaticamente na porta `8000`.

### 3. Popular o Banco com os Dados Iniciais de Manaus (Seed)

Execute o script assíncrono dentro do container da API:

```bash
docker compose exec api python -m app.scripts.seed_data
```

Esse comando cria as tabelas e cadastra de forma idempotente as 6 unidades de saúde iniciais de Manaus (UBS Dr. José Rayol, Nilton Lins, Arthur Virgílio, Alfredo Campos, Deodato de Miranda Leão e Megumo Kado).

### 4. Verificar logs

```bash
docker compose logs -f api
```

---

## 💻 Execução Local (Sem Docker)

### 1. Criar e ativar o ambiente virtual

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configurar `.env`

Certifique-se de ter um PostgreSQL rodando e ajuste `DATABASE_URL`:

```bash
DATABASE_URL="postgresql+asyncpg://prevsus:prevsus_password@localhost:5432/prevsus_db"
```

### 4. Executar carga inicial

```bash
python -m app.scripts.seed_data
```

### 5. Iniciar o servidor de desenvolvimento

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📡 Endpoints Disponíveis

| Método | Rota                               | Descrição                                                                 |
| ------ | ---------------------------------- | ------------------------------------------------------------------------- |
| `GET`  | `/health`                          | Status da API e teste de conexão com o banco                              |
| `GET`  | `/api/v1/health`                   | Health check no prefixo da v1                                             |
| `GET`  | `/api/v1/ubs`                      | Lista todas as UBS cadastradas (ordenação A–Z)                            |
| `GET`  | `/api/v1/ubs?query={termo}`        | Busca textual insensível a maiúsculas por nome ou bairro                  |
| `GET`  | `/api/v1/ubs?zone={zona}`          | Filtro por zona (`Norte`, `Sul`, `Leste`, `Oeste`, `Centro-Sul`, `Todas`) |
| `GET`  | `/api/v1/ubs/{id}`                 | Detalhes cadastrais e janelas de funcionamento da UBS (ou 404)            |
| `GET`  | `/api/v1/ubs/{id}/slots?day={dia}` | Disponibilidade operacional das faixas horárias segundo a Regra RB02      |
| `GET`  | `/api/v1/ubs/{id}/predict?day={dia}&slot={faixa}` | Previsão de demanda via XGBoost (RB03) com corte amostral (RB04) |

### 🤖 Pipeline de Machine Learning (XGBoost)

Para regenerar a base de dados histórica e retreinar o modelo preditivo:

```bash
# 1. Gerar dataset sintético calibrado para Manaus
python -m app.scripts.generate_dataset

# 2. Treinar modelo XGBoost multiclasse e persistir artefatos
python -m app.scripts.train_model
```

### Documentação Interativa

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Exemplos de Requisições

### 1. Health Check

```bash
curl -X GET http://localhost:8000/health
```

**Resposta (200 OK):**

```json
{
  "status": "healthy",
  "service": "prevsus-backend",
  "database": "connected"
}
```

### 2. Listagem com Filtro por Zona e Busca

```bash
curl -X GET "http://localhost:8000/api/v1/ubs?zone=Centro-Sul&query=Flores"
```

### 3. Detalhe de UBS por ID

```bash
curl -X GET http://localhost:8000/api/v1/ubs/ubs-dr-jose-rayol-dos-santos
```

**Resposta (200 OK):**

```json
{
  "id": "ubs-dr-jose-rayol-dos-santos",
  "cnes": "2013897",
  "name": "UBS Dr. José Rayol dos Santos",
  "address": "Av. Constantino Nery, s/n — Flores",
  "neighborhood": "Flores",
  "zone": "Centro-Sul",
  "hours_description": "Segunda a sexta, 07h às 21h | Sábado, 08h às 12h",
  "has_extended_hours": true,
  "latitude": -3.0905,
  "longitude": -60.0264,
  "schedule_data": {
    "segunda": { "start": 7, "end": 21 },
    "terca": { "start": 7, "end": 21 },
    "quarta": { "start": 7, "end": 21 },
    "quinta": { "start": 7, "end": 21 },
    "sexta": { "start": 7, "end": 21 },
    "sabado": { "start": 8, "end": 12 },
    "domingo": null
  },
  "hours": "Segunda a sexta, 07h às 21h | Sábado, 08h às 12h",
  "extendedHours": true,
  "schedule": {
    "segunda": { "start": 7, "end": 21 },
    "terca": { "start": 7, "end": 21 },
    "quarta": { "start": 7, "end": 21 },
    "quinta": { "start": 7, "end": 21 },
    "sexta": { "start": 7, "end": 21 },
    "sabado": { "start": 8, "end": 12 },
    "domingo": null
  }
}
```
