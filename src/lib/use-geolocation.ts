import { useCallback, useState } from "react";
import { toast } from "sonner";

export type GeolocationStatus = "idle" | "loading" | "active";

export interface UserPosition {
  latitude: number;
  longitude: number;
}

/**
 * Geolocalização 100% no cliente (RNF04): as coordenadas nunca saem do
 * dispositivo do usuário e não são armazenadas.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [position, setPosition] = useState<UserPosition | null>(null);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error(
        "Seu navegador não oferece suporte à geolocalização. Você pode continuar pesquisando normalmente pelo nome ou bairro.",
      );
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus("active");
      },
      () => {
        setStatus("idle");
        setPosition(null);
        toast.error(
          "Não foi possível acessar sua localização. Você pode continuar pesquisando normalmente pelo nome ou bairro.",
        );
      },
      { timeout: 10000 },
    );
  }, []);

  const clear = useCallback(() => {
    setStatus("idle");
    setPosition(null);
  }, []);

  return { status, position, request, clear };
}
