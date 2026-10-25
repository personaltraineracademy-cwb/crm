import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Cartão — a ÚNICA superfície de conteúdo (Unnify DS §10.9, §6.3).
 *
 * Raio 12 (`rounded-xl` na escala do Unnify), borda de 1px, fundo `card`,
 * SEM sombra. Nunca aninhe um cartão dentro de outro: para agrupar itens
 * dentro dele use `bg-muted/40 rounded-lg`.
 *
 * ─── Dois jeitos de usar, e por que o padding mora nas partes ──────────────
 *
 * 1. Composto: `CardHeader` → `CardContent` → `CardFooter`. Cada parte traz o
 *    respiro de 16 (celular) / 20 (a partir de `sm`), e o resultado é o do
 *    Unnify: 20 em volta, 20 entre cabeçalho e conteúdo, rodapé `muted/30`
 *    com borda superior.
 * 2. Caixa simples: `<Card className="p-4 space-y-3">`. É o uso de mais da
 *    metade dos 169 importadores. Por isso a raiz NÃO tem padding, `flex` nem
 *    `gap`: com eles, o `space-y-*` do chamador somaria ao `gap` e o `sm:py-5`
 *    venceria o `p-4` dele a partir de 640px.
 *
 * O cabeçalho só vira container (e só ganha a coluna de ação a partir de
 * 420px do próprio cabeçalho) quando tem `CardAction`. Container de tamanho
 * impõe contenção de largura: aplicado a todo cabeçalho, um cartão que mede o
 * próprio conteúdo deixaria de contar a largura do título.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card text-sm text-card-foreground",
        "*:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid min-w-0 auto-rows-min grid-cols-[minmax(0,1fr)] items-start gap-x-4 gap-y-1 p-4 sm:p-5",
        "has-data-[slot=card-action]:@container/card-header",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-6 font-semibold break-words text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Ação do cabeçalho (um botão, um menu). Abaixo de 420px do cabeçalho ela
 * desce para baixo do título; a partir daí ocupa a coluna da direita, na
 * altura do título e da descrição.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "mt-2 flex max-w-full min-w-0 flex-wrap gap-2 justify-self-start",
        "@min-[420px]/card-header:col-start-2 @min-[420px]/card-header:row-span-2 @min-[420px]/card-header:row-start-1 @min-[420px]/card-header:mt-0 @min-[420px]/card-header:justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Conteúdo. Depois do cabeçalho, o respiro de cima vem do próprio cabeçalho;
 * sozinho no cartão (primeiro filho), ganha o de cima também.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("min-w-0 px-4 pb-4 first:pt-4 sm:px-5 sm:pb-5 sm:first:pt-5", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-b-xl border-t border-border bg-muted/30 px-4 py-3 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
