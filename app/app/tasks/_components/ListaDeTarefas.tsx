"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/hooks/auth/AuthProvider";
import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { useT } from "@/hooks/i18n/useT";
import { useAssignableMembers } from "@/hooks/inbox/useAssignableMembers";
import {
  agrupaPorPrazo,
  estaAtrasada,
  estaEncerrada,
  type FaixaDePrazo,
  type PrioridadeDaTarefa,
  type Tarefa,
} from "@/lib/tarefas/tipos";
import { Kanban, ListChecks, PencilSimple, Trash, UserCircle } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

interface Props {
  tarefas: Tarefa[];
  podeEditar: boolean;
  aoAlternarConcluida: (tarefa: Tarefa) => Promise<unknown>;
  aoEditar: (tarefa: Tarefa) => void;
  aoApagar: (tarefa: Tarefa) => Promise<unknown>;
  /**
   * Mostrar de qual negócio é cada tarefa, com o atalho para ele. A tela de
   * Tarefas mostra; o dossiê não — lá dentro todas são do mesmo negócio, e
   * repetir o nome dele em cada linha só tomaria espaço.
   */
  mostrarNegocio?: boolean;
}

/** A cor é do TEMA, nunca um hex: ela tem de sobreviver ao claro e ao escuro. */
const COR_DA_PRIORIDADE: Record<PrioridadeDaTarefa, string> = {
  // Cor só em "alta" (aviso) e "urgente" (perigo), DS §1 e §10.23; baixa e
  // média ficam neutras para a cor continuar significando alguma coisa.
  low: "border-border bg-muted text-muted-foreground",
  medium: "border-border bg-muted text-muted-foreground",
  high: "border-warning-border bg-warning-soft text-warning-foreground",
  urgent: "border-danger-border bg-danger-soft text-danger-foreground",
};

