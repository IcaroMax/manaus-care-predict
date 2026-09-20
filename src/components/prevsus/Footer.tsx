import { HeartPulse } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center sm:px-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HeartPulse className="size-4 text-ods3" aria-hidden="true" />
          PrevSUS — Previsão de Demanda em UBS de Manaus
        </p>
        <p className="text-xs text-muted-foreground">
          Sistema de apoio à gestão da atenção primária · Alinhado ao ODS 3 (Saúde e Bem-Estar)
        </p>
        <p className="text-xs text-muted-foreground">
          Dados demonstrativos para fins de simulação.
        </p>
      </div>
    </footer>
  );
}
