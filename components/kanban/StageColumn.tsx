"use client";
import { Droppable } from "@hello-pangea/dnd";
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types/leads";
import type { Stage } from "@/lib/kanban/types";
import { buildCardInput } from "@/lib/kanban/card-state";
import { intervaloDaColuna } from "@/lib/kanban/selecao";
import { formatSomaPorMoeda, formatValorDoNegocio, MOEDA_PADRAO, somaPorMoeda } from "@/lib/money";
import { CaretDown, CaretRight, Tray } from "@/lib/ui/icons";
import { KanbanCard, type GestoDeSelecao } from "./KanbanCard";
import { TOM_MARCADOR, tomDaEtapa } from "./tons";
import { useMovimentoDaLista } from "./movimento-da-lista";

interface StageColumnProps {
  stage: Stage;
  /**
   * A posição da etapa no funil. Só escolhe o tom do marcador quando a etapa
   * não tem cor gravada (rodízio estável dos `tone-*`).
   */
  posicao?: number;
  leads: Lead[];
  pipelineId: string;
  /** owner_user_id → nome, resolvido no board. O dono agente vem no lead. */
  ownerNames?: Map<string, string | null>;
  /** ids que o radar classificou como esfriando (fonte única, não recalculada). */
  coolingIds?: Set<string>;
  /** Propostas de retomada vivas, por lead. */
  reactivations?: Map<string, { proposalId: string; expiresAt: string }>;
  /** `settings.canonical_tags` do pipeline — a única tag que fica no card. */
  canonicalTags?: string[];
  selectedLeadIds?: Set<string>;
  /** leadId → quantos eventos remotos já chegaram (muda = pulsa de novo). */
  pulses?: Map<string, number>;
  /**
   * Marca/desmarca um conjunto de uma vez — a etapa inteira, ou o intervalo do
   * shift+clique. Existe separado de `onSelect` porque a coluna é a única que
   * sabe a ordem VISÍVEL dos cards (é ela que recebe a lista já filtrada), e
   * resolver o intervalo no board significaria reconstruir essa ordem lá.
   */
  onSelectMany?: (leadIds: string[], marcar: boolean) => void;
  /** Abrir o dossiê — atravessa o board até o card, como `pulses`. */
  onOpen?: (leadId: string) => void;
  /** "Mover para…" do menu do card — atravessa a coluna como `onOpen`. */
  etapas?: Stage[];
  onMoverPara?: (lead: Lead, stageId: string) => void;
  /** `manager`+ — mesmo corte de papel da rota que renomeia a etapa. */
  podeRenomear?: boolean;
  onRenomear?: (nome: string) => void;
}

/**
 * Comparação do `memo` da coluna e da lista: rasa, com UMA exceção — `leads` é
 * comparado item a item. O quadro reagrupa os leads num array novo por etapa a
 * cada mudança de dados, e comparado por referência esse array furava o `memo`
 * de TODAS as colunas: soltar um card re-renderizava o funil inteiro (medido no
 * portal: um quadro de 186 a 428 ms exatamente quando o card assentava). Item a
 * item, só re-renderizam as colunas cujos leads mudaram — origem e destino.
 */
function mesmasProps<P extends { leads: Lead[] }>(a: P, b: P): boolean {
  for (const chave of Object.keys(a) as (keyof P)[]) {
    if (chave === "leads") continue;
    if (!Object.is(a[chave], b[chave])) return false;
  }
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  return a.leads.length === b.leads.length && a.leads.every((l, i) => l === b.leads[i]);
}

/**
 * `memo` com `mesmasProps`: com os callbacks estáveis do quadro, soltar um card
 * re-renderiza só as colunas de origem e de destino.
 */
