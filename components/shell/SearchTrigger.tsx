"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { MagnifyingGlass } from "@/lib/ui/icons";
import { useT } from "@/hooks/i18n/useT";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { EVENTO_ABRIR_BUSCA, atalhoDaBusca } from "@/components/shell/busca-global";

/**
 * A BUSCA-COMANDO DA BARRA DE CIMA (DS §5.6 e §10.18).
 *
 * De 1024px para cima é um CAMPO: altura 36, largura até 576, lupa de 17 à
 * esquerda e o atalho em `kbd` à direita (`xs`, borda de 1px, raio 4). Clicar
 * abre a paleta, que é quem busca de verdade.
 *
 * Abaixo de 1024 o centro da barra é do título da tela, e a busca encolhe para
 * o botão só com a lupa, de 44 — o mesmo botão, para não haver duas paletas. O
 * rótulo fica `sr-only` (e não `hidden`) para o botão continuar com nome no
 * leitor de tela.
 *
 * O atalho escrito é o do sistema da pessoa: "Ctrl K" no Windows e no Linux,
 * "⌘K" no Mac. Antes era sempre "⌘K", o que mandava metade de quem usa o
 * produto procurar uma tecla que não tem.
 */
const semAssinatura = () => () => {};

export function SearchTrigger() {
  const t = useT();
  const [open, setOpen] = useState(false);
  // "Ctrl K" no servidor e na hidratação; o do sistema no navegador. O sistema
  // não muda com a página aberta, então não há o que assinar.
  const atalho = useSyncExternalStore(semAssinatura, atalhoDaBusca, () => "Ctrl K");

  // `enableOnFormTags`: o atalho precisa funcionar com o cursor dentro do
  // composer do inbox, que é onde o operador passa o dia.
  useHotkeys("mod+k", () => setOpen(true), { preventDefault: true, enableOnFormTags: true });

  // O campo de busca da gaveta do celular pede a MESMA paleta por evento
  // (`components/shell/busca-global.ts`).
  useEffect(() => {
    const abrir = () => setOpen(true);
    window.addEventListener(EVENTO_ABRIR_BUSCA, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_BUSCA, abrir);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          "inline-flex shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[color,background-color,border-color] duration-fast " +
          // Abaixo de 1024: só a lupa, alvo de 44.
          "hover:bg-interactive hover:text-interactive-foreground size-11 " +
          // De 1024 para cima: o campo de 36 × até 576.
          "lg:hover:border-interactive-border lg:h-9 lg:w-full lg:max-w-[576px] lg:justify-start lg:gap-2 lg:border lg:border-input lg:bg-card lg:px-3 lg:text-sm lg:hover:bg-card lg:hover:text-muted-foreground"
        }
      >
        <MagnifyingGlass size={17} aria-hidden className="shrink-0" />
        <span className="truncate max-lg:sr-only">{t("Buscar...")}</span>
        <kbd className="ml-auto hidden rounded-sm border border-border bg-muted px-1.5 font-sans text-xs leading-5 text-muted-foreground lg:inline">
          {atalho}
        </kbd>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
