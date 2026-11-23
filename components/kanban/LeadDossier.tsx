"use client";

import { TituloEditavel, ValorEditavel } from "./CabecalhoEditavel";
import { OrigemDoLead } from "@/components/contacts/OrigemDoLead";
import { origemDoNegocio } from "@/lib/leads/origem-resumida";
import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/hooks/i18n/useT";
import { useActiveOrg, usePermission, useUser } from "@/hooks/auth/AuthProvider";
import { ROLE_RANK } from "@/lib/auth/types";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CaretLeft, CaretRight, PencilSimple } from "@/lib/ui/icons";
import { useLeadTimeline } from "@/hooks/leads/useLeadTimeline";
import type { Lead } from "@/lib/types/leads";
import type { Stage } from "@/lib/kanban/types";
import { ContatoDoNegocio } from "./ContatoDoNegocio";
import { ConversaNoDossie } from "./ConversaNoDossie";
import { LeadFieldsForm } from "./LeadFieldsForm";
import { ScoreSlot } from "./ScoreSlot";
import { LeadTimeline } from "./LeadTimeline";
import { PropostasDoNegocio } from "./PropostasDoNegocio";
import { TarefasDoNegocio } from "./TarefasDoNegocio";
import { OwnerBadge } from "./OwnerBadge";
import { EtapaNoDossie } from "./EtapaNoDossie";
import { SecaoDoDossie, useSecoesRecolhidas } from "./SecaoDoDossie";
import { resolveLeadOwner } from "@/lib/kanban/owner";
import { formatValorDoNegocio, MOEDA_PADRAO } from "@/lib/money";
import type { CustomFieldDef } from "@/components/contacts/CustomFieldsEditor";

/** O id do formulário dos dados do negócio: o botão do rodapé o envia por `form=`. */
const FORMULARIO_DOS_DADOS = "dossie-dados-do-negocio";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead;
  pipelineId: string;
  fieldDefs?: CustomFieldDef[];
  stageName: string;
  ownerNames?: Map<string, string | null>;
  /**
   * As etapas do funil e quem move. Presentes (o quadro passa), o cabeçalho
   * troca o nome da etapa por um seletor — ver `EtapaNoDossie`. Ausentes (o
   * calendário, por enquanto), fica o texto de antes.
   */
  etapas?: Pick<Stage, "id" | "name">[];
  onMudarEtapa?: (stageId: string) => void;
  /**
   * Ir para o negócio anterior ou o próximo, na ordem do quadro (etapa por
   * etapa, de cima para baixo), sem fechar o painel. `undefined` na ponta da
   * lista ou quando quem abre não tem lista (o calendário): o botão desliga.
   */
  onAnterior?: () => void;
  onProximo?: () => void;
  /** "3 de 25": onde este negócio está na lista que as setas percorrem. */
  posicaoNaLista?: { atual: number; total: number };
}

function formatValor(cents: number | null, currency: string | null): string {
  // Mesma régua e mesmo locale do card e do total da coluna (`formatValorDoNegocio`).
  if (cents === null) return "—";
  return formatValorDoNegocio(cents, currency ?? MOEDA_PADRAO, { semCentavos: true });
}

/**
 * O dossiê do negócio: cabeçalho vivo → Contato → Dados do negócio → Linha do
 * tempo (issue #3181).
 *
 * ─── A ORDEM, e por que ela inverteu ────────────────────────────────────────
 *
 * A ordem antiga era Contato → Linha do tempo → Dados do negócio, e o argumento
 * dela era bom: quem abre um lead quer primeiro saber O QUE ACONTECEU. O que ela
 * não previu foi o crescimento da linha do tempo. Com uso real, mensagens,
 * mudanças de etapa, automações e follow-ups empurram os CAMPOS DO FUNIL para
 * baixo de uma parede de rolagem — e os campos são justamente o que se preenche
 * durante o atendimento (destino, datas, passageiros, produtos vendidos). A
 * ordem dos campos já segue a lógica do atendimento; com a linha do tempo no
 * meio, essa lógica se perdia e os campos ficavam vazios.
 *
 * A inversão não joga a linha do tempo fora: ela passa a ser a CONSULTA, depois
 * do que se PREENCHE. E as três seções viraram recolhíveis, com o estado
 * lembrado, para quem quiser o contrário de volta.
 *
 * ─── O estado lembrado é POR NAVEGADOR ──────────────────────────────────────
 *
 * A preferência que já existe (`interface_settings`) é da ORGANIZAÇÃO e exige
 * papel de admin para ser escrita — reclinar uma seção mudaria a tela de todo
 * mundo. O pedido foi "por usuário", então o estado vai para o `localStorage`
 * (ver `SecaoDoDossie.tsx`, que declara o custo). Não nasceu schema novo.
 *
 * Fora deste PR: a sugestão 3 do autor (ordem das seções configurável por
 * funil) — ela pede uma preferência por FUNIL, que hoje não existe em lugar
 * nenhum, e não caberia sem inventar schema.
 *
 * SALVAR NÃO FECHA. Quem edita precisa ver a atividade que acabou de gerar
 * entrar na timeline; fechar esconderia o registro justamente de quem o
 * produziu, e a funcionalidade que prova "sua ação fica registrada" provaria
 * isso para todo mundo menos para o autor.
 */