export const StageColumn = memo(function StageColumn({
  stage,
  posicao = 0,
  leads,
  pipelineId,
  ownerNames,
  coolingIds,
  reactivations,
  canonicalTags,
  selectedLeadIds,
  pulses,
  onSelectMany,
  onOpen,
  etapas,
  onMoverPara,
  podeRenomear = false,
  onRenomear,
}: StageColumnProps) {
  const t = useT();
  // O TOTAL É POR MOEDA (#1531). Antes ele somava todos os `value_cents` e
  // escrevia o resultado na moeda do primeiro negócio: R$ 5.000 e 5.000 € saíam
  // "R$ 10.000,00", um valor que não existe. Agora cada moeda tem o seu total,
  // lado a lado e sem conversão ("R$ 5.000,00 + 5000,00 €"). Com uma moeda só o
  // texto é exatamente o de antes — é o caso comum, e nele nada muda. (Antes
  // disso, o total saía SEMPRE em R$ por um `formatBRL` local com a moeda em
  // duro; `formatValorDoNegocio` é a fonte única e a régua ×100 do negócio.)
  //
  // `currency` NULL conta como `MOEDA_PADRAO`, porque é o que o card mostra
  // (`KanbanCard`): o total não pode discordar do card que está logo abaixo.
  const moedaDoLead = (l: Lead) => l.currency ?? MOEDA_PADRAO;
  const totais = somaPorMoeda(leads, (l) => l.value_cents, moedaDoLead);
  // A ordem: primeiro a moeda com MAIS NEGÓCIOS COM VALOR na coluna (empate em
  // ordem alfabética), depois as demais em ordem alfabética. Conta negócios, não
  // soma valores — "mais valor" compararia centavos de moedas diferentes, o
  // mesmo erro que esta regra acaba. E não depende da posição dos cards: mover
  // um card na coluna não embaralha o cabeçalho.
  //
  // ponytail: o ideal é a moeda da ORGANIZAÇÃO primeiro, mas ela não chega ao
  // quadro (`ActiveOrg` traz o fuso e não a moeda). Como o negócio nasce na
  // moeda da organização (API e conversa), a mais frequente é, na prática, ela;
  // numa organização anterior a isso, os negócios antigos em BRL podem ganhar.
  // Upgrade: `currency` no embed `organizations(...)` de `lib/auth/server.ts`,
  // em `ActiveOrg`, e daí page → `PipelinePageClient` → `KanbanBoard` → uma prop
  // aqui que substitui `primeira`.
  const primeira = [
    ...somaPorMoeda(leads, (l) => (l.value_cents == null ? null : 1), moedaDoLead),
  ].sort(([ma, na], [mb, nb]) => nb - na || ma.localeCompare(mb))[0]?.[0];
  // A faixa aparece quando alguma moeda soma mais de zero — o `total > 0` de
  // antes, por moeda. Coluna sem valor nenhum não mostra "R$ 0,00".
  const temTotal = [...totais.values()].some((cents) => cents > 0);

  // A linha "ponderado" (issue #1535): o que ESTA coluna representa quando a
  // etapa tem chance calibrada. Ganho e perda valem 100 e 0 NA REGRA
  // (`lib/leads/previsao.ts`), não na coluna. `null` = etapa sem calibração, e
  // aí a linha não aparece: exibir "R$ 0,00" seria um número que ninguém
  // calibrou lendo como uma promessa de zero.
  //
  // Também por moeda, com a mesma função de moeda e a mesma `primeira` do total:
  // mesmas moedas, na mesma ordem. Arredonda por negócio, como antes.
  const probDaColuna = stage.is_won ? 100 : stage.is_lost ? 0 : (stage.win_probability ?? null);
  const ponderados =
    probDaColuna === null
      ? null
      : somaPorMoeda(
          leads,
          (l) => (l.value_cents == null ? null : Math.round((l.value_cents * probDaColuna) / 100)),
          moedaDoLead,
        );

  const idsVisiveis = leads.map((l) => l.id);
  const selecionadosAqui = idsVisiveis.filter((id) => selectedLeadIds?.has(id)).length;
  const todosSelecionados = idsVisiveis.length > 0 && selecionadosAqui === idsVisiveis.length;

  // A âncora do shift+clique. `useRef` e não `useState` de propósito: mudar a
  // âncora não muda nada na tela, e um `setState` aqui remontaria a coluna
  // inteira — inclusive o `Droppable` — a cada card marcado.
  const ancora = useRef<string | null>(null);

  const decidirSelecao = (leadId: string, gesto: GestoDeSelecao) => {
    if (gesto === "intervalo") {
      const faixa = intervaloDaColuna(idsVisiveis, ancora.current, leadId);
      ancora.current = leadId;
      onSelectMany?.(faixa, true);
      return;
    }
    ancora.current = leadId;
    onSelectMany?.([leadId], !selectedLeadIds?.has(leadId));
  };
  // Identidade ESTÁVEL para os cards: a função acima é nova a cada render, e
  // passá-la direto furava o `memo` de todos os cards da coluna. A versão mais
  // recente fica num ref, gravado depois do commit (nunca durante o render).
  const selecaoAtual = useRef(decidirSelecao);
  useLayoutEffect(() => {
    selecaoAtual.current = decidirSelecao;
  });
  const aoSelecionar = useCallback(
    (leadId: string, gesto: GestoDeSelecao) => selecaoAtual.current(leadId, gesto),
    [],
  );

  const alternarEtapa = () => {
    ancora.current = null;
    onSelectMany?.(idsVisiveis, !todosSelecionados);
  };
  // O marcador é um tom categórico do Unnify (DS §3.3), nunca o hex cru: a cor
  // gravada vira o `tone-*` mais próximo, e ganho/perda usam o tom do estado.
  const tom = tomDaEtapa(stage, posicao);

  // Recolher é só da tela (DS §10.23, "Coluna do quadro"): a coluna vira uma
  // faixa estreita com o nome e a contagem. O `Droppable` continua montado, então
  // soltar um card numa etapa recolhida segue funcionando.
  const [recolhida, setRecolhida] = useState(false);
  // Entrada, saída e deslize dos vizinhos fora do arrasto (movimento-da-lista.ts).
  const listaRef = useRef<HTMLDivElement | null>(null);
  useMovimentoDaLista(listaRef, idsVisiveis.join(","), !recolhida);

  const contagem =
    selecionadosAqui > 0 ? `${selecionadosAqui}/${leads.length}` : String(leads.length);

  return (
    <div
      /*
        Largura (DS §5.3 e §10.23): a coluna cresce (`grow`) a partir de uma
        base de 18rem até 28rem (`max-w-md`), para o quadro ocupar a largura
        útil sem a coluna virar painel.

        No celular continua `w-[85vw] max-w-80 snap-center`: a coluna cabe na
        tela, uma por vez, e a sobra de 15% é onde a seguinte se anuncia — um
        quadro que parece rolável, não cortado.

        Recolhida, vira uma faixa de 48px com o nome na vertical.
      */
      className={cn(
        "flex min-h-full shrink-0 snap-center flex-col rounded-xl border border-border bg-muted/40",
        recolhida ? "w-12" : "w-[85vw] max-w-80 md:w-72 md:max-w-md md:grow",
      )}
      data-etapa-do-quadro={stage.id}
      data-recolhida={recolhida || undefined}
    >
      {/* Cabeçalho e total PRESOS no alto do quadro enquanto os cards rolam: com
          uma etapa comprida, é o que diz em que etapa se está olhando. O fundo
          opaco (`bg-background`) é o que impede os cards de aparecerem por baixo;
          por dentro, a mesma camada translúcida da coluna, para o tom não mudar.

          A BORDA DE CIMA É DO CABEÇALHO, não da coluna (#3030): a coluna tem
          `border` e o cabeçalho `sticky top-0`, então ao rolar a borda da coluna
          saía da tela e o cabeçalho ficava solto, sem contorno em cima. Com
          `border-x border-t` aqui e `-mx-px -mt-px` (1px para cima e para os
          lados), o contorno de cima cobre exatamente a borda da coluna e viaja
          junto com o cabeçalho preso. */}
      <div
        className="sticky top-0 z-10 -mx-px -mt-px rounded-t-xl border-x border-t border-border bg-background"
        data-cabecalho-da-etapa
      >
        <div className="rounded-t-xl bg-muted/40">
          <div
            className={cn(
              "group/etapa flex items-center border-b border-border",
              recolhida ? "flex-col gap-2 px-1 py-2" : "gap-2 py-2 pr-3 pl-2",
            )}
          >
            {/* Recolher (DS §10.23): 28×28, raio 6, chevron de 14. */}
            <button
              type="button"
              onClick={() => setRecolhida((v) => !v)}
              aria-expanded={!recolhida}
              aria-label={`${recolhida ? t("Expandir etapa") : t("Recolher etapa")} ${stage.name}`}
              title={recolhida ? t("Expandir etapa") : t("Recolher etapa")}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              {recolhida ? (
                <CaretRight size={14} aria-hidden />
              ) : (
                <CaretDown size={14} aria-hidden />
              )}
            </button>
            {/* "Selecionar a etapa inteira" é o gesto que faz a ação em lote valer a
            pena: sem ele, mover trinta cards deixa de ser trinta arrastes e vira
            trinta cliques com modificador. Fica no cabeçalho porque é ali que a
            etapa é um objeto — o mesmo lugar onde já se lê a contagem dela.
            Indeterminado quando a seleção é parcial: "alguns" e "nenhum" não
            podem ter a mesma aparência num controle que o próximo clique
            inverte. Continua `<input>` nativo: o terceiro estado é a
            propriedade `indeterminate`, que o e2e do lote lê. */}
            {!recolhida && (
              <input
                type="checkbox"
                checked={todosSelecionados}
                ref={(el) => {
                  if (el) el.indeterminate = selecionadosAqui > 0 && !todosSelecionados;
                }}
                disabled={idsVisiveis.length === 0}
                onChange={alternarEtapa}
                aria-label={
                  todosSelecionados
                    ? `${t("Desmarcar todos em")} ${stage.name}`
                    : `${t("Selecionar todos em")} ${stage.name}`
                }
                className={cn(
                  "order-last size-4 shrink-0 cursor-pointer rounded-sm accent-primary transition-opacity",
                  "focus:opacity-100 disabled:cursor-default",
                  // `pointer-coarse:opacity-100` pelo mesmo motivo da caixa do
                  // card (ver `components/kanban/KanbanCard.tsx`): no toque o
                  // hover nunca acontece, e "selecionar a etapa inteira" é o gesto
                  // que faz a ação em lote valer a pena. Sem ele, mover trinta
                  // cards no celular eram trinta arrastes.
                  selecionadosAqui > 0
                    ? "opacity-100"
                    : "opacity-0 group-hover/etapa:opacity-100 pointer-coarse:opacity-100",
                )}
              />
            )}
            <span
              className={cn("size-2 shrink-0 rounded-full", TOM_MARCADOR[tom])}
              data-tom-da-etapa={tom}
              aria-hidden
            />
            {recolhida ? (
              <h2
                className="truncate text-sm font-semibold text-foreground [writing-mode:vertical-rl]"
                title={stage.name}
              >
                {stage.name}
              </h2>
            ) : podeRenomear && onRenomear ? (
              // `key` pelo nome: remonta (e descarta o rascunho) quando o nome
              // GRAVADO muda — mesmo contrato de `NomeDaEtapa` em Configurações,
              // para uma edição feita em outra aba não ficar escondida atrás de
              // um rascunho velho aqui.
              // Dentro do <h2>: a coluna segue sendo título para quem navega
              // por leitor de tela, com ou sem permissão de renomear.
              <h2 className="flex min-w-0 flex-1">
                <NomeDaEtapaNoQuadro key={stage.name} nome={stage.name} onConfirmar={onRenomear} />
              </h2>
            ) : (
              <h2 className="flex-1 truncate text-sm font-semibold text-foreground">
                {stage.name}
              </h2>
            )}
            <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
              {contagem}
            </span>
          </div>

          {temTotal && !recolhida && (
            <div className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground tabular-nums">
              {formatSomaPorMoeda(totais, formatValorDoNegocio, { primeira })}
              {ponderados !== null && (
                <span className="ml-2">
                  · {t("ponderado")}{" "}
                  {formatSomaPorMoeda(ponderados, formatValorDoNegocio, { primeira })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <Droppable droppableId={stage.id} type="LEAD">
        {(provided, snapshot) => (
          <div
            ref={(el) => {
              provided.innerRef(el);
              listaRef.current = el;
            }}
            {...provided.droppableProps}
            // A coluna que vai receber o card ganha um véu (`movimento.css`),
            // que aparece por OPACIDADE — antes era a cor de fundo trocando,
            // pintura da coluna inteira a cada entrada e saída do cursor.
            data-recebendo={snapshot.isDraggingOver || undefined}
            className="kanban-coluna-destino relative flex flex-1 flex-col gap-2 rounded-b-xl p-2"
          >
            {!recolhida && (
              <ListaDeCards
                leads={leads}
                stageName={stage.name}
                pipelineId={pipelineId}
                ownerNames={ownerNames}
                coolingIds={coolingIds}
                reactivations={reactivations}
                canonicalTags={canonicalTags}
                selectedLeadIds={selectedLeadIds}
                pulses={pulses}
                onSelect={aoSelecionar}
                onOpen={onOpen}
                etapas={etapas}
                onMoverPara={onMoverPara}
              />
            )}
            {provided.placeholder}
            {leads.length === 0 && !snapshot.isDraggingOver && !recolhida && (
              // Estado vazio da coluna (guia 2.8): ícone de 20 num círculo de 40 em --muted,
              // título e uma frase que diz o que fazer. Compacto: a coluna tem ~270px.
              <div
                data-slot="coluna-vazia"
                className="flex flex-col items-center gap-2 px-4 py-6 text-center"
              >
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Tray size={20} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm leading-5 font-semibold text-foreground">
                    {t("Nenhum lead nesta etapa")}
                  </p>
                  <p className="text-xs leading-4 text-muted-foreground">
                    {t("Arraste um card para cá.")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}, mesmasProps);

interface ListaDeCardsProps {
  leads: Lead[];
  stageName: string;
  pipelineId: string;
  ownerNames?: Map<string, string | null>;
  coolingIds?: Set<string>;
  reactivations?: Map<string, { proposalId: string; expiresAt: string }>;
  canonicalTags?: string[];
  selectedLeadIds?: Set<string>;
  pulses?: Map<string, number>;
  onSelect: (leadId: string, gesto: GestoDeSelecao) => void;
  onOpen?: (leadId: string) => void;
  etapas?: Stage[];
  onMoverPara?: (lead: Lead, stageId: string) => void;
}

/**
 * Os cards da coluna FORA do render-prop do `Droppable`. É a recomendação de
 * desempenho do `@hello-pangea/dnd`: o render-prop roda de novo toda vez que o
 * cursor entra ou sai da coluna (`isDraggingOver`), e sem este `memo` cada
 * passagem re-renderizava todos os cards dela no meio do arrasto.
 */
const ListaDeCards = memo(function ListaDeCards({
  leads,
  stageName,
  pipelineId,
  ownerNames,
  coolingIds,
  reactivations,
  canonicalTags,
  selectedLeadIds,
  pulses,
  onSelect,
  onOpen,
  etapas,
  onMoverPara,
}: ListaDeCardsProps) {
  // `buildCardInput` devolve um objeto novo a cada chamada, e um objeto novo
  // fura o `memo` do card. Esta lista só re-renderiza quando os leads dela
  // mudam (`mesmasProps`), então a coluna parada não reconstrói nada.
  const cards = useMemo(
    () =>
      leads.map((lead) =>
        buildCardInput(lead, { stageName, ownerNames, coolingIds, reactivations, canonicalTags }),
      ),
    [leads, stageName, ownerNames, coolingIds, reactivations, canonicalTags],
  );
  const isSelecting = (selectedLeadIds?.size ?? 0) > 0;

  return (
    <>
      {leads.map((lead, idx) => (
        <KanbanCard
          key={lead.id}
          card={cards[idx]!}
          lead={lead}
          index={idx}
          pipelineId={pipelineId}
          isSelected={selectedLeadIds?.has(lead.id)}
          isSelecting={isSelecting}
          pulseCount={pulses?.get(lead.id) ?? 0}
          onSelect={onSelect}
          onOpen={onOpen}
          etapas={etapas}
          onMoverPara={onMoverPara}
        />
      ))}
    </>
  );
}, mesmasProps);

/**
 * O nome da etapa, editado no lugar — direto no cabeçalho da coluna.
 *
 * Mesmo contrato de `NomeDaEtapa` (Configurações › Funis, que chama a MESMA
 * rota `PATCH /api/v1/pipelines/:id/stages/:stageId`): salva ao CONFIRMAR
 * (Enter ou sair do campo), nunca a cada tecla — um PATCH por caractere
 * dispararia a validação de nome duplicado no meio da digitação. O rascunho é
 * local; o `key={stage.name}` de quem chama remonta o campo quando o nome
 * GRAVADO muda, então uma edição feita em outra aba não fica escondida atrás
 * de um rascunho velho.
 */
function NomeDaEtapaNoQuadro({
  nome,
  onConfirmar,
}: {
  nome: string;
  onConfirmar: (nome: string) => void;
}) {
  const t = useT();
  const [rascunho, setRascunho] = useState(nome);
  // O Escape desfoca, e o desfoque chama `confirmar` na MESMA tecla: o
  // `rascunho` que ele lê ainda é o texto digitado, e sem esta marca o Escape
  // salvava o que devia desfazer (medido em renomear-etapa-no-quadro.test.tsx).
  const cancelado = useRef(false);

  function confirmar() {
    const limpo = rascunho.trim();
    if (cancelado.current || !limpo || limpo === nome) {
      cancelado.current = false;
      setRascunho(nome);
      return;
    }
    onConfirmar(limpo);
  }

  return (
    <input
      value={rascunho}
      maxLength={80}
      aria-label={`${t("Nome da etapa")} «${nome}»`}
      data-testid="nome-etapa-quadro"
      onChange={(e) => setRascunho(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelado.current = true;
          e.currentTarget.blur();
        }
      }}
      className="min-w-0 flex-1 truncate rounded-sm bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground outline-hidden hover:bg-background focus:bg-background"
    />
  );
}
