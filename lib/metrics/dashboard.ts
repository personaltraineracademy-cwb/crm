/**
 * O Dashboard (tela `/app/radar`) — tipos do que a RPC `fn_dashboard_de_leads`
 * (migration 0762) devolve e as contas PURAS que a tela faz em cima.
 *
 * A contagem inteira é do SQL; aqui só mora o que a consulta não faz: escolher
 * a janela, comparar com o período anterior, achar a etapa que mais segura
 * lead e dar forma de texto a um número. `null` continua `null` — "ainda sem
 * resposta" nunca vira "respondeu em 0s".
 */

export type PeriodoDoDashboard = "hoje" | "7d" | "30d" | "90d";

export const PERIODOS: ReadonlyArray<{ value: PeriodoDoDashboard; dias: number }> = [
  { value: "hoje", dias: 1 },
  { value: "7d", dias: 7 },
  { value: "30d", dias: 30 },
  { value: "90d", dias: 90 },
];

export interface TotaisDoDashboard {
  leads: number;
  ganhos: number;
  perdidos: number;
  abertos: number;
  valor_ganho_cents: number;
  respondidos: number;
  sem_resposta: number;
  media_resposta_segundos: number | null;
  mediana_resposta_segundos: number | null;
}

export interface OrigemDoDashboard {
  origem: string;
  meio: string | null;
  campanha: string | null;
  leads: number;
  ganhos: number;
}

export interface EtapaDoDashboard {
  stage_id: string;
  stage_name: string;
  position: number;
  pipeline_id: string;
  pipeline_name: string;
  pipeline_is_default: boolean;
  abertos: number;
  parados: number;
  sem_dono: number;
  valor_cents: number;
}

export interface LeadDoDashboard {
  id: string;
  title: string;
  created_at: string;
  status: string;
  stage_name: string | null;
  origem: string;
  campanha: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  tem_dono: boolean;
  resposta_segundos: number | null;
  respondido_por: "pessoa" | "assistente" | null;
}

export interface DashboardDeLeads {
  window: { from: string; to: string };
  totais: TotaisDoDashboard;
  leads_periodo_anterior: number;
  por_dia: Array<{ dia: string; leads: number }>;
  origens: OrigemDoDashboard[];
  etapas: EtapaDoDashboard[];
  leads: LeadDoDashboard[];
}

export const TOTAIS_VAZIOS: TotaisDoDashboard = {
  leads: 0,
  ganhos: 0,
  perdidos: 0,
  abertos: 0,
  valor_ganho_cents: 0,
  respondidos: 0,
  sem_resposta: 0,
  media_resposta_segundos: null,
  mediana_resposta_segundos: null,
};

/**
 * A janela do período, no relógio de quem olha: começa à meia-noite LOCAL de
 * `dias - 1` dias atrás e termina agora. "Hoje" é de meia-noite até agora;
 * "7 dias" inclui hoje e os seis dias anteriores.
 */
export function janelaDoPeriodo(
  periodo: PeriodoDoDashboard,
  agora: Date = new Date(),
): { from: string; to: string } {
  const dias = PERIODOS.find((p) => p.value === periodo)?.dias ?? 30;
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - (dias - 1));
  return { from: inicio.toISOString(), to: agora.toISOString() };
}

/**
 * A variação contra o período anterior, em porcentagem inteira. `null` quando
 * o anterior foi zero: de 0 para 12 não é "+∞%", é "sem base de comparação".
 */
export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (!Number.isFinite(atual) || !Number.isFinite(anterior) || anterior <= 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

/** Parte de um todo, em porcentagem inteira; `null` com o todo vazio. */
export function porcentagem(parte: number, todo: number): number | null {
  if (!Number.isFinite(parte) || !Number.isFinite(todo) || todo <= 0) return null;
  return Math.round((parte / todo) * 100);
}

/**
 * Duração para leigo: "45s", "12min", "3h 20min", "2d 4h". `null` vira "—".
 * Diferente de `formatarDuracao` de `canais.ts`, que para em minutos: a
 * resposta de um lead pode levar dias, e "4320min" não é leitura de ninguém.
 */
export function duracaoLegivel(segundos: number | null | undefined): string {
  if (segundos == null || !Number.isFinite(segundos)) return "—";
  const s = Math.max(0, Math.round(segundos));
  if (s < 60) return `${s}s`;
  const min = Math.floor(s / 60);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const restoMin = min % 60;
  if (h < 24) return restoMin === 0 ? `${h}h` : `${h}h ${restoMin}min`;
  const d = Math.floor(h / 24);
  const restoH = h % 24;
  return restoH === 0 ? `${d}d` : `${d}d ${restoH}h`;
}

/** As etapas de um funil, na ordem do quadro. */
export function etapasDoFunil(etapas: EtapaDoDashboard[], pipelineId: string | null): EtapaDoDashboard[] {
  return etapas
    .filter((e) => pipelineId === null || e.pipeline_id === pipelineId)
    .sort((a, b) => a.position - b.position || a.stage_name.localeCompare(b.stage_name));
}

/** Os funis presentes, na ordem em que a consulta os devolveu (posição do funil). */
export function funisDoDashboard(
  etapas: EtapaDoDashboard[],
): Array<{ id: string; name: string; is_default: boolean }> {
  const vistos = new Map<string, { id: string; name: string; is_default: boolean }>();
  for (const e of etapas) {
    if (!vistos.has(e.pipeline_id)) {
      vistos.set(e.pipeline_id, {
        id: e.pipeline_id,
        name: e.pipeline_name,
        is_default: e.pipeline_is_default,
      });
    }
  }
  return [...vistos.values()];
}

/** O funil que a tela abre: o padrão, senão o primeiro; `null` sem funil nenhum. */
export function funilInicial(etapas: EtapaDoDashboard[]): string | null {
  const funis = funisDoDashboard(etapas);
  return (funis.find((f) => f.is_default) ?? funis[0])?.id ?? null;
}

/**
 * A etapa que mais segura lead parado — o gargalo. `null` quando ninguém está
 * parado: destacar uma etapa com zero seria inventar problema.
 */
export function etapaGargalo(etapas: EtapaDoDashboard[]): EtapaDoDashboard | null {
  let pior: EtapaDoDashboard | null = null;
  for (const e of etapas) {
    if (e.parados > 0 && (pior === null || e.parados > pior.parados)) pior = e;
  }
  return pior;
}

/** Normaliza o jsonb da RPC: campo ausente vira vazio, nunca `undefined` na tela. */
export function normalizarDashboard(
  bruto: Partial<Omit<DashboardDeLeads, "window">> | null | undefined,
): Omit<DashboardDeLeads, "window"> {
  const b = bruto ?? {};
  return {
    totais: { ...TOTAIS_VAZIOS, ...(b.totais ?? {}) },
    leads_periodo_anterior: Number(b.leads_periodo_anterior) || 0,
    por_dia: Array.isArray(b.por_dia) ? b.por_dia : [],
    origens: Array.isArray(b.origens) ? b.origens : [],
    etapas: Array.isArray(b.etapas) ? b.etapas : [],
    leads: Array.isArray(b.leads)
      ? b.leads.map((l) => ({ ...l, owner_name: l.owner_name ?? null }))
      : [],
  };
}
