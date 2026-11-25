/**
 * AS ATIVIDADES DE UM NEGÓCIO, como a aba "Atividades" do painel as mostra.
 *
 * "Atividade" é a tarefa (`crm_tasks`) presa ao negócio: o mesmo registro da
 * tela de Tarefas, sem tabela nova. O que esta aba acrescenta é só LEITURA:
 *
 *   - o progresso ("1 de 3 concluídas"), que conta as concluídas sobre as que
 *     ainda valem (cancelada não conta nem como feita nem como pendente);
 *   - a separação entre próximas (por prazo) e encerradas;
 *   - o "Dia N": em que dia DO NEGÓCIO a atividade vence, contando o dia em que
 *     ele foi criado como Dia 1. É o que deixa uma sequência de follow-up
 *     legível ("Dia 1, Dia 3, Dia 7") sem gravar campo novo.
 *
 * Funções puras, com o relógio como parâmetro: o teste fixa o "agora".
 */
import { estaAtrasada, estaEncerrada, type Tarefa } from "./tipos";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Meia-noite local do dia de `iso`. Dia de calendário, não janela de 24h. */
function inicioDoDia(iso: string | Date): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Em que dia do negócio a atividade vence (Dia 1 = o dia em que o negócio foi
 * criado). Sem prazo, ou com data ilegível, não há dia: `null`. Prazo antes da
 * criação do negócio (tarefa antiga religada a ele) fica no Dia 1, nunca em
 * "Dia 0" ou negativo.
 */
export function diaDoNegocio(
  prazo: string | null | undefined,
  criadoEm: string | null | undefined,
): number | null {
  if (!prazo || !criadoEm) return null;
  const p = Date.parse(prazo);
  const c = Date.parse(criadoEm);
  if (Number.isNaN(p) || Number.isNaN(c)) return null;
  const dias = Math.round((inicioDoDia(prazo) - inicioDoDia(criadoEm)) / UM_DIA_MS);
  return Math.max(1, dias + 1);
}

/** Dias inteiros desde `desde` até `agora` (0 = hoje). Data ilegível = `null`. */
export function diasDesde(desde: string | null | undefined, agora: Date = new Date()): number | null {
  if (!desde || Number.isNaN(Date.parse(desde))) return null;
  return Math.max(0, Math.round((inicioDoDia(agora) - inicioDoDia(desde)) / UM_DIA_MS));
}

export interface ProgressoDasAtividades {
  concluidas: number;
  total: number;
  /** 0 a 100, inteiro. Sem atividade nenhuma, 0. */
  porcentagem: number;
}

export function progressoDasAtividades(
  tarefas: readonly Pick<Tarefa, "status">[],
): ProgressoDasAtividades {
  const validas = tarefas.filter((t) => t.status !== "cancelled");
  const concluidas = validas.filter((t) => t.status === "done").length;
  const total = validas.length;
  return {
    concluidas,
    total,
    porcentagem: total === 0 ? 0 : Math.round((concluidas / total) * 100),
  };
}

export interface AtividadesSeparadas<T> {
  /** O que ainda pede ação: prazo mais próximo primeiro, sem prazo no fim. */
  proximas: T[];
  /** Concluídas e canceladas: a mais recente primeiro. */
  encerradas: T[];
}

export function separarAtividades<
  T extends Pick<Tarefa, "id" | "status" | "due_date" | "created_at" | "updated_at">,
>(tarefas: readonly T[]): AtividadesSeparadas<T> {
  const proximas = tarefas.filter((t) => !estaEncerrada(t));
  const encerradas = tarefas.filter((t) => estaEncerrada(t));
  proximas.sort((a, b) => {
    const pa = a.due_date ? Date.parse(a.due_date) : Number.POSITIVE_INFINITY;
    const pb = b.due_date ? Date.parse(b.due_date) : Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa < pb ? -1 : 1;
    return Date.parse(a.created_at) - Date.parse(b.created_at) || (a.id < b.id ? -1 : 1);
  });
  encerradas.sort(
    (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at) || (a.id < b.id ? -1 : 1),
  );
  return { proximas, encerradas };
}

/**
 * A atividade que o painel abre ao chegar: a escolhida, se ainda existir; senão
 * a próxima a vencer; senão a última encerrada; senão nenhuma.
 */
export function atividadeEmFoco<T extends { id: string }>(
  separadas: AtividadesSeparadas<T>,
  escolhida: string | null,
): T | null {
  const todas = [...separadas.proximas, ...separadas.encerradas];
  return (
    (escolhida ? todas.find((t) => t.id === escolhida) : undefined) ??
    separadas.proximas[0] ??
    separadas.encerradas[0] ??
    null
  );
}

export { estaAtrasada };
