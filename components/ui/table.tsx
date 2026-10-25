import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Tabela (Unnify DS §10.12, §11.4; canônico = a do Pulse, alinhada ao contrato).
 *
 * - Contêiner com rolagem horizontal PRÓPRIA: a tabela larga rola dentro dele,
 *   nunca a página. Dê `min-w-*` à tabela e às colunas que não podem encolher.
 * - Cabeçalho `muted/40` com borda inferior; células `xs`/500 muted, 48 de altura.
 * - Linha de 48, hover `muted/40`, selecionada (`data-state="selected"`) no
 *   azul suave (`interactive`); a última sem borda.
 * - Célula 16 × 12, centralizada na vertical. Números tabulares na tabela toda:
 *   alinhe os numéricos à direita (`text-right`) e escreva "—" no vazio.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full min-w-0 overflow-auto overscroll-x-contain"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm text-foreground tabular-nums", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("border-b border-border bg-muted/40 [&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-border bg-muted/40 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "data-[state=selected]:bg-interactive h-12 border-b border-border transition-colors duration-fast hover:bg-muted/40 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 py-3 text-left align-middle text-xs leading-5 font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
