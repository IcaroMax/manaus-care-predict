import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PredictivePanel } from "@/components/prevsus/PredictivePanel";
import { UbsDetailsCard } from "@/components/prevsus/UbsDetailsCard";
import { getUbsById } from "@/lib/prevsus-data";

export const Route = createFileRoute("/ubs/$id")({
  loader: ({ params }) => {
    const ubs = getUbsById(params.id);
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
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Unidade não encontrada</h1>
      <p className="mt-2 text-muted-foreground">
        A UBS que você procura não está cadastrada ou o endereço está incorreto.
      </p>
      <Link to="/ubs" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar à lista de unidades
      </Link>
    </div>
  );
}

function UbsDetailPage() {
  const { ubs } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        to="/ubs"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar às unidades
      </Link>

      <div className="mt-6 space-y-6">
        <UbsDetailsCard ubs={ubs} />
        <PredictivePanel ubs={ubs} />
      </div>
    </div>
  );
}
