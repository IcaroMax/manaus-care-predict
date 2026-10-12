import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PredictivePanel } from "@/components/prevsus/PredictivePanel";
import { UbsDetailsCard } from "@/components/prevsus/UbsDetailsCard";
import { fetchUbsById } from "@/lib/api";

export const Route = createFileRoute("/ubs/$id")({
  loader: async ({ params }) => {
    const ubs = await fetchUbsById(params.id);
    if (!ubs) throw notFound();
    return { ubs };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Unidade não encontrada — PrevSUS" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { ubs } = loaderData;
    return {
      meta: [
        { title: `${ubs.name} — PrevSUS` },
        {
          name: "description",
          content: `Previsão de demanda da ${ubs.name} (${ubs.neighborhood}, Manaus) por dia e horário.`,
        },
        { property: "og:title", content: `${ubs.name} — PrevSUS` },
        {
          property: "og:description",
          content: `Previsão de demanda da ${ubs.name} (${ubs.neighborhood}, Manaus) por dia e horário.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: UbsDetailPage,
  notFoundComponent: UbsNotFound,
});

function UbsNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Unidade não encontrada</h1>
      <p className="mt-2 text-muted-foreground">
        A UBS que você procura não está cadastrada ou o endereço está incorreto.
      </p>
      <Link
        to="/ubs"
        className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar à lista de unidades
      </Link>
    </main>
  );
}

function UbsDetailPage() {
  const { ubs } = Route.useLoaderData();

  return (
    <main className="w-full min-h-[calc(100vh-4rem)] py-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div>
          <Link
            to="/ubs"
            onClick={(e) => {
              if (window.history.length > 1) {
                e.preventDefault();
                window.history.back();
              }
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar às unidades
          </Link>
        </div>

        {/* Grid responsivo: 1 coluna no mobile, 2 colunas a partir de 768px (md:) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <UbsDetailsCard ubs={ubs} />
          <PredictivePanel ubs={ubs} />
        </div>
      </div>
    </main>
  );
}
