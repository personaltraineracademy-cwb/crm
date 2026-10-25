import type * as React from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Aviso em linha (Unnify DS §10.19, §10.21).
 *
 * Grade com ícone de 16 (alinhado ao título) + título + descrição; raio 8,
 * borda de 1px, padding 10 × 8, texto `sm`. UMA ação no máximo, no canto
 * superior direito; quando o aviso tem menos de 448px, ela desce para baixo do
 * texto. Um aviso por conceito.
 *
 * Variantes:
 * - `default` e `destructive` são as do Work: fundo `card`; o destrutivo pinta
 *   borda, ícone e texto na família `danger` (o `-foreground`, que passa AA).
 * - `warning`, `success` e `info` não existem no Work. Seguem o trio de estado
 *   do DS (§10.6, `STATE_CHIP`): `{estado}-border`, `{estado}-soft` e
 *   `{estado}-foreground`. Nenhuma cor nova.
 *
 * Erro (DS §10.21): diga a causa em linguagem simples e dê 1 ação ("Tentar de
 * novo"). `destructive` e `warning` anunciam na hora (`role="alert"`); os demais
 * são `role="status"`.
 */
type AlertVariant = "default" | "destructive" | "warning" | "success" | "info";

const SUPERFICIE: Record<AlertVariant, string> = {
  default: "border-border bg-card text-card-foreground",
  destructive: "border-danger-border bg-card text-danger-foreground",
  warning: "border-warning-border bg-warning-soft text-warning-foreground",
  success: "border-success-border bg-success-soft text-success-foreground",
  info: "border-info-border bg-info-soft text-info-foreground",
};

const DESCRICAO: Record<AlertVariant, string> = {
  default: "text-muted-foreground",
  destructive: "text-danger-foreground",
  warning: "text-warning-foreground",
  success: "text-success-foreground",
  info: "text-info-foreground",
};

const ICONE: Record<
  AlertVariant,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>
> = {
  default: Info,
  destructive: CircleAlert,
  warning: TriangleAlert,
  success: CircleCheck,
  info: Info,
};

export interface AlertProps extends Omit<React.ComponentProps<"div">, "title"> {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** A ação única do aviso (um botão `xs`/`sm`, ou um link). */
  action?: React.ReactNode;
  /** Troca o ícone da variante; `null` tira o ícone. */
  icon?: React.ReactNode | null;
}

function Alert({
  variant = "default",
  title,
  children,
  action,
  icon,
  className,
  role,
  ...props
}: AlertProps) {
  const IconePadrao = ICONE[variant];
  const icone = icon === undefined ? <IconePadrao aria-hidden="true" /> : icon;
  const temIcone = icone !== null && icone !== false;

  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={role ?? (variant === "destructive" || variant === "warning" ? "alert" : "status")}
      className={cn(
        "@container/alert relative w-full rounded-lg border px-2.5 py-2 text-left text-sm",
        SUPERFICIE[variant],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "grid items-start gap-x-2",
          temIcone ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]",
        )}
      >
        {temIcone ? (
          <span
            data-slot="alert-icon"
            className="flex h-5 items-center [&_svg]:size-4 [&_svg]:shrink-0"
          >
            {icone}
          </span>
        ) : null}
        <div className="min-w-0">
          {title ? (
            <div data-slot="alert-title" className="leading-5 font-medium">
              {title}
            </div>
          ) : null}
          {children ? (
            <div
              data-slot="alert-description"
              className={cn(
                "leading-5 text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-2",
                title ? "mt-0.5" : null,
                DESCRICAO[variant],
              )}
            >
              {children}
            </div>
          ) : null}
        </div>
        {action ? (
          <div
            data-slot="alert-action"
            className={cn(
              "mt-2 flex flex-wrap items-center gap-2",
              temIcone ? "col-start-2" : "col-start-1",
              "@min-[28rem]/alert:row-start-1 @min-[28rem]/alert:mt-0 @min-[28rem]/alert:ml-2 @min-[28rem]/alert:justify-self-end",
              temIcone ? "@min-[28rem]/alert:col-start-3" : "@min-[28rem]/alert:col-start-2",
            )}
          >
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { Alert };
export type { AlertVariant };
