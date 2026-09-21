import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Navigation } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceKm } from "@/lib/geo";
import type { Ubs } from "@/lib/prevsus-data";

export function UbsCard({ ubs, distanceKm }: { ubs: Ubs; distanceKm?: number | undefined }) {
  return (
    <Link
      to="/ubs/$id"
      params={{ id: ubs.id }}
      className="block rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{ubs.name}</CardTitle>
            <Badge variant={ubs.isOpen ? "default" : "secondary"}>
              {ubs.isOpen ? "Aberta" : "Fechada"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {ubs.neighborhood} (Zona {ubs.zone}) — {ubs.address}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            {ubs.hours}
          </p>
          {distanceKm !== undefined && (
            <div className="pt-1">
              <Badge variant="outline" className="font-normal">
                <Navigation className="size-3" aria-hidden="true" />a {formatDistanceKm(distanceKm)}{" "}
                km de você
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