/** Quantas entradas a linha do tempo mostra com a seção recolhida (#3181). */
const ENTRADAS_COM_A_LINHA_RECOLHIDA = 3;

export function LeadDossier({
  open,
  onOpenChange,
  lead,
  pipelineId,
  fieldDefs = [],
  stageName,
  ownerNames,
  etapas,
  onMudarEtapa,
  onAnterior,
  onProximo,
  posicaoNaLista,
}: Props) {
  const tagDoIdioma = useTagDeIdioma();
  const t = useT();
  const campos = useRef<HTMLDivElement | null>(null);
  // Quem abriu o dossiê (o card): o Radix devolve o foco ao GATILHO, e o card não é
  // um gatilho dele — sem isto o foco ia para o <body> ao fechar com Esc, e quem usa
  // o teclado perdia o lugar no quadro. O quadro monta o dossiê a cada abertura, então
  // o inicializador roda ANTES de o Radix puxar o foco para dentro do painel.
  const [abridor] = useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null;
    const ativo = document.activeElement;
    return ativo instanceof HTMLElement && ativo !== document.body ? ativo : null;
  });
  const timeline = useLeadTimeline(open ? lead.id : null, lead.contact_id);
  const { fechadas, alternar, abrir } = useSecoesRecolhidas();
  const timelineRecolhida = fechadas.has("linha-do-tempo");
  // As três MAIS RECENTES: a rota devolve `performed_at` decrescente, então o
  // corte é no início da lista, não no fim.
  const itensDaTimeline = timelineRecolhida
    ? timeline.itens.slice(0, ENTRADAS_COM_A_LINHA_RECOLHIDA)
    : timeline.itens;
  const temMaisNaTimeline = timeline.itens.length > ENTRADAS_COM_A_LINHA_RECOLHIDA;
  // O atalho do cabeçalho precisa rolar DEPOIS de a seção estar aberta: rolar
  // num mesmo tique mediria a altura de antes, com os campos ainda escondidos.
  const [pedidoDeRolagem, setPedidoDeRolagem] = useState(0);
  // O formulário dos dados avisa quando está gravando: o botão do rodapé o espelha.
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (pedidoDeRolagem === 0) return;
    campos.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pedidoDeRolagem]);
  const owner = resolveLeadOwner(lead, ownerNames);
  const score = lead.score ?? null;
  // N1 — o atalho "Nova proposta" é manager+ (mesmo gate do envio, mesma
  // régua do BulkActionBar). O dossiê não tinha nenhuma checagem de papel;
  // esta é a primeira, no padrão já estabelecido do kanban.
  const user = useUser();
  const activeOrg = useActiveOrg();
  const podeCriarProposta =
    user.is_platform_admin || (activeOrg && ROLE_RANK[activeOrg.role] >= ROLE_RANK.manager) || false;
  // A MESMA régua do arrasto e do "Mover para…" do card (`KanbanCardActions`).
  const podeMoverCard = usePermission("pipeline.move_card");
  // Tarefas são `agent`+, a mesma régua da tela de Tarefas e da rota — e o
  // suporte temporário só lê, como lá (`requireSupportWrite`).
  const podeEditarTarefas =
    (user.is_platform_admin && !user.support) ||
    (activeOrg ? ROLE_RANK[activeOrg.role] >= ROLE_RANK.agent : false);

  /**
   * As props da linha do tempo, montadas UMA vez e usadas nos dois estados da
   * seção. Duplicar o bloco seria a maneira mais fácil de os dois divergirem —
   * e o recolhido é justamente o estado menos olhado por quem revisa.
   *
   * São as props, e não o elemento da linha do tempo já montado numa variável
   * lá em cima: `tests/unit/dossie-atalho-conversa` prova que o bloco da
   * conversa aparece ANTES da linha do tempo lendo a posição do primeiro
   * elemento dela no arquivo, e uma variável içada para o topo do componente
   * inverteria essa leitura sem nada ter mudado na tela — o teste passaria a
   * medir a posição de uma variável, e não da seção.
   */
  const propsDaLinhaDoTempo = {
    itens: itensDaTimeline,
    chegouAoVivo: timeline.chegouAoVivo,
    isLoading: timeline.isLoading,
    isError: timeline.isError,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size="lg"
        className="flex flex-col"
        onCloseAutoFocus={(e) => {
          // O mouse não foca o card (o arrasto do quadro segura o `mousedown`): sem
          // abridor guardado, procura o card pelo id que o arrasto grava nele.
          const card =
            abridor?.isConnected === true
              ? abridor
              : document.querySelector<HTMLElement>(
                  `[data-rfd-draggable-id="${CSS.escape(lead.id)}"]`,
                );
          if (card) {
            e.preventDefault();
            card.focus();
          }
        }}
        // Observável pelo mesmo motivo do board: "a assinatura morreu" e "nada
        // aconteceu" têm a mesma aparência, que é silêncio.
        data-realtime-status={timeline.realtimeStatus.toLowerCase()}
        // Observável como no board: "a entrega morreu" e "nada aconteceu"
        // têm a mesma aparência, e no dossiê a segunda é ainda mais crível —
        // negócio sem novidade é um estado normal.
        data-refetch-divergencias={timeline.seguranca.divergencias}
      >
        {/* Cabeçalho FIXO do painel (guia §4.4): título + a linha de contexto
            (valor · etapa · dono · probabilidade) e o atalho "Editar campos".
            Só o corpo rola. */}
        <SheetHeader className="gap-2">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="min-w-0 text-base leading-6">
              {podeEditarTarefas ? (
                // Edição no lugar: clicar no título vira campo; Enter grava.
                <TituloEditavel lead={lead} pipelineId={pipelineId} />
              ) : (
                lead.title
              )}
            </SheetTitle>
            {posicaoNaLista ? (
              // Anterior / próximo: percorrer a fila sem fechar e reabrir o
              // painel a cada negócio.
              <div className="ml-auto flex shrink-0 items-center gap-0.5" data-navegacao-do-dossie>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("Negócio anterior")}
                  title={t("Negócio anterior")}
                  className="text-muted-foreground"
                  disabled={!onAnterior}
                  onClick={onAnterior}
                >
                  <CaretLeft size={16} aria-hidden />
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {posicaoNaLista.atual}/{posicaoNaLista.total}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("Próximo negócio")}
                  title={t("Próximo negócio")}
                  className="text-muted-foreground"
                  disabled={!onProximo}
                  onClick={onProximo}
                >
                  <CaretRight size={16} aria-hidden />
                </Button>
              </div>
            ) : null}
            {/* Ação do cabeçalho (guia §4.4): ícone `ghost` de 32 ao lado do X, com o
                nome acessível "Editar campos" e a dica. Era um texto solto no fim da
                linha de contexto. Continua um BOTÃO com esse nome. */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("Editar campos")}
              title={t("Editar campos")}
              className="shrink-0 text-muted-foreground"
              onClick={() => {
                // Se os campos estiverem recolhidos, o clique também os abre:
                // rolar até um título fechado entregaria um destino vazio.
                abrir("dados-do-negocio");
                setPedidoDeRolagem((n) => n + 1);
              }}
            >
              <PencilSimple size={16} aria-hidden />
            </Button>
          </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {podeEditarTarefas ? (
            <ValorEditavel lead={lead} pipelineId={pipelineId} />
          ) : (
            <span className="font-medium tabular-nums text-text">
              {formatValor(lead.value_cents, lead.currency)}
            </span>
          )}
          {etapas && onMudarEtapa ? (
            <EtapaNoDossie
              etapaAtual={lead.stage_id}
              etapas={etapas}
              podeMover={podeMoverCard}
              onMudar={onMudarEtapa}
            />
          ) : (
            <span className="text-text-muted">{stageName}</span>
          )}
          <OwnerBadge
            ownerKind={owner.kind}
            ownerName={owner.name}
            agentVersion={owner.agentVersion}
          />
          {score && (
            // O MESMO componente do card, não uma cópia do medidor.
            // "Superfície nova herda as decisões da antiga" só vale como
            // mecanismo: herdar por cópia é como as duas listas do evidence —
            // funciona hoje e diverge no mês em que alguém mudar um dos dois.
            // De brinde, o rótulo honesto da âncora ("registro que sustenta",
            // nunca "momento da conversa") vem junto, sem eu reescrever nada.
            <ScoreSlot
              probability={score.probability}
              band={score.band}
              reason={score.reason}
              factors={score.factors.slice(0, 3)}
            />
          )}
        </div>
        </SheetHeader>

        <SheetBody>
        {/* O score NÃO aparece na timeline: recálculo é telemetria e não emite
            atividade (silêncio para telemetria, pulso para mudança de estado).
            Sem esta linha, quem visse o número mudando no cabeçalho e nunca na
            timeline concluiria que a timeline está incompleta. */}
        {score?.at && (
          <p className="pt-2 text-xs text-text-muted">
            {t("Probabilidade recalculada automaticamente")} ·{" "}
            {new Date(score.at).toLocaleString(tagDoIdioma)}
          </p>
        )}

        <ConversaNoDossie
          conversa={lead.conversa}
          contactId={lead.contact_id}
          phone={lead.contact_phone}
        />

        {/* ① Contato — os dados do CLIENTE: telefone e e-mail numa aba, links
            (Instagram, site, Google Meu Negócio…) na outra. Vêm do contato, não
            do lead. Primeira porque é o contexto de quem está falando. */}
        <SecaoDoDossie
          id="contato"
          titulo={t("Contato")}
          recolhida={fechadas.has("contato")}
          aoAlternar={alternar}
        >
          <ContatoDoNegocio
            contactId={lead.contact_id}
            pipelineId={pipelineId}
            leadId={lead.id}
          />
          {/* Origem — de onde este lead veio (UTM do link ou anúncio). Dentro
              de "Contato", e não em seção própria: a ordem das seções do
              dossiê é contrato (#3181), e a origem é dado de quem chegou. */}
          <div className="mt-4 border-t border-border pt-3">
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">{t("Origem")}</h4>
            <OrigemDoLead
              origem={origemDoNegocio(lead.contact_origem, lead.source_metadata, lead.source)}
            />
          </div>
        </SecaoDoDossie>

        {/* ② Dados do negócio — o que se PREENCHE, agora ANTES da linha do
            tempo (#3181). */}
        <SecaoDoDossie
          id="dados-do-negocio"
          titulo={t("Dados do negócio")}
          recolhida={fechadas.has("dados-do-negocio")}
          aoAlternar={alternar}
        >
          <div ref={campos}>
            <LeadFieldsForm
              lead={lead}
              pipelineId={pipelineId}
              fieldDefs={fieldDefs}
              formId={FORMULARIO_DOS_DADOS}
              semBotoes
              onPendente={setSalvando}
            />
          </div>
        </SecaoDoDossie>

        {/* As tarefas SEGUEM antes da linha do tempo: a timeline conta o que já
            aconteceu, a tarefa é o que ainda falta fazer — e quem abre o card
            para agir procura o próximo passo primeiro. Não entram no
            recolhimento deste PR: o autor citou as três seções acima, e tarefa
            é trabalho em curso, não consulta. */}
        <TarefasDoNegocio
          leadId={lead.id}
          contactId={lead.contact_id}
          podeEditar={podeEditarTarefas}
          aberto={open}
        />

        {/* ③ Linha do tempo — a CONSULTA, por último. Recolhida, mostra as três
            entradas mais recentes e o "ver tudo" (pedido do autor): a seção
            fecha sem deixar a pergunta "e o que aconteceu por último?" sem
            resposta. */}
        <SecaoDoDossie
          id="linha-do-tempo"
          titulo={t("Linha do tempo")}
          recolhida={timelineRecolhida}
          aoAlternar={alternar}
          className="flex-1"
          conteudoRecolhido={
            <>
              <LeadTimeline {...propsDaLinhaDoTempo} />
              {/* Só quando há o que ver: "ver tudo" numa lista de três seria um
                  botão que não leva a lugar nenhum. */}
              {temMaisNaTimeline && (
                <button
                  type="button"
                  onClick={() => alternar("linha-do-tempo")}
                  className="mt-2 text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
                >
                  {t("Ver tudo")}
                </button>
              )}
            </>
          }
        >
          <LeadTimeline {...propsDaLinhaDoTempo} />
        </SecaoDoDossie>

        {/* N1 — seção "Propostas", depois da linha do tempo. Some sozinha
            (null) quando a capacidade está desligada — ver PropostasDoNegocio. */}
        <PropostasDoNegocio
          leadId={lead.id}
          pipelineId={pipelineId}
          podeCriar={podeCriarProposta}
        />
        </SheetBody>

        {/* O "Salvar" saiu do meio do painel: mora no rodapé FIXO e envia o
            formulário dos dados do negócio por `form=` (o botão não precisa estar
            dentro dele). Só existe com a seção aberta, que é quando o formulário
            está montado. */}
        {!fechadas.has("dados-do-negocio") && (
          <SheetFooter>
            <Button type="submit" form={FORMULARIO_DOS_DADOS} disabled={salvando}>
              {salvando ? t("Salvando…") : t("Salvar")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
