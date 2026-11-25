"use client";

import { TituloEditavel, ValorEditavel } from "./CabecalhoEditavel";
import { OrigemDoLead } from "@/components/contacts/OrigemDoLead";
import { origemDoNegocio } from "@/lib/leads/origem-resumida";
import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { useLayoutEffect, useRef, useState } from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AtividadesDoNegocio } from "./dossie/AtividadesDoNegocio";
import { EmpresaDoNegocio } from "./dossie/EmpresaDoNegocio";
import { EtapasEmSeta } from "./dossie/EtapasEmSeta";
import { MensagensDoNegocio } from "./dossie/MensagensDoNegocio";
import { NotasDoNegocio } from "./dossie/NotasDoNegocio";
import { diasDesde } from "@/lib/tarefas/atividades-do-negocio";
import { useLeadTimeline } from "@/hooks/leads/useLeadTimeline";
import type { Lead } from "@/lib/types/leads";
import type { Stage } from "@/lib/kanban/types";
import { ContatoDoNegocio } from "./ContatoDoNegocio";
import { LeadFieldsForm } from "./LeadFieldsForm";
import { ScoreSlot } from "./ScoreSlot";
import { LeadTimeline } from "./LeadTimeline";
import { PropostasDoNegocio } from "./PropostasDoNegocio";
import { OwnerBadge } from "./OwnerBadge";
import { EtapaNoDossie } from "./EtapaNoDossie";
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
   * etapa, de cima para baixo), sem fechar o painel. Ausente quando quem abre
   * não tem lista (o calendário): as setas nem aparecem.
   *
   * Um objeto só, com as duas ações OBRIGATÓRIAS, de propósito: posição e
   * ações chegam juntas ou não chegam. Eram três props opcionais soltas, com
   * `disabled={!onAnterior}` — a forma que `tests/unit/controle-decorativo.test.ts`
   * persegue, porque esquecer a callback deixa o botão cinza para sempre com
   * cara de regra. Aqui a seta desliga pelo motivo verdadeiro, que é a POSIÇÃO:
   * não há negócio antes do primeiro nem depois do último.
   */
  navegacao?: {
    /** "3 de 25": onde este negócio está na lista que as setas percorrem. */
    atual: number;
    total: number;
    irParaAnterior: () => void;
    irParaProximo: () => void;
  };
  /** O nome do funil, para o caminho "FUNIL / ETAPA" do topo. */
  nomeDoFunil?: string;
  /**
   * O "+ Criar tarefa" do card pediu atividade nova PARA ESTE negócio: o painel
   * abre em Atividades com o formulário aberto.
   */
  novaTarefaPedida?: boolean;
}

/** As abas do painel, na ordem do desenho de referência. */
const ABAS_DO_DOSSIE = [
  "atividades",
  "mensagens",
  "contato",
  "empresa",
  "negocio",
  "notas",
  "historico",
] as const;
type AbaDoDossie = (typeof ABAS_DO_DOSSIE)[number];

function formatValor(cents: number | null, currency: string | null): string {
  // Mesma régua e mesmo locale do card e do total da coluna (`formatValorDoNegocio`).
  if (cents === null) return "—";
  return formatValorDoNegocio(cents, currency ?? MOEDA_PADRAO, { semCentavos: true });
}

