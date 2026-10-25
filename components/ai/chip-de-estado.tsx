import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Chip de estado do Unnify (§3.3 e §10.6, `STATE_CHIP`): SEMPRE o trio
 * `{estado}-soft` (fundo) + `{estado}-border` + `{estado}-foreground` (texto),
 * raio 6, `xs`/500, ícone de 12. Cor sólida de estado fica para ponto, barra e
 * ícone; o chip é o lugar do texto.
 *
 * Usado onde o estado é o dado da linha — Radar, execuções e casos da IA,
 * propostas da IA — e onde o `Badge` genérico não garante o trio.
 * `neutro` é o estado sem cor (rascunho, pausado, encerrado).
 */
export type TomDeEstado = "sucesso" | "aviso" | "perigo" | "info" | "neutro";

export const CLASSES_DO_TOM: Record<TomDeEstado, string> = {
  sucesso: "border-success-border bg-success-soft text-success-foreground",
  aviso: "border-warning-border bg-warning-soft text-warning-foreground",
  perigo: "border-danger-border bg-danger-soft text-danger-foreground",
  info: "border-info-border bg-info-soft text-info-foreground",
  neutro: "border-border bg-muted text-muted-foreground",
};

/** Ponto de estado de 8px (cor sólida): para linha do tempo e lista densa. */
export const PONTO_DO_TOM: Record<TomDeEstado, string> = {
  sucesso: "bg-success",
  aviso: "bg-warning",
  perigo: "bg-danger",
  info: "bg-info",
  neutro: "bg-muted-foreground/60",
};

/** Texto de estado (ícone e frase curta fora de chip). */
export const TEXTO_DO_TOM: Record<TomDeEstado, string> = {
  sucesso: "text-success-foreground",
  aviso: "text-warning-foreground",
  perigo: "text-danger-foreground",
  info: "text-info-foreground",
  neutro: "text-muted-foreground",
};

export function classesDoChipDeEstado(tom: TomDeEstado, className?: string): string {
  return cn(
    "inline-flex min-h-6 w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
    CLASSES_DO_TOM[tom],
    className,
  );
}

interface Props {
  tom: TomDeEstado;
  children: ReactNode;
  icone?: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
  title?: string;
}

export function ChipDeEstado({ tom, children, icone: Icone, className, ...resto }: Props) {
  return (
    <span className={classesDoChipDeEstado(tom, className)} data-tom={tom} {...resto}>
      {Icone ? <Icone size={12} aria-hidden /> : null}
      {children}
    </span>
  );
}
