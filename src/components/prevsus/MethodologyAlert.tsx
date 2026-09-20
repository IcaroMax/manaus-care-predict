import { Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function MethodologyAlert() {
  return (
    <Card className="border-cyan-brand/40 bg-secondary">
      <CardContent className="flex items-start gap-3 pt-5">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-secondary-foreground">
          <span className="font-semibold">Nota:</span> Os níveis apresentados correspondem a uma
          estimativa preditiva estatística calculada via Machine Learning com base no histórico de
          atendimentos, não representando a contagem de fila em tempo real.
        </p>
      </CardContent>
    </Card>
  );
}
