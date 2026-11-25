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
import { CaretDown, CaretRight, Plus, Target, Trophy, XCircle } from "@/lib/ui/icons";
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
  /** O "+ Adicionar negócio" no pé da coluna, com a etapa dela. */
  onAdicionar?: (stageId: string) => void;
  /** O "+ Criar tarefa" do rodapé de cada card. */
  onCriarTarefa?: (leadId: string) => void;
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
  onAdicionar,
  onCriarTarefa,
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
  //
  // Ganho e Perdido NASCEM recolhidas: são destino, não fila de trabalho. Viram
  // dois alvos estreitos onde se solta o card, e o quadro fica com as etapas em
  // que alguém ainda precisa agir. Um clique no cabeçalho abre a coluna inteira.
  // Todas as colunas nascem ABERTAS, Ganho e Perdido inclusive (desenho de
  // referência): recolher continua a um clique, no cabeçalho.
  const [recolhida, setRecolhida] = useState(false);
  // Entrada, saída e deslize dos vizinhos fora do arrasto (movimento-da-lista.ts).
  const listaRef = useRef<HTMLDivElement | null>(null);
  useMovimentoDaLista(listaRef, idsVisiveis.join(","), !recolhida);

  const contagem =
    selecionadosAqui > 0 ? `${selecionadosAqui}/${leads.length}` : String(leads.length);

  // Sem valor nenhum na coluna, o cabeçalho ainda diz "R$ 0,00" (desenho de
  // referência): um total que some deixa a dúvida "não somou ou não carregou?".
  // A moeda é a dos próprios negócios da coluna; coluna vazia usa a padrão.
  const moedaDoZero = primeira ?? (leads[0] ? moedaDoLead(leads[0]) : MOEDA_PADRAO);
  const IconeDoVazio = stage.is_won ? Trophy : stage.is_lost ? XCircle : Target;

  return (
    <div
      /*
        Largura (DS §5.3 e §10.23): a coluna cresce (`grow`) a partir de uma
        base de 18rem até 28rem (`max-w-md`). No celular `w-[85vw] max-w-80
        snap-center`: uma coluna por vez, e a sobra anuncia a seguinte.
        Recolhida, vira uma faixa de 48px com o nome na vertical.

        DESENHO DE REFERÊNCIA: o nome, a contagem e o total ficam FORA da caixa,
        em cima; a caixa é a área de soltar, com borda e fundo pontilhado; o
        "+ Adicionar negócio" fica embaixo dela.
      */
      className={cn(
        "flex min-h-full shrink-0 snap-center flex-col",
        recolhida ? "w-12" : "w-[85vw] max-w-80 md:w-72 md:max-w-md md:grow",
      )}
      data-etapa-do-quadro={stage.id}
      data-recolhida={recolhida || undefined}
    >
      {/* Cabeçalho PRESO no alto do quadro enquanto os cards rolam: com uma etapa
          comprida, é o que diz em que etapa se está olhando. Fundo opaco para os
          cards não aparecerem por baixo. */}
      <div className="sticky top-0 z-10 bg-background" data-cabecalho-da-etapa>
        <div
          className={cn(
            "group/etapa flex items-center",
            recolhida
              ? "flex-col gap-2 rounded-xl border border-border px-1 py-2"
              : "gap-2 px-1 pt-1 pb-3",
          )}
        >
          {/* Recolher (DS §10.23): discreto, aparece no hover e no foco. */}
          <button
            type="button"
            onClick={() => setRecolhida((v) => !v)}
            aria-expanded={!recolhida}
            aria-label={`${recolhida ? t("Expandir etapa") : t("Recolher etapa")} ${stage.name}`}
            title={recolhida ? t("Expandir etapa") : t("Recolher etapa")}
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[opacity,colors] hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
              !recolhida && "opacity-0 group-hover/etapa:opacity-100 pointer-coarse:opacity-100",
            )}
          >
            {recolhida ? (
              <CaretRight size={14} aria-hidden />
            ) : (
              <CaretDown size={14} aria-hidden />
            )}
          </button>
          {/* "Selecionar a etapa inteira": o gesto que faz a ação em lote valer a
              pena. Indeterminado com seleção parcial; `<input>` nativo porque o
              e2e do lote lê a propriedade `indeterminate`. */}
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
            <h2 className="flex min-w-0 flex-1 items-baseline">
              <NomeDaEtapaNoQuadro key={stage.name} nome={stage.name} onConfirmar={onRenomear} />
            </h2>
          ) : (
            <h2
              className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-foreground"
              title={stage.name}
            >
              {stage.name}
            </h2>
          )}
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            ({contagem})
          </span>
        </div>
        {/* O total numa linha própria: na mesma linha do nome, o "ponderado"
            empurrava o nome da etapa até ele sumir. */}
        {!recolhida && (
          <p
            className="-mt-2 truncate px-1 pb-3 text-xs text-muted-foreground tabular-nums"
            data-total-da-etapa
          >
            {temTotal ? (
              <>
                {formatSomaPorMoeda(totais, formatValorDoNegocio, { primeira })}
                {ponderados !== null && (
                  <span className="ml-1.5">
                    · {t("ponderado")}{" "}
                    {formatSomaPorMoeda(ponderados, formatValorDoNegocio, { primeira })}
                  </span>
                )}
              </>
            ) : (
              formatValorDoNegocio(0, moedaDoZero)
            )}
          </p>
        )}
      </div>

      <Droppable droppableId={stage.id} type="LEAD">
        {(provided, snapshot) => (
          <div
            ref={(el) => {
              provided.innerRef(el);
              listaRef.current = el;
            }}
            {...provided.droppableProps}
            data-recebendo={snapshot.isDraggingOver || undefined}
            className={cn(
              "kanban-coluna-destino relative flex flex-1 flex-col gap-2 rounded-2xl",
              recolhida
                ? "mt-2"
                : "border border-border bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:16px_16px] p-2",
              snapshot.isDraggingOver && !recolhida && "border-primary/60",
            )}
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
                onCriarTarefa={onCriarTarefa}
              />
            )}
            {provided.placeholder}
            {leads.length === 0 && !snapshot.isDraggingOver && !recolhida && (
              <div
                data-slot="coluna-vazia"
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center"
              >
                <IconeDoVazio size={22} aria-hidden className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("Nenhum negócio")}</p>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {!recolhida && onAdicionar && (
        <button
          type="button"
          onClick={() => onAdicionar(stage.id)}
          className="mt-2 inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          data-adicionar-na-etapa={stage.id}
        >
          <Plus size={14} aria-hidden />
          {t("Adicionar negócio")}
        </button>
      )}
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
  onCriarTarefa?: (leadId: string) => void;
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
  onCriarTarefa,
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
          onCriarTarefa={onCriarTarefa}
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
