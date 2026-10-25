"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useT } from "@/hooks/i18n/useT";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, CaretDown, Gear, MagnifyingGlass } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/AuthProvider";
import { ConnectionHealthDot } from "@/components/connections/ConnectionHealthDot";
import { ContadorDeCasos } from "@/components/shell/ContadorDeCasos";
import { ContadorDaFila } from "@/components/shell/ContadorDaFila";
import { VersionFooter } from "@/components/shell/VersionFooter";
import { ContaNaBarraLateral } from "@/components/shell/UserMenu";
import { abrirBuscaGlobal } from "@/components/shell/busca-global";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LogotipoDoProduto, SimboloDoProduto } from "@/components/branding/MarcaDoProduto";
import { marcaEhADoProduto } from "@/lib/branding";
import { useMarcaDaInstalacao } from "@/lib/branding/contexto";
import { GRUPO_NO_RODAPE, sidebarGroups, type NavDestination } from "@/lib/navigation/registry";

const CHAVE_GRUPOS_FECHADOS = "sidebar-grupos-fechados";

interface SidebarContentProps {
  collapsed: boolean;
  /**
   * Desenhada dentro da GAVETA do celular (DS §5.6): itens de 48 em vez de 44,
   * o campo de busca no alto e sem o botão de conta — abaixo de 1024 a conta já
   * está no topo, ao lado do título.
   */
  naGaveta?: boolean;
  onNavigate?: () => void;
}

/**
 * Navegação principal, agrupada por objetivo — o desenho da barra lateral do
 * Unnify (DS §5.6 e §10.22).
 *
 * Não decide nada: `sidebarGroups()` (lib/navigation/registry.ts) resolve quais
 * grupos e destinos este papel vê, e este componente desenha. Antes, a lista de
 * itens e sete `usePermission()` viviam aqui — e divergiam do hub de
 * Configurações e das abas de IA, que mantinham suas próprias listas.
 *
 * O botão de recolher SAIU daqui: no Unnify ele mora à esquerda da barra de
 * cima (`TopBar`), e a barra lateral fica só com marca, navegação e conta.
 */
