"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  type ControlProps,
  type Edge,
} from "@xyflow/react";

import { cn } from "@/lib/utils";

/**
 * Tema do Unnify para os editores de fluxo (@xyflow) — o construtor de
 * follow-up (`app/app/ai/followups/[id]`, que também abre os fluxos de
 * atendimento) e o designer de automações (`app/app/webhooks/automacoes/[id]`).
 * Um módulo só para os dois falarem a MESMA língua visual.
 *
 * O Unnify não tem editor de fluxo; tudo aqui é adaptação das peças dele:
 * - tela: fundo `background` com trama de pontos em `border` a cada 20px (a
 *   trama da abertura do Work);
 * - nó: o `Card` (raio 12, borda 1px, sem sombra), com o bloco de ícone de 32
 *   dos painéis (`primary/10`) e o tipo em `xs` muted; selecionado, o anel de
 *   foco (2px `ring` + 2px de afastamento); com erro, a borda inválida
 *   (`destructive` + anel de 4px `destructive/20`, §9.1);
 * - aresta: 1,5px `border-strong`; selecionada, `primary`; rótulo em chip
 *   `xs`, raio 6, sobre `popover`;
 * - controles: grupo de botões de 32 sobre `popover`, raio 8 e `shadow-md`
 *   (flutuam sobre a tela, então são os únicos com sombra).
 *
 * POR QUE `!` NOS SELETORES: o CSS do @xyflow entra sem camada, e regra sem
 * camada vence qualquer utilitário do Tailwind (que mora em `@layer
 * utilities`), seja qual for a especificidade. As cores vão por variável
 * (`--xy-*`), que o próprio @xyflow lê; tamanho e fonte, que ele fixa em px,
 * só cedem a `!important`.
 */
export const CLASSE_DO_CANVAS = cn(
  "bg-background",
  // Arestas e linha de ligação.
  "[--xy-edge-stroke:var(--border-strong)]",
  "[--xy-edge-stroke-selected:var(--primary)]",
  "[--xy-edge-stroke-width:1.5]",
  "[--xy-connectionline-stroke:var(--primary)]",
  "[--xy-connectionline-stroke-width:1.5]",
  "[--xy-edge-label-background-color:var(--popover)]",
  "[--xy-edge-label-color:var(--muted-foreground)]",
  "[&_.react-flow__edge-text]:text-xs! [&_.react-flow__edge-text]:font-medium!",
  "[&_.react-flow__edge-textbg]:stroke-border",
  // Portas (handles): 10px, `card` com borda `input`; hover `primary`.
  "[--xy-handle-background-color:var(--card)]",
  "[--xy-handle-border-color:var(--input)]",
  "[&_.react-flow__handle]:size-2.5! [&_.react-flow__handle]:transition-colors",
  "[&_.react-flow__handle:hover]:border-primary! [&_.react-flow__handle:hover]:bg-primary!",
  // Seleção por arrasto.
  "[--xy-selection-background-color:color-mix(in_srgb,var(--primary)_10%,transparent)]",
  "[--xy-selection-border:1px_solid_var(--primary)]",
  // Controles de zoom.
  "[--xy-controls-button-background-color:var(--popover)]",
  "[--xy-controls-button-background-color-hover:var(--interactive)]",
  "[--xy-controls-button-color:var(--popover-foreground)]",
  "[--xy-controls-button-color-hover:var(--interactive-foreground)]",
  "[--xy-controls-button-border-color:var(--border)]",
  "[--xy-controls-box-shadow:var(--shadow-md)]",
  // Minimapa (nenhum editor usa hoje; se entrar, já nasce no padrão).
  "[--xy-minimap-background-color:var(--card)]",
  "[--xy-minimap-mask-background-color:color-mix(in_srgb,var(--muted)_60%,transparent)]",
  "[--xy-minimap-node-background-color:var(--muted)]",
  "[--xy-minimap-node-stroke-color:var(--border)]",
  "[&_.react-flow__minimap]:overflow-hidden [&_.react-flow__minimap]:rounded-lg [&_.react-flow__minimap]:border [&_.react-flow__minimap]:border-border",
  // Crédito do @xyflow, quando aparece.
  "[--xy-attribution-background-color:transparent]",
);

/** Tela de desenho: fundo `background` com pontos em `border` a cada 20px. */
export function FundoDoFluxo() {
  return (
    <Background
      variant={BackgroundVariant.Dots}
      gap={20}
      size={2}
      color="var(--border)"
      bgColor="var(--background)"
    />
  );
}

/** Zoom e enquadrar: grupo de botões de 32 sobre `popover`, raio 8, `shadow-md`. */
export function ControlesDoFluxo({ className, ...props }: ControlProps) {
  return (
    <Controls
      {...props}
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        "[&_.react-flow__controls-button]:size-8! [&_.react-flow__controls-button]:p-2!",
        "[&_.react-flow__controls-button]:transition-colors [&_.react-flow__controls-button:last-child]:border-b-0!",
        className,
      )}
    />
  );
}

/**
 * O rótulo da aresta como chip: padding 8 × 4, raio 6, fundo `popover` com
 * borda `border` (a cor vem de `CLASSE_DO_CANVAS`). Espalhe em cada aresta
 * que tiver rótulo.
 */
export const ROTULO_DA_ARESTA = {
  labelBgPadding: [8, 4] as [number, number],
  labelBgBorderRadius: 6,
  labelShowBg: true,
} satisfies Partial<Edge>;

/**
 * A casca do nó, a mesma nos dois editores. Largura 224 (`w-56`) porque o
 * auto-layout mede a partir dela (`LAYOUT_NODE_WIDTH`).
 */
export function classesDoNo({
  selecionado,
  comErro,
}: {
  selecionado?: boolean;
  comErro?: boolean;
}): string {
  return cn(
    "w-56 rounded-xl border border-border bg-card text-card-foreground shadow-none",
    "transition-[border-color,box-shadow] duration-150",
    comErro && "border-destructive ring-4 ring-destructive/20",
    selecionado && "ring-2 ring-ring ring-offset-2 ring-offset-background",
  );
}

/** Bloco de ícone de 32 dos painéis do Work: `primary/10` com o ícone em `primary`. */
export const BLOCO_DE_ICONE =
  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary";

/** O mesmo bloco, menor, para listas (paleta): 28, raio 6. */
export const BLOCO_DE_ICONE_PEQUENO =
  "flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary";

/** Faixa de rodapé do nó (ramos, opções, erro): linha de 1px `border`. */
export const FAIXA_DO_NO = "border-t border-border px-3 py-1.5 text-xs";

/**
 * Os três papéis do QUANDO/SE/ENTÃO como chip de tom categórico (§3.3,
 * `bg-tone-X/12 text-tone-X-foreground`, raio 6). Tons que não colidem com
 * estado nem com o azul de ação: gatilho violeta, condição laranja, ação
 * verde-azulado.
 */
export type PapelDaEtapa = "gatilho" | "condicao" | "acao";

export const CHIP_DA_ETAPA: Record<PapelDaEtapa, string> = {
  gatilho: "bg-tone-violet/12 text-tone-violet-foreground",
  condicao: "bg-tone-orange/12 text-tone-orange-foreground",
  acao: "bg-tone-teal/12 text-tone-teal-foreground",
};

export function classesDoChipDaEtapa(papel: PapelDaEtapa): string {
  return cn(
    "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium",
    CHIP_DA_ETAPA[papel],
  );
}

/** Bloco agrupador dentro de cartão ou painel (§1): `muted/40`, raio 8. */
export const BLOCO_AGRUPADOR = "rounded-lg bg-muted/40 p-3";