/**
 * O PAINEL DO NEGÓCIO, aberto pelo card do funil (desenho de referência).
 *
 * Em abas, e não mais em seções empilhadas: Atividades (o sistema de tarefas do
 * vendedor), Mensagens (a conversa, com a caixa de envio), Contato, Empresa,
 * Negócio (os campos e as propostas), Notas e Histórico (a linha do tempo).
 * Acima das abas, a faixa de etapas em seta, que move o negócio pelo mesmo
 * caminho do quadro.
 *
 * A troca de seções por abas substitui a decisão #3181 (ordem Contato → Dados →
 * Linha do tempo, com recolhimento lembrado por navegador): com abas, cada
 * assunto tem a tela inteira e a ordem é a das abas.
 *
 * SALVAR NÃO FECHA. Quem edita precisa ver a atividade que acabou de gerar
 * entrar no histórico; fechar esconderia o registro justamente de quem o
 * produziu.
 */

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
  navegacao,
  nomeDoFunil,
  novaTarefaPedida = false,
}: Props) {
  const tagDoIdioma = useTagDeIdioma();
  const t = useT();
  // Quem abriu o dossiê (o card): o Radix devolve o foco ao GATILHO, e o card não é
  // um gatilho dele — sem isto o foco ia para o <body> ao fechar com Esc, e quem usa
  // o teclado perdia o lugar no quadro. O quadro monta o dossiê a cada abertura, e o
  // efeito de LAYOUT roda no commit da montagem, ANTES do efeito passivo em que o
  // Radix puxa o foco para dentro do painel.
  //
  // Não é inicializador de `useState`: esse roda de novo na hidratação, lendo o
  // navegador (cerca: `tests/unit/hidratacao-useState-nao-le-o-navegador.test.ts`).
  // `undefined` = ainda não medido; a guarda existe porque o modo estrito repete o
  // efeito em desenvolvimento, já com o foco dentro do painel.
  const abridor = useRef<HTMLElement | null | undefined>(undefined);
  useLayoutEffect(() => {
    if (abridor.current !== undefined) return;
    const ativo = document.activeElement;
    abridor.current = ativo instanceof HTMLElement && ativo !== document.body ? ativo : null;
  }, []);
  const timeline = useLeadTimeline(open ? lead.id : null, lead.contact_id);
  const [aba, setAba] = useState<AbaDoDossie>("atividades");
  const [salvando, setSalvando] = useState(false);
  // "Criar tarefa" vindo do card leva para Atividades. Ajuste no render, sem efeito.
  const [pedidoVisto, setPedidoVisto] = useState(false);
  if (novaTarefaPedida !== pedidoVisto) {
    setPedidoVisto(novaTarefaPedida);
    if (novaTarefaPedida) setAba("atividades");
  }
  const owner = resolveLeadOwner(lead, ownerNames);
  const score = lead.score ?? null;
  const user = useUser();
  const activeOrg = useActiveOrg();
  const podeCriarProposta =
    user.is_platform_admin || (activeOrg && ROLE_RANK[activeOrg.role] >= ROLE_RANK.manager) || false;
  const podeMoverCard = usePermission("pipeline.move_card");
  const podeEditarTarefas =
    (user.is_platform_admin && !user.support) ||
    (activeOrg ? ROLE_RANK[activeOrg.role] >= ROLE_RANK.agent : false);
  const diasNaEtapa = diasDesde(lead.stage_changed_at ?? lead.created_at);
  const anotacoes = timeline.itens.filter((i) => i.type === "note");
  const iniciais =
    lead.title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const rotuloDaAba: Record<AbaDoDossie, string> = {
    atividades: t("Atividades"),
    mensagens: t("Mensagens"),
    contato: t("Contato"),
    empresa: t("Empresa"),
    negocio: t("Negócio"),
    notas: t("Notas"),
    historico: t("Histórico"),
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size="lg"
        // O painel ocupa quase a tela toda (desenho de referência): Atividades
        // tem duas colunas e Mensagens precisa de altura para a conversa.
        className="flex flex-col sm:max-w-[min(80rem,calc(100vw-1rem))]"
        onCloseAutoFocus={(e) => {
          // O mouse não foca o card (o arrasto do quadro segura o `mousedown`): sem
          // abridor guardado, procura o card pelo id que o arrasto grava nele.
          const guardado = abridor.current;
          const card =
            guardado?.isConnected === true
              ? guardado
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
        data-refetch-divergencias={timeline.seguranca.divergencias}
        data-aba-do-dossie={aba}
      >
        <Tabs
          value={aba}
          onValueChange={(v) => setAba(v as AbaDoDossie)}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Cabeçalho FIXO: caminho, identidade, valor, dono, abas e etapas.
              Só o corpo da aba rola. */}
          <SheetHeader className="gap-3 pb-0">
            <div className="flex items-center justify-between gap-2 pr-10">
              <p
                className="min-w-0 truncate text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                data-caminho-do-negocio
              >
                {nomeDoFunil ? `${nomeDoFunil} / ${stageName}` : stageName}
              </p>
              <div className="flex shrink-0 items-center gap-0.5">
                {navegacao ? (
                  // Anterior / próximo: percorrer a fila sem fechar e reabrir o
                  // painel a cada negócio.
                  <div className="flex items-center gap-0.5" data-navegacao-do-dossie>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("Negócio anterior")}
                      title={t("Negócio anterior")}
                      className="text-muted-foreground"
                      disabled={navegacao.atual <= 1}
                      onClick={navegacao.irParaAnterior}
                    >
                      <CaretLeft size={16} aria-hidden />
                    </Button>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {navegacao.atual}/{navegacao.total}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("Próximo negócio")}
                      title={t("Próximo negócio")}
                      className="text-muted-foreground"
                      disabled={navegacao.atual >= navegacao.total}
                      onClick={navegacao.irParaProximo}
                    >
                      <CaretRight size={16} aria-hidden />
                    </Button>
                  </div>
                ) : null}
                {/* "Editar campos" leva à aba Negócio, onde mora o formulário. */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("Editar campos")}
                  title={t("Editar campos")}
                  className="shrink-0 text-muted-foreground"
                  onClick={() => setAba("negocio")}
                >
                  <PencilSimple size={16} aria-hidden />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
                >
                  {iniciais}
                </span>
                <SheetTitle className="min-w-0 text-xl leading-7 font-semibold">
                  {podeEditarTarefas ? (
                    // Edição no lugar: clicar no título vira campo; Enter grava.
                    <TituloEditavel lead={lead} pipelineId={pipelineId} />
                  ) : (
                    lead.title
                  )}
                </SheetTitle>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                <span className="text-lg">
                  {podeEditarTarefas ? (
                    <ValorEditavel lead={lead} pipelineId={pipelineId} />
                  ) : (
                    <span className="font-semibold tabular-nums text-text">
                      {formatValor(lead.value_cents, lead.currency)}
                    </span>
                  )}
                </span>
                <OwnerBadge
                  ownerKind={owner.kind}
                  ownerName={owner.name}
                  agentVersion={owner.agentVersion}
                />
                {score && (
                  <ScoreSlot
                    probability={score.probability}
                    band={score.band}
                    reason={score.reason}
                    factors={score.factors.slice(0, 3)}
                  />
                )}
              </div>
            </div>

            <TabsList variant="line" aria-label={t("Seções do negócio")}>
              {ABAS_DO_DOSSIE.map((valor) => (
                <TabsTrigger key={valor} value={valor} data-aba={valor}>
                  {rotuloDaAba[valor]}
                </TabsTrigger>
              ))}
            </TabsList>
          </SheetHeader>

          {/* As etapas: faixa de setas no computador; no celular a faixa não
              cabe, e fica o seletor de sempre. Os dois movem pelo MESMO
              `onMudarEtapa` do quadro (perda pede motivo, campo obrigatório é
              cobrado). */}
          {etapas && etapas.length > 0 && (
            <div className="border-b border-border px-4 py-3 sm:px-6">
              <div className="hidden sm:block">
                <EtapasEmSeta
                  etapas={etapas}
                  etapaAtual={lead.stage_id}
                  diasNaEtapa={diasNaEtapa}
                  podeMover={podeMoverCard && !!onMudarEtapa}
                  onMudar={onMudarEtapa}
                />
              </div>
              <div className="text-xs sm:hidden">
                {onMudarEtapa ? (
                  <EtapaNoDossie
                    etapaAtual={lead.stage_id}
                    etapas={etapas}
                    podeMover={podeMoverCard}
                    onMudar={onMudarEtapa}
                  />
                ) : (
                  <span className="text-text-muted">{stageName}</span>
                )}
              </div>
            </div>
          )}

          {/* `key` = o negócio: andar pelas setas troca o negócio sem fechar o
              painel, e o que cada aba guarda (rascunho da nota, atividade em
              foco) não pode vazar de um negócio para o outro. */}
          <SheetBody key={lead.id} className="flex min-h-0 flex-1 flex-col pt-4">
            <TabsContent value="atividades" className="flex min-h-0 flex-1 flex-col">
              <AtividadesDoNegocio
                leadId={lead.id}
                contactId={lead.contact_id}
                criadoEm={lead.created_at}
                podeEditar={podeEditarTarefas}
                aberto={open}
                novaPedida={novaTarefaPedida}
              />
            </TabsContent>

            <TabsContent value="mensagens" className="flex min-h-0 flex-1 flex-col">
              <MensagensDoNegocio lead={lead} aberto={open && aba === "mensagens"} />
            </TabsContent>

            <TabsContent value="contato">
              {/* Os dados do CLIENTE (telefone, e-mail, links), as pessoas
                  relacionadas e de onde ele veio. Vêm do contato, não do lead. */}
              <ContatoDoNegocio
                contactId={lead.contact_id}
                pipelineId={pipelineId}
                leadId={lead.id}
              />
              <div className="mt-4 border-t border-border pt-3">
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">{t("Origem")}</h4>
                <OrigemDoLead
                  origem={origemDoNegocio(lead.contact_origem, lead.source_metadata, lead.source)}
                />
              </div>
            </TabsContent>

            <TabsContent value="empresa">
              <EmpresaDoNegocio contactId={lead.contact_id} />
            </TabsContent>

            <TabsContent value="negocio">
              {/* O formulário só monta com a aba aberta (o Radix desmonta a aba
                  fechada): nasce do valor atual do negócio, então a nota salva
                  na aba Notas não é sobrescrita por um formulário antigo. */}
              <LeadFieldsForm
                lead={lead}
                pipelineId={pipelineId}
                fieldDefs={fieldDefs}
                formId={FORMULARIO_DOS_DADOS}
                semBotoes
                onPendente={setSalvando}
              />
              <div className="mt-6">
                <PropostasDoNegocio
                  leadId={lead.id}
                  pipelineId={pipelineId}
                  podeCriar={podeCriarProposta}
                />
              </div>
            </TabsContent>

            <TabsContent value="notas">
              <NotasDoNegocio
                lead={lead}
                pipelineId={pipelineId}
                podeEditar={podeEditarTarefas}
                anotacoes={anotacoes}
              />
            </TabsContent>

            <TabsContent value="historico">
              {/* O score NÃO aparece na linha do tempo: recálculo é telemetria.
                  Sem esta linha, quem visse o número mudar no topo e nunca aqui
                  concluiria que o histórico está incompleto. */}
              {score?.at && (
                <p className="pb-3 text-xs text-text-muted">
                  {t("Probabilidade recalculada automaticamente")} ·{" "}
                  {new Date(score.at).toLocaleString(tagDoIdioma)}
                </p>
              )}
              <LeadTimeline
                itens={timeline.itens}
                chegouAoVivo={timeline.chegouAoVivo}
                isLoading={timeline.isLoading}
                isError={timeline.isError}
              />
            </TabsContent>
          </SheetBody>

          {/* O "Salvar" dos dados do negócio, no rodapé FIXO, só na aba Negócio:
              envia o formulário por `form=`. */}
          {aba === "negocio" && (
            <SheetFooter>
              <Button type="submit" form={FORMULARIO_DOS_DADOS} disabled={salvando}>
                {salvando ? t("Salvando…") : t("Salvar")}
              </Button>
            </SheetFooter>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
