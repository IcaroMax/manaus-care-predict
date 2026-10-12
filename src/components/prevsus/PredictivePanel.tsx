import { useEffect, useMemo, useState } from "react";
import { CalendarX, Database, Sparkles, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAvailableSlots,
  fetchPrediction,
  type PredictionResult,
  type SlotItem,
} from "@/lib/api";
import {
  TIME_SLOTS,
  WEEK_DAYS,
  isSlotAvailable,
  openDaysLabel,
  type TimeSlot,
  type Ubs,
  type WeekDay,
} from "@/lib/prevsus-data";
import { DemandBadge, DemandDescription } from "./DemandBadge";
import { MethodologyAlert } from "./MethodologyAlert";

function firstAvailableSlot(ubs: Ubs, day: WeekDay, slotItems?: SlotItem[]): TimeSlot {
  if (slotItems && slotItems.length > 0) {
    const found = slotItems.find((s) => s.is_available);
    if (found) return found.slot as TimeSlot;
  }
  const found = TIME_SLOTS.find((s) => isSlotAvailable(ubs, day, s.value));
  return found?.value ?? "08-10";
}

export function PredictivePanel({ ubs }: { ubs: Ubs }) {
  const [day, setDay] = useState<WeekDay>("segunda");
  const [slot, setSlot] = useState<TimeSlot>(() => firstAvailableSlot(ubs, "segunda"));

  // Slots sincronizados com a validação RB02 do backend (com fallback local)
  const [apiSlots, setApiSlots] = useState<SlotItem[]>(() => {
    return TIME_SLOTS.map((s) => {
      const avail = isSlotAvailable(ubs, "segunda", s.value);
      return {
        slot: s.value,
        label: s.label,
        start_hour: s.start,
        end_hour: s.end,
        is_available: avail,
        reason: avail ? null : "fora do expediente",
      };
    });
  });

  // Inferência preditiva via XGBoost com corte amostral RB04
  const [prediction, setPrediction] = useState<PredictionResult | null>(() => {
    const isAvail = isSlotAvailable(ubs, "segunda", firstAvailableSlot(ubs, "segunda"));
    const lvl = isAvail
      ? (ubs.demand?.["segunda"]?.[firstAvailableSlot(ubs, "segunda")] ?? null)
      : null;
    return {
      ubs_id: ubs.id,
      day: "segunda",
      slot: firstAvailableSlot(ubs, "segunda"),
      status: !isAvail ? "CLOSED" : lvl === null ? "INSUFFICIENT_DATA" : "OPEN",
      demand_level: lvl,
      confidence: lvl ? 0.89 : null,
      sufficient_data: lvl !== null,
      message: "",
    };
  });
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  const dayIsOpen = ubs.schedule[day] !== null;

  // Atualiza disponibilidade dos slots quando o dia muda
  useEffect(() => {
    let cancelled = false;

    fetchAvailableSlots(ubs.id, day, ubs).then((data) => {
      if (!cancelled && data && data.length > 0) {
        setApiSlots(data);

        setSlot((prevSlot) => {
          const currentInNew = data.find((s) => s.slot === prevSlot);
          if (!currentInNew?.is_available) {
            return firstAvailableSlot(ubs, day, data);
          }
          return prevSlot;
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ubs.id, day, ubs]);

  // Consulta o modelo preditivo XGBoost sempre que dia ou slot mudar
  useEffect(() => {
    let cancelled = false;
    setIsPredicting(true);

    fetchPrediction(ubs.id, day, slot, ubs).then((res) => {
      if (!cancelled) {
        setPrediction(res);
        setIsPredicting(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ubs.id, day, slot, ubs]);

  const handleDayChange = (value: string) => {
    const nextDay = value as WeekDay;
    setDay(nextDay);
  };

  const slotMap = useMemo(() => {
    return new Map(apiSlots.map((s) => [s.slot, s]));
  }, [apiSlots]);

  const currentSlotInfo = slotMap.get(slot);
  const slotAvailable = currentSlotInfo
    ? currentSlotInfo.is_available
    : isSlotAvailable(ubs, day, slot);

  const isClosed = !slotAvailable || prediction?.status === "CLOSED";
  const isInsufficient =
    prediction?.status === "INSUFFICIENT_DATA" || prediction?.demand_level === null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="size-5 text-primary" aria-hidden="true" />
          Consulta Preditiva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className="grid gap-4 sm:grid-cols-2"
          role="group"
          aria-label="Filtros da previsão de demanda"
        >
          <div className="space-y-2">
            <Label htmlFor="day-select">Dia da semana</Label>
            <Select value={day} onValueChange={handleDayChange}>
              <SelectTrigger
                id="day-select"
                className="w-full"
                aria-label="Selecione o dia da semana"
              >
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                {WEEK_DAYS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                    {ubs.schedule[d.value] === null && " — unidade fechada"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-select">Faixa horária</Label>
            <Select
              value={slot}
              onValueChange={(v) => setSlot(v as TimeSlot)}
              disabled={!dayIsOpen}
            >
              <SelectTrigger
                id="slot-select"
                className="w-full"
                aria-label="Selecione a faixa horária"
              >
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((s) => {
                  const item = slotMap.get(s.value);
                  const available = item ? item.is_available : isSlotAvailable(ubs, day, s.value);
                  const reason = item?.reason || "fora do expediente";
                  return (
                    <SelectItem key={s.value} value={s.value} disabled={!available}>
                      {s.label}
                      {!available && ` — ${reason}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Região dinâmica de resultado preditivo com aria-live (WCAG 4.1.3) */}
        <div aria-live="polite" aria-atomic="true" aria-busy={isPredicting}>
          {isClosed ? (
            <div
              className="rounded-xl border border-border bg-muted/40 p-6 text-center shadow-sm"
              role="status"
            >
              <div className="flex flex-col items-center gap-2 text-foreground/80">
                <CalendarX className="size-8" aria-hidden="true" />
                <p className="font-medium">
                  {currentSlotInfo?.reason === "unidade fechada no dia"
                    ? "Unidade fechada neste dia — sem expediente"
                    : "Faixa fora do horário de atendimento da unidade (Regra RB02)"}
                </p>
                <p className="max-w-sm text-sm">Horário de funcionamento: {ubs.hours}.</p>
                <p className="max-w-sm text-xs">Dias com atendimento: {openDaysLabel(ubs)}.</p>
              </div>
            </div>
          ) : isInsufficient ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="flex flex-col items-center gap-2 text-foreground/80">
                <Database className="size-8 text-amber-500" aria-hidden="true" />
                <p className="font-medium text-foreground">Dados históricos insuficientes</p>
                <p className="max-w-sm text-sm">
                  Dados históricos insuficientes para esta combinação de dia e horário. Não é
                  possível gerar uma estimativa confiável (Regra RB04).
                </p>
              </div>
            </div>
          ) : prediction?.demand_level ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-foreground/80">
                Nível de demanda previsto — {WEEK_DAYS.find((d) => d.value === day)?.label},{" "}
                {TIME_SLOTS.find((s) => s.value === slot)?.label}
              </p>
              <div className="mt-4 space-y-3">
                <DemandBadge level={prediction.demand_level} large />
                <p className="mx-auto max-w-sm text-sm text-foreground/80">
                  <DemandDescription level={prediction.demand_level} />
                </p>
                {prediction.confidence && (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                    Confiança estatística do modelo XGBoost:{" "}
                    {Math.round(prediction.confidence * 100)}%
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Aviso Metodológico Permanente (Regra RB05) */}
        <MethodologyAlert />
      </CardContent>
    </Card>
  );
}
