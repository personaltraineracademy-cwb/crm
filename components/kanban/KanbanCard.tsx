"use client";
import { Draggable } from "@hello-pangea/dnd";
import type { MouseEvent } from "react";
import { useT } from "@/hooks/i18n/useT";
import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { CalendarBlank, DragHandle } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";
import { formatValorDoNegocio, MOEDA_PADRAO } from "@/lib/money";
import type { Lead } from "@/lib/types/leads";
import type { Stage } from "@/lib/kanban/types";
import { resolveCardState, stageAgeLabel, type CardInput } from "@/lib/kanban/card-state";
import { KanbanCardActions } from "./KanbanCardActions";
import { NextActionSlot } from "./NextActionSlot";
import { ReactivationSlot } from "./ReactivationSlot";
import { ConversaSlot } from "./ConversaSlot";
import { ScoreSlot } from "./ScoreSlot";
import { OwnerBadge } from "./OwnerBadge";
import { ContatoNoCard } from "./ContatoNoCard";
import { TarefasNoCard } from "./TarefasNoCard";
import { prazoRelativo } from "./prazo";
import { useCoresDasEtiquetas } from "@/components/tags/CoresDasEtiquetas";
import { chaveDaEtiqueta } from "@/lib/tags/cor-da-etiqueta";
import { TOM_MARCADOR, TOM_SUAVE, tomDaEtiqueta, tomMaisProximo, type Tom } from "./tons";

/** Quantas etiquetas cabem na linha do card; o resto vira "+N" (todas no `title`). */
const ETIQUETAS_VISIVEIS = 3;

/** Os dois gestos de seleção que o card sabe relatar. */
export type GestoDeSelecao = "alterna" | "intervalo";

interface KanbanCardProps {
  /** O que o card mostra — explicitamente NÃO é a linha do banco. */
  card: CardInput;
  /** A linha do lead, só para o menu de ações (que muta o lead). */
  lead: Lead;
  index: number;
  pipelineId: string;
  isSelected?: boolean;
  /**
   * Há seleção viva no quadro. Só muda a VISIBILIDADE da caixa (que fora disso
   * aparece no hover/foco): quando o usuário já está selecionando, esconder as
   * caixas dos outros cards transforma "clicar em mais um" numa caça ao pixel.
   */
  isSelecting?: boolean;
  /**
   * Contador de pulsos deste card (evento REMOTO). Muda a cada evento novo — é
   * a MUDANÇA que remonta o overlay e reinicia a animação; um booleano deixaria
   * o segundo evento dentro da janela passar despercebido.
   */
  pulseCount?: number;
  /**
   * `alterna` = um card entra/sai da seleção. `intervalo` = daqui até a âncora
   * (shift). Quem resolve o intervalo é a COLUNA, que é a única que conhece a
   * ordem visível dos cards — o card só relata o gesto.
   */
  onSelect?: (leadId: string, gesto: GestoDeSelecao) => void;
  /** Abrir o dossiê. Separado de `onSelect`: são gestos e intenções diferentes. */
  onOpen?: (leadId: string) => void;
  /** Repassados ao menu de ações ("Mover para…"). */
  etapas?: Stage[];
  onMoverPara?: (lead: Lead, stageId: string) => void;
}

function formatValor(cents: number | null, currency: string | null): string | null {
  // A régua do negócio (×100 em qualquer moeda) e o locale da moeda moram em
  // `formatValorDoNegocio` — a mesma função do total da coluna, para o card e o
  // topo da coluna nunca escreverem o mesmo dinheiro de dois jeitos.
  if (cents == null) return null;
  return formatValorDoNegocio(cents, currency ?? MOEDA_PADRAO, { semCentavos: true });
}

/**
 * O card do Kanban — orçamento FIXO: 5 elementos, 3 faixas, altura constante.
 *
 * As alturas são reservadas em vez de derivadas do conteúdo: título sempre
 * ocupa 2 linhas, valor sempre ocupa a sua linha (com "—" quando não há valor),
 * e a faixa do agente existe mesmo vazia. É isso que faz o board continuar
 * legível quando score, próxima ação e alerta chegarem — o card não cresce com
 * dados, ele TROCA de estado.
 *
 * Visual do cartão de tarefa do Work (DS §6.3 e §10.23): `card` com borda,
 * raio 12 e a sombra leve que só ele tem; hover mais marcado; etiquetas em
 * chips de tom; prazo em texto relativo; alça de arrastar no canto.
 *
 * Cor só quando o estado pede (Lei C, e a regra de prioridade do Unnify: cor
 * só em "alta" e "urgente"). O negócio não tem prioridade própria; os dois
 * estados que pedem ação já têm cor no próprio texto: esfriando em aviso (③)
 * e tarefa atrasada em perigo (④). A antiga borda esquerda colorida saiu — o
 * cartão do Work não tem faixa lateral.
 */