function Linha({
  tarefa,
  podeEditar,
  aoAlternarConcluida,
  aoEditar,
  aoApagar,
  mostrarNegocio,
  nomeDoResponsavel,
}: {
  tarefa: Tarefa;
  podeEditar: boolean;
  aoAlternarConcluida: (t: Tarefa) => Promise<unknown>;
  aoEditar: (t: Tarefa) => void;
  aoApagar: (t: Tarefa) => Promise<unknown>;
  mostrarNegocio: boolean;
  /** Já resolvido por quem monta a lista; `null` = sem responsável conhecido. */
  nomeDoResponsavel: string | null;
}) {
  const t = useT();
  const tag = useTagDeIdioma();
  const [ocupada, setOcupada] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const encerrada = estaEncerrada(tarefa);
  const atrasada = estaAtrasada(tarefa);

  const rotuloDaPrioridade: Record<PrioridadeDaTarefa, string> = {
    low: t("Baixa"),
    medium: t("Média"),
    high: t("Alta"),
    urgent: t("Urgente"),
  };

  async function comBloqueio(acao: () => Promise<unknown>) {
    setOcupada(true);
    try {
      await acao();
    } finally {
      setOcupada(false);
    }
  }

  return (
    <div
      className={cn(
        "group flex min-h-14 items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
        encerrada && "opacity-60",
      )}
    >
      <Checkbox
        className="mt-0.5"
        checked={encerrada}
        aria-label={encerrada ? t("Reabrir a tarefa") : t("Marcar como concluída")}
        disabled={ocupada || !podeEditar}
        onCheckedChange={() => comBloqueio(() => aoAlternarConcluida(tarefa))}
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            encerrada && "text-muted-foreground line-through",
          )}
        >
          {tarefa.title}
        </p>
        {tarefa.description ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{tarefa.description}</p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 font-medium",
              COR_DA_PRIORIDADE[tarefa.priority],
            )}
          >
            {rotuloDaPrioridade[tarefa.priority]}
          </span>
          <span
            className={cn(
              "text-muted-foreground tabular-nums",
              atrasada && "text-danger-foreground font-semibold",
            )}
          >
            {tarefa.due_date
              ? new Date(tarefa.due_date).toLocaleString(tag, {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : t("Sem prazo")}
          </span>
          {nomeDoResponsavel ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <UserCircle size={12} aria-hidden />
              {nomeDoResponsavel}
            </span>
          ) : null}
          {mostrarNegocio && tarefa.lead ? (
            <Link
              href={`/app/leads/${tarefa.lead.id}`}
              className="flex min-w-0 max-w-[16rem] items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
              title={tarefa.lead.title}
            >
              <Kanban size={12} aria-hidden className="shrink-0" />
              <span className="truncate">{tarefa.lead.title}</span>
            </Link>
          ) : null}
        </div>
      </div>

      {podeEditar ? (
        // Escondidas até o hover SÓ onde existe hover: no toque elas ficavam
        // invisíveis. Mesma regra de `components/kanban/KanbanCardActions.tsx`.
        <div className="flex shrink-0 items-center gap-1 transition-opacity focus-within:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="md:h-7 md:w-7"
            aria-label={t("Editar a tarefa")}
            onClick={() => aoEditar(tarefa)}
          >
            <PencilSimple size={14} aria-hidden />
          </Button>
          {/*
            Confirmação em DOIS TOQUES no lugar de `confirm()`, que era o do
            original: `window.confirm` é bloqueado em iframe, ignora o tema e
            não passa por `t()` — o texto sai no idioma do navegador, não no da
            organização.
          */}
          {confirmando ? (
            <Button
              variant="destructive"
              size="sm"
              className="px-2 text-xs md:h-7"
              disabled={ocupada}
              onClick={() => comBloqueio(() => aoApagar(tarefa))}
            >
              {t("Confirmar")}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:h-7 md:w-7"
              aria-label={t("Apagar a tarefa")}
              onClick={() => setConfirmando(true)}
              onBlur={() => setConfirmando(false)}
            >
              <Trash size={14} aria-hidden />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ListaDeTarefas({
  tarefas,
  podeEditar,
  aoAlternarConcluida,
  aoEditar,
  aoApagar,
  mostrarNegocio = true,
}: Props) {
  const t = useT();
  const usuario = useUser();
  const grupos = agrupaPorPrazo(tarefas);
  // Os nomes vêm da lista de responsáveis, que é `agent`+ na rota: para quem só
  // lê, a consulta nem sai e a linha fica sem o nome — nunca com um id cru.
  const membros = useAssignableMembers(podeEditar);
  const nomes = new Map((membros.data ?? []).map((m) => [m.user_id, m.full_name]));

  function nomeDoResponsavel(tarefa: Tarefa): string | null {
    if (!tarefa.assigned_to) return null;
    if (tarefa.assigned_to === usuario.id) return t("Eu");
    return nomes.get(tarefa.assigned_to) ?? null;
  }

  const rotuloDaFaixa: Record<FaixaDePrazo, string> = {
    atrasada: t("Atrasadas"),
    hoje: t("Hoje"),
    esta_semana: t("Esta semana"),
    mais_tarde: t("Mais tarde"),
    sem_prazo: t("Sem prazo"),
    encerrada: t("Encerradas"),
  };

  if (grupos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={<ListChecks aria-hidden />}
          title={t("Nenhuma tarefa por aqui")}
          description={t(
            "Enquanto isto estiver vazio, o que foi combinado vive só na memória de alguém.",
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.faixa}>
          <h2
            className={cn(
              "mb-2 text-xs font-medium",
              grupo.faixa === "atrasada" ? "text-danger-foreground" : "text-muted-foreground",
            )}
          >
            {rotuloDaFaixa[grupo.faixa]}
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {grupo.tarefas.map((tarefa) => (
              <Linha
                key={tarefa.id}
                tarefa={tarefa}
                podeEditar={podeEditar}
                aoAlternarConcluida={aoAlternarConcluida}
                aoEditar={aoEditar}
                aoApagar={aoApagar}
                mostrarNegocio={mostrarNegocio}
                nomeDoResponsavel={nomeDoResponsavel(tarefa)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
