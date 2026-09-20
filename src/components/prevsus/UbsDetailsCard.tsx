import { Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ubs } from "@/lib/prevsus-data";

export function UbsDetailsCard({ ubs }: { ubs: Ubs }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-xl">{ubs.name}</CardTitle>
          <Badge variant={ubs.isOpen ? "default" : "secondary"} className="text-sm">
            {ubs.isOpen ? "Aberta agora" : "Fechada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="font-medium text-foreground">Endereço</dt>
              <dd className="text-muted-foreground">{ubs.address}</dd>
            </div>
          </div>
          <div>
            <dt className="font-medium text-foreground">Bairro e zona</dt>
            <dd className="text-muted-foreground">
              {ubs.neighborhood} — Zona {ubs.zone}
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="font-medium text-foreground">Horário de funcionamento</dt>
              <dd className="text-muted-foreground">{ubs.hours}</dd>
            </div>
          </div>
          <div>
            <dt className="font-medium text-foreground">Tipo de expediente</dt>
            <dd className="text-muted-foreground">
              {ubs.extendedHours ? "Horário ampliado" : "Horário padrão (Seg a Sex, 07h às 17h)"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
