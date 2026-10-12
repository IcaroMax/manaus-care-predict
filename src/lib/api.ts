import {
  TIME_SLOTS,
  getUbsById,
  isSlotAvailable,
  isUbsOpenNow,
  searchUbs,
  type DemandLevel,
  type TimeSlot,
  type Ubs,
  type WeekDay,
  type Zone,
} from "@/lib/prevsus-data";

export const API_BASE_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:8000/api/v1";

export interface SlotItem {
  slot: string;
  label: string;
  start_hour: number;
  end_hour: number;
  is_available: boolean;
  reason?: string | null;
}

export interface SlotAvailabilityResponse {
  ubs_id: string;
  day: string;
  is_open_day: boolean;
  slots: SlotItem[];
}

export interface PredictionResult {
  ubs_id: string;
  day: string;
  slot: string;
  status: "OPEN" | "CLOSED" | "INSUFFICIENT_DATA";
  demand_level: DemandLevel | null;
  confidence?: number | null;
  sufficient_data: boolean;
  message: string;
}

export interface BackendUbsPayload {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  zone: Zone;
  hours_description: string;
  has_extended_hours: boolean;
  latitude: number;
  longitude: number;
  schedule_data: Record<string, { start: number; end: number } | null>;
  cnes?: string | null;
  hours?: string;
  extendedHours?: boolean;
  schedule?: Record<string, { start: number; end: number } | null>;
  isOpen?: boolean;
  is_open?: boolean;
}

const emptyDemandMap: Record<WeekDay, Record<TimeSlot, DemandLevel | null>> = {
  segunda: {} as Record<TimeSlot, DemandLevel | null>,
  terca: {} as Record<TimeSlot, DemandLevel | null>,
  quarta: {} as Record<TimeSlot, DemandLevel | null>,
  quinta: {} as Record<TimeSlot, DemandLevel | null>,
  sexta: {} as Record<TimeSlot, DemandLevel | null>,
  sabado: {} as Record<TimeSlot, DemandLevel | null>,
  domingo: {} as Record<TimeSlot, DemandLevel | null>,
};

/**
 * Converte a resposta do backend no modelo de domínio `Ubs` do frontend,
 * preservando a matriz preditiva de demanda e o status de funcionamento.
 */
function normalizeBackendUbs(payload: BackendUbsPayload): Ubs {
  const localFallback = getUbsById(payload.id);

  const schedule = (payload.schedule || payload.schedule_data || {}) as Record<
    WeekDay,
    { start: number; end: number } | null
  >;

  const ubsEntity: Ubs = {
    id: payload.id,
    name: payload.name,
    address: payload.address,
    neighborhood: payload.neighborhood,
    zone: payload.zone,
    hours: payload.hours || payload.hours_description,
    extendedHours: payload.extendedHours ?? payload.has_extended_hours ?? false,
    isOpen: payload.isOpen ?? payload.is_open ?? false,
    latitude: payload.latitude,
    longitude: payload.longitude,
    schedule: {
      segunda: schedule.segunda ?? null,
      terca: schedule.terca ?? null,
      quarta: schedule.quarta ?? null,
      quinta: schedule.quinta ?? null,
      sexta: schedule.sexta ?? null,
      sabado: schedule.sabado ?? null,
      domingo: schedule.domingo ?? null,
    },
    demand: localFallback?.demand || emptyDemandMap,
  };

  // Garante que o status isOpen esteja atualizado
  ubsEntity.isOpen = isUbsOpenNow(ubsEntity);
  return ubsEntity;
}

/**
 * Busca a lista de UBS com suporte a query e zone.
 * Em caso de erro de rede ou backend indisponível, executa fallback transparente para os dados locais.
 */
export async function fetchUbsList(query?: string, zone?: Zone | "Todas"): Promise<Ubs[]> {
  try {
    const params = new URLSearchParams();
    if (query && query.trim()) {
      params.append("query", query.trim());
    }
    if (zone && zone !== "Todas") {
      params.append("zone", zone);
    }

    const url = `${API_BASE_URL}/ubs${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000), // Timeout resiliente de 4s
    });

    if (!response.ok) {
      throw new Error(`Falha na resposta do servidor: status ${response.status}`);
    }

    const data: BackendUbsPayload[] = await response.json();
    return data.map(normalizeBackendUbs);
  } catch (error) {
    console.warn(
      "[PrevSUS API] Falha ao consultar backend, utilizando dados locais (fallback):",
      error,
    );
    return searchUbs(query || "", zone || "Todas");
  }
}

/**
 * Busca uma UBS individual por ID (slug).
 * Em caso de falha de conexão, utiliza o fallback local de `getUbsById`.
 */
export async function fetchUbsById(id: string): Promise<Ubs | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ubs/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Erro ao obter UBS: ${response.status}`);
    }

    const data: BackendUbsPayload = await response.json();
    return normalizeBackendUbs(data);
  } catch (error) {
    console.warn(
      `[PrevSUS API] Falha ao obter UBS '${id}' do backend, utilizando fallback:`,
      error,
    );
    return getUbsById(id) || null;
  }
}

