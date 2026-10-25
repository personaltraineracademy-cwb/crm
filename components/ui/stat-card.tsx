import type * as React from "react";
import {
  CircleAlert,
  CircleCheck,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Cartão de métrica — KPI (Unnify DS §10.11, §11.3).
 *
 * Altura mínima 148, padding 16/20, a mesma superfície do `Card` (raio 12,
 * borda, sem sombra). De cima para baixo:
 *
 * 1. Rótulo `sm`/500 muted, com a altura de 2 LINHAS reservada: numa fila de
 *    KPIs os valores ficam na mesma linha mesmo quando um rótulo quebra.
 * 2. Valor `clamp(26px, 2.2vw, 32px)`/600, `tracking-tight`, tabular, e o chip
 *    de variação ao lado (`xs`/600, `rounded-full`).
 * 3. Contexto `xs` muted ("vs. período anterior"); valores dentro dele em
 *    `<strong>` saem `xs`/500 `foreground`.
 * 4. Meta (opcional): barra de 8px (trilho `primary/15`), linha de status com
 *    ícone de 14px colorida pelo estado.
 * 5. Sparkline (opcional): SVG de 28px, sem eixos, área suave.
 *
 * Use numa grade `auto-fit`:
 * `grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4`.
 */
export type StatTrend = "up" | "down" | "neutral";
export type StatTone = "positive" | "negative" | "neutral";

export interface StatCardDelta {
  /** Texto pronto, com sinal: "+12%", "−3,4 p.p.". */
  value: string;
  trend: StatTrend;
  /**
   * Cor do chip. Por padrão subir é bom (verde) e cair é ruim (vermelho); em
   * métrica de custo (CPA, tempo de resposta) passe o tom ao contrário.
   */
  tone?: StatTone;
}

export interface StatCardGoal {
  /** Progresso em porcentagem; o desenho limita a 0–100. */
  progress: number;
  status: "ok" | "warning" | "danger";
  /** Texto de status ("Meta batida", "Faltam R$ 2.300"). */
  label?: string;
}

export interface StatCardProps extends Omit<React.ComponentProps<"div">, "children"> {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: StatCardDelta;
  context?: React.ReactNode;
  goal?: StatCardGoal;
  sparkline?: number[];
  /** Uma ação no canto superior direito (ex.: botão de editar meta, 36×36 `ghost`). */
  action?: React.ReactNode;
  /** Esqueleto com a forma final do cartão. */
  loading?: boolean;
}

const TOM_PADRAO: Record<StatTrend, StatTone> = {
  up: "positive",
  down: "negative",
  neutral: "neutral",
};

const CHIP: Record<StatTone, string> = {
  positive: "bg-value-positive-bg text-value-positive",
  negative: "bg-value-negative-bg text-value-negative",
  neutral: "bg-value-neutral-bg text-muted-foreground",
};

const PALAVRA: Record<StatTrend, string> = { up: "Subiu", down: "Caiu", neutral: "Estável" };

/** Chip de variação (DS §10.6): `rounded-full px-2 py-1 xs/600` tabular, com seta. */
export function StatDelta({
  value,
  trend,
  tone,
  className,
}: StatCardDelta & { className?: string }) {
  const Icone = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <span
      data-slot="stat-delta"
      data-trend={trend}
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs leading-4 font-semibold tabular-nums",
        CHIP[tone ?? TOM_PADRAO[trend]],
        className,
      )}
    >
      <Icone className="size-3 shrink-0" aria-hidden="true" />
      <span className="sr-only">{PALAVRA[trend]}: </span>
      {value}
    </span>
  );
}

