import type { ReactNode } from "react";

import { CaretDown } from "@/lib/ui/icons";

/**
 * O recolhido do formulário do agente: o que quase ninguém muda fica atrás de
 * um clique, com uma frase dizendo o que há lá dentro.
 *
 * Divulgação progressiva (docs/research/2026-11-adaptacao-fitness/03-ux.md): a
 * tela pedia 45 respostas de uma vez. Os campos daqui continuam MONTADOS —
 * `<details>` fechado esconde, não desmonta —, então o valor de cada um segue
 * no estado do formulário e é salvo igual. Nada do que se grava mudou.
 *
 * `<details>` nativo de propósito: abre por teclado, o leitor de tela anuncia o
 * estado, e a busca do navegador (Ctrl+F) abre o bloco sozinha quando acha o
 * texto procurado lá dentro.
 */
export function AjustesAvancados({
  titulo,
  resumo,
  children,
}: {
  titulo: string;
  /** O que há lá dentro, em uma linha — o rótulo tem de dizer o que guarda. */
  resumo: string;
  children: ReactNode;
}) {
  return (
    <details className="group/ajustes rounded-xl border border-border" data-testid="ajustes-avancados">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-medium">{titulo}</span>
          <span className="block text-xs text-muted-foreground">{resumo}</span>
        </span>
        <CaretDown
          size={16}
          aria-hidden
          className="shrink-0 transition-transform duration-fast group-open/ajustes:rotate-180"
        />
      </summary>
      <div className="space-y-4 border-t border-border p-3">{children}</div>
    </details>
  );
}