/**
 * Computa a lista de faixas horárias com disponibilidade localmente para fallback.
 */
function getLocalAvailableSlots(ubs: Ubs, day: WeekDay): SlotItem[] {
  const window = ubs.schedule[day];
  if (!window) {
    return TIME_SLOTS.map((s) => ({
      slot: s.value,
      label: s.label,
      start_hour: s.start,
      end_hour: s.end,
      is_available: false,
      reason: "unidade fechada no dia",
    }));
  }

  return TIME_SLOTS.map((s) => {
    const available = isSlotAvailable(ubs, day, s.value);
    return {
      slot: s.value,
      label: s.label,
      start_hour: s.start,
      end_hour: s.end,
      is_available: available,
      reason: available ? null : "fora do expediente",
    };
  });
}

/**
 * Consulta a disponibilidade das faixas horárias para a UBS no dia informado segundo a Regra RB02.
 * Realiza fallback transparente caso a API esteja inacessível.
 */
export async function fetchAvailableSlots(
  id: string,
  day: WeekDay,
  fallbackUbs?: Ubs,
): Promise<SlotItem[]> {
  try {
    const url = `${API_BASE_URL}/ubs/${encodeURIComponent(id)}/slots?day=${encodeURIComponent(day)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar slots: ${response.status}`);
    }

    const data: SlotAvailabilityResponse = await response.json();
    return data.slots;
  } catch (error) {
    console.warn(
      `[PrevSUS API] Falha ao consultar slots da UBS '${id}', calculando localmente:`,
      error,
    );
    const ubs = fallbackUbs || getUbsById(id);
    if (!ubs) {
      return [];
    }
    return getLocalAvailableSlots(ubs, day);
  }
}

/**
 * Consulta a inferência preditiva do modelo XGBoost via API FastAPI (Regras RB03 / RB04).
 * Em caso de falha de conexão, aplica fallback inteligente para a matriz histórica de `prevsus-data.ts`.
 */
export async function fetchPrediction(
  ubsId: string,
  day: WeekDay,
  slot: TimeSlot,
  fallbackUbs?: Ubs,
): Promise<PredictionResult> {
  try {
    const url = `${API_BASE_URL}/ubs/${encodeURIComponent(ubsId)}/predict?day=${encodeURIComponent(day)}&slot=${encodeURIComponent(slot)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000), // Inferência rápida com timeout
    });

    if (!response.ok) {
      throw new Error(`Erro na inferência preditiva: ${response.status}`);
    }

    const data: PredictionResult = await response.json();
    return data;
  } catch (error) {
    console.warn(
      `[PrevSUS API] Falha ao consultar predição para UBS '${ubsId}', utilizando fallback local:`,
      error,
    );
    const ubs = fallbackUbs || getUbsById(ubsId);
    if (!ubs) {
      return {
        ubs_id: ubsId,
        day,
        slot,
        status: "CLOSED",
        demand_level: null,
        sufficient_data: false,
        message: "Unidade não encontrada.",
      };
    }

    const isAvailable = isSlotAvailable(ubs, day, slot);
    if (!isAvailable) {
      return {
        ubs_id: ubsId,
        day,
        slot,
        status: "CLOSED",
        demand_level: null,
        sufficient_data: false,
        message: "Unidade fechada neste horário ou dia da semana (Regra RB02).",
      };
    }

    const demandLevel = ubs.demand?.[day]?.[slot] ?? null;
    if (demandLevel === null) {
      return {
        ubs_id: ubsId,
        day,
        slot,
        status: "INSUFFICIENT_DATA",
        demand_level: null,
        sufficient_data: false,
        message:
          "Dados históricos insuficientes para esta combinação de dia e horário. Não é possível gerar uma estimativa confiável (Regra RB04).",
      };
    }

    return {
      ubs_id: ubsId,
      day,
      slot,
      status: "OPEN",
      demand_level: demandLevel,
      confidence: 0.88,
      sufficient_data: true,
      message: `Demanda estimada como ${demandLevel} com base na série histórica consolidada (Regra RB03).`,
    };
  }
}
