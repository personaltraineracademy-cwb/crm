"use client";

import { useMemo, useState } from "react";

import { FormularioDeTarefa } from "@/app/app/tasks/_components/FormularioDeTarefa";
import { useUser } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { useAssignableMembers } from "@/hooks/inbox/useAssignableMembers";
import { useTasks } from "@/hooks/tasks/useTasks";
import {
  atividadeEmFoco,
  diaDoNegocio,
  estaAtrasada,
  progressoDasAtividades,
  separarAtividades,
} from "@/lib/tarefas/atividades-do-negocio";
import { estaEncerrada, type NovaTarefa, type Tarefa } from "@/lib/tarefas/tipos";
import { CaretDown, CaretRight, CheckSquare, PencilSimple, Plus, Square, Trash } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

import { AplicarPlanoNoNegocio } from "../AplicarPlanoNoNegocio";

/**
 * A ABA "ATIVIDADES" do painel do negócio — o sistema de tarefas do vendedor
 * (desenho de referência).
 *
 * À esquerda, a lista: progresso, "Escolher template" (os Planos de tarefa que
 * já existem), as próximas atividades por prazo e as concluídas recolhidas. À
 * direita, a atividade em foco: o roteiro (a descrição da tarefa), "Concluir
 * atividade" e "Editar".
 *
 * Nada novo no banco: a atividade é a `crm_tasks` presa ao negócio, criada,
 * editada e concluída pelas MESMAS rotas e pelo MESMO formulário da tela de
 * Tarefas. A regra de leitura (dia do negócio, progresso, ordem) mora em
 * `lib/tarefas/atividades-do-negocio.ts`, com teste.
 */
interface Props {
  leadId: string;
  /** O contato do negócio vai junto na atividade nova. */
  contactId: string | null;
  /** Quando o negócio nasceu: é o "Dia 1" da contagem. */
  criadoEm: string;
  /** `agent`+, a mesma régua da rota de tarefas. */
  podeEditar: boolean;
  /** O painel aberto. Fechado, a consulta não sai. */
  aberto: boolean;
  /**
   * Alguém pediu "Criar tarefa" de fora (o rodapé do card): o formulário de
   * atividade nova abre UMA vez nesta montagem. Quem pede é o quadro, que
   * esquece o pedido ao trocar de negócio ou fechar o painel.
   */
  novaPedida?: boolean;
}

