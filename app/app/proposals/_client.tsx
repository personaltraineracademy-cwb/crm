"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { showApiError } from "@/components/feedback/ApiErrorToast";
import { FileText } from "@/lib/ui/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/hooks/i18n/useT";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/lib/api/wrappers";
import { formatCents } from "@/lib/money";
import type { ProposalStatus } from "@/lib/propostas/tipos";
import { PageHeader } from "@/components/ui/page-header";

interface PropostaResumo {
  id: string;
  titulo: string;
  status: ProposalStatus;
  total_cents: number;
  moeda: string;
  numero: number | null;
  ano: number | null;
  versao: number;
  created_at: string;
  drafted_by_agent_id: string | null;
}

function aguardaRevisao(p: PropostaResumo): boolean {
  return p.status === "rascunho" && p.drafted_by_agent_id !== null;
}

/** Rascunho da IA primeiro — é o que espera uma decisão; o resto na ordem da rota (mais novo primeiro). */
function ordenarParaRevisao(lista: PropostaResumo[]): PropostaResumo[] {
  return [...lista.filter(aguardaRevisao), ...lista.filter((p) => !aguardaRevisao(p))];
}

export function ProposalsClient({ podeCriar }: { podeCriar: boolean }) {
  const t = useT();
  const statusLabels: Record<ProposalStatus, string> = {
    rascunho: t("Rascunho"),
    enviando: t("Enviando"),
    enviada: t("Enviada"),
    aceita: t("Aceita"),
    recusada: t("Recusada"),
    vencida: t("Vencida"),
    cancelada: t("Cancelada"),
    substituida: t("Substituída"),
  };
  const [propostas, setPropostas] = useState<PropostaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    apiClient
      .get<ApiSuccess<PropostaResumo[]>>("/api/v1/proposals", {
        signal: controller.signal,
      })
      .then((res) => {
        if (!controller.signal.aborted) setPropostas(ordenarParaRevisao(res.data));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setErro(true);
        showApiError(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => controller.abort();
  }, [tentativa]);

  return (
    <div className="w-full space-y-6 md:p-6">
      <PageHeader
        title={t("Propostas")}
        actions={
          podeCriar ? (
            <Button asChild size="sm">
              <Link href="/app/proposals/novo">{t("Nova proposta")}</Link>
            </Button>
          ) : null
        }
      />

      {carregando ? (
        <div
          role="status"
          aria-label={t("Carregando…")}
          className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex h-12 items-center gap-4 px-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      ) : erro ? (
        <Alert
          variant="destructive"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setErro(false);
                setCarregando(true);
                setTentativa((atual) => atual + 1);
              }}
            >
              {t("Tentar novamente")}
            </Button>
          }
        >
          {t("Falha ao listar propostas.")}
        </Alert>
      ) : propostas.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<FileText aria-hidden />}
            title={t("Nenhuma proposta cadastrada ainda.")}
          />
        </div>
      ) : (
        // Tabela do DS (§10.12): cabeçalho `muted/40` de 48 com rótulos xs/500,
        // linhas de 48 e o título (a identidade) preso à esquerda ao rolar.
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm max-md:block md:min-w-[720px]">
            <thead className="bg-muted/40 max-md:hidden">
              <tr className="h-12 border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th scope="col" className="px-4 font-medium">
                  {t("Número")}
                </th>
                <th scope="col" className="px-4 font-medium">
                  {t("Título")}
                </th>
                <th scope="col" className="px-4 font-medium">
                  {t("Status")}
                </th>
                <th scope="col" className="px-4 text-right font-medium">
                  {t("Valor")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border max-md:block">
              {propostas.map((p) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-muted/40 max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:px-3 max-md:py-2 md:h-12"
                >
                  <td className="px-4 whitespace-nowrap tabular-nums max-md:p-0 max-md:text-xs">
                    {p.numero !== null && p.ano !== null
                      ? `${String(p.numero).padStart(4, "0")}/${p.ano} v${p.versao}`
                      : t("Rascunho")}
                  </td>
                  <td className="min-w-64 px-4 max-md:order-first max-md:basis-full max-md:p-0">
                    <Link
                      href={`/app/proposals/${p.id}`}
                      className="underline underline-offset-4 max-md:flex max-md:min-h-11 max-md:items-center"
                    >
                      {p.titulo}
                    </Link>
                  </td>
                  <td className="px-4 max-md:p-0 max-md:text-xs">
                    {aguardaRevisao(p) ? (
                      <span className="border-warning-border bg-warning-soft text-warning-foreground rounded-md border px-2 py-0.5 text-xs font-medium">
                        {t("Aguardando revisão")}
                      </span>
                    ) : (
                      statusLabels[p.status]
                    )}
                  </td>
                  <td className="px-4 text-right whitespace-nowrap tabular-nums max-md:p-0 max-md:text-xs">
                    {formatCents(p.total_cents, p.moeda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
