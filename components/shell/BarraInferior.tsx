"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ContadorDaFila } from "@/components/shell/ContadorDaFila";
import { ContadorDeCasos } from "@/components/shell/ContadorDeCasos";
import { GavetaDeNavegacao } from "@/components/shell/MobileSidebar";
import { useAuth } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { sidebarGroups, type NavDestination } from "@/lib/navigation/registry";
import { usePecaDoRodape, type PecaDoRodape } from "@/lib/ui/rodape-ocupado";
import { cn } from "@/lib/utils";

/**
 * O que a barra OCUPA no rodapé, para a casca descontar (contrato em
 * `lib/ui/rodape-ocupado.tsx`, issue #1305).
 *
 * `distancia: 0` porque ela encosta na borda de baixo — é barra de abas, não
 * painel flutuante.
 *
 * ─── `altura: 0` é deliberado, e contraria o uso normal do contrato ─────────
 *
 * O contrato pede um PISO em `altura` — a conta do próprio CSS da peça, para a
 * reserva valer antes de o navegador medir a caixa. Para esta peça, piso é
 * defeito.
 *
 * Esta barra existe em toda largura e quem a esconde a partir de `lg` é CSS
 * (`lg:hidden`), não condição de render. Então no laptop ela está no DOM com
 * `display: none` — e `ocupacaoDaPeca` é `distancia + max(altura, medida)`: com
 * `altura: 56`, o `<main>` do desktop perderia 56px de rodapé por uma barra que
 * não está na tela. O Inbox e o quadro do funil, que leem a mesma variável para
 * calcular a própria altura, encolheriam junto.
 *
 * Com zero, quem decide é só a medição: `getBoundingClientRect()` devolve altura
 * 0 para elemento `display: none`, e o hook grava esse zero — porque a peça saiu
 * de vista (ver `saiuDeVista` em `lib/ui/rodape-ocupado.tsx`, #3061) —, então no
 * desktop a reserva fica em 0 e nada encolhe; no celular ela passa a valer o que
 * a barra mede de verdade, incluindo a área segura do iOS, que nenhuma constante
 * aqui saberia prever. E vale nas DUAS direções: quem estreita e volta a alargar
 * a mesma janela (giro do celular, painel do navegador, modo responsivo) não
 * fica com a última medida presa.
 *
 * O custo é um quadro: na primeira pintura do celular a reserva ainda é 0, e o
 * `ResizeObserver` a corrige em seguida. Trocado por reservar espaço errado em
 * toda tela grande, é barato.
 */
export const BARRA_INFERIOR: PecaDoRodape = {
  dono: "components/shell/BarraInferior.tsx",
  distancia: 0,
  altura: 0,
};

/**
 * A ordem de preferência das abas — e por que ela é uma lista, não um filtro.
 *
 * Barra de abas de celular cabe quatro destinos mais o "Mais". Quais quatro não
 * é derivável do catálogo: `sidebar: true` marca 21 destinos como "uso diário",
 * o que é verdade no laptop e não resolve a escolha aqui. Então a preferência é
 * declarada, e o primeiro que a organização PUDER ver ganha a vaga.
 *
 * A escolha segue quem usa o produto no celular: alguém atendendo fora da mesa.
 * Inbox é a conversa; Funis é onde o negócio anda; Agenda é o compromisso de
 * hoje; Desempenho é o número que se confere no caminho. A lista tem sobra
 * depois dessas quatro porque toda uma dessas portas pode estar fechada — o
 * plano da empresa pode não incluir Análise, a organização pode não ter ligado
 * a Agenda —, e uma barra com um buraco no meio é pior que uma barra com outra
 * aba. Contatos e Casos entram nessa ordem como reserva.
 */
const PREFERIDAS = [
  "/app/inbox",
  "/app/kanban",
  "/app/agenda",
  "/app/metrics",
  "/app/contacts",
  "/app/ai/cases",
] as const;

const VAGAS = 4;

/**
 * Barra de abas do rodapé no celular.
 *
 * ─── Por que ela existe ─────────────────────────────────────────────────────
 *
 * Até aqui a única navegação do celular era o hambúrguer: dois toques e uma
 * gaveta por cima da tela para trocar de seção. É o padrão de site. Barra de
 * abas fixa é o padrão de app — um toque, destino sempre visível, e a pessoa
 * sabe onde está sem abrir nada. É a mudança que mais aproxima o produto de
 * parecer nativo no celular.
 *
 * ─── O que ela NÃO decide ───────────────────────────────────────────────────
 *
 * Nada sobre permissão. As abas saem de `sidebarGroups()`, a MESMA função que
 * desenha o sidebar e a gaveta, com os mesmos argumentos — papel, módulos
 * ligados, capacidades da organização e áreas do plano. Uma porta que o sidebar
 * não mostraria não aparece aqui, e não há uma segunda régua para divergir.
 *
 * `areas_disponiveis` vai CRU, sem `?? []`, pelo mesmo motivo documentado no
 * `SidebarContent`: ausente quer dizer "não filtra por área", e um `?? []`
 * esconderia Análise e Agente de IA de uma vez.
 */