export function SidebarContent({ collapsed, naGaveta = false, onNavigate }: SidebarContentProps) {
  // A barra lateral aparece em TODA tela — traduzi-la aqui é o que faz a
  // escolha de idioma virar algo visível no primeiro clique.
  const t = useT();
  const pathname = usePathname();
  const { user, activeOrg } = useAuth();
  const todos = sidebarGroups(
    user.is_platform_admin && !user.support,
    activeOrg?.role ?? null,
    activeOrg?.interface_settings,
    activeOrg?.modulos_ligados ?? [],
    activeOrg?.capacidades_ligadas ?? [],
  );
  // Configurações sai da área que rola e vai para o rodapé fixo: medido em
  // 1280x768, ele caía fora da dobra mesmo em telas de 1080px.
  const grupos = todos.filter((g) => g.group.id !== GRUPO_NO_RODAPE);
  const rodape = todos.find((g) => g.group.id === GRUPO_NO_RODAPE)?.group.hub;

  /**
   * Grupo fechado é preferência POR NAVEGADOR, não por conta: começa vazio (tudo
   * aberto) em toda renderização — servidor, primeira pintura do cliente e nos
   * testes, que nunca clicam em nada — e só muda depois do mount, se o
   * `localStorage` tiver algo salvo. Guardar o CONJUNTO DOS FECHADOS, e não dos
   * abertos, é o que faz "sem preferência salva" já significar "tudo aberto".
   *
   * O Unnify desenha o rótulo de seção parado. Aqui ele continua sendo o botão
   * que fecha o grupo: o catálogo tem seis grupos, e com o item de 44px do
   * Unnify o menu inteiro passa da altura de um notebook — fechar o grupo que
   * não se usa é o que a pessoa tem para não rolar.
   */
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_GRUPOS_FECHADOS);
      if (salvo) setGruposFechados(new Set(JSON.parse(salvo) as string[]));
    } catch {
      // Storage bloqueado (aba privada) — fica tudo aberto, que é o padrão.
    }
  }, []);
  function toggleGrupo(id: string) {
    setGruposFechados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(CHAVE_GRUPOS_FECHADOS, JSON.stringify([...next]));
      } catch {
        // Clique continua funcionando nesta sessão; só não sobrevive a um F5.
      }
      return next;
    });
  }

  const brand = useMarcaDaInstalacao();
  /**
   * O CONSUMIDOR do nome por organização.
   *
   * Sem ele, `settings.branding.app_name` seria campo decorativo: medido, o nome
   * da org não aparece em lugar nenhum da casca para o cliente típico de um
   * revendedor — o único leitor é o `TenantSwitcher`, e ele devolve `null` com
   * uma organização só.
   *
   * A marca da INSTALAÇÃO continua embaixo: a organização que não definiu nome
   * vê exatamente o que via antes. O que mudou é POR ONDE ela chega — era
   * `branding()`, que no navegador lê `window.__PUBLIC_ENV__` e no servidor lê
   * `process.env`, e essas duas fontes passaram a divergir quando o layout raiz
   * começou a injetar a marca do BANCO. Divergência entre SSR e cliente aqui não
   * é detalhe: com logo no banco e `APP_LOGO_URL` vazio, o servidor desenhava o
   * `<span>` de baixo e o cliente desenhava o `<img>` — React #418 em toda tela.
   * Hoje a marca vem por PROP do servidor (`useMarcaDaInstalacao`), pela mesma
   * rota de `activeOrg`, e os dois lados leem o mesmo objeto por construção.
   */
  const nome = activeOrg?.marca?.nome ?? brand.name;
  /**
   * O mesmo desenho para o LOGO — e é este par de linhas que fecha o caminho do
   * `logo_url` gravado até a tela.
   *
   * `||` e não `??`: vazio é AUSÊNCIA de logo, não "logo em branco". É a regra
   * que `resolveBranding` e `primeiroDefinido` já aplicam nas camadas de baixo, e
   * com `??` um `""` vindo de cima apagaria o logo do revendedor em vez de
   * descer para ele — que é o contrário do que a precedência por campo promete.
   */
  const logo = activeOrg?.marca?.logoUrl || brand.logoUrl;
  const logoEscuro =
    activeOrg?.marca?.logoDarkUrl !== undefined
      ? activeOrg.marca.logoDarkUrl
      : activeOrg?.marca?.logoUrl
        ? null
        : brand.logoDarkUrl;
  // Só quando NINGUÉM — nem a instalação, nem a organização — pôs logo: é a
  // condição de `marcaEhADoProduto` (`lib/branding.ts`), avaliada sobre o que a
  // barra vai mostrar. O nome não conta: com nome próprio e sem logo, a barra
  // mostra o logo do produto.
  const marcaDoProduto = marcaEhADoProduto({ name: nome, logoUrl: logo ?? null });

  const conteudo = (
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center px-3",
          collapsed ? "justify-center px-0" : "justify-start",
          // Na gaveta, o "Fechar" do painel mora no canto direito desta linha.
          naGaveta && "pr-12",
        )}
      >
        {(logo || logoEscuro) && !collapsed ? (
          // Sem arte própria para o escuro, preserva a proteção de contraste.
          <div
            className={cn(
              // `min-w-0`: item de flex não encolhe abaixo do `min-width: auto`,
              // que é o valor padrão — sem isso, uma arte própria larga empurra o
              // botão de recolher para fora da barra em vez de encolher.
              "min-w-0 rounded-md",
              !logoEscuro && "dark:bg-white dark:px-2 dark:py-1 dark:shadow-sm",
            )}
          >
            {/* <img> em vez de next/image de propósito: a URL vem de quem hospeda
              (banco ou .env), e next/image exige allowlist de domínios fechada em
              build — a imagem pré-buildada rejeitaria o domínio do self-hoster.
              Altura fixa e largura livre porque a arte enviada tem proporção
              desconhecida; forçar as duas distorceria o logo de quem configurou. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? (
              <img
                src={logo}
                alt={nome}
                className={cn(
                  // `max-w-[min(10rem,100%)]` e não `max-w-[10rem]` sozinho, como o
                  // review mediu (#2723): a linha da logo tem ~207px úteis na barra
                  // aberta e o botão de recolher disputa o mesmo espaço. Uma arte
                  // própria larga (160px) vazava 7px do fundo claro e ficava a 1px
                  // do botão. O teto de 10rem continua valendo, mas agora a imagem
                  // encolhe antes de estourar.
                  //
                  // `max-w-[10rem]` + `max-w-full` não valem os dois: disputam a
                  // MESMA propriedade no CSS e só um sobrevive — a pegadinha que o
                  // review apontou, e por isso o teto é um único `min()`.
                  "h-7 w-auto max-w-[min(10rem,100%)] object-contain",
                  logoEscuro && "dark:hidden",
                )}
              />
            ) : (
              // `truncate` + `title`: o nome longo (uma clínica com nome grande,
              // medido no review) virava 3 linhas dentro de uma linha de 56px e
              // estourava a barra. Uma linha com reticências, e o nome completo
              // continua no tooltip. `block` porque este wrapper não é flex: inline,
              // o `truncate` não corta e o nome passa por cima do botão.
              <span className="block min-w-0 truncate dark:hidden" title={nome}>
                {nome}
              </span>
            )}
            {logoEscuro ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoEscuro}
                alt={nome}
                className="hidden h-7 w-auto max-w-[min(10rem,100%)] object-contain dark:block"
              />
            ) : null}
          </div>
        ) : marcaDoProduto ? (
          // O logo do produto (ver `components/branding/MarcaDoProduto.tsx`): o
          // horizontal com a barra aberta, só o símbolo com ela recolhida.
          collapsed ? (
            <SimboloDoProduto nome={nome} className="h-8 w-8" />
          ) : (
            <LogotipoDoProduto nome={nome} className="h-8 w-auto" />
          )
        ) : (
          <span
            className={cn(
              "min-w-0 truncate font-semibold tracking-tight",
              collapsed && "sr-only",
            )}
            title={nome}
          >
            {nome}
          </span>
        )}
        {collapsed && !marcaDoProduto && (
          <span aria-hidden className="text-lg font-semibold text-primary">
            {/* Spread e não `[0]`: nome começando com emoji ou acento composto
                quebraria no meio do code point. Mesma regra de `resolveBranding`
                — a inicial precisa acompanhar o nome que a barra mostra, senão
                recolher o menu troca a marca. */}
            {[...nome][0]?.toUpperCase() ?? brand.initial}
          </span>
        )}
      </div>
      {naGaveta && (
        // A busca do celular (DS §5.6): campo de 48, lupa de 17. Abre a MESMA
        // paleta do topo, depois de fechar a gaveta — duas camadas modais
        // empilhadas brigariam pelo foco.
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              requestAnimationFrame(() => abrirBuscaGlobal());
            }}
            className="hover:border-interactive-border flex h-12 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm text-muted-foreground transition-colors"
          >
            <MagnifyingGlass size={17} aria-hidden />
            <span className="truncate">{t("Buscar...")}</span>
          </button>
        </div>
      )}
      {/*
        A DENSIDADE, DEPOIS DO UNNIFY.

        Até a etapa 6 a linha tinha 28px, raspada à mão para o menu inteiro caber
        em 1280×900 sem rolar (`navegacao.spec.ts`), e a regra escrita aqui era:
        quando um grupo passa de quatro destinos, cria-se o HUB, não se raspa
        densidade. A regra continua valendo — CRM, IA e Análise já têm hub.

        O que mudou é a medida da linha: o item do Unnify tem 44px (48 na
        gaveta), e não há como raspá-lo sem deixar de ser o Unnify. A conta passa
        a ser 48px por destino (44 + 4 de intervalo); trocar N destinos por um
        hub devolve (N-1)×48px. Onde não couber, a área rola — e Configurações
        e a conta continuam no rodapé FIXO, fora dela, que era o que a regra
        protegia de verdade.
      */}
      <nav
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-2"
        aria-label={t("Navegação principal")}
      >
        {grupos.map(({ group, items }, indice) => {
          const tituloId = `nav-grupo-${group.id}`;
          // Recolhido o sidebar inteiro (rail de 64px), o grupo sempre mostra
          // seus itens — não há onde desenhar cabeçalho nem seta para fechá-lo.
          const aberto = collapsed || !gruposFechados.has(group.id);
          return (
            <div key={group.id}>
              {/* Recolhida, o rótulo de seção vira o divisor de 28×1 do Unnify,
                  que preserva o agrupamento sem texto. Antes do primeiro grupo
                  não há o que separar. */}
              {collapsed ? (
                indice > 0 ? (
                  <div aria-hidden className="bg-sidebar-border mx-auto my-2 h-px w-7" />
                ) : null
              ) : (
                <h2 id={tituloId}>
                  <button
                    type="button"
                    onClick={() => toggleGrupo(group.id)}
                    aria-expanded={aberto}
                    className={cn(
                      "text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between gap-2 rounded-lg px-3 pt-3 pb-1.5 text-left text-xs font-medium transition-colors",
                      naGaveta && "min-h-11",
                    )}
                  >
                    {t(group.label)}
                    <CaretDown
                      size={12}
                      aria-hidden
                      className={cn("shrink-0 transition-transform", !aberto && "-rotate-90")}
                    />
                  </button>
                </h2>
              )}
              {aberto && (
                <ul
                  aria-labelledby={collapsed ? undefined : tituloId}
                  aria-label={collapsed ? t(group.label) : undefined}
                  className="space-y-1"
                >
                  {items.map((item) => {
                    const ativo = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <ItemDaNavegacao
                          href={item.href}
                          rotulo={t(item.label)}
                          Icone={item.icon}
                          ativo={ativo}
                          recolhida={collapsed}
                          naGaveta={naGaveta}
                          onNavigate={onNavigate}
                          sinais={
                            <>
                              {item.healthDot && (
                                <ConnectionHealthDot
                                  className={cn(
                                    collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto",
                                  )}
                                />
                              )}
                              {item.contador === "casos" && (
                                <ContadorDeCasos compacto={collapsed} />
                              )}
                              {item.contador === "fila" && <ContadorDaFila compacto={collapsed} />}
                            </>
                          }
                        />
                      </li>
                    );
                  })}
                  {group.hub && (
                    <li>
                      <ItemDaNavegacao
                        href={group.hub.href}
                        rotulo={t(group.hub.label)}
                        Icone={ArrowRight}
                        ativo={pathname === group.hub.href}
                        recolhida={collapsed}
                        naGaveta={naGaveta}
                        onNavigate={onNavigate}
                      />
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-sidebar-border shrink-0 space-y-1 border-t p-2">
        {rodape && (
          <ItemDaNavegacao
            href={rodape.href}
            rotulo={t(rodape.label)}
            Icone={Gear}
            ativo={pathname.startsWith(rodape.href)}
            recolhida={collapsed}
            naGaveta={naGaveta}
            onNavigate={onNavigate}
          />
        )}
        {!naGaveta && <ContaNaBarraLateral recolhida={collapsed} />}
        <VersionFooter collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </>
  );

  // Recolhida, cada item é só o bloco do ícone, com a dica INSTANTÂNEA à
  // direita (DS §5.6, `IconTooltip`): sem atraso, porque é o único jeito de ler
  // o nome de um destino num trilho de 64px.
  return collapsed ? (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      {conteudo}
    </TooltipProvider>
  ) : (
    conteudo
  );
}

/**
 * Um item da navegação (DS §5.6): altura 44 (48 na gaveta), raio 12, `gap-3`,
 * `sm`/500, ícone de 18 num BLOCO de 32×32 raio 8.
 *
 * - Inativo: texto `sidebar-muted`; hover pinta `sidebar-accent`.
 * - Ativo: fundo `sidebar-accent`, texto `sidebar-foreground` e o bloco do ícone
 *   CHEIO em `primary`. A cor de marca sai do fundo da linha (antes, a linha
 *   inteira em `bg-accent`, que no CRM é a ação cheia) e vai para o bloco.
 *
 * O ícone segue Phosphor `regular` (o catálogo de navegação não muda nesta
 * etapa, e é ele que dá o ícone de cada destino). O `weight="fill"` do ativo
 * saiu: quem marca o ativo agora é o bloco cheio, como no Unnify.
 */
function ItemDaNavegacao({
  href,
  rotulo,
  Icone,
  ativo,
  recolhida,
  naGaveta,
  onNavigate,
  sinais,
}: {
  href: string;
  rotulo: string;
  Icone: NavDestination["icon"];
  ativo: boolean;
  recolhida: boolean;
  naGaveta: boolean;
  onNavigate?: () => void;
  /** Contador e ponto de saúde. Recolhida, eles vão para o canto do bloco. */
  sinais?: ReactNode;
}) {
  const link = (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "relative flex min-w-0 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors duration-fast",
        naGaveta ? "h-12" : "h-11",
        ativo
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
        recolhida && "justify-center px-0",
      )}
    >
      <span
        className={cn(
          "relative grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-fast",
          ativo && "bg-primary text-primary-foreground",
        )}
      >
        <Icone size={18} aria-hidden />
        {recolhida && sinais}
      </span>
      {recolhida ? (
        <span className="sr-only">{rotulo}</span>
      ) : (
        <>
          <span className="min-w-0 truncate">{rotulo}</span>
          {sinais}
        </>
      )}
    </Link>
  );
  if (!recolhida) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {rotulo}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        // ⚠️ `sticky`, e NUNCA tirada do fluxo.
        //
        // Com a barra fora do fluxo, ela não ocupa lugar nenhum na linha, e
        // quem afastava o conteúdo era um `md:ml-16`/`md:ml-60` do lado de lá.
        // Duas medidas para a mesma coisa, em componentes diferentes — e no dia
        // em que discordassem (largura de 60 com margem de 16), a barra passava
        // POR CIMA da lista de conversas, escondendo o começo de cada linha.
        //
        // Foi assim que apareceu numa instalação real: a barra expandida, com as
        // etiquetas legíveis, e a lista atrás dela cortada. Um F5 "consertava",
        // que é a assinatura de servidor e navegador terem pintado estados
        // diferentes — e `AppShell` e `Sidebar` são ambos `"use client"`.
        //
        // `sticky top-0 h-dvh` dá o mesmo efeito visual (a barra não rola com
        // a página) e ela VOLTA a ocupar lugar: sobra para o conteúdo exatamente
        // o que ela não usou, e não há segunda medida para discordar.
        //
        // A barra FLUTUANTE do Unnify (DS §5.6) cabe nisto sem mudar o
        // princípio: esta coluna continua no fluxo e com a altura da tela, e o
        // painel desenhado mora DENTRO dela, afastado 8px de cada borda pelo
        // `p-2` — a margem de 8, a altura `100dvh − 16` e o raio de 16. A coluna
        // mede o painel + 16: 264 aberta (painel de 248) e 80 recolhida (64).
        //
        // `h-dvh` e não `h-screen`: `100vh` é a janela com a barra de endereço
        // RECOLHIDA, e o navegador nunca corrige esse valor. `dvh` acompanha a
        // barra do navegador aparecendo e sumindo. Princípio 2 de
        // `docs/design-system/screen-flow/07-responsive-strategy.md`.
        //
        // O topo e a altura descontam `--faixas-de-cima` (`FaixasDeCima`): as
        // faixas grudam em `top-0`, e uma barra em `top-0` passaria por baixo
        // delas ao rolar — e com `h-dvh` cheio o documento mediria a tela mais
        // a faixa.
        //
        // `shrink-0` porque item de flex encolhe por padrão, e uma barra
        // espremida para caber é o mesmo defeito por outro caminho.
        //
        // A largura anda em 200ms com a curva padrão do Unnify
        // (`cubic-bezier(0.2, 0.8, 0.2, 1)`), os dois números do DS §7.2.
        "sticky top-[var(--faixas-de-cima,0px)] z-30 flex h-[calc(100dvh-var(--faixas-de-cima,0px))] shrink-0 flex-col p-2 transition-[width] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        collapsed ? "w-20" : "w-[264px]",
      )}
    >
      <div className="casca-barra-lateral flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <SidebarContent collapsed={collapsed} />
      </div>
    </aside>
  );
}
