import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "prevsus-backend"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_list_all_ubs_ordered(client: AsyncClient):
    response = await client.get("/api/v1/ubs")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 6

    # Verificar ordenação alfabética (A-Z) por nome
    names = [ubs["name"] for ubs in data]
    assert names == sorted(names)

    # Verificar que o primeiro é Alfredo Campos e o último é UBS Nilton Lins
    assert names[0] == "UBS Alfredo Campos"
    assert names[-1] == "UBS Nilton Lins"


@pytest.mark.asyncio
async def test_filter_by_query_name(client: AsyncClient):
    response = await client.get("/api/v1/ubs?query=Rayol")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "ubs-dr-jose-rayol-dos-santos"


@pytest.mark.asyncio
async def test_filter_by_query_neighborhood(client: AsyncClient):
    response = await client.get("/api/v1/ubs?query=Flores")
    assert response.status_code == 200
    data = response.json()
    # No bairro Flores temos UBS Dr. José Rayol e UBS Nilton Lins
    assert len(data) == 2
    ids = {ubs["id"] for ubs in data}
    assert "ubs-dr-jose-rayol-dos-santos" in ids
    assert "ubs-nilton-lins" in ids


@pytest.mark.asyncio
async def test_filter_by_zone(client: AsyncClient):
    response = await client.get("/api/v1/ubs?zone=Norte")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "ubs-arthur-virgilio-filho"
    assert data[0]["zone"] == "Norte"


@pytest.mark.asyncio
async def test_filter_by_zone_todas(client: AsyncClient):
    response = await client.get("/api/v1/ubs?zone=Todas")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 6


@pytest.mark.asyncio
async def test_get_ubs_by_id_success(client: AsyncClient):
    ubs_id = "ubs-dr-jose-rayol-dos-santos"
    response = await client.get(f"/api/v1/ubs/{ubs_id}")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == ubs_id
    assert data["name"] == "UBS Dr. José Rayol dos Santos"
    assert data["zone"] == "Centro-Sul"
    assert data["has_extended_hours"] is True
    assert data["latitude"] == -3.0905
    assert data["longitude"] == -60.0264

    # Verificar compatibilidade com frontend (campos computados)
    assert data["hours"] == data["hours_description"]
    assert data["extendedHours"] is True
    assert "segunda" in data["schedule"]
    assert data["schedule"]["segunda"]["start"] == 7
    assert data["schedule"]["segunda"]["end"] == 21


@pytest.mark.asyncio
async def test_get_ubs_by_id_not_found(client: AsyncClient):
    response = await client.get("/api/v1/ubs/ubs-inexistente")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Unidade não encontrada"


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "docs" in data
    assert "api_v1" in data
