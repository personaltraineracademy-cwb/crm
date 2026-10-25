"use client";
import { useSearchParams } from "next/navigation";
import { StatCard as CartaoDeMetrica } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiUsage, type AiUsageFilters } from "@/hooks/ai/useAiUsage";
import { UsageFilters, type UsageFiltersAgent } from "@/components/ai/UsageFilters";
import { UsageChart } from "@/components/ai/UsageChart";
import { formatCentsUSD } from "@/lib/money";
import { useT } from "@/hooks/i18n/useT";

interface Props {
  agents: UsageFiltersAgent[];
  initial: {
    agent_id?: string;
    invocation_kind?: string;
    from?: string;
    to?: string;
  };
}

/** Custo por turno costuma ficar abaixo de um centavo: duas casas mostrariam US$ 0,00. */
function formatCentsUSDFino(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  });
}

/**
 * O cartão de métrica do Unnify (§10.11), com o `hint` daqui no lugar do
 * contexto. A grade é `auto-fit` (§11.3): as colunas seguem a largura.
 */
function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <CartaoDeMetrica label={label} value={value} context={hint} />;
}

const GRADE_DE_KPIS = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4";

function StatSkeletons() {
  return (
    <div className={GRADE_DE_KPIS}>
      {Array.from({ length: 6 }).map((_, i) => (
        <CartaoDeMetrica key={i} label="" value="" loading />
      ))}
    </div>
  );
}

function ChartSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-[200px] w-full" />
        </div>
      ))}
    </div>
  );
}

export function UsageDashboardClient({ agents, initial }: Props) {
  const t = useT();
  const searchParams = useSearchParams();

  const filters: AiUsageFilters = {
    agent_id: searchParams.get("agent_id") ?? undefined,
    invocation_kind: searchParams.get("invocation_kind") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  };

  const q = useAiUsage(filters);
  // As opções de "Tipo de uso" vêm da mesma consulta SEM o filtro de tipo: o
  // `by_kind` da consulta filtrada só tem o tipo escolhido, e a lista encolheria
  // para ele. Sem filtro de tipo a chave é a mesma e o react-query não repete a ida.
  const semTipo = useAiUsage({ ...filters, invocation_kind: undefined });
  const kinds = Object.keys(semTipo.data?.by_kind ?? {});

  return (
    <div className="flex flex-col gap-6">
      <UsageFilters agents={agents} kinds={kinds} initial={initial} />

      {q.isLoading || !q.data ? (
        <>
          <StatSkeletons />
          <ChartSkeletons />
        </>
      ) : (
        <>
          <div className={GRADE_DE_KPIS}>
            <StatCard
              label={t("Custo no período")}
              // DÓLAR: esta tela mostrava o MESMO número em duas moedas — o card de
              // orçamento logo acima em US$ e este StatCard em R$, dois centímetros abaixo.
              value={formatCentsUSD(q.data.totals.cost_cents)}
            />
            {/*
              Este card se chamava "Atendimentos com IA" e contava linhas de
              `llm_calls` — CHAMADAS ao modelo. Um turno do agente faz várias
              (ferramentas, classificadores), então o número inflava o volume de
              atendimento. Os turnos têm o card ao lado.
            */}
            <StatCard
              label={t("Chamadas de IA")}
              value={q.data.totals.invocations.toLocaleString("pt-BR")}
              hint={t("cada resposta do agente pode fazer várias")}
            />
            {/*
              Turno = um job distinto com chamada `agent_turn` que deu certo, e
              o custo dele é o do job inteiro mesmo com filtro. `llm_calls.job_id`
              vira null quando a poda da fila apaga o job, então o turno antigo
              deixa de contar — o hint diz isso em vez de esconder.
            */}
            <StatCard
              label={t("Turnos do agente")}
              value={q.data.totals.agent_turns.toLocaleString("pt-BR")}
              hint={
                q.data.totals.avg_cost_per_turn_cents === null
                  ? t("sem turnos no período")
                  : `${t("custo médio por turno:")} ${formatCentsUSDFino(q.data.totals.avg_cost_per_turn_cents)} · ${t("conta só os turnos que a fila ainda guarda (padrão: 90 dias)")}`
              }
            />
            <StatCard
              label={t("Taxa de cache")}
              value={`${(q.data.totals.cache_hit_rate * 100).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}%`}
              hint={t("do texto enviado à IA veio do cache, que custa bem menos")}
            />
            <StatCard
              label={t("Passaram para uma pessoa")}
              value={`${(q.data.totals.handoff_rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}
              hint={t("quanto mais alto, mais a IA precisou de ajuda")}
            />
            {/*
              "p95" quer dizer: em 95 das 100 chamadas o tempo foi ATÉ isso. É a
              medida honesta (a média esconde os casos ruins), mas o rótulo não
              pode ser a sigla. E é o tempo de UMA chamada ao modelo — um turno
              do agente encadeia várias, então isto não é o tempo que o cliente
              esperou pela resposta. O rótulo antigo, "Tempo de resposta",
              prometia o segundo e media o primeiro.
            */}
            <StatCard
              label={t("Tempo de uma chamada à IA")}
              value={`${(q.data.totals.p95_latency_ms / 1000).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })} s`}
              hint={`${t("a maioria responde em")} ${(
                q.data.totals.p50_latency_ms / 1000
              ).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s; ${t("este é o pior caso comum")}`}
            />
          </div>

          <UsageChart payload={q.data} />
        </>
      )}
    </div>
  );
}
