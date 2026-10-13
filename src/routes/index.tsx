import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, HeartPulse, MapPinned, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UbsSearch } from "@/components/prevsus/UbsSearch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrevSUS — Previsão de Demanda em UBS de Manaus" },
      {
        name: "description",
        content:
          "Consulte a previsão de demanda nas Unidades Básicas de Saúde de Manaus por dia e horário. Sistema alinhado ao ODS 3 — Saúde e Bem-Estar.",
      },
      { property: "og:title", content: "PrevSUS — Previsão de Demanda em UBS de Manaus" },
      {
        property: "og:description",
        content:
          "Consulte a previsão de demanda nas Unidades Básicas de Saúde de Manaus por dia e horário. Sistema alinhado ao ODS 3 — Saúde e Bem-Estar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-3 py-1 text-xs font-medium">
            <HeartPulse className="size-4" aria-hidden="true" />
            ODS 3 · Saúde e Bem-Estar
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Previsão de Demanda em UBS de Manaus
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/85">
            O PrevSUS ajuda você a escolher o melhor momento para buscar atendimento, com
            estimativas estatísticas de movimento por unidade, dia e horário.
          </p>

          <div className="mt-8 max-w-xl rounded-xl bg-card p-4 text-foreground shadow-lg">
            <UbsSearch />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="min-h-11 bg-white text-[#1E3A8A] font-semibold shadow-md hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <Link to="/ubs">
                Ver todas as unidades
                <ArrowRight className="ml-1 size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Como funciona</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <MapPinned className="size-8 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-foreground">1. Encontre sua UBS</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Busque pelo nome da unidade ou pelo bairro de Manaus onde você deseja atendimento.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <CalendarClock className="size-8 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-foreground">2. Escolha dia e horário</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione o dia da semana e a faixa horária em que pretende ir à unidade.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="size-8 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-foreground">3. Veja a previsão</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Receba o nível de demanda previsto — baixa, moderada ou alta — e planeje sua visita.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
