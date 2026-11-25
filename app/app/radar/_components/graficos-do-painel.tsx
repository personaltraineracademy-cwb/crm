"use client";

import type { ComponentProps, ComponentType, ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

/**
 * AS PEÇAS DE GRÁFICO DO PAINEL POR CONVERSA, no padrão do Unnify Pulse
 * (hub-pta: `components/charts/useChartTheme.ts`, `ChartsSection.tsx`,
 * `tracking/analyticsShared.tsx`, `ui/StatCard.tsx`) — pedido da dona,
 * 25/11/2026: os painéis do CRM seguem o mesmo padrão de gráficos do Pulse.
 *
 * O que vem de lá, sem invenção: a paleta de dados (`--grafico-*` em
 * `app/globals.css`, os mesmos hex de `PIE_COLORS_LIGHT/DARK`), eixo com texto
 * de 12px e sem linha, grade tracejada só horizontal, área com degradê de 0,22
 * a 0, barras com cantos de 4px, rosca de 55% a 80% com legenda em lista, o
 * tooltip de 12px de raio e o cartão de número com a variação colorida.
 */

export const CORES_DOS_DADOS = [
  "var(--grafico-1)",
  "var(--grafico-2)",
  "var(--grafico-3)",
  "var(--grafico-4)",
  "var(--grafico-5)",
  "var(--grafico-6)",
  "var(--grafico-7)",
  "var(--grafico-8)",
] as const;

const GRADE = { strokeDasharray: "3 3", stroke: "var(--grafico-grade)", vertical: false as const };
const EIXO = {
  stroke: "none",
  tick: { fontSize: 12, fill: "var(--muted-foreground)" },
  tickLine: false as const,
  axisLine: false as const,
};
const DICA = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    fontSize: 12,
    padding: "10px 12px",
    maxWidth: "min(320px, calc(100vw - 32px))",
    overflowWrap: "anywhere" as const,
    lineHeight: 1.5,
    color: "var(--popover-foreground)",
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
  cursor: { fill: "var(--muted)" },
};

/** O contêiner responsivo estável do Pulse: nasce 1×1 para não avisar no primeiro render. */
function Responsivo(props: ComponentProps<typeof ResponsiveContainer>) {
  return <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} {...props} />;
}

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
export function numeroCompacto(n: number): string {
  return Math.abs(n) < 1000 ? n.toLocaleString("pt-BR") : compacto.format(n);
}

/** Quantos rótulos o eixo X mostra: no máximo uns 8, como `xInterval` do Pulse. */
function intervaloDoEixo(n: number): number {
  if (n <= 8) return 0;
  if (n <= 16) return 1;
  if (n <= 32) return Math.ceil(n / 7) - 1;
  if (n <= 90) return Math.ceil(n / 6) - 1;
  return Math.ceil(n / 5) - 1;
}

/** O cartão que envolve um gráfico (ChartCard do Pulse): ícone, título e subtítulo. */
export function CartaoDeGrafico({
  titulo,
  subtitulo,
  Icone,
  className,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  Icone?: ComponentType<{ size?: number; style?: React.CSSProperties; "aria-hidden"?: boolean }>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5", className)}
    >
      <div className="mb-5 flex min-w-0 items-start gap-2.5">
        {Icone && (
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: "color-mix(in srgb, var(--grafico-1) 10%, transparent)" }}
          >
            <Icone size={14} style={{ color: "var(--grafico-1)" }} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm leading-6 font-semibold text-foreground">{titulo}</h3>
          {subtitulo && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitulo}</p>}
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </article>
  );
}

