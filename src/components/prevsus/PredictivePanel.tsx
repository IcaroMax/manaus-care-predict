import { useMemo, useState } from "react";
import { CalendarX, Database, TrendingUp } from "lucide-react";

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

function firstAvailableSlot(ubs: Ubs, day: WeekDay): TimeSlot {
  const found = TIME_SLOTS.find((s) => isSlotAvailable(ubs, day, s.value));
  return found?.value ?? "08-10";
}

export function PredictivePanel({ ubs }: { ubs: Ubs }) {
  const [day, setDay] = useState<WeekDay>("segunda");
  const [slot, setSlot] = useState<TimeSlot>(() => firstAvailableSlot(ubs, "segunda"));

  const dayIsOpen = ubs.schedule[day] !== null;

  const handleDayChange = (value: string) => {
    const nextDay = value as WeekDay;
    setDay(nextDay);
    if (ubs.schedule[nextDay] && !isSlotAvailable(ubs, nextDay, slot)) {
      setSlot(firstAvailableSlot(ubs, nextDay));
    }
  };

  const slotAvailable = useMemo(() => isSlotAvailable(ubs, day, slot), [ubs, day, slot]);
  const level = slotAvailable ? ubs.demand[day][slot] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="size-5 text-primary" aria-hidden="true" />
          Consulta Preditiva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="day-select">Dia da semana</Label>
            <Select value={day} onValueChange={handleDayChange}>
              <SelectTrigger id="day-select" className="w-full">
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
              <SelectTrigger id="slot-select" className="w-full">
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((s) => {
                  const available = isSlotAvailable(ubs, day, s.value);
                  return (
                    <SelectItem key={s.value} value={s.value} disabled={!available}>
                      {s.label}
                      {!available && " — fora do expediente"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!slotAvailable ? (
          <div
            className="rounded-xl border border-border bg-muted/40 p-6 text-center shadow-sm"
            role="status"
          >
            <div className="flex flex-col items-center gap-2 text-foreground/80">
              <CalendarX className="size-8" aria-hidden="true" />
              <p className="font-medium">Unidade fechada neste período — sem previsão de atendimento</p>
              <p className="max-w-sm text-sm">Atendimento: {ubs.hours}.</p>
              <p className="max-w-sm text-xs">Dias com atendimento: {openDaysLabel(ubs)}.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-foreground/80">
              Nível de demanda previsto — {WEEK_DAYS.find((d) => d.value === day)?.label},{" "}
              {TIME_SLOTS.find((s) => s.value === slot)?.label}
            </p>
            {level ? (
              <div className="mt-4 space-y-3">
                <DemandBadge level={level} large />
                <p className="mx-auto max-w-sm text-sm text-foreground/80">
                  <DemandDescription level={level} />
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2 text-foreground/80">
                <Database className="size-8" aria-hidden="true" />
                <p className="max-w-sm text-sm">
                  Dados históricos insuficientes para esta combinação de dia e horário. Não é
                  possível gerar uma estimativa confiável.
                </p>
              </div>
            )}
          </div>
        )}

        <MethodologyAlert />
      </CardContent>
    </Card>
  );
}
