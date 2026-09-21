import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { LocationButton } from "@/components/prevsus/LocationButton";
import { UbsCard } from "@/components/prevsus/UbsCard";
import { calculateDistanceKm } from "@/lib/geo";
import { ZONES, searchUbs, type Ubs, type Zone } from "@/lib/prevsus-data";
import { useGeolocation } from "@/lib/use-geolocation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ubs/")({
  head: () => ({
    meta: [
      { title: "Unidades Básicas de Saúde — PrevSUS" },
      {
        name: "description",
        content:
          "Busque Unidades Básicas de Saúde de Manaus por nome, bairro ou zona e consulte a previsão de demanda.",
      },
      { property: "og:title", content: "Unidades Básicas de Saúde — PrevSUS" },
      {
        property: "og:description",
        content:
          "Busque Unidades Básicas de Saúde de Manaus por nome, bairro ou zona e consulte a previsão de demanda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UbsListPage,
});

const ZONE_OPTIONS: (Zone | "Todas")[] = ["Todas", ...ZONES];

function UbsListPage() {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<Zone | "Todas">("Todas");
  const { status, position, request, clear } = useGeolocation();

  const results = useMemo(() => {
    const list = searchUbs(query, zone);
    if (status !== "active" || !position) return { list, distances: new Map<string, number>() };
    const distances = new Map<string, number>(
      list.map((u) => [u.id, calculateDistanceKm(position.latitude, position.longitude, u.latitude, u.longitude)]),
    );
    const sorted = [...list].sort((a, b) => (distances.get(a.id) ?? 0) - (distances.get(b.id) ?? 0));
    return { list: sorted, distances };
  }, [query, zone, status, position]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Unidades Básicas de Saúde
      </h1>
      <p className="mt-2 text-muted-foreground">
        Busque pelo nome da UBS, pelo bairro ou filtre por zona de Manaus para consultar a previsão
        de demanda.
      </p>

      <div className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: UBS Dr. José Rayol dos Santos, Flores, Educandos…"
            className="h-12 pl-10 text-base"
            aria-label="Buscar UBS por nome ou bairro"
          />
        </div>
        <LocationButton
          status={status}
          nearbyCount={status === "active" ? results.list.length : undefined}
          onRequest={request}
          onClear={clear}
        />
      </div>

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar unidades por zona de Manaus"
      >
        {ZONE_OPTIONS.map((option) => {
          const selected = zone === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setZone(option)}
              aria-pressed={selected}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary text-primary-foreground focus-visible:ring-offset-background"
                  : "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              {option === "Todas" ? "Todas" : `Zona ${option}`}
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-foreground/80">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
        Sua localização é processada exclusivamente no seu dispositivo e não é armazenada.
      </p>

      {results.list.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          Nenhuma unidade encontrada
          {query.trim() !== "" ? ` para “${query}”` : ""}
          {zone !== "Todas" ? ` na Zona ${zone}` : ""}. Tente outro nome, bairro ou zona.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.list.map((ubs: Ubs) => (
            <UbsCard key={ubs.id} ubs={ubs} distanceKm={results.distances.get(ubs.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
