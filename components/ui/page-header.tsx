import type * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cabeçalho de página (Unnify DS §10.10, §11.1, §11.7).
 *
 * Uma única hierarquia: título e descrição à esquerda, ações à direita e, abaixo,
 * as abas da página (`children`, normalmente `<TabsList variant="line">`). A
 * estrutura vem do espaçamento e de uma linha, não de caixa em volta.
 *
 * - Título: `h1` `2xl`/600 `tracking-tight` (no `card`, `xl`). Selo ao lado.
 * - Descrição: `sm` muted, 4px abaixo. Diga só o que o usuário pode agir.
 * - Metadados (`meta`): `xs` muted, 8px abaixo, itens a 12px.
 * - Ações: `flex-wrap gap-2`, à direita a partir de `sm`. Controles em `sm` (32).
 * - `back`: link de volta `xs`/500 muted, 4px acima do título (detalhe de item).
 * - `plain` (padrão): direto sobre o fundo. `card`: borda, `card`, raio 12,
 *   padding 16/20, para um contexto interno (ex.: uma campanha salva); as abas
 *   ficam atrás de uma borda superior.
 *
 * Sem sobretítulo (o contrato do Work não usa: o nome da área já está na barra
 * lateral).
 */
export interface PageHeaderProps extends Omit<React.ComponentProps<"header">, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  back?: { href: string; label: string };
  variant?: "plain" | "card";
  /** Nível do título. `h1` na página; `h2`/`h3` quando o cabeçalho é de uma seção. */
  headingAs?: "h1" | "h2" | "h3";
  /** Abas da página, abaixo do cabeçalho. */
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  badge,
  back,
  variant = "plain",
  headingAs = "h1",
  children,
  className,
  ...props
}: PageHeaderProps) {
  const Titulo = headingAs;
  const emCartao = variant === "card";

  return (
    <header
      data-slot="page-header"
      data-variant={variant}
      className={cn(
        "min-w-0",
        emCartao && "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
          emCartao ? "p-4 sm:p-5" : "pb-1",
        )}
      >
        <div className="min-w-0 flex-1">
          {back ? (
            <Link
              href={back.href}
              data-slot="page-header-back"
              className="mb-1 -ml-0.5 inline-flex items-center gap-0.5 rounded-md text-xs leading-4 font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground pointer-coarse:min-h-11"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              {back.label}
            </Link>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Titulo
              className={cn(
                "min-w-0 font-semibold tracking-tight text-balance [overflow-wrap:anywhere] text-foreground",
                headingAs === "h1" && (emCartao ? "text-xl leading-7" : "text-2xl leading-8"),
                headingAs === "h2" && "text-lg leading-7",
                headingAs === "h3" && "text-base leading-6",
              )}
            >
              {title}
            </Titulo>
            {badge}
          </div>
          {description ? (
            <div
              data-slot="page-header-description"
              className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground"
            >
              {description}
            </div>
          ) : null}
          {meta ? (
            <div
              data-slot="page-header-meta"
              className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-muted-foreground"
            >
              {meta}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div
            data-slot="page-header-actions"
            className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:justify-end"
          >
            {actions}
          </div>
        ) : null}
      </div>

      {children ? (
        <div
          data-slot="page-header-tabs"
          className={cn(
            "min-w-0",
            emCartao
              ? "border-t border-border px-4 sm:px-5 [&_[data-slot=tabs-list][data-variant=line]]:border-b-0"
              : "mt-4",
          )}
        >
          {children}
        </div>
      ) : null}
    </header>
  );
}
