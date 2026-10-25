"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/**
 * Abas (Unnify DS §10.7). Duas formas, e só duas:
 *
 * - `segmented` (padrão, para não mudar nenhuma tela que já usa `TabsList`):
 *   alternância de visão DENTRO de um cartão. Trilho `muted` raio 8, padding 2,
 *   gap 2; aba de 32, raio 6, padding 12; ativa em `card` com `shadow-xs`.
 * - `line`: navegação da PÁGINA (um nível por página, DS §1.2). Borda inferior
 *   de 1px, abas de 40, padding 12, `sm`/500 muted; a ativa fica `foreground`
 *   com sublinhado de 2px `primary` (inset 12, ponta arredondada) que cresce
 *   com `scaleX`. Sem caixa.
 *
 * Nível abaixo da navegação da página é `SegmentedControl` ou `segmented`,
 * nunca um segundo `line`.
 *
 * As duas rolam na horizontal sem barra visível e esmaecem a borda do lado
 * em que ainda há aba escondida (Work: `pta-scroll-fade-x`). Aqui o
 * esmaecimento é medido em JS (rolagem + tamanho) e só liga o lado que tem
 * conteúdo: sem rolagem, nada esmaece.
 *
 * ─── Alvo de toque ──────────────────────────────────────────────────────────
 * Abaixo de `lg` a aba tem 44px (`min-h-11`), o mesmo corte de
 * `components/ui/button.tsx`. A fila segmentada é `h-9` no computador e
 * `max-lg:h-auto` abaixo, porque `overflow-x-auto` força `overflow-y` a rolar
 * e uma fila de 36px cortaria a aba de 44 (vigiado em
 * `tests/unit/toque-nos-primitivos.test.ts`). Não é `h-auto lg:h-9`: quem já
 * passa `h-auto` perderia o dele no computador pelo `tailwind-merge`.
 */
type TabsVariant = "segmented" | "line";

const TabsVariantContext = React.createContext<TabsVariant>("segmented");

const Tabs = TabsPrimitive.Root;

/** Liga `data-esmaece-inicio`/`data-esmaece-fim` conforme há conteúdo escondido de cada lado. */
function useEsmaecimentoHorizontal<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const medir = () => {
      const max = el.scrollWidth - el.clientWidth;
      const inicio = max > 1 && el.scrollLeft > 1;
      const fim = max > 1 && el.scrollLeft < max - 1;
      el.toggleAttribute("data-esmaece-inicio", inicio);
      el.toggleAttribute("data-esmaece-fim", fim);
    };

    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    if (observador) {
      observador.observe(el);
      for (const filho of Array.from(el.children)) observador.observe(filho);
    }
    return () => {
      el.removeEventListener("scroll", medir);
      observador?.disconnect();
    };
  }, []);

  return ref;
}

function juntarRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (valor: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(valor);
      else if (r) (r as React.RefObject<T | null>).current = valor;
    }
  };
}

/**
 * Máscara do esmaecimento: 32px do lado ligado, 0 do outro. Com 0, a parada
 * transparente e a preta coincidem na borda e o lado fica nítido.
 */
const ESMAECIMENTO =
  "[--esmaece-ini:0px] [--esmaece-fim:0px] data-esmaece-inicio:[--esmaece-ini:32px] data-esmaece-fim:[--esmaece-fim:32px] [mask-image:linear-gradient(to_right,transparent,black_var(--esmaece-ini),black_calc(100%_-_var(--esmaece-fim)),transparent)]";

function TabsList({
  className,
  variant = "segmented",
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  const esmaecimento = useEsmaecimentoHorizontal<HTMLDivElement>();

  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        ref={juntarRefs(ref, esmaecimento)}
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(
          "inline-flex max-w-full shrink-0 items-center justify-start overflow-x-auto overscroll-x-contain text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          ESMAECIMENTO,
          variant === "segmented" && "h-9 gap-0.5 rounded-lg bg-muted p-0.5 max-lg:h-auto",
          variant === "line" && "w-full gap-1 border-b border-border",
          className,
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 text-sm leading-5 font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 lg:min-h-0",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        variant === "segmented" &&
          "h-8 rounded-md px-3 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs dark:data-[state=active]:bg-neutral-600",
        variant === "line" &&
          "h-10 rounded-t-md px-3 after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-150 data-[state=active]:text-foreground data-[state=active]:after:scale-x-100 motion-reduce:after:transition-none",
        className,
      )}
      {...props}
    />
  );
}

/** Painel: 24px abaixo da fila de abas (DS §10.7). */
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "mt-6 min-w-0 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { TabsVariant };
