"use client";

import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { UsageSeries } from "@/app/api/v1/admin/usage/route";
import { formatCentsUSD } from "@/lib/money";
import {
  PROPS_DA_DICA,
  PROPS_DA_GRADE,
  PROPS_DO_EIXO,
  diaDoEixo,
  numeroCompacto,
  numeroPtBr,
} from "@/components/ai/grafico/tema-do-grafico";
import { useT } from "@/hooks/i18n/useT";

interface UsageChartsProps {
  series: UsageSeries;
}

// Data de calendário puro: lida em UTC (§12.3). Antes era meia-noite LOCAL,
// e no fuso do Brasil o rótulo andava um dia para trás.
const formatDateTick = diaDoEixo;

// DÓLAR: o número é `llm_calls.cost_cents`, e `pricing.ts` cota o provedor em USD.
const formatCurrency = formatCentsUSD;

const formatNumber = (n: number) => numeroPtBr(n);

function EmptyChart() {
  const t = useT();
  return (
    <div className="flex h-40 items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
      {t("Sem dados no período")}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-4 text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function UsageCharts({ series }: UsageChartsProps) {
  const tagDoIdioma = useTagDeIdioma();
  const t = useT();
  const hasMessages = series.messages.some((p) => p.count > 0);
  const hasCost = series.ai_cost.some((p) => p.cents > 0);
  const hasTokens = series.ai_tokens.some((p) => p.tokens > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Messages per day */}
      <ChartCard title={t("Mensagens / dia")}>
        {!hasMessages ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={series.messages}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...PROPS_DA_GRADE} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDateTick(v, tagDoIdioma)}
                {...PROPS_DO_EIXO}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                {...PROPS_DO_EIXO}
                tickFormatter={formatNumber}
                width={45}
              />
              <Tooltip
                {...PROPS_DA_DICA}
                formatter={(value) => [formatNumber(Number(value)), t("Mensagens")]}
                labelFormatter={(label) => formatDateTick(String(label), tagDoIdioma)}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--chart-1)"
                strokeWidth={2}
                activeDot={{ r: 3, strokeWidth: 0 }}
                fill="url(#colorMsg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* AI Cost per day */}
      <ChartCard title={t("Custo AI / dia (R$)")}>
        {!hasCost ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={series.ai_cost}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...PROPS_DA_GRADE} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDateTick(v, tagDoIdioma)}
                {...PROPS_DO_EIXO}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                {...PROPS_DO_EIXO}
                tickFormatter={(v: number) =>
                  formatCurrency(v)
                }
                width={70}
              />
              <Tooltip
                {...PROPS_DA_DICA}
                formatter={(value) => [formatCurrency(Number(value)), t("Custo")]}
                labelFormatter={(label) => formatDateTick(String(label), tagDoIdioma)}
              />
              <Area
                type="monotone"
                dataKey="cents"
                stroke="var(--chart-2)"
                strokeWidth={2}
                activeDot={{ r: 3, strokeWidth: 0 }}
                fill="url(#colorCost)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* AI Tokens per day — full width */}
      <div className="md:col-span-2">
        <ChartCard title={t("AI Tokens / dia")}>
          {!hasTokens ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={series.ai_tokens}
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...PROPS_DA_GRADE} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDateTick(v, tagDoIdioma)}
                  {...PROPS_DO_EIXO}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  {...PROPS_DO_EIXO}
                  tickFormatter={numeroCompacto}
                  width={50}
                />
                <Tooltip
                  {...PROPS_DA_DICA}
                  formatter={(value) => [formatNumber(Number(value)), "Tokens"]}
                  labelFormatter={(label) => formatDateTick(String(label), tagDoIdioma)}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  fill="url(#colorTokens)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
