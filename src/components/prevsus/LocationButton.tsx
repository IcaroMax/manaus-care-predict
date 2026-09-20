import { Loader2, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GeolocationStatus } from "@/lib/use-geolocation";

export function LocationButton({
  status,
  nearbyCount,
  onRequest,
  onClear,
}: {
  status: GeolocationStatus;
  nearbyCount?: number | undefined;
  onRequest: () => void;
  onClear: () => void;
}) {
  if (status === "active") {
    return (
      <Button
        type="button"
        variant="default"
        onClick={onClear}
        aria-label="Desativar ordenação por proximidade e voltar à ordenação padrão"
      >
        <MapPin className="size-4" aria-hidden="true" />
        Próximas de você{nearbyCount !== undefined ? ` (${nearbyCount})` : ""}
        <X className="size-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button type="button" variant="secondary" onClick={onRequest} disabled={status === "loading"}>
      {status === "loading" ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <MapPin className="size-4" aria-hidden="true" />
      )}
      {status === "loading" ? "Localizando…" : "Usar minha localização"}
    </Button>
  );
}
