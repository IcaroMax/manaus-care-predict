from datetime import datetime
from zoneinfo import ZoneInfo
import pytest
from httpx import AsyncClient

from app.services.schedule_service import ScheduleService

MANAUS_TZ = ZoneInfo("America/Manaus")


@pytest.mark.asyncio
async def test_standard_hours_ubs_slots(client: AsyncClient):
    """
    UBS Arthur Virgílio Filho possui horário padrão (07h às 17h, segunda a sexta).
    - Em dias úteis (segunda), slots 17-19 e 19-21 devem estar bloqueados com 'fora do expediente'.
    - Sábado e domingo devem estar completamente bloqueados com 'unidade fechada no dia'.
    """
    ubs_id = "ubs-arthur-virgilio-filho"

    # 1. Dia útil (Segunda-feira)
    res_seg = await client.get(f"/api/v1/ubs/{ubs_id}/slots?day=segunda")
    assert res_seg.status_code == 200
    data_seg = res_seg.json()
    assert data_seg["ubs_id"] == ubs_id
    assert data_seg["day"] == "segunda"
    assert data_seg["is_open_day"] is True

    slots_map = {s["slot"]: s for s in data_seg["slots"]}
    assert slots_map["08-10"]["is_available"] is True
    assert slots_map["10-12"]["is_available"] is True
    assert slots_map["13-15"]["is_available"] is True
    assert slots_map["15-17"]["is_available"] is True

    # Bloqueados após 17h
    assert slots_map["17-19"]["is_available"] is False
    assert slots_map["17-19"]["reason"] == "fora do expediente"
    assert slots_map["19-21"]["is_available"] is False
    assert slots_map["19-21"]["reason"] == "fora do expediente"

    # 2. Sábado (fechado)
    res_sab = await client.get(f"/api/v1/ubs/{ubs_id}/slots?day=sabado")
    assert res_sab.status_code == 200
    data_sab = res_sab.json()
    assert data_sab["is_open_day"] is False
    assert all(s["is_available"] is False for s in data_sab["slots"])
    assert all(s["reason"] == "unidade fechada no dia" for s in data_sab["slots"])

    # 3. Domingo (fechado)
    res_dom = await client.get(f"/api/v1/ubs/{ubs_id}/slots?day=domingo")
    assert res_dom.status_code == 200
    data_dom = res_dom.json()
    assert data_dom["is_open_day"] is False
    assert all(s["is_available"] is False for s in data_dom["slots"])
    assert all(s["reason"] == "unidade fechada no dia" for s in data_dom["slots"])


@pytest.mark.asyncio
async def test_extended_hours_ubs_slots(client: AsyncClient):
    """
    UBS Dr. José Rayol dos Santos possui horário ampliado (07h às 21h seg-sex; 08h às 12h sábado).
    - Em dias úteis (segunda), slots 17-19 e 19-21 devem ser permitidos (is_available=True).
    - No sábado, faixas 08-10 e 10-12 são permitidas, e após as 12h são bloqueadas com 'fora do expediente'.
    """
    ubs_id = "ubs-dr-jose-rayol-dos-santos"

    # 1. Dia útil (Segunda-feira até 21h)
    res_seg = await client.get(f"/api/v1/ubs/{ubs_id}/slots?day=segunda")
    assert res_seg.status_code == 200
    data_seg = res_seg.json()
    assert data_seg["is_open_day"] is True

    slots_map = {s["slot"]: s for s in data_seg["slots"]}
    assert slots_map["08-10"]["is_available"] is True
    assert slots_map["10-12"]["is_available"] is True
    assert slots_map["13-15"]["is_available"] is True
    assert slots_map["15-17"]["is_available"] is True
    assert slots_map["17-19"]["is_available"] is True
    assert slots_map["19-21"]["is_available"] is True

    # 2. Sábado (08h às 12h)
    res_sab = await client.get(f"/api/v1/ubs/{ubs_id}/slots?day=sabado")
    assert res_sab.status_code == 200
    data_sab = res_sab.json()
    assert data_sab["is_open_day"] is True

    sab_map = {s["slot"]: s for s in data_sab["slots"]}
    assert sab_map["08-10"]["is_available"] is True
    assert sab_map["10-12"]["is_available"] is True

    # Fechado após as 12h
    assert sab_map["13-15"]["is_available"] is False
    assert sab_map["13-15"]["reason"] == "fora do expediente"
    assert sab_map["15-17"]["is_available"] is False
    assert sab_map["17-19"]["is_available"] is False
    assert sab_map["19-21"]["is_available"] is False


@pytest.mark.asyncio
async def test_sunday_closed_for_all_units(client: AsyncClient):
    """
    Garante que no domingo todas as 6 UBS de Manaus retornam is_open_day=False.
    """
    list_res = await client.get("/api/v1/ubs")
    assert list_res.status_code == 200
    all_ubs = list_res.json()
    assert len(all_ubs) == 6

    for ubs in all_ubs:
        res = await client.get(f"/api/v1/ubs/{ubs['id']}/slots?day=domingo")
        assert res.status_code == 200
        data = res.json()
        assert data["is_open_day"] is False
        assert all(s["is_available"] is False for s in data["slots"])
        assert all(s["reason"] == "unidade fechada no dia" for s in data["slots"])


@pytest.mark.asyncio
async def test_slots_non_existent_ubs(client: AsyncClient):
    """
    Garante 404 para busca de slots em unidade inexistente.
    """
    res = await client.get("/api/v1/ubs/ubs-inexistente/slots?day=segunda")
    assert res.status_code == 404
    assert res.json()["detail"] == "Unidade não encontrada"


@pytest.mark.asyncio
async def test_slots_invalid_day_parameter(client: AsyncClient):
    """
    Garante 422 para dia da semana fora do enum válido.
    """
    res = await client.get("/api/v1/ubs/ubs-dr-jose-rayol-dos-santos/slots?day=invalido")
    assert res.status_code == 422


def test_is_ubs_open_now_unit():
    """
    Teste unitário para a função is_ubs_open_now com horários simulados.
    """
    schedule = {
        "segunda": {"start": 7, "end": 17},
        "sabado": {"start": 8, "end": 12},
        "domingo": None,
    }

    # Segunda às 10h30 (aberto)
    dt_open = datetime(2026, 10, 12, 10, 30, tzinfo=MANAUS_TZ)  # Segunda-feira
    assert ScheduleService.is_ubs_open_now(schedule, dt_open) is True

    # Segunda às 17h01 (fechado)
    dt_closed_night = datetime(2026, 10, 12, 17, 1, tzinfo=MANAUS_TZ)
    assert ScheduleService.is_ubs_open_now(schedule, dt_closed_night) is False

    # Segunda às 06h59 (fechado)
    dt_closed_early = datetime(2026, 10, 12, 6, 59, tzinfo=MANAUS_TZ)
    assert ScheduleService.is_ubs_open_now(schedule, dt_closed_early) is False

    # Domingo (fechado o dia todo)
    dt_sunday = datetime(2026, 10, 18, 10, 0, tzinfo=MANAUS_TZ)  # Domingo
    assert ScheduleService.is_ubs_open_now(schedule, dt_sunday) is False
