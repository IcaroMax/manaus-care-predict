import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import type { DemandLevel } from "@/lib/prevsus-data";
import { cn } from "@/lib/utils";

const config: Record<
  DemandLevel,
  { label: string; classes: string; Icon: typeof Minus; description: string }
> = {
  baixa: {
    label: "Baixa",
    classes: "bg-demand-low text-demand-low-foreground",
    Icon: ArrowDownRight,
    description: "Fluxo tranquilo previsto. Bom momento para atendimento.",
  },
  moderada: {
    label: "Moderada",
    classes: "bg-demand-medium text-demand-medium-foreground",
    Icon: Minus,
    description: "Movimento intermediário previsto. Pode haver alguma espera.",
  },
  alta: {
    label: "Alta",
    classes: "bg-demand-high text-demand-high-foreground",
    Icon: ArrowUpRight,
    description: "Movimento intenso previsto. Considere outro horário, se possível.",
  },
};

export function DemandBadge({ level, large = false }: { level: DemandLevel; large?: boolean }) {
  const { label, classes, Icon } = config[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        classes,
        large ? "px-4 py-2 text-base" : "px-2.5 py-1 text-xs",
      )}
    >
      <Icon className={large ? "size-5" : "size-3.5"} aria-hidden="true" />
      {label}
    </span>
  );
}

export function DemandDescription({ level }: { level: DemandLevel }) {
  return <>{config[level].description}</>;
}
