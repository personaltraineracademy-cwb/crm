"use client";
import { useTransition, type ReactNode } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/auth/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTrocaDeIdioma } from "@/components/shell/SeletorDeIdioma";
import { useT } from "@/hooks/i18n/useT";
import { IDIOMAS_VISIVEIS } from "@/lib/i18n/registro";
import type { Idioma } from "@/lib/i18n/idiomas";
import { useTheme, type Theme } from "@/lib/theme";
import { SignOut, ShieldCheck } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

/**
 * A CONTA (DS §5.6, "Conta (rodapé)").
 *
 * No Unnify a conta mora no RODAPÉ da barra lateral: botão de 44, raio 12,
 * avatar de 36 com anel de 1px, e o hover em `primary/10` com texto `primary`.
 * É o `ContaNaBarraLateral`, a partir de 1024px.
 *
 * Abaixo de 1024 a barra lateral não está na tela, e a conta volta ao topo como
 * o avatar de sempre (`UserMenu`). As duas abrem o MESMO menu
 * (`ConteudoDaConta`), com o mesmo nome acessível — "Menu do usuário" — que as
 * specs de celular e de computador procuram.
 *
 * Tema e idioma ENTRAM no menu: no celular estreito (< 640px) o topo tem o
 * título da tela e não comporta os dois botões ao lado dele. Acima disso eles
 * continuam no topo também; o menu é o caminho que funciona em toda largura.
 */

/**
 * As iniciais do avatar. Tolera conta sem e-mail: a barra lateral é desenhada
 * em testes com uma conta parcial, e uma conta sem nome nem e-mail não pode
 * derrubar a casca inteira.
 */
export function iniciais(
  nome: string | null | undefined,
  email: string | null | undefined,
): string {
  if (nome && nome.trim()) {
    return nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }
  return (email ?? "").slice(0, 2).toUpperCase() || "?";
}

function AvatarDaConta({ className }: { className?: string }) {
  const { user } = useAuth();
  return (
    <Avatar className={cn("ring-1 ring-border", className)}>
      {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
      <AvatarFallback className="text-xs font-medium">
        {iniciais(user?.full_name, user?.email)}
      </AvatarFallback>
    </Avatar>
  );
}

/** O avatar do TOPO, abaixo de 1024px. */
export function UserMenu({ className }: { className?: string }) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("Menu do usuário")}
          className={cn(
            "hover:bg-interactive inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors lg:size-9",
            className,
          )}
        >
          <AvatarDaConta className="size-8" />
        </button>
      </DropdownMenuTrigger>
      <ConteudoDaConta align="end" />
    </DropdownMenu>
  );
}

/**
 * O botão de conta do RODAPÉ da barra lateral. Aberta: avatar de 36 + nome e
 * e-mail. Recolhida: só o avatar, com a dica instantânea à direita (o nome
 * escrito não cabe em 64px).
 */
export function ContaNaBarraLateral({ recolhida }: { recolhida: boolean }) {
  const t = useT();
  const { user } = useAuth();
  const nome = user?.full_name?.trim() || user?.email || "";

  return (
    <DropdownMenu>
      <DicaSeRecolhida recolhida={recolhida} rotulo={nome}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("Menu do usuário")}
            className={cn(
              "text-sidebar-foreground flex h-11 w-full min-w-0 items-center gap-3 rounded-xl px-1 text-left text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
              recolhida && "justify-center px-0",
            )}
          >
            <AvatarDaConta className="size-9" />
            {!recolhida && (
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate">{nome}</span>
                {user?.full_name && user?.email ? (
                  <span className="text-sidebar-muted truncate text-xs font-normal">
                    {user.email}
                  </span>
                ) : null}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
      </DicaSeRecolhida>
      <ConteudoDaConta align="start" side={recolhida ? "right" : "top"} />
    </DropdownMenu>
  );
}

/** Recolhida, a dica instantânea à direita (o `TooltipProvider` é da barra). */
function DicaSeRecolhida({
  recolhida,
  rotulo,
  children,
}: {
  recolhida: boolean;
  rotulo: string;
  children: ReactNode;
}) {
  if (!recolhida) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {rotulo}
      </TooltipContent>
    </Tooltip>
  );
}

function ConteudoDaConta({
  align,
  side,
}: {
  align: "start" | "end";
  side?: "top" | "right" | "bottom";
}) {
  const t = useT();
  const { user, signOut } = useAuth();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenuContent align={align} side={side} className="min-w-[240px]">
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <span className="truncate text-sm font-medium">{user.full_name ?? user.email}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {/*
        A PORTA DO MODO ADMINISTRADOR.

        Até aqui só se chegava ao painel da instalação digitando /admin na
        barra de endereços, ou por um item chamado "Gerenciar organizações"
        escondido no seletor de organização — que leva a UMA tela do painel e
        não anuncia que existe um painel.

        Ela não entra em `lib/navigation/registry.ts` de propósito: aquele
        registro descreve a navegação do TENANT (`app/app/**`), e o teste de
        completude varre só aquela raiz — uma entrada para /admin reprovaria
        o CI como link morto. Além disso o registro não sabe expressar "só o
        dono do servidor": o campo `platform` que existe lá é um atalho que
        ABRE tudo para quem é dono, não um cadeado que restringe aos outros.
        Mesmo precedente de `VersionFooter`: porta bespoke, gate próprio.

        O rótulo diz MODO, não "admin": para quem instalou o sistema, o que
        ele quer não é "uma área chamada admin", é "ir para onde eu mexo no
        servidor" — e o subtítulo diz de que servidor se trata.
      */}
      {user.is_platform_admin && (
        <>
          <DropdownMenuItem asChild>
            <Link href="/admin" data-testid="porta-modo-administrador">
              <ShieldCheck size={16} aria-hidden />
              <span className="flex flex-col">
                <span>{t("Modo administrador")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("Configurar este servidor")}
                </span>
              </span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <PreferenciasDaConta />
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await signOut();
          })
        }
      >
        <SignOut size={16} aria-hidden />
        {t("Sair")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

/**
 * Tema e idioma como escolha de rádio. Só existe com o menu ABERTO (o conteúdo
 * do Radix não é montado fechado) — e é por isso que `useTheme()`, que lança
 * fora do provedor, não alcança os testes que desenham a barra lateral sozinha.
 */
function PreferenciasDaConta() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const { idioma, salvando, escolher } = useTrocaDeIdioma();
  const temas: Array<{ valor: Theme; rotulo: string }> = [
    { valor: "light", rotulo: t("Claro") },
    { valor: "dark", rotulo: t("Escuro") },
    { valor: "system", rotulo: t("Sistema") },
  ];
  return (
    <>
      <Grupo rotulo={t("Tema")}>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          {temas.map(({ valor, rotulo }) => (
            <DropdownMenuRadioItem key={valor} value={valor} onSelect={(e) => e.preventDefault()}>
              {rotulo}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </Grupo>
      <DropdownMenuSeparator />
      <Grupo rotulo={t("Idioma")}>
        <DropdownMenuRadioGroup value={idioma} onValueChange={(v) => escolher(v as Idioma)}>
          {IDIOMAS_VISIVEIS.map(({ codigo, nomeNativo }) => (
            <DropdownMenuRadioItem
              key={codigo}
              value={codigo}
              disabled={salvando}
              data-testid={`conta-idioma-${codigo}`}
            >
              {nomeNativo}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </Grupo>
    </>
  );
}

function Grupo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <>
      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
        {rotulo}
      </DropdownMenuLabel>
      {children}
    </>
  );
}
