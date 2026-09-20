import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, Search, ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { LocationButton } from "@/components/prevsus/LocationButton";
import { calculateDistanceKm, formatDistanceKm } from "@/lib/geo";
import { searchUbs } from "@/lib/prevsus-data";
import { useGeolocation } from "@/lib/use-geolocation";

export function UbsSearch({
  placeholder = "Busque por nome da UBS ou bairro…",
  showSuggestions = true,
}: {
  placeholder?: string;
  showSuggestions?: boolean;
}) {
  const [query, setQuery] = useState("");
  const { status, position, request, clear } = useGeolocation();

  const results = useMemo(() => {
    const list = searchUbs(query);
    if (status !== "active" || !position) return { list, distances: new Map<string, number>() };
    const distances = new Map<string, number>(
      list.map((u) => [u.id, calculateDistanceKm(position.latitude, position.longitude, u.latitude, u.longitude)]),
    );
    const sorted = [...list].sort((a, b) => (distances.get(a.id) ?? 0) - (distances.get(b.id) ?? 0));
    return { list: sorted, distances };
  }, [query, status, position]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
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
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-foreground/80">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
        Sua localização é processada exclusivamente no seu dispositivo e não é armazenada.
      </p>

      {showSuggestions && query.trim() === "" && (
        <p className="mt-3 text-xs font-medium text-foreground/80">
          Exemplos: UBS Dr. José Rayol dos Santos, UBS Nilton Lins, UBS Arthur Virgílio Filho
        </p>
      )}

      {(query.trim() !== "" || status === "active") && (
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {results.list.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              Nenhuma unidade encontrada para “{query}”.
            </li>
          )}
          {results.list.map((ubs) => (
            <li key={ubs.id}>
              <Link
                to="/ubs/$id"
                params={{ id: ubs.id }}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">{ubs.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" aria-hidden="true" />
                    {ubs.neighborhood}
                    {results.distances.has(ubs.id) && (
                      <span className="flex items-center gap-0.5 text-primary">
                        <Navigation className="size-3" aria-hidden="true" />a{" "}
                        {formatDistanceKm(results.distances.get(ubs.id)!)} km
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-xs font-medium text-primary">Ver previsão</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
