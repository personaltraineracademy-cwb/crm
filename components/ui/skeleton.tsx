import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * O esqueleto de carregamento (Unnify DS §10.20, §7.2, §7.3).
 *
 * Raio 8 (`rounded-lg`), gradiente `skeleton-base` → `skeleton-highlight` →
 * `skeleton-base` em 200% de largura varrendo em 1,6s `ease-in-out`. Com
 * movimento reduzido vira bloco ESTÁTICO na cor `skeleton-base`. Ele tem a
 * FORMA FINAL do conteúdo (mesma altura e largura), para a tela não saltar.
 *
 * ─── Como, sem CSS novo ─────────────────────────────────────────────────────
 * O mecanismo continua o `.ds-esqueleto` do `app/globals.css` (o `@keyframes`
 * e o gradiente de 200%) e o bloco estático do `app/unnify/base.css`. Aqui só
 * trocamos as CORES que ele lê (`--ds-esqueleto-corpo` e `--ds-esqueleto-brilho`)
 * pelas do Unnify. Em `style`, e não em classe: a regra `.ds-esqueleto` está
 * fora de camada e venceria qualquer utilitário do Tailwind.
 *
 * ─── Contraste ─────────────────────────────────────────────────────────────
 * O `skeleton-base` do Unnify (#eceff4) dava 1,15:1 sobre o cartão claro e
 * 1,04:1 sobre a página: o esqueleto sumia (`docs/unnify/pendencias-etapa-3.md`
 * §4, decisão S2). O token foi movido na própria rampa neutra
 * (`app/unnify/tokens.css`) para ficar entre 1,4:1 e 1,6:1 contra o cartão E
 * contra a página, nos dois temas: claro #c8cfd9 (1,57 no cartão, 1,41 na
 * página), escuro #383d46 (1,39 no cartão, 1,60 na página). Mais que isso
 * pesaria como conteúdo; o CRM usava `neutral-400` (2,1:1).
 *
 * `data-esqueleto` é a âncora de teste (classe é implementação e muda; "isto é
 * um esqueleto" é contrato). Vários testes a usam: não remova.
 */
function Skeleton({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      data-esqueleto
      className={cn("ds-esqueleto rounded-lg", className)}
      style={
        {
          "--ds-esqueleto-corpo": "var(--skeleton-base)",
          "--ds-esqueleto-brilho": "var(--skeleton-highlight)",
          animationTimingFunction: "ease-in-out",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Skeleton };
