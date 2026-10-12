import time
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_predict_open_peak_hours(client: AsyncClient):
    """
    Testa inferência válida do XGBoost em horário de pico (Segunda-feira 08h-10h no Rayol).
    Deve retornar status OPEN, demand_level classificado (RB03), confiança calculada e sufficient_data=True.
    """
    ubs_id = "ubs-dr-jose-rayol-dos-santos"
    response = await client.get(f"/api/v1/ubs/{ubs_id}/predict?day=segunda&slot=08-10")
    assert response.status_code == 200
    data = response.json()

    assert data["ubs_id"] == ubs_id
    assert data["day"] == "segunda"
    assert data["slot"] == "08-10"
    assert data["status"] == "OPEN"
    assert data["sufficient_data"] is True
    assert data["demand_level"] in ["baixa", "moderada", "alta"]
    assert data["confidence"] is not None
    assert 0.0 <= data["confidence"] <= 1.0
    assert "Regra RB03" in data["message"]


@pytest.mark.asyncio
async def test_predict_closed_schedule_rb02(client: AsyncClient):
    """
    Testa resposta quando a unidade está fechada no período (RB02):
    1. Arthur Virgílio no domingo (fechada o dia todo).
    2. Arthur Virgílio em dia útil às 19h (fora do horário padrão até 17h).
    Deve retornar status CLOSED, demand_level=None e sufficient_data=False.
    """
    ubs_id = "ubs-arthur-virgilio-filho"

    # 1. Domingo fechado
    res_dom = await client.get(f"/api/v1/ubs/{ubs_id}/predict?day=domingo&slot=08-10")
    assert res_dom.status_code == 200
    data_dom = res_dom.json()
    assert data_dom["status"] == "CLOSED"
    assert data_dom["demand_level"] is None
    assert data_dom["confidence"] is None
    assert data_dom["sufficient_data"] is False
    assert "Regra RB02" in data_dom["message"]

    # 2. Fora do expediente (19-21)
    res_noite = await client.get(f"/api/v1/ubs/{ubs_id}/predict?day=segunda&slot=19-21")
    assert res_noite.status_code == 200
    data_noite = res_noite.json()
    assert data_noite["status"] == "CLOSED"
    assert data_noite["demand_level"] is None
    assert data_noite["sufficient_data"] is False


@pytest.mark.asyncio
async def test_predict_insufficient_data_rb04(client: AsyncClient):
    """
    Testa o gatilho de dados históricos insuficientes (Regra RB04):
    Na UBS Dr. José Rayol, a quarta-feira 13h-15h possui amostragem esparsa (< 15 amostras).
    Deve retornar status INSUFFICIENT_DATA, demand_level=None e sufficient_data=False.
    """
    ubs_id = "ubs-dr-jose-rayol-dos-santos"
    response = await client.get(f"/api/v1/ubs/{ubs_id}/predict?day=quarta&slot=13-15")
    assert response.status_code == 200
    data = response.json()

    assert data["ubs_id"] == ubs_id
    assert data["status"] == "INSUFFICIENT_DATA"
    assert data["demand_level"] is None
    assert data["confidence"] is None
    assert data["sufficient_data"] is False
    assert "Regra RB04" in data["message"]


@pytest.mark.asyncio
async def test_predict_latency_sub_second_rnf03(client: AsyncClient):
    """
    Garante o Requisito Não Funcional RNF03:
    Tempo de resposta de inferência em memória estritamente inferior a 50 milissegundos.
    """
    ubs_id = "ubs-nilton-lins"
    start_time = time.perf_counter()
    response = await client.get(f"/api/v1/ubs/{ubs_id}/predict?day=segunda&slot=10-12")
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    assert response.status_code == 200
    assert elapsed_ms < 50.0, f"Latência de {elapsed_ms:.2f}ms excedeu limite de 50ms (RNF03)"


@pytest.mark.asyncio
async def test_predict_non_existent_ubs(client: AsyncClient):
    """
    Testa retorno 404 para identificador de UBS inexistente.
    """
    response = await client.get("/api/v1/ubs/ubs-inexistente/predict?day=segunda&slot=08-10")
    assert response.status_code == 404
    assert response.json()["detail"] == "Unidade não encontrada"


@pytest.mark.asyncio
async def test_predict_invalid_query_parameters(client: AsyncClient):
    """
    Testa retorno 422 para parâmetros inválidos de dia ou faixa horária.
    """
    ubs_id = "ubs-dr-jose-rayol-dos-santos"

    # Dia inválido
    res_bad_day = await client.get(f"/api/v1/ubs/{ubs_id}/predict?day=feriado&slot=08-10")
    assert res_bad_day.status_code == 422

    # Slot inválido
    res_bad_slot = await client.get(f"/api/v1/ubs/{ubs_id}/predict?day=segunda&slot=00-04")
    assert res_bad_slot.status_code == 422
