export type DemandLevel = "baixa" | "moderada" | "alta";

export type WeekDay =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo";

export type TimeSlot = "08-10" | "10-12" | "13-15" | "15-17" | "17-19" | "19-21";

export type Zone = "Norte" | "Sul" | "Leste" | "Oeste" | "Centro-Sul";

export const ZONES: Zone[] = ["Norte", "Sul", "Leste", "Oeste", "Centro-Sul"];

/** Janela de funcionamento em horas decimais (ex.: 7 = 07h, 21 = 21h). null = fechada */
export interface DayWindow {
  start: number;
  end: number;
}

export interface Ubs {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  zone: Zone;
  hours: string;
  /** Horário ampliado = atende além das 17h e/ou aos sábados */
  extendedHours: boolean;
  isOpen: boolean;
  latitude: number;
  longitude: number;
  /** RB02: janela real de funcionamento por dia da semana */
  schedule: Record<WeekDay, DayWindow | null>;
  /** demand[day][slot] — null = dados insuficientes (RB04) */
  demand: Record<WeekDay, Record<TimeSlot, DemandLevel | null>>;
}

export const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export const TIME_SLOTS: { value: TimeSlot; label: string; start: number; end: number }[] = [
  { value: "08-10", label: "08h–10h", start: 8, end: 10 },
  { value: "10-12", label: "10h–12h", start: 10, end: 12 },
  { value: "13-15", label: "13h–15h", start: 13, end: 15 },
  { value: "15-17", label: "15h–17h", start: 15, end: 17 },
  { value: "17-19", label: "17h–19h", start: 17, end: 19 },
  { value: "19-21", label: "19h–21h", start: 19, end: 21 },
];

type SlotMap = Record<TimeSlot, DemandLevel | null>;

/** Cria a matriz semanal a partir de um padrão base + ajustes por dia (RB04 usa null) */
function weekly(
  base: SlotMap,
  overrides: Partial<Record<WeekDay, Partial<SlotMap>>> = {},
): Record<WeekDay, Record<TimeSlot, DemandLevel | null>> {
  const days: WeekDay[] = [
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
    "domingo",
  ];
  return days.reduce(
    (acc, day) => {
      acc[day] = { ...base, ...(overrides[day] ?? {}) };
      return acc;
    },
    {} as Record<WeekDay, Record<TimeSlot, DemandLevel | null>>,
  );
}

const closed: SlotMap = {
  "08-10": null,
  "10-12": null,
  "13-15": null,
  "15-17": null,
  "17-19": null,
  "19-21": null,
};

/** Padrão: Seg a Sex 07h–17h, sem sábado */
function standardSchedule(): Record<WeekDay, DayWindow | null> {
  const w = { start: 7, end: 17 };
  return {
    segunda: w,
    terca: w,
    quarta: w,
    quinta: w,
    sexta: w,
    sabado: null,
    domingo: null,
  };
}

