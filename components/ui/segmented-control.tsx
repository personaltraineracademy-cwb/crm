"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Controle segmentado (Unnify DS §10.8): 2 a 5 opções para trocar a VISÃO
 * dentro de um cartão ("Rosca · Mensal · Barras"). Para navegação de página
 * use `TabsList variant="line"`; para uma visão com painéis próprios, `Tabs`
 * `segmented`.
 *
 * Trilho `muted` raio 8, padding 2, gap 2. Peça de 28 (`sm`, padrão) ou 32
 * (`md`), raio 6, padding 12; ativa em `card` com `shadow-xs` (no escuro,
 * `neutral-600`: o `card` dá 1,04:1 sobre o trilho `muted`). Ícone opcional
 * de 14px. `role="group"` com um botão `aria-pressed` por opção. Substitui
 * qualquer botão-alternador feito à mão.
 *
 * `iconOnlyOnMobile` esconde o rótulo abaixo de 640px; o rótulo vira o nome
 * acessível (`aria-label`) e a dica (`title`) do botão. Só faz sentido quando
 * TODA opção tem ícone.
 */
export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  /** Ícone opcional (lucide), desenhado a 14px antes do rótulo. */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> extends Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue" | "children" | "aria-label"
> {
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SegmentedControlOption<T>>;
  /** `sm` = peça de 28 (padrão do DS); `md` = 32, a altura da aba segmentada. */
  size?: "sm" | "md";
  /** Nome do grupo para leitor de tela ("Visualização do gráfico"). */
  "aria-label": string;
  iconOnlyOnMobile?: boolean;
}

export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  size = "sm",
  iconOnlyOnMobile = false,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      data-slot="segmented-control"
      data-size={size}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 rounded-lg bg-muted p-0.5",
        className,
      )}
      {...props}
    >
      {options.map((opcao) => {
        const ativa = opcao.value === value;
        return (
          <button
            key={opcao.value}
            type="button"
            data-slot="segmented-control-item"
            data-state={ativa ? "on" : "off"}
            aria-pressed={ativa}
            aria-label={iconOnlyOnMobile ? opcao.label : undefined}
            title={iconOnlyOnMobile ? opcao.label : undefined}
            disabled={opcao.disabled}
            onClick={() => {
              if (!ativa) onValueChange(opcao.value);
            }}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md px-3 font-medium whitespace-nowrap outline-hidden transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-9",
              "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
              size === "sm" ? "h-7 text-xs" : "h-8 text-sm",
              ativa
                ? "bg-card text-foreground shadow-xs dark:bg-neutral-600"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opcao.icon}
            <span className={iconOnlyOnMobile && opcao.icon ? "hidden sm:inline" : undefined}>
              {opcao.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
