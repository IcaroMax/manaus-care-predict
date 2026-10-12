from datetime import datetime
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from app.schemas.schedule import SlotAvailabilityResponse, SlotItem

MANAUS_TZ = ZoneInfo("America/Manaus")

STANDARD_TIME_SLOTS = [
    {"slot": "08-10", "label": "08h–10h", "start_hour": 8, "end_hour": 10},
    {"slot": "10-12", "label": "10h–12h", "start_hour": 10, "end_hour": 12},
    {"slot": "13-15", "label": "13h–15h", "start_hour": 13, "end_hour": 15},
    {"slot": "15-17", "label": "15h–17h", "start_hour": 15, "end_hour": 17},
    {"slot": "17-19", "label": "17h–19h", "start_hour": 17, "end_hour": 19},
    {"slot": "19-21", "label": "19h–21h", "start_hour": 19, "end_hour": 21},
]

PYTHON_TO_WEEKDAY: Dict[int, str] = {
    0: "segunda",
    1: "terca",
    2: "quarta",
    3: "quinta",
    4: "sexta",
    5: "sabado",
    6: "domingo",
}


def _extract_window_bound(window: Any, field_name: str, default: int = 0) -> int:
    """Extrai start ou end independentemente de window ser dict ou modelo Pydantic/objeto."""
    if isinstance(window, dict):
        return int(window.get(field_name, default))
    return int(getattr(window, field_name, default))


class ScheduleService:
    @staticmethod
    def calculate_slots_availability(
        ubs_id: str,
        ubs_schedule_data: Optional[Dict[str, Any]],
        day: str,
    ) -> SlotAvailabilityResponse:
        """
        Calcula a disponibilidade de cada faixa horária para uma UBS em determinado dia da semana,
        respeitando estritamente a Regra de Negócio RB02.
        """
        schedule = ubs_schedule_data or {}
        day_window = schedule.get(day)

        # Caso a unidade não abra no dia (ex.: domingo ou sábado para UBS padrão)
        if not day_window:
            slots = [
                SlotItem(
                    slot=s["slot"],
                    label=s["label"],
                    start_hour=s["start_hour"],
                    end_hour=s["end_hour"],
                    is_available=False,
                    reason="unidade fechada no dia",
                )
                for s in STANDARD_TIME_SLOTS
            ]
            return SlotAvailabilityResponse(
                ubs_id=ubs_id,
                day=day,
                is_open_day=False,
                slots=slots,
            )

        start_time = _extract_window_bound(day_window, "start", 0)
        end_time = _extract_window_bound(day_window, "end", 0)

        slots: List[SlotItem] = []
        for s in STANDARD_TIME_SLOTS:
            # RB02: A faixa só está disponível se iniciar >= abertura e encerrar <= fechamento
            if s["start_hour"] >= start_time and s["end_hour"] <= end_time:
                slots.append(
                    SlotItem(
                        slot=s["slot"],
                        label=s["label"],
                        start_hour=s["start_hour"],
                        end_hour=s["end_hour"],
                        is_available=True,
                        reason=None,
                    )
                )
            else:
                slots.append(
                    SlotItem(
                        slot=s["slot"],
                        label=s["label"],
                        start_hour=s["start_hour"],
                        end_hour=s["end_hour"],
                        is_available=False,
                        reason="fora do expediente",
                    )
                )

        return SlotAvailabilityResponse(
            ubs_id=ubs_id,
            day=day,
            is_open_day=True,
            slots=slots,
        )

    @staticmethod
    def is_ubs_open_now(
        ubs_schedule_data: Optional[Dict[str, Any]],
        current_dt: Optional[datetime] = None,
    ) -> bool:
        """
        Determina se uma UBS está em operação no momento exato, considerando o fuso horário
        oficial de Manaus (America/Manaus - UTC-4).
        """
        if not ubs_schedule_data:
            return False

        if current_dt is None:
            current_dt = datetime.now(MANAUS_TZ)
        elif current_dt.tzinfo is None:
            current_dt = current_dt.replace(tzinfo=MANAUS_TZ)
        else:
            current_dt = current_dt.astimezone(MANAUS_TZ)

        weekday_key = PYTHON_TO_WEEKDAY.get(current_dt.weekday(), "")
        day_window = ubs_schedule_data.get(weekday_key)
        if not day_window:
            return False

        start = _extract_window_bound(day_window, "start", 0)
        end = _extract_window_bound(day_window, "end", 0)
        current_hour = current_dt.hour + (current_dt.minute / 60.0)

        return start <= current_hour < end
