import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Classes do campo do Unnify (DESIGN-SYSTEM.md §10.2, §9.1), repartidas com a
 * `Textarea` e com o gatilho do `Select`, que o DS manda ser "idêntico ao campo".
 *
 * - Repouso: fundo `card`, borda 1px `input` (3:1), raio 8.
 * - Hover: borda `interactive-border`.
 * - Foco: borda `ring` + anel 2px com afastamento de 2px (§9.2).
 * - Inválido (`aria-invalid`): borda destrutiva + anel de 4px a 20%. Com foco, o
 *   anel volta a 2px na cor destrutiva cheia: o de 20% sozinho não é indicador
 *   de foco visível (§9.2, "nunca remova o foco").
 * - Desabilitado: `opacity .5` e fundo `input/50` (Work).
 *
 * `text-base md:text-sm` é conserto de COMPORTAMENTO: o Safari do iPhone dá zoom
 * na página quando um campo recebe foco com fonte menor que 16px, e sair do
 * campo não desfaz o salto. O outro caminho (`maximum-scale=1` no viewport)
 * proíbe qualquer zoom, inclusive o de quem precisa ampliar para ler. A partir
 * de `md` não há zoom de foco, e a interface volta aos 14px. O DS manda o mesmo.
 *
 * `pointer-coarse:min-h-11 max-sm:min-h-11` — 44px onde o dedo aciona (§5.2).
 * `min-h` em vez de trocar o `h-9`: o campo que o chamador dimensionou à mão
 * (`h-8` na barra de filtros, por exemplo) continua com a medida dele no mouse.
 */
export const CAMPO_BASE = [
  "w-full min-w-0 rounded-lg border border-input bg-card text-foreground",
  "text-base md:text-sm placeholder:text-muted-foreground",
  "transition-[background-color,border-color,box-shadow] duration-fast ease-out",
  "hover:border-interactive-border",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden",
  "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:disabled:bg-input/80",
  "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
  "aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-destructive",
].join(" ");

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          CAMPO_BASE,
          "flex h-9 px-3 py-1.5 max-sm:min-h-11 pointer-coarse:min-h-11",
          // Botão interno de arquivo: 24 de altura, sem borda, `sm`/500.
          "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
