import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge — Unnify (DESIGN-SYSTEM.md §10.6).
 *
 * Altura mínima 24, padding 8 × 2, texto `xs`/500, ícone de 12, raio 6 (o
 * canônico do Work; a pílula fica só para o chip de variação). Regra do DS: 1 a
 * 2 palavras; se precisa de mais, é texto, não badge.
 *
 * Variantes do Unnify:
 *   - default: destaque de marca SUAVE (`primary/10`, borda `primary/20`);
 *   - secondary: informação neutra;
 *   - outline: etiqueta discreta;
 *   - ghost / link: sem fundo, ação leve em linha;
 *   - destructive, success, warning, info: o trio do estado
 *     (`border-*-border bg-*-soft text-*-foreground`).
 * Apelidos do CRM: `neutral` = `secondary`, `error` = `destructive`.
 */
const badgeVariants = cva(
  [
    "inline-flex min-h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-md border border-transparent px-2 py-0.5",
    "text-xs leading-4 font-medium whitespace-nowrap",
    "transition-colors duration-fast ease-out motion-reduce:transition-none",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:text-primary-hover hover:underline",
        destructive: "border-destructive/20 bg-destructive/10 text-danger-foreground",
        success: "border-success-border bg-success-soft text-success-foreground",
        warning: "border-warning-border bg-warning-soft text-warning-foreground",
        info: "border-info-border bg-info-soft text-info-foreground",
        // Apelidos do CRM
        neutral: "border-border bg-secondary text-secondary-foreground",
        error: "border-destructive/20 bg-destructive/10 text-danger-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant ?? "default"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