export const UBS_LIST: Ubs[] = [
  {
    id: "ubs-dr-jose-rayol-dos-santos",
    name: "UBS Dr. José Rayol dos Santos",
    address: "Av. Constantino Nery, s/n — Flores",
    neighborhood: "Flores",
    zone: "Centro-Sul",
    hours: "Segunda a sexta, 07h às 21h | Sábado, 08h às 12h",
    extendedHours: true,
    isOpen: false,
    latitude: -3.0905,
    longitude: -60.0264,
    schedule: {
      segunda: { start: 7, end: 21 },
      terca: { start: 7, end: 21 },
      quarta: { start: 7, end: 21 },
      quinta: { start: 7, end: 21 },
      sexta: { start: 7, end: 21 },
      sabado: { start: 8, end: 12 },
      domingo: null,
    },
    demand: weekly(
      {
        "08-10": "alta",
        "10-12": "moderada",
        "13-15": "moderada",
        "15-17": "baixa",
        "17-19": "moderada",
        "19-21": "baixa",
      },
      {
        quarta: { "13-15": null },
        sexta: { "19-21": null },
        sabado: { "08-10": "moderada", "10-12": "baixa" },
        domingo: closed,
      },
    ),
  },
  {
    id: "ubs-nilton-lins",
    name: "UBS Nilton Lins",
    address: "Av. Prof. Nilton Lins, 3220 — Flores",
    neighborhood: "Flores",
    zone: "Centro-Sul",
    hours: "Segunda a sexta, 07h às 19h | Sábado, 08h às 12h",
    extendedHours: true,
    isOpen: false,
    latitude: -3.0875,
    longitude: -60.018,
    schedule: {
      segunda: { start: 7, end: 19 },
      terca: { start: 7, end: 19 },
      quarta: { start: 7, end: 19 },
      quinta: { start: 7, end: 19 },
      sexta: { start: 7, end: 19 },
      sabado: { start: 8, end: 12 },
      domingo: null,
    },
    demand: weekly(
      {
        "08-10": "alta",
        "10-12": "alta",
        "13-15": "moderada",
        "15-17": "moderada",
        "17-19": "baixa",
        "19-21": null,
      },
      {
        quinta: { "08-10": "baixa", "10-12": "moderada" },
        sabado: { "08-10": "moderada", "10-12": "baixa" },
        domingo: closed,
      },
    ),
  },
  {
    id: "ubs-arthur-virgilio-filho",
    name: "UBS Arthur Virgílio Filho",
    address: "Av. Nossa Senhora da Conceição, s/n — Santa Etelvina",
    neighborhood: "Santa Etelvina",
    zone: "Norte",
    hours: "Segunda a sexta, 07h às 17h",
    extendedHours: false,
    isOpen: false,
    latitude: -3.0031,
    longitude: -60.0225,
    schedule: standardSchedule(),
    demand: weekly(
      {
        "08-10": "moderada",
        "10-12": "alta",
        "13-15": "alta",
        "15-17": "moderada",
        "17-19": null,
        "19-21": null,
      },
      {
        quarta: { "08-10": "baixa", "15-17": null },
        quinta: { "10-12": "baixa", "13-15": "baixa", "15-17": "baixa" },
        sabado: closed,
        domingo: closed,
      },
    ),
  },
  {
    id: "ubs-alfredo-campos",
    name: "UBS Alfredo Campos",
    address: "Rua Jacamim, s/n — Zumbi dos Palmares",
    neighborhood: "Zumbi dos Palmares",
    zone: "Leste",
    hours: "Segunda a sexta, 07h às 17h",
    extendedHours: false,
    isOpen: false,
    latitude: -3.0847,
    longitude: -59.9572,
    schedule: standardSchedule(),
    demand: weekly(
      {
        "08-10": "alta",
        "10-12": "alta",
        "13-15": "moderada",
        "15-17": "moderada",
        "17-19": null,
        "19-21": null,
      },
      {
        terca: { "13-15": "baixa" },
        quinta: { "08-10": "moderada", "15-17": null },
        sabado: closed,
        domingo: closed,
      },
    ),
  },
  {
    id: "ubs-deodato-de-miranda-leao",
    name: "UBS Deodato de Miranda Leão",
    address: "Rua Belém, s/n — Glória",
    neighborhood: "Glória",
    zone: "Oeste",
    hours: "Segunda a sexta, 07h às 19h",
    extendedHours: true,
    isOpen: false,
    latitude: -3.1232,
    longitude: -60.0416,
    schedule: {
      segunda: { start: 7, end: 19 },
      terca: { start: 7, end: 19 },
      quarta: { start: 7, end: 19 },
      quinta: { start: 7, end: 19 },
      sexta: { start: 7, end: 19 },
      sabado: null,
      domingo: null,
    },
    demand: weekly(
      {
        "08-10": "baixa",
        "10-12": "moderada",
        "13-15": "moderada",
        "15-17": "baixa",
        "17-19": "baixa",
        "19-21": null,
      },
      {
        quinta: { "08-10": null },
        sexta: { "13-15": "moderada", "17-19": "moderada" },
        sabado: closed,
        domingo: closed,
      },
    ),
  },
  {
    id: "ubs-megumo-kado",
    name: "UBS Megumo Kado",
    address: "Rua Miranda Leão, s/n — Educandos",
    neighborhood: "Educandos",
    zone: "Sul",
    hours: "Segunda a sexta, 07h às 17h | Sábado, 08h às 12h",
    extendedHours: true,
    isOpen: false,
    latitude: -3.1438,
    longitude: -60.0131,
    schedule: {
      segunda: { start: 7, end: 17 },
      terca: { start: 7, end: 17 },
      quarta: { start: 7, end: 17 },
      quinta: { start: 7, end: 17 },
      sexta: { start: 7, end: 17 },
      sabado: { start: 8, end: 12 },
      domingo: null,
    },
    demand: weekly(
      {
        "08-10": "moderada",
        "10-12": "alta",
        "13-15": "moderada",
        "15-17": "alta",
        "17-19": null,
        "19-21": null,
      },
      {
        quarta: { "13-15": null },
        sabado: { "08-10": "alta", "10-12": "moderada" },
        domingo: closed,
      },
    ),
  },
];

const JS_TO_WEEKDAY: Record<number, WeekDay> = {
  0: "domingo",
  1: "segunda",
  2: "terca",
  3: "quarta",
  4: "quinta",
  5: "sexta",
  6: "sabado",
};

/**
 * Avalia dinamicamente se a UBS está em operação no momento exato da consulta.
 */
export function isUbsOpenNow(ubs: Ubs, date: Date = new Date()): boolean {
  const weekDay = JS_TO_WEEKDAY[date.getDay()];
  const window = ubs.schedule?.[weekDay];
  if (!window) return false;

  const currentHour = date.getHours() + date.getMinutes() / 60;
  return currentHour >= window.start && currentHour < window.end;
}

export function searchUbs(query: string, zone: Zone | "Todas" = "Todas"): Ubs[] {
  const q = query.trim().toLowerCase();
  return UBS_LIST.map((u) => ({ ...u, isOpen: isUbsOpenNow(u) })).filter((u) => {
    const matchesZone = zone === "Todas" || u.zone === zone;
    const matchesText =
      !q || u.name.toLowerCase().includes(q) || u.neighborhood.toLowerCase().includes(q);
    return matchesZone && matchesText;
  });
}

export function getUbsById(id: string): Ubs | undefined {
  const ubs = UBS_LIST.find((u) => u.id === id);
  if (!ubs) return undefined;
  return { ...ubs, isOpen: isUbsOpenNow(ubs) };
}

/** RB02: a faixa só está disponível se estiver inteiramente dentro da janela do dia */
export function isSlotAvailable(ubs: Ubs, day: WeekDay, slot: TimeSlot): boolean {
  const window = ubs.schedule[day];
  if (!window) return false;
  const s = TIME_SLOTS.find((t) => t.value === slot);
  if (!s) return false;
  return s.start >= window.start && s.end <= window.end;
}

/** Dias em que a unidade atende (para mensagens de RB02) */
export function openDaysLabel(ubs: Ubs): string {
  return WEEK_DAYS.filter((d) => ubs.schedule[d.value] !== null)
    .map((d) => d.label)
    .join(", ");
}