export function KanbanCard({
  card,
  lead,
  index,
  pipelineId,
  isSelected,
  isSelecting = false,
  pulseCount = 0,
  onSelect,
  onOpen,
  etapas,
  onMoverPara,
}: KanbanCardProps) {
  const t = useT();
  const value = formatValor(card.valueCents, card.currency);
  const state = resolveCardState(card, t);
  const age = stageAgeLabel(card.hoursInStage, t);
  const tagDeIdioma = useTagDeIdioma();
  const prazo = prazoRelativo(lead.expected_close_date, new Date(), t, tagDeIdioma);
  // A cor cadastrada da etiqueta (Configurações › Tags) manda; ela vira o
  // `tone-*` mais próximo. Sem cor cadastrada, o tom sai do próprio texto.
  const coresDasEtiquetas = useCoresDasEtiquetas();
  const tomDe = (tag: string): Tom => {
    const cor = coresDasEtiquetas[chaveDaEtiqueta(tag)];
    return (cor ? tomMaisProximo(cor) : null) ?? tomDaEtiqueta(tag);
  };
  const etiquetasVisiveis = card.tags.slice(0, ETIQUETAS_VISIVEIS);
  const etiquetasEscondidas = card.tags.length - etiquetasVisiveis.length;

  // Clique ABRE o dossiê; ctrl/cmd+clique SELECIONA; shift+clique estende até a
  // âncora. "Clicar abre" é a convenção mais forte, e seleção múltipla é recurso
  // de poder, que tolera modificador. O arrasto continua funcionando porque o
  // dnd distingue clique de arrasto por movimento, não por handler.
  //
  // A CAIXA abaixo existe porque modificador não se descobre: até ela, a única
  // porta para o lote era saber que ctrl+clique fazia algo — e um recurso que
  // só quem já sabe encontra não é recurso, é folclore.
  //
  // ⚠️ UMA função, dois pontos de entrada — e a duplicação que existia aqui
  // custou o recurso inteiro no alvo mais óbvio. O TÍTULO é um `<button>` com
  // `stopPropagation()` (ver abaixo), então o clique nele NUNCA chega a este
  // handler; e o `onClick` do título ignorava os modificadores e abria o dossiê
  // sempre. Medido pela tela em 2026-09-04, com 6 cards e a âncora no 2º:
  //
  //   shift+clique no TÍTULO do 5º  → 1 marcado, 1 diálogo aberto (o dossiê)
  //   shift+clique no CORPO  do 5º  → 4 marcados, 0 diálogos
  //
  // O título é o maior e mais natural alvo do card. Quem lê "Segurando Shift,
  // um clique seleciona tudo entre o card anterior e o que você clicou" e clica
  // no card clica no nome dele — e recebia o dossiê.
  const decidirClique = (e: {
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
  }): void => {
    if (e.shiftKey) {
      onSelect?.(card.id, "intervalo");
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      onSelect?.(card.id, "alterna");
      return;
    }
    onOpen?.(card.id);
  };
  const handleClick = (e: MouseEvent<HTMLDivElement>) => decidirClique(e);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          // O dnd marca o handle como role="button"; com o menu de ações dentro,
          // isso vira nested-interactive no axe. "group" mantém o foco e o
          // teclado do dnd (tabIndex e handlers continuam vindo do spread) sem
          // aninhar dois controles — nada de aria-hidden nem de suprimir regra.
          role="group"
          aria-label={`${t("Lead")}: ${card.title}`}
          onClick={handleClick}
          // Tags saem do card (Lei A): ficam a um hover, sem ocupar altura.
          title={card.tags.length > 0 ? `Tags: ${card.tags.join(", ")}` : undefined}
          className={cn(
            "group relative overflow-hidden rounded-xl border border-border bg-card p-3 text-card-foreground",
            // A sombra do cartão de tarefa do Work (DS §6.3) — o único cartão
            // com sombra em repouso, porque é o único que se arrasta.
            "shadow-[0_2px_4px_rgb(0_0_0/3%),0_6px_18px_rgb(0_0_0/2%)] transition-shadow",
            "hover:shadow-[0_4px_16px_rgb(0_0_0/7%)]",
            snapshot.isDragging && "rotate-1 shadow-md ring-1 ring-primary/40",
            isSelected && "ring-2 ring-primary",
          )}
        >
          {/* key = contador: cada evento remoto monta um overlay NOVO, e é isso
              que reinicia a animação. Fica no elemento interno — pôr no wrapper
              remontaria o draggable e quebraria o arrasto. */}
          {pulseCount > 0 && (
            <span
              key={pulseCount}
              aria-hidden
              // Observável de propósito: é assim que o teste prova que o
              // overlay REMONTOU (contador novo) em vez de ter sobrado do
              // evento anterior — e "sobrou" era exatamente o defeito.
              data-pulse={pulseCount}
              className="card-pulse pointer-events-none absolute inset-0"
            />
          )}
          {/* O estado continua exposto para quem mede (e2e, leitor de DOM),
              mas sem tinta: a cor mora no texto do slot ③. */}
          <span aria-hidden data-estado-do-card={state.border} className="hidden" />

          {/* ① identidade — altura FIXA de 2 linhas, com ou sem texto longo. */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-1.5">
              {/* A largura é SEMPRE reservada (`h-4 w-4` num wrapper que não
                  some), só a tinta é condicional: o card tem orçamento fixo de
                  altura e largura, e uma caixa que aparece no hover EMPURRANDO
                  o título faria o quadro inteiro tremer com o mouse. Some por
                  opacidade, nunca por `hidden`. `focus:opacity-100` no próprio
                  input: uma caixa invisível e tabulável seria armadilha de
                  teclado. */}
              <input
                type="checkbox"
                checked={Boolean(isSelected)}
                aria-label={`${t("Selecionar")}: ${card.title}`}
                onClick={(e) => {
                  // O card inteiro tem onClick (abre o dossiê): sem parar a
                  // propagação, marcar a caixa abriria o dossiê por cima.
                  e.stopPropagation();
                  onSelect?.(card.id, e.shiftKey ? "intervalo" : "alterna");
                }}
                onChange={() => {
                  /* estado vem de `isSelected`; quem decide é o onClick acima */
                }}
                className={cn(
                  "mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-primary transition-opacity",
                  "focus:opacity-100 focus-visible:outline-2 focus-visible:outline-ring",
                  isSelected || isSelecting
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                )}
              />
              {card.canonicalTag && (
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    TOM_MARCADOR[tomDe(card.canonicalTag)],
                  )}
                  title={card.canonicalTag}
                  // role="img": um span nu não aceita aria-label (aria-prohibited-attr).
                  role="img"
                  aria-label={`${t("Tag")}: ${card.canonicalTag}`}
                />
              )}
              {/* O TÍTULO é o elemento ativável, não o card inteiro.
                  `role="group"` no card foi decisão da wave 2 (o dnd marca o
                  handle como button, e com o menu de ações dentro isso vira
                  nested-interactive no axe). Voltar o card para `button`
                  reintroduziria aquele defeito com cara de melhoria de
                  acessibilidade; deixar só onKeyDown daria uma ação que existe
                  e NÃO É DESCOBERTA por leitor de tela. O título como button
                  atende mouse, teclado e leitor sem desfazer a decisão antiga. */}
              <h3 className="line-clamp-2 h-10 text-sm leading-5 font-medium text-foreground">
                <button
                  type="button"
                  onClick={(e) => {
                    // `stopPropagation` continua: sem ele o handler do card
                    // rodaria de novo e o gesto seria contado duas vezes (um
                    // ctrl+clique marcaria e desmarcaria no mesmo instante).
                    // Por isso a DECISÃO tem de ser tomada aqui também.
                    e.stopPropagation();
                    decidirClique(e);
                  }}
                  className="text-left hover:underline"
                >
                  {card.title}
                </button>
              </h3>
            </div>
            <div className="-mt-1 -mr-1 flex shrink-0 items-center">
              {/* A alça do canto (DS §10.23). O arrasto continua pegando o card
                  inteiro, como antes; a alça é a pista visual de que ele se
                  arrasta, e some no repouso para não poluir a coluna. */}
              <span
                aria-hidden
                data-alca-de-arrastar
                className={cn(
                  "inline-flex size-6 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-opacity",
                  "opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100",
                  snapshot.isDragging && "cursor-grabbing opacity-100",
                )}
              >
                <DragHandle size={14} />
              </span>
              <KanbanCardActions
                lead={lead}
                pipelineId={pipelineId}
                etapas={etapas}
                onMoverPara={onMoverPara}
              />
            </div>
          </div>

          {/* ② valor — altura reservada mesmo sem valor, senão o card encolhe. */}
          <div className="mt-1 flex h-5 items-center justify-between gap-2">
            <p
              className={cn(
                "text-xs leading-5 font-medium tabular-nums",
                value ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {value ?? "—"}
            </p>
            {prazo && (
              // Prazo relativo (DS §13): "Hoje", "Amanhã", "10 de out". Só o
              // vencido ganha cor — é o estado "urgente" do cartão.
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 text-xs tabular-nums",
                  prazo.vencido ? "text-danger-foreground font-medium" : "text-muted-foreground",
                )}
                title={`${t("Fechamento previsto")}: ${prazo.completo}`}
                data-prazo-do-card
              >
                <CalendarBlank size={12} aria-hidden />
                {prazo.texto}
              </span>
            )}
          </div>

          {/* Etiquetas (DS §10.23): chips de tom, gap 6, até 128px cada,
              truncadas. A lista inteira segue no `title` do card. */}
          {etiquetasVisiveis.length > 0 && (
            <ul
              className="mt-1.5 flex h-5 items-center gap-1.5 overflow-hidden"
              aria-label={t("Tags")}
            >
              {etiquetasVisiveis.map((tag) => (
                <li
                  key={tag}
                  className={cn(
                    "inline-flex h-5 max-w-32 shrink-0 items-center rounded-md px-1.5 text-xs font-medium",
                    TOM_SUAVE[tomDe(tag)],
                  )}
                  title={tag}
                >
                  <span className="truncate">{tag}</span>
                </li>
              ))}
              {etiquetasEscondidas > 0 && (
                <li className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  +{etiquetasEscondidas}
                </li>
              )}
            </ul>
          )}

          {/* ③ a linha do agente — um slot, três estados, nunca três blocos. */}
          <div className="mt-1.5 flex h-6 items-center gap-2 text-xs">
            {state.slot.type === "awaiting" && (
              // A proposta do agente é a ÚNICA linha do card com ação: é o
              // ponto onde a decisão do humano entra. Sem os botões aqui, o
              // texto seria só mais um aviso — e a wave existe porque avisar
              // sem poder decidir é o que já acontecia (o dado ficava no banco).
              <NextActionSlot
                label={state.slot.label}
                leadId={card.id}
                approvedSeq={lead.next_action?.seq ?? -1}
                pipelineId={pipelineId}
              />
            )}
            {state.slot.type === "reactivation" && (
              // O negócio parou E aqui está o que fazer. Mesma faixa, mesma
              // altura: o card não cresce quando o sistema tem algo a propor.
              <ReactivationSlot
                leadId={card.id}
                proposalId={state.slot.proposalId}
                expiresAt={state.slot.expiresAt}
                pipelineId={pipelineId}
              />
            )}
            {state.slot.type === "cooling" && (
              // -fg é a variante de TEXTO do token (o -warning puro dá 3.7:1 em
              // 12px); a cor cheia fica na borda de estado, que é gráfica.
              <span className="text-warning-foreground truncate">{state.slot.label}</span>
            )}
            {state.slot.type === "meter" && (
              <ScoreSlot
                probability={state.slot.probability}
                band={state.slot.band}
                reason={state.slot.reason}
                factors={state.slot.factors}
              />
            )}
          </div>

          {/* A última mensagem, com atalho para o inbox. Fica ANTES do rodapé
              de dono/tempo porque é conteúdo do negócio, não metadado do card —
              e some por inteiro quando não há conversa. */}
          <ConversaSlot
            conversa={lead.conversa}
            contactId={lead.contact_id}
            phone={lead.contact_phone}
          />

          {/* Telefone, e-mail e links do contato — some por inteiro quando o
              negócio não tem nada disso, como a conversa acima. */}
          <ContatoNoCard lead={lead} />

          {/* ④ dono (+ selo de tarefas) · ⑤ tempo no estágio */}
          <div className="mt-1 flex h-6 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <OwnerBadge
                ownerKind={card.owner.kind}
                ownerName={card.owner.name}
                agentVersion={card.owner.agentVersion}
              />
              <TarefasNoCard tarefas={lead.tarefas} />
            </div>
            <span className="min-w-0 truncate text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {state.showStageAge && age
                ? `${age} ${t("em")} ${card.stageName}`
                : `${t("em")} ${card.stageName}`}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