/** Linha de tendência sem eixos, 28px de altura, na cor da 1ª série de dados. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const valores = data.filter((v) => Number.isFinite(v));
  if (valores.length < 2) return <div className={cn("h-7", className)} aria-hidden="true" />;

  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const faixa = max - min || 1;
  const L = 100;
  const A = 28;
  const pontos = valores.map(
    (v, i) =>
      `${((i / (valores.length - 1)) * L).toFixed(2)},${(A - ((v - min) / faixa) * A).toFixed(2)}`,
  );

  return (
    <svg
      data-slot="sparkline"
      viewBox={`0 0 ${L} ${A}`}
      preserveAspectRatio="none"
      className={cn("text-chart-1 h-7 w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <polygon
        points={`0,${A} ${pontos.join(" ")} ${L},${A}`}
        fill="currentColor"
        fillOpacity={0.08}
      />
      <polyline
        points={pontos.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Meta({ goal, rotulo }: { goal: StatCardGoal; rotulo: string }) {
  const progresso = Math.round(
    Math.min(100, Math.max(0, Number.isFinite(goal.progress) ? goal.progress : 0)),
  );
  const batida = goal.status === "ok" && progresso >= 100;
  const barra =
    goal.status === "danger"
      ? "bg-danger"
      : goal.status === "warning"
        ? "bg-warning"
        : batida
          ? "bg-success"
          : "bg-primary";
  const texto =
    goal.status === "danger"
      ? "text-danger-foreground"
      : goal.status === "warning"
        ? "text-warning-foreground"
        : batida
          ? "text-success-foreground"
          : "text-primary";
  const Icone =
    goal.status === "danger"
      ? CircleAlert
      : goal.status === "warning"
        ? TriangleAlert
        : batida
          ? CircleCheck
          : Target;

  return (
    <div data-slot="stat-goal" data-status={goal.status} className="mt-auto pt-4">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progresso}
        aria-label={rotulo}
        aria-valuetext={goal.label ? `${progresso}%, ${goal.label}` : `${progresso}%`}
        className="h-2 w-full overflow-hidden rounded-full bg-primary/15"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-base motion-reduce:transition-none",
            barra,
          )}
          style={{ width: `${progresso}%` }}
        />
      </div>
      {goal.label ? (
        <p className={cn("mt-2.5 flex items-start gap-1.5 text-xs leading-4 font-medium", texto)}>
          <Icone className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{goal.label}</span>
        </p>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  context,
  goal,
  sparkline,
  action,
  loading = false,
  className,
  ...props
}: StatCardProps) {
  const superficie = cn(
    "relative flex h-full min-h-[148px] w-full min-w-0 flex-col rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5",
    className,
  );

  if (loading) {
    return (
      <div data-slot="stat-card" aria-busy="true" className={superficie} {...props}>
        <div className="flex min-h-10 flex-col gap-1.5 pt-0.5">
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="mt-2 h-8 w-2/5" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <span className="sr-only">Carregando</span>
      </div>
    );
  }

  const rotuloDaMeta = typeof label === "string" ? `Meta de ${label}` : "Progresso da meta";

  return (
    <div data-slot="stat-card" className={superficie} {...props}>
      {action ? <div className="absolute top-3 right-3 z-10">{action}</div> : null}
      <p
        data-slot="stat-label"
        title={typeof label === "string" ? label : undefined}
        className={cn(
          "line-clamp-2 min-h-10 text-sm leading-5 font-medium [overflow-wrap:anywhere] text-muted-foreground",
          action && "pr-12",
        )}
      >
        {label}
      </p>
      <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          data-slot="stat-value"
          className="max-w-full text-[length:clamp(26px,2.2vw,32px)] leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] text-foreground tabular-nums"
        >
          {value}
        </span>
        {delta ? <StatDelta {...delta} /> : null}
      </div>
      {context ? (
        <div
          data-slot="stat-context"
          className="mt-1 text-xs leading-4 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_strong]:tabular-nums"
        >
          {context}
        </div>
      ) : null}
      {goal ? (
        <Meta goal={goal} rotulo={rotuloDaMeta} />
      ) : sparkline && sparkline.length > 1 ? (
        <div className="mt-auto pt-3">
          <Sparkline data={sparkline} />
        </div>
      ) : null}
    </div>
  );
}
