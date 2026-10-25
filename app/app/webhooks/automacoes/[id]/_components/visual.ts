import type { ComponentType } from "react";

import {
  Bell,
  Brain,
  EnvelopeSimple,
  FlowArrow,
  Funnel,
  Kanban,
  ListChecks,
  PaperPlaneTilt,
  Play,
  Sparkle,
  Tag,
  UserCircle,
  UsersThree,
  WebhooksLogo,
} from "@/lib/ui/icons";

import { ACTION_LABELS, type ActionType } from "../../../_components/labels";

/**
 * A cara de cada caixa do designer — o MESMO vocabulário visual do construtor
 * de follow-up (`app/app/ai/followups/[id]/_components/nodes/nodeVisuals.ts`).
 * No tema do Unnify (`components/fluxo/tema-do-fluxo.tsx`) o tipo se distingue
 * pelo ÍCONE, num bloco `primary/10` igual para todos; a cor fica para o papel
 * na fila (Quando · Se · Então), em chip de tom. Onde a caixa é a mesma ideia
 * do follow-up (gatilho, mensagem, tarefa, tag, IA), o ícone é o mesmo.
 */
export interface VisualDaCaixa {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  /** Rótulo curto da paleta. O título da caixa é o rótulo completo da ação. */
  paleta: string;
}

export const VISUAL_DO_GATILHO: VisualDaCaixa = { icon: Play, paleta: "Gatilho" };
export const VISUAL_DAS_CONDICOES: VisualDaCaixa = { icon: Funnel, paleta: "Condições" };
/** O passo que hoje só nasce pela API: aparece, mas não está na paleta. */
export const VISUAL_DA_IA: VisualDaCaixa = { icon: Brain, paleta: "A IA decide" };

export const VISUAL_DA_ACAO: Record<ActionType, VisualDaCaixa> = {
  create_or_move_lead: { icon: Kanban, paleta: "Criar/mover lead" },
  send_whatsapp_message: { icon: PaperPlaneTilt, paleta: "Mensagem no WhatsApp" },
  send_email: { icon: EnvelopeSimple, paleta: "Enviar e-mail" },
  send_ai_message: { icon: Sparkle, paleta: "Mensagem pela IA" },
  add_tag: { icon: Tag, paleta: "Adicionar tag" },
  assign_owner: { icon: UserCircle, paleta: "Atribuir atendente" },
  call_webhook: { icon: WebhooksLogo, paleta: "Avisar outro sistema" },
  start_message_flow: { icon: FlowArrow, paleta: "Iniciar follow-up" },
  create_task: { icon: Bell, paleta: "Tarefa interna" },
  apply_task_plan: { icon: ListChecks, paleta: "Plano de tarefas" },
  // #2642 — o único destino que não é o lead: a EQUIPE. UsersThree porque quem
  // recebe é gente da casa (o WhatsApp cadastrado em Avisos). Entrada exigida
  // pelo Record<ActionType, …> da main (o tipo ganhou `notify_team` neste PR).
  notify_team: { icon: UsersThree, paleta: "Mensagem para a equipe" },
};

/** A ordem da paleta: a mesma do seletor "Adicionar ação" do editor de hoje. */
export const ACOES_DA_PALETA = Object.keys(ACTION_LABELS) as ActionType[];

export function visualDaAcao(tipo: string): VisualDaCaixa {
  if (tipo === "ai_decide") return VISUAL_DA_IA;
  return VISUAL_DA_ACAO[tipo as ActionType] ?? { icon: Play, paleta: tipo };
}
