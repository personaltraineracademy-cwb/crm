"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { DotsThree } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Cartão de registro: o padrão único dos cartões de LISTA do CRM (fluxos,
 * agentes, automações, modelos, campanhas).
 *
 * ─── O que o padrão garante ────────────────────────────────────────────────
 * - O cartão INTEIRO abre o item (link esticado no título, `after:inset-0`),
 *   com hover de borda + fundo e anel de foco visível no cartão.
 * - Título em até 2 linhas (`line-clamp-2`), sem corte quando há espaço. O selo
 *   de estado NÃO disputa a linha do título: vai na linha dos metadados.
 * - Metadados numa linha discreta, na fonte do sistema, em tom secundário,
 *   separados por «·». Nada de grade rótulo/valor nem fonte monoespaçada.
 * - Ações: no máximo UMA visível (`acao`) e o resto no menu «⋯» (`menu`, com
 *   `MenuDoCartao`). Os botões nunca quebram linha.
 * - Espaço só da escala do guia: 16 de respiro, 8 entre linhas relacionadas.
 *
 * `acao` e `menu` ficam em `relative z-10`, acima do link esticado: clicar
 * neles não abre o item.
 */
export interface CartaoDeRegistroProps {
  /** Para onde o cartão inteiro leva. Sem `href`, use `aoAbrir` (abre um painel, não navega). */
  href?: string;
  /** O cartão inteiro como botão: para quem abre um painel ou diálogo em vez de navegar. */
  aoAbrir?: () => void;
  titulo: string;
  /** Chip de estado (`ChipDeEstado`), na linha dos metadados. */
  selo?: React.ReactNode;
  /** Até 2 linhas, em tom secundário. */
  descricao?: string | null;
  /** Cada item vira um trecho da linha; os vazios (`null`, `false`) saem. */
  meta?: React.ReactNode[];
  /** A única ação visível, quando faz sentido (um `Button size="sm"`). */
  acao?: React.ReactNode;
  /** O menu «⋯» (`MenuDoCartao`). */
  menu?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const CLASSES_DO_TITULO =
  "line-clamp-2 break-words outline-hidden after:absolute after:inset-0 after:content-['']";

export function CartaoDeRegistro({
  href,
  aoAbrir,
  titulo,
  selo,
  descricao,
  meta,
  acao,
  menu,
  className,
  "data-testid": testId,
}: CartaoDeRegistroProps) {
  const trechos = (meta ?? []).filter(
    (m) => m !== null && m !== undefined && m !== false && m !== "",
  );
  const temRodape = Boolean(acao);

  return (
    <Card
      data-slot="cartao-de-registro"
      data-testid={testId}
      className={cn(
        "relative flex h-full flex-col gap-2 p-4",
        "transition-[border-color,background-color] duration-fast ease-out",
        "hover:border-interactive-border hover:bg-surface-hover",
        "has-[a:focus-visible,h3_button:focus-visible]:ring-2 has-[a:focus-visible,h3_button:focus-visible]:ring-ring has-[a:focus-visible,h3_button:focus-visible]:ring-offset-2 has-[a:focus-visible,h3_button:focus-visible]:ring-offset-background",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-base leading-6 font-medium text-card-foreground">
          {href ? (
            <Link href={href} title={titulo} className={CLASSES_DO_TITULO}>
              {titulo}
            </Link>
          ) : (
            <button
              type="button"
              title={titulo}
              onClick={aoAbrir}
              className="block w-full cursor-pointer text-left outline-hidden after:absolute after:inset-0 after:content-['']"
            >
              {/* `line-clamp` não funciona no próprio <button>: o corte vai no texto. */}
              <span className="line-clamp-2 break-words">{titulo}</span>
            </button>
          )}
        </h3>
        {menu ? <div className="relative z-10 -mr-2 flex h-6 shrink-0 items-center">{menu}</div> : null}
      </div>

      {descricao ? (
        <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{descricao}</p>
      ) : null}

      {selo || trechos.length > 0 ? (
        /*
          Separador «·» que nunca fica pendurado: cada trecho leva o seu ponto À
          ESQUERDA (`before`), dentro de um recuo de 12 que a caixa externa corta
          (`overflow-hidden` + `-ml-3` na interna). Se a linha quebra, o ponto
          que cairia no começo da linha de baixo fica no recuo cortado.
        */
        <div className="mt-auto overflow-hidden pt-1 text-xs leading-5 text-muted-foreground">
          <div className="-ml-3 flex flex-wrap items-center gap-y-1">
            {selo ? <span className="pl-3">{selo}</span> : null}
            {trechos.map((trecho, i) => (
              <span
                key={i}
                className="relative pl-3 before:absolute before:left-1 before:content-['·'] empty:hidden"
              >
                {trecho}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {temRodape ? <div className="relative z-10 flex items-center gap-2 pt-2">{acao}</div> : null}
    </Card>
  );
}

/**
 * O gatilho «⋯»: fantasma e NEUTRO em todos os estados. O `ghost` do Button
 * pinta hover, aberto e pressionado com `interactive` (verde-água) e o texto em
 * `interactive-foreground`, o que no escuro deixava um quadrado colorido com os
 * pontos de outra cor. Aqui o ícone é `muted-foreground`; hover, aberto e
 * pressionado só levantam o fundo (`surface-hover`) e o ícone vai a `foreground`.
 * O foco segue o anel padrão do Button.
 */
export const CLASSES_DO_GATILHO_DO_MENU = cn(
  "text-muted-foreground",
  "hover:bg-surface-hover hover:text-foreground",
  "active:bg-surface-hover active:text-foreground",
  "aria-expanded:bg-surface-hover aria-expanded:text-foreground",
);

/**
 * Gatilho + conteúdo do menu «⋯» do cartão. Os itens são `DropdownMenuItem` do
 * `components/ui`; o destrutivo (`variant="destructive"`) vai por último, depois
 * de um `DropdownMenuSeparator`.
 *
 * Diálogos que o menu abre (renomear, excluir) ficam FORA dele, ao lado, e o
 * item só liga o estado: dentro do conteúdo do menu eles sumiriam junto com ele.
 */
export function MenuDoCartao({
  rotulo,
  disabled,
  children,
}: {
  /** Nome acessível do gatilho, ex.: «Ações de Boas-vindas». */
  rotulo: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={rotulo}
          disabled={disabled}
          className={CLASSES_DO_GATILHO_DO_MENU}
        >
          <DotsThree size={18} weight="bold" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A grade dos cartões: colunas de no mínimo 320 que se repartem a largura da
 * área (`auto-fill`), vão de 16. Um cartão sozinho não estica até a borda.
 */
export function GradeDeRegistros({
  className,
  children,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="grade-de-registros"
      className={cn("grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr))]", className)}
      {...props}
    >
      {children}
    </ul>
  );
}

/** Cartão-esqueleto com a forma final do `CartaoDeRegistro`: a tela não salta ao carregar. */
export function CartaoDeRegistroCarregando() {
  return (
    <Card
      data-slot="cartao-de-registro-carregando"
      aria-hidden
      className="flex h-full flex-col gap-2 p-4"
    >
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    </Card>
  );
}