export function BarraInferior() {
  const t = useT();
  const pathname = usePathname();
  const { user, activeOrg } = useAuth();
  const ancora = usePecaDoRodape(BARRA_INFERIOR);

  const visiveis = new Map<string, NavDestination>();
  for (const { items } of sidebarGroups(
    user.is_platform_admin && !user.support,
    activeOrg?.role ?? null,
    activeOrg?.interface_settings,
    activeOrg?.modulos_ligados ?? [],
    activeOrg?.capacidades_ligadas ?? [],
  )) {
    for (const item of items) visiveis.set(item.href, item);
  }

  const abas = PREFERIDAS.map((href) => visiveis.get(href))
    .filter((d): d is NavDestination => d !== undefined)
    .slice(0, VAGAS);

  // Sem nenhuma aba não há barra: um rodapé com só o "Mais" ocuparia altura da
  // tela para repetir o hambúrguer que já está na barra de cima. Acontece com
  // papel `viewer` numa instalação com quase tudo desligado.
  if (abas.length === 0) return null;

  return (
    <nav
      ref={ancora}
      aria-label={t("Navegação rápida")}
      // Âncora de medição para `tests/e2e/celular-cabe-na-tela.spec.ts`, no
      // padrão `data-*` que o quadro do funil já usa (`data-quadro-do-funil`,
      // `data-etapa-do-quadro`). Procurar a barra pelo `aria-label` quebraria a
      // spec no espanhol, que é idioma de produção aqui.
      data-barra-inferior
      // A distância até o fundo vem do contrato, não de um `bottom-0` escrito
      // aqui: é o mesmo número que a casca desconta (issue #1305).
      style={{ bottom: BARRA_INFERIOR.distancia }}
      /*
        A BARRA ANCORADA DO UNNIFY (DS §5.6, `.pta-mobile-dock`): fixa embaixo,
        `padding: 6px 8px + safe-area`, borda de cima de 1px e fundo `card` a
        94% com `blur(20px) saturate(1.3)` — os três últimos moram em
        `.casca-dock` (`components/shell/casca.css`), que também a devolve a
        sólido com transparência reduzida ou alto contraste. Camada 40 (§5.5).

        A safe-area entra SOMADA aos 6px: no iOS em tela cheia os últimos ~34px
        são do indicador de home, e sem ela os rótulos ficariam por baixo dele —
        e é esta barra, de todas as peças do produto, a que mais obviamente
        precisa disso, porque ela mora exatamente onde o indicador mora.

        `lg:hidden` é o mesmo corte que a casca usa para trocar a barra lateral
        pela gaveta (`hidden lg:block` no `AppShell`): de 1024px para cima a
        barra lateral já está na tela e uma segunda navegação seria redundante.
      */
      className="casca-dock fixed inset-x-0 z-40 px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom,0px))] lg:hidden"
    >
      <ul className="flex items-stretch justify-around gap-1">
        {abas.map((aba) => {
          const Icone = aba.icon;
          // `startsWith` e não igualdade: em `/app/inbox/[id]` a aba Inbox
          // continua sendo onde a pessoa está. A igualdade deixaria a barra
          // inteira apagada justamente na tela de conversa, que é onde se passa
          // mais tempo no celular.
          const aqui = pathname === aba.href || pathname.startsWith(`${aba.href}/`);
          return (
            <li key={aba.href} className="flex min-w-0 flex-1">
              <Link
                href={aba.href}
                aria-current={aqui ? "page" : undefined}
                className={cn(
                  // Coluna ícone + rótulo `xs`/500, altura mínima 56, raio 12;
                  // ao tocar, `interactive-strong` (em `.casca-dock`).
                  "relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5",
                  "transition-[color,background-color] duration-fast",
                  aqui ? "text-primary" : "text-muted-foreground",
                )}
              >
                {/* O `relative` é a âncora do ponto do contador: no canto do
                    ícone, e não no canto da coluna inteira. */}
                <span className="relative">
                  <Icone size={20} aria-hidden />
                  {aba.contador === "fila" && (
                    <ContadorDaFila compacto className="-top-0.5 -right-1 ring-card" />
                  )}
                  {aba.contador === "casos" && (
                    <ContadorDeCasos compacto className="-top-0.5 -right-1 ring-card" />
                  )}
                </span>
                <span className="w-full truncate text-center text-xs leading-tight font-medium">
                  {t(aba.label)}
                </span>
                {/*
                  `compacto` desenha o contador como um PONTO de 8px (acima, no
                  canto do ícone), em vez do número ao lado do rótulo. Numa aba
                  de ~70px o número não caberia junto do texto, e o ponto é o que
                  um app nativo mostra: "tem coisa aqui", sem pedir leitura. O
                  rótulo acessível com a contagem exata continua no `aria-label`
                  do próprio contador.
                */}
              </Link>
            </li>
          );
        })}
        {/*
          A quinta vaga é a gaveta com o inventário completo. O botão dela mora
          dentro da própria `GavetaDeNavegacao`, e não aqui: o gate
          `tests/unit/controle-decorativo.test.ts` só aceita botão sem `onClick`
          quando ele está IMEDIATAMENTE dentro de um gatilho `asChild` — e ele
          mede isso pelas duas linhas anteriores. Passar o botão por prop daqui
          o faria acusar um botão correto. O porquê está em `MobileSidebar.tsx`.
        */}
        <li className="flex min-w-0 flex-1">
          <GavetaDeNavegacao comoAba />
        </li>
      </ul>
    </nav>
  );
}