export function AtividadesDoNegocio({
  leadId,
  contactId,
  criadoEm,
  podeEditar,
  aberto,
  novaPedida = false,
}: Props) {
  const t = useT();
  const tag = useTagDeIdioma();
  const usuario = useUser();
  const { tarefas, carregando, falhou, criarTarefa, editarTarefa, apagarTarefa, alternarConcluida } =
    useTasks({ lead_id: leadId }, { enabled: aberto });
  const membros = useAssignableMembers(aberto);

  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [concluidasAbertas, setConcluidasAbertas] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Tarefa | null>(null);
  const [aberturas, setAberturas] = useState(0);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // Pedido de fora ("+ Criar tarefa" no card): abre o formulário UMA vez.
  // Ajuste de estado no render (o padrão que o React documenta), sem efeito.
  const [pedidoAtendido, setPedidoAtendido] = useState(false);
  if (novaPedida && !pedidoAtendido && podeEditar) {
    setPedidoAtendido(true);
    setEmEdicao(null);
    setAberturas((n) => n + 1);
    setFormAberto(true);
  }

  const separadas = useMemo(() => separarAtividades(tarefas), [tarefas]);
  const foco = atividadeEmFoco(separadas, escolhida);
  const progresso = progressoDasAtividades(tarefas);

  const nomeDe = (userId: string | null) =>
    userId ? (membros.data?.find((m) => m.user_id === userId)?.full_name ?? null) : null;

  const dataCurta = (iso: string) =>
    new Date(iso).toLocaleDateString(tag, { day: "2-digit", month: "2-digit" });
  const dataLonga = (iso: string) =>
    new Date(iso).toLocaleString(tag, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  function abrirNova() {
    setEmEdicao(null);
    setAberturas((n) => n + 1);
    setFormAberto(true);
  }

  function abrirEdicao(tarefa: Tarefa) {
    setEmEdicao(tarefa);
    setAberturas((n) => n + 1);
    setFormAberto(true);
  }

  async function salvar(entrada: NovaTarefa) {
    if (emEdicao) await editarTarefa(emEdicao.id, entrada);
    else await criarTarefa(entrada);
  }

  async function alternar(tarefa: Tarefa) {
    setOcupado(true);
    try {
      await alternarConcluida(tarefa);
    } finally {
      setOcupado(false);
    }
  }

  async function apagar(tarefa: Tarefa) {
    setOcupado(true);
    try {
      await apagarTarefa(tarefa.id);
      setEscolhida(null);
      setConfirmarApagar(false);
    } finally {
      setOcupado(false);
    }
  }

  // Função que devolve JSX, e não componente: um componente declarado dentro
  // do render seria um tipo NOVO a cada render e remontaria a lista inteira.
  function linha(tarefa: Tarefa) {
    const dia = diaDoNegocio(tarefa.due_date, criadoEm);
    const atrasada = estaAtrasada(tarefa);
    const encerrada = estaEncerrada(tarefa);
    const emFoco = foco?.id === tarefa.id;
    return (
      <li
        key={tarefa.id}
        className={cn(
          "relative flex items-center gap-3 rounded-lg py-2 pr-2 pl-3 transition-colors",
          emFoco ? "bg-muted" : "hover:bg-muted/60",
        )}
        data-atividade={tarefa.id}
        data-em-foco={emFoco || undefined}
      >
        {emFoco && (
          <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
        )}
        <span className="w-6 shrink-0 text-center text-xs text-muted-foreground tabular-nums">
          {dia ?? "—"}
        </span>
        <button
          type="button"
          disabled={!podeEditar || ocupado}
          onClick={() => void alternar(tarefa)}
          aria-label={
            encerrada
              ? `${t("Reabrir")}: ${tarefa.title}`
              : `${t("Concluir")}: ${tarefa.title}`
          }
          title={encerrada ? t("Reabrir") : t("Concluir")}
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-default",
            encerrada
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-foreground",
          )}
        >
          {encerrada ? <CheckSquare size={14} aria-hidden /> : <Square size={14} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => {
            setEscolhida(tarefa.id);
            setConfirmarApagar(false);
          }}
          className={cn(
            "min-w-0 flex-1 truncate text-left text-sm focus-visible:outline-2 focus-visible:outline-ring",
            encerrada ? "text-muted-foreground line-through" : "text-foreground",
          )}
          aria-current={emFoco ? "true" : undefined}
        >
          {tarefa.title}
        </button>
        {tarefa.due_date && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 text-xs tabular-nums",
              atrasada ? "text-danger-foreground" : "text-muted-foreground",
            )}
            title={dataLonga(tarefa.due_date)}
          >
            {dataCurta(tarefa.due_date)}
            {atrasada && (
              <span aria-label={t("Atrasada")} className="size-1.5 rounded-full bg-danger" />
            )}
          </span>
        )}
      </li>
    );
  }

  return (
    <div
      className="grid min-h-0 flex-1 gap-6 md:grid-cols-[minmax(18rem,22rem)_1fr]"
      data-aba-atividades
    >
      {/* ─── A lista ─────────────────────────────────────────────────────── */}
      <section className="flex min-h-0 flex-col gap-4 md:border-r md:border-border md:pr-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{t("Atividades")}</h3>
          {podeEditar && (
            <button
              type="button"
              onClick={abrirNova}
              aria-label={t("Nova atividade")}
              title={t("Nova atividade")}
              className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Plus size={16} aria-hidden />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2" data-progresso-das-atividades>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{progresso.concluidas}</span>{" "}
              {t("de")} {progresso.total}{" "}
              {progresso.total === 1 ? t("concluída") : t("concluídas")}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {progresso.porcentagem}%
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progresso.porcentagem}
            aria-label={t("Atividades concluídas")}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progresso.porcentagem}%` }}
            />
          </div>
        </div>

        {podeEditar && (
          <AplicarPlanoNoNegocio
            leadId={leadId}
            aberto={aberto}
            rotulo={t("Escolher template")}
            classeDoGatilho="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          />
        )}

        {falhou ? (
          <p className="text-sm text-destructive">{t("Não foi possível carregar as atividades.")}</p>
        ) : carregando ? (
          <p className="text-sm text-muted-foreground" aria-busy>
            {t("Carregando…")}
          </p>
        ) : (
          <div className="flex min-h-0 flex-col gap-1 overflow-y-auto">
            <div className="flex items-center gap-3 px-3 pb-1 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
              <span className="w-6 text-center">{t("Dia")}</span>
              <span>{t("Próximas atividades")}</span>
            </div>
            {separadas.proximas.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {tarefas.length === 0
                  ? t("Nenhuma atividade ainda. Crie a primeira ou escolha um template.")
                  : t("Tudo em dia: nenhuma atividade pendente.")}
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {separadas.proximas.map((tarefa) => linha(tarefa))}
              </ul>
            )}

            {separadas.encerradas.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setConcluidasAbertas((v) => !v)}
                  aria-expanded={concluidasAbertas}
                  className="flex items-center gap-2 px-1 py-1 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground"
                >
                  {concluidasAbertas ? (
                    <CaretDown size={12} aria-hidden />
                  ) : (
                    <CaretRight size={12} aria-hidden />
                  )}
                  {t("Concluídas")}
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[0.6875rem] normal-case tabular-nums">
                    {separadas.encerradas.length}
                  </span>
                </button>
                {concluidasAbertas && (
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {separadas.encerradas.map((tarefa) => linha(tarefa))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── A atividade em foco ─────────────────────────────────────────── */}
      <section className="flex min-h-[20rem] flex-col" data-atividade-em-foco={foco?.id}>
        {foco ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <CheckSquare size={14} aria-hidden />
              <span>{t("Tarefa")}</span>
              {diaDoNegocio(foco.due_date, criadoEm) !== null && (
                <span>
                  {t("Dia")} {diaDoNegocio(foco.due_date, criadoEm)}
                </span>
              )}
              {(foco.priority === "high" || foco.priority === "urgent") && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 normal-case tracking-normal",
                    foco.priority === "urgent"
                      ? "bg-danger-soft text-danger-foreground"
                      : "bg-warning-soft text-warning-foreground",
                  )}
                >
                  {foco.priority === "urgent" ? t("Urgente") : t("Alta prioridade")}
                </span>
              )}
              {estaEncerrada(foco) && (
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 normal-case tracking-normal text-foreground">
                  {foco.status === "cancelled" ? t("Cancelada") : t("Concluída")}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{foco.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {foco.due_date ? (
                <span className={cn(estaAtrasada(foco) && "text-danger-foreground")}>
                  {estaAtrasada(foco) ? t("Venceu") : t("Vence")} {dataLonga(foco.due_date)}
                </span>
              ) : (
                t("Sem prazo")
              )}
              {" · "}
              {nomeDe(foco.assigned_to) ?? t("Sem responsável")}
            </p>

            <div className="mt-6 flex-1">
              {foco.description?.trim() ? (
                <div
                  className="rounded-xl border border-border bg-card p-4 text-sm leading-6 whitespace-pre-wrap text-foreground"
                  data-roteiro-da-atividade
                >
                  {foco.description}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground italic">
                  {t("Esta atividade não possui um roteiro configurado.")}
                  {podeEditar && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => abrirEdicao(foco)}
                        className="text-foreground not-italic underline-offset-2 hover:underline"
                      >
                        {t("Escrever o roteiro")}
                      </button>
                    </>
                  )}
                </p>
              )}
            </div>

            {podeEditar && (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void alternar(foco)}
                  className={cn(
                    "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring",
                    estaEncerrada(foco)
                      ? "border border-border bg-card text-foreground hover:bg-muted"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  <CheckSquare size={16} aria-hidden />
                  {estaEncerrada(foco) ? t("Reabrir atividade") : t("Concluir atividade")}
                </button>
                <button
                  type="button"
                  onClick={() => abrirEdicao(foco)}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring sm:w-56"
                >
                  <PencilSimple size={16} aria-hidden />
                  {t("Editar")}
                </button>
                {confirmarApagar ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t("Apagar esta atividade?")}</span>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void apagar(foco)}
                      className="rounded-lg bg-destructive px-3 py-2 font-medium text-destructive-foreground"
                    >
                      {t("Apagar")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmarApagar(false)}
                      className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted"
                    >
                      {t("Cancelar")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmarApagar(true)}
                    aria-label={`${t("Apagar")}: ${foco.title}`}
                    title={t("Apagar atividade")}
                    className="flex h-12 items-center justify-center rounded-xl px-4 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Trash size={16} aria-hidden />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          !carregando &&
          !falhou && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t("Este negócio ainda não tem atividades.")}
              </p>
              {podeEditar && (
                <button
                  type="button"
                  onClick={abrirNova}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus size={16} aria-hidden />
                  {t("Criar atividade")}
                </button>
              )}
            </div>
          )
        )}
      </section>

      <FormularioDeTarefa
        key={aberturas}
        aberto={formAberto}
        aoMudarAbertura={setFormAberto}
        tarefa={emEdicao}
        aoSalvar={salvar}
        leadId={leadId}
        contactId={contactId}
        responsavelPadrao={usuario.id}
      />
    </div>
  );
}
