import { Link } from "@tanstack/react-router";
import { Activity, HeartPulse } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">PrevSUS</span>
            <span className="hidden text-xs text-primary-foreground/80 sm:block">
              Previsão de Demanda em UBS de Manaus
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span
            className="hidden items-center gap-2 rounded-full border border-primary-foreground/30 px-3 py-1 text-xs font-medium md:flex"
            title="ODS 3 — Saúde e Bem-Estar"
          >
            <HeartPulse className="size-4" aria-hidden="true" />
            ODS 3 · Saúde e Bem-Estar
          </span>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link
              to="/"
              className="rounded-md px-3 py-2 text-primary-foreground/85 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              activeProps={{ className: "bg-primary-foreground/15 text-primary-foreground" }}
              activeOptions={{ exact: true }}
            >
              Início
            </Link>
            <Link
              to="/ubs"
              className="rounded-md px-3 py-2 text-primary-foreground/85 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              activeProps={{ className: "bg-primary-foreground/15 text-primary-foreground" }}
            >
              Unidades
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
