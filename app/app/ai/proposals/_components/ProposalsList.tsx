"use client";

import { useLocaleDeData } from "@/hooks/i18n/useLocaleDeData";

import type { Locale } from "date-fns";
import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useProposals,
  useDecidirProposta,
  type DecisaoPassada,
  type PropostaPendente,
} from "@/hooks/leads/useProposals";
import { Check, Sparkle, X } from "@/lib/ui/icons";
import { ChipDeEstado } from "@/components/ai/chip-de-estado";
import { useT } from "@/hooks/i18n/useT";

function quando(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDistanceToNowStrict(d, { addSuffix: true, locale: locale });
}

export function ProposalsList({ canDecide }: { canDecide: boolean }) {
  const t = useT();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const { data, isLoading } = useProposals();
  const decidir = useDecidirProposta();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "history")}>
        <TabsList>
          <TabsTrigger value="pending">
            {t("Aguardando decisão")}{data ? ` (${data.pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history">{t("Já decididas")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : tab === "pending" ? (
        <Pendentes
          itens={data?.pending ?? []}
          canDecide={canDecide}
          pending={decidir.isPending}
          onDecidir={(leadId, decision, seq) => decidir.mutate({ leadId, decision, seq })}
        />
      ) : (
        <Historico itens={data?.history ?? []} />
      )}
    </div>
  );
}

function Pendentes({
  itens,
  canDecide,
  pending,
  onDecidir,
}: {
  itens: PropostaPendente[];
  canDecide: boolean;
  pending: boolean;
  onDecidir: (leadId: string, decision: "approve" | "dismiss", seq: number) => void;
}) {
  const localeDaData = useLocaleDeData();
  const t = useT();
  if (itens.length === 0) {
    return (
      <Vazio
        titulo={t("Nenhuma proposta esperando você")}
        detalhe={t(
          "Quando o assistente sugerir um próximo passo, ele aparece aqui — e some daqui assim que você decidir.",
        )}
      />
    );
  }

  return (
    // Cada proposta é um cartão com UMA ação primária (Aprovar); ignorar é
    // secundária. O texto da proposta vai num bloco `muted/40` (agrupador
    // dentro do cartão, §1) e as ações no rodapé `muted/30` (§10.9).
    <ul className="grid gap-4 md:grid-cols-2">
      {itens.map((p) => (
        <li
          key={`${p.lead_id}-${p.seq}`}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkle size={16} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={p.lead_title}>
                  {p.lead_title}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {p.contact_name && <span className="truncate">{p.contact_name}</span>}
                  {/* Há quanto tempo espera é a informação que decide a ORDEM de quem
                      olha — por isso fica junto do título, não escondida embaixo. */}
                  <span className="tabular-nums">
                    {t("proposta")} {quando(p.proposed_at, localeDaData)}
                  </span>
                </p>
              </div>
              {p.stage_name && (
                <Badge variant="secondary" className="shrink-0">
                  {p.stage_name}
                </Badge>
              )}
            </div>

            <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">{p.next_action}</p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3 sm:px-5">
            <Button
              size="sm"
              variant="ghost"
              disabled={!canDecide || pending}
              onClick={() => onDecidir(p.lead_id, "dismiss", p.seq)}
              aria-label={`${t("Ignorar")}: ${p.next_action}`}
            >
              <X size={14} aria-hidden />
              {t("Ignorar")}
            </Button>
            <Button
              size="sm"
              disabled={!canDecide || pending}
              onClick={() => onDecidir(p.lead_id, "approve", p.seq)}
              aria-label={`${t("Aprovar")}: ${p.next_action}`}
            >
              <Check size={14} aria-hidden />
              {t("Aprovar")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Historico({ itens }: { itens: DecisaoPassada[] }) {
  const localeDaData = useLocaleDeData();
  const t = useT();
  if (itens.length === 0) {
    return (
      <Vazio
        titulo={t("Nenhuma decisão registrada ainda")}
        detalhe={t(
          "Aprovar e ignorar viram registro — os dois. Quando você decidir a primeira, ela fica aqui.",
        )}
      />
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {itens.map((d) => (
        <li key={d.activity_id} className="flex flex-col gap-1.5 px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {/* IGNORAR NÃO É "NADA ACONTECEU": ganha o mesmo destaque visual de
                aprovar, porque a wave 4 existe exatamente para que a recusa
                seja uma decisão registrada e não uma ausência. */}
            <ChipDeEstado tom={d.decision === "approve" ? "sucesso" : "neutro"}>
              {d.decision === "approve" ? t("Aprovada") : t("Ignorada")}
            </ChipDeEstado>
            <span className="text-sm font-medium text-foreground">{d.lead_title}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("por")} {d.decided_by ?? "—"} · {quando(d.decided_at, localeDaData)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{d.next_action}</p>
        </li>
      ))}
    </ul>
  );
}

function Vazio({ titulo, detalhe }: { titulo: string; detalhe: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <Sparkle size={32} aria-hidden className="text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      <p className="max-w-md text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}
