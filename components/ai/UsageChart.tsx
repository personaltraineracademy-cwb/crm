"use client";

import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { UsagePayload } from "@/lib/ai/usage/aggregate";
import { formatCentsUSD } from "@/lib/money";
import {
  COR_DA_SERIE,
  PROPS_DA_DICA,
  PROPS_DA_GRADE,
  PROPS_DA_LEGENDA,
  PROPS_DO_EIXO,
  diaDoEixo,
  numeroCompacto,
  numeroPtBr,
  percentualPtBr,
  propsDaLinha,
} from "@/components/ai/grafico/tema-do-grafico";
import { useT } from "@/hooks/i18n/useT";

interface Props {
  payload: UsagePayload;
}

const formatDateTick = diaDoEixo;
const formatNumber = (n: number) => numeroPtBr(n);
const formatTokens = numeroCompacto;

/** Cartão de gráfico (§12.4): o `Card` padrão, título `base`/600. */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-4 text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  const t = useT();
  return (
    <div className="flex h-[200px] items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
      {t("Sem dados no período")}
    </div>
  );
}

export function UsageChart({ payload }: Props) {
  const tagDoIdioma = useTagDeIdioma();
  const t = useT();
  const { series } = payload;

  // Pre-build merged latency dataset for the dual-line chart.
  const latencyData = series.p50_latency_ms.map((p, i) => ({
    day: p.day,
    p50: p.value,
    p95: series.p95_latency_ms[i]?.value ?? 0,
  }));

  const handoffData = series.handoff_rate.map((p) => ({
    day: p.day,
    pct: Number((p.value * 100).toFixed(2)),
  }));

  const hasCost = series.cost_cents.some((p) => p.value > 0);
  const hasTokens = series.total_tokens.some((p) => p.value > 0);
  const hasLatency = latencyData.some((p) => p.p50 > 0 || p.p95 > 0);
  const hasHandoff = handoffData.some((p) => p.pct > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard title={t("Quanto gastou por dia (US$)")}>
        {!hasCost ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={series.cost_cents}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid {...PROPS_DA_GRADE} />
              <XAxis
                dataKey="day"
                tickFormatter={(v) => formatDateTick(v, tagDoIdioma)}
                {...PROPS_DO_EIXO}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                {...PROPS_DO_EIXO}
                tickFormatter={(v: number) => formatCentsUSD(v)}
                width={70}
              />
              <Tooltip
                {...PROPS_DA_DICA}
                formatter={(value) => [formatCentsUSD(Number(value)), t("Custo")]}
                labelFormatter={(label) => formatDateTick(String(label), tagDoIdioma)}
              />
              <Line
                {...propsDaLinha(COR_DA_SERIE.principal)}
                dataKey="value"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t("Volume de texto processado por dia")}>
        {!hasTokens ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={series.total_tokens}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid {...PROPS_DA_GRADE} />
              <XAxis
                dataKey="day"
                tickFormatter={(v) => formatDateTick(v, tagDoIdioma)}
                {...PROPS_DO_EIXO}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                {...PROPS_DO_EIXO}
                tickFormatter={formatTokens}
                width={50}
              />
              <Tooltip
                {...PROPS_DA_DICA}
                formatter={(value) => [formatNumber(Number(value)), t("Tokens")]}
                labelFormatter={(label) => formatDateTick(String(label), tagDoIdioma)}
              />
              <Line
                {...propsDaLinha(COR_DA_SERIE.secundaria)}
                dataKey="value"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t("Tempo de uma chamada à IA por dia (segundos)")}>
        {!hasLatency ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={latencyData}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid {...PROPS_DA_GRADE} />
              <XAxis
                dataKey="day"
                tickFormatter={(v) => formatDateTick(v, tagDoIdioma)}
                {...PROPS_DO_EIXO}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                {...PROPS_DO_EIXO}
                // O eixo TAMBÉM em segundos. Traduzir só o título e o tooltip
                // deixaria a régua contradizendo o rótulo — o gráfico diria
                // "segundos" e mostraria 24.000 na lateral.
                tickFormatter={(v: number) =>
                  numeroPtBr(v / 1000)
                }
                width={40}
              />
              <Tooltip
                {...PROPS_DA_DICA}
                // Segundos, não milissegundos: 17.621 ms não diz nada a quem
                // atende; 17,6 s diz.
                formatter={(value, name) => [
                  `${numeroPtBr(Number(value) / 1000, 1)} s`,
                  name,
                ]}
                labelFormatter={(label) => formatDateTick(String(label), tagDoIdioma)}
              />
              <Legend {...PROPS_DA_LEGENDA} />
              <Line
                {...propsDaLinha(COR_DA_SERIE.principal)}
                dataKey="p50"
                name={t("a maioria responde em")}
              />
              <Line
                {...propsDaLinha(COR_DA_SERIE.comparativo)}
                dataKey="p95"
                name={t("pior caso comum")}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t("Quanto foi para uma pessoa (%)")}>
        {!hasHandoff ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={handoffData}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid {...PROPS_DA_GRADE} />
              <XAxis
                dataKey="day"
                tickFormatter={(v) => formatDateTick(v, tagDoIdioma)}
                {...PROPS_DO_EIXO}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                {...PROPS_DO_EIXO}
                tickFormatter={(v: number) => percentualPtBr(v, 0)}
                width={45}
              />
              <Tooltip
                {...PROPS_DA_DICA}
                formatter={(value) => [percentualPtBr(Number(value), 2), t("Handoff")]}
                labelFormatter={(label) => formatDateTick(String(label), tagDoIdioma)}
              />
              <Line
                {...propsDaLinha(COR_DA_SERIE.secundaria)}
                dataKey="pct"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
