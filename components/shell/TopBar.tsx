"use client";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { useMarcaDaInstalacao } from "@/lib/branding/contexto";
import { CaretDoubleLeft, CaretDoubleRight } from "@/lib/ui/icons";
import { AlertsBell } from "./AlertsBell";
import { AvisoDePropostaEmDestaque } from "./AvisoDePropostaEmDestaque";
import { MobileSidebar } from "./MobileSidebar";
import { SearchTrigger } from "./SearchTrigger";
import { SeletorDeIdioma } from "./SeletorDeIdioma";
import { TenantSwitcher } from "./TenantSwitcher";
import { UserMenu } from "./UserMenu";
import { tituloDaRota } from "./titulo-da-rota";

interface TopBarProps {
  /** A barra lateral está recolhida (o cookie `sidebar_collapsed`). */
  barraRecolhida?: boolean;
  /**
   * Recolhe ou abre a barra lateral. Ausente, o botão não aparece — quem monta
   * a barra de cima sem barra lateral não ganha um controle que não controla
   * nada.
   */
  aoAlternarBarra?: () => void;
  /** A troca está a caminho do servidor: o botão espera, não empilha cliques. */
  alternando?: boolean;
}

/**
 * A BARRA DE CIMA (DS §5.5 e §5.6): 56px, linha de base de 1px, fundo
 * `background` a 92% (`.casca-barra-superior`), camada 30.
 *
 * De 1024px para cima, como no Unnify: à esquerda o botão de recolher/abrir a
 * barra lateral, no centro a busca-comando (36 × até 576) e à direita tema,
 * idioma, sino e organização. A conta está no rodapé da barra lateral.
 *
 * Abaixo de 1024 a barra lateral sai de cena: à esquerda o hambúrguer da gaveta
 * e o TÍTULO da tela; a busca vira a lupa; e a conta volta ao topo como avatar.
 * Abaixo de 640 tema e idioma saem do topo (o título não caberia ao lado deles)
 * e ficam no menu da conta.
 *
 * O que o Unnify não prevê e foi adaptado: o idioma ao lado do tema (é
 * aparência, como ele, e precisa ser achado por quem não lê o idioma em vigor);
 * o sino e o seletor de organização à direita, no lugar dos convites do Work.
 */
export function TopBar({
  barraRecolhida = false,
  aoAlternarBarra,
  alternando = false,
}: TopBarProps) {
  const t = useT();
  const pathname = usePathname();
  const { activeOrg } = useAuth();
  const marca = useMarcaDaInstalacao();
  const rota = tituloDaRota(pathname ?? "");
  const titulo = rota ? t(rota.label) : (activeOrg?.marca?.nome ?? marca.name);

  return (
    <header className="casca-barra-superior sticky top-[var(--faixas-de-cima,0px)] z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border px-(--pta-gutter)">
      <div className="flex min-w-0 flex-1 items-center gap-1 lg:basis-0">
        <MobileSidebar />
        {aoAlternarBarra && (
          <BotaoDeRecolher
            recolhida={barraRecolhida}
            alternando={alternando}
            onClick={aoAlternarBarra}
          />
        )}
        {/* Título, e não cabeçalho: a página tem o próprio `h1`, e dois `h1`
            por tela confundem quem navega por títulos. */}
        <p className="min-w-0 truncate pl-1 text-base font-semibold lg:hidden" title={titulo}>
          {titulo}
        </p>
      </div>
      <div className="flex shrink-0 justify-center lg:min-w-0 lg:flex-[2] lg:shrink">
        <SearchTrigger />
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1 lg:flex-1 lg:basis-0">
        <ThemeToggle className="hidden sm:inline-flex" />
        <SeletorDeIdioma className="hidden sm:inline-flex" />
        <AlertsBell />
        <AvisoDePropostaEmDestaque />
        <TenantSwitcher />
        <UserMenu className="lg:hidden" />
      </div>
    </header>
  );
}

/**
 * Recolher/abrir a barra lateral, à ESQUERDA da barra de cima (DS §5.6) — saiu
 * da linha da logo, onde a #2722 o tinha posto. Só de 1024px para cima: abaixo
 * disso não há barra lateral para recolher, e o lugar é do hambúrguer.
 *
 * Botão só com ícone: nome em `aria-label` e a dica INSTANTÂNEA do DS (§8).
 */
function BotaoDeRecolher({
  recolhida,
  alternando,
  onClick,
}: {
  recolhida: boolean;
  alternando: boolean;
  onClick: () => void;
}) {
  const t = useT();
  const rotulo = recolhida ? t("Expandir sidebar") : t("Recolher sidebar");
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={alternando}
            aria-label={rotulo}
            aria-expanded={!recolhida}
            className="hidden shrink-0 text-muted-foreground lg:inline-flex"
          >
            {recolhida ? (
              <CaretDoubleRight size={16} aria-hidden />
            ) : (
              <CaretDoubleLeft size={16} aria-hidden />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {rotulo}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
