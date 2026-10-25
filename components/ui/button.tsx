import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button — Unnify (DESIGN-SYSTEM.md §10.1, §9).
 *
 * Variantes do Unnify:
 *   - default: a ação primária (UMA por área). `primary` → `primary-hover` → `primary-pressed`.
 *   - outline: ação secundária padrão (cartão + borda; hover `interactive`).
 *   - secondary: secundária com peso (fundo `secondary`, sem borda).
 *   - ghost: terciária e botões só com ícone.
 *   - destructive: a CANÔNICA, suave (`destructive/10`, texto destrutivo).
 *   - destructive-solid: a sólida, reservada à confirmação final dentro de diálogo.
 *   - link: texto `primary`, sublinha no hover.
 * Apelido do CRM (364 arquivos importam): `primary` = `default`.
 *
 * Tamanhos (altura · padding · raio): xs 28·10·6 · sm 32·12·8 · default 36·14·8 ·
 * lg 40·20·8; ícone icon-xs 28 · icon-sm 32 · icon 36 · icon-lg 40.
 * Apelido do CRM: `md` = `default`.
 *
 * Alvo de toque: 44×44 em ponteiro grosso e abaixo de 640px (Work, DS §5.2). O
 * CRM subia TODO botão a 44 abaixo de 1024px; o Unnify mede pelo ponteiro, e o
 * notebook com mouse entre 640 e 1024 volta aos 36.
 *
 * Sem `active:translate-y-px` e sem sombra: no Unnify pressionar só troca a cor
 * (§7.2) e superfície é lisa (§1).
 */
const ALVO_DE_TOQUE = "pointer-coarse:min-h-11 max-sm:min-h-11";
const ALVO_DE_TOQUE_ICONE = `${ALVO_DE_TOQUE} pointer-coarse:min-w-11 max-sm:min-w-11`;

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap",
    "rounded-lg border border-transparent bg-clip-padding text-sm font-medium select-none",
    "transition-[background-color,border-color,color,box-shadow] duration-fast ease-out",
    // Foco 2+2 (§9.2): anel `ring` com afastamento na cor do fundo.
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    // Inválido (§9.1): borda destrutiva + anel de 4px a 20%.
    "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
    // Ícone de 16 por padrão; quem passar `size-*` no ícone escolhe outro.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
        outline:
          "border-border bg-card text-foreground hover:border-interactive-border hover:bg-interactive hover:text-interactive-foreground active:bg-interactive-strong aria-expanded:border-interactive-border aria-expanded:bg-interactive aria-expanded:text-interactive-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-interactive hover:text-interactive-foreground active:bg-interactive-strong aria-expanded:bg-interactive aria-expanded:text-interactive-foreground",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-interactive hover:text-interactive-foreground active:bg-interactive-strong aria-expanded:bg-interactive aria-expanded:text-interactive-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/25 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:active:bg-destructive/35",
        "destructive-solid":
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        link: "bg-transparent text-primary underline-offset-4 hover:text-primary-hover hover:underline active:text-primary-pressed",
      },
      size: {
        xs: `h-7 gap-1.5 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5 ${ALVO_DE_TOQUE}`,
        sm: `h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 ${ALVO_DE_TOQUE}`,
        default: `h-9 gap-2 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 ${ALVO_DE_TOQUE}`,
        md: `h-9 gap-2 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 ${ALVO_DE_TOQUE}`,
        lg: `h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 ${ALVO_DE_TOQUE}`,
        "icon-xs": `size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5 ${ALVO_DE_TOQUE_ICONE}`,
        "icon-sm": `size-8 ${ALVO_DE_TOQUE_ICONE}`,
        icon: `size-9 ${ALVO_DE_TOQUE_ICONE}`,
        "icon-lg": `size-10 ${ALVO_DE_TOQUE_ICONE}`,
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-slot="button"
        data-variant={variant ?? "default"}
        data-size={size ?? "default"}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