/** O cartão de número (StatCard "overview" do Pulse). */
export function CartaoDeNumero({
  rotulo,
  valor,
  variacao,
  quedaEBoa = false,
  contexto,
}: {
  rotulo: string;
  valor: string;
  /** Variação percentual contra o período anterior; `null` = sem base. */
  variacao?: number | null;
  /** Métrica em que cair é bom (tempo de resposta, sem resposta). */
  quedaEBoa?: boolean;
  contexto?: ReactNode;
}) {
  const favoravel = variacao == null ? null : quedaEBoa ? variacao <= 0 : variacao >= 0;
  return (
    <article className="flex min-h-[148px] min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
      <p className="min-h-5 text-sm leading-5 font-medium text-muted-foreground [overflow-wrap:anywhere]">
        {rotulo}
      </p>
      <p className="mt-2 flex min-h-9 min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="max-w-full shrink-0 text-[clamp(1.65rem,2.2vw,2rem)] leading-tight font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">
          {valor}
        </span>
        {variacao != null && (
          <span
            className={cn(
              "shrink-0 text-sm font-medium tabular-nums",
              favoravel ? "text-success-foreground" : "text-danger-foreground",
            )}
          >
            {variacao >= 0 ? "+" : ""}
            {variacao.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
          </span>
        )}
      </p>
      {contexto ? (
        <div className="mt-auto flex min-h-6 items-end pt-3">
          <p className="text-xs text-muted-foreground">{contexto}</p>
        </div>
      ) : null}
    </article>
  );
}

/** Série por dia em área com degradê (o gráfico de tendência do Pulse). */
export function AreaPorDia({
  pontos,
  nome,
  rotuloDoDia,
}: {
  pontos: Array<{ dia: string; valor: number }>;
  nome: string;
  rotuloDoDia: (dia: string) => string;
}) {
  return (
    <div className="h-56 sm:h-64">
      <Responsivo width="100%" height="100%">
        <AreaChart data={pontos} margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="degradeDoPainel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--grafico-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--grafico-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRADE} />
          <XAxis
            dataKey="dia"
            {...EIXO}
            tickFormatter={rotuloDoDia}
            interval={intervaloDoEixo(pontos.length)}
            height={24}
          />
          <YAxis {...EIXO} tickFormatter={(v) => numeroCompacto(Number(v))} width="auto" allowDecimals={false} />
          <Tooltip
            {...DICA}
            labelFormatter={(v) => rotuloDoDia(String(v))}
            formatter={(v) => [numeroCompacto(Number(v)), nome]}
          />
          <Area
            type="monotone"
            dataKey="valor"
            name={nome}
            stroke="var(--grafico-1)"
            strokeWidth={3}
            fill="url(#degradeDoPainel)"
          />
        </AreaChart>
      </Responsivo>
    </div>
  );
}

/** Ranking em barras horizontais (barra de ranking do Pulse). */
export function BarrasDeRanking({
  itens,
  nome,
  formatar = numeroCompacto,
}: {
  itens: Array<{ rotulo: string; valor: number }>;
  nome: string;
  formatar?: (n: number) => string;
}) {
  return (
    <div style={{ height: Math.max(itens.length * 34, 96) }}>
      <Responsivo width="100%" height="100%">
        <BarChart data={itens} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRADE} vertical horizontal={false} />
          <XAxis type="number" {...EIXO} tickFormatter={(v) => formatar(Number(v))} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="rotulo"
            {...EIXO}
            width={120}
            interval={0}
            tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)}
          />
          <Tooltip {...DICA} formatter={(v) => [formatar(Number(v)), nome]} />
          <Bar dataKey="valor" name={nome} radius={[0, 4, 4, 0]} maxBarSize={18}>
            {itens.map((i, n) => (
              <Cell key={i.rotulo} fill={CORES_DOS_DADOS[n % CORES_DOS_DADOS.length]} />
            ))}
          </Bar>
        </BarChart>
      </Responsivo>
    </div>
  );
}

/** Rosca com a legenda em lista ao lado (DonutChart do Pulse). */
export function Rosca({ fatias }: { fatias: Array<{ rotulo: string; valor: number }> }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
      <div style={{ width: 180, height: 180 }} className="shrink-0">
        <Responsivo width="100%" height="100%">
          <PieChart>
            <Pie
              data={fatias}
              dataKey="valor"
              nameKey="rotulo"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {fatias.map((f, n) => (
                <Cell key={f.rotulo} fill={CORES_DOS_DADOS[n % CORES_DOS_DADOS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              {...DICA}
              formatter={(v, nome) => [
                `${numeroCompacto(Number(v))} · ${total === 0 ? 0 : Math.round((Number(v) / total) * 100)}%`,
                String(nome),
              ]}
            />
          </PieChart>
        </Responsivo>
      </div>
      <ul className="w-full min-w-0 space-y-1.5">
        {fatias.map((f, n) => (
          <li key={f.rotulo} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: CORES_DOS_DADOS[n % CORES_DOS_DADOS.length] }}
              />
              <span className="truncate text-xs text-muted-foreground">{f.rotulo}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
              {numeroCompacto(f.valor)}
              <span className="ml-1 font-normal text-muted-foreground">
                ({total === 0 ? 0 : Math.round((f.valor / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
