import { z } from "zod";
import type pg from "pg";

import {
  runModelCall,
  tool,
  type LlmEdgeConfig,
  type ModelMessage,
} from "@/lib/agent-engine/edge/llm/run-model-call";

import {
  SISTEMA_DO_PAINEL,
  normalizarPlano,
  planoSchema,
  type PlanoDoPainel,
} from "./painel-por-conversa";
import { chaveDoPainel } from "./chave-do-painel";

/**
 * A chamada ao modelo do painel por conversa (ponto `dashboard_assistant`).
 *
 * Passa pelo MESMO seam do assistente de propostas (`runModelCall`): a chave
 * é a da organização quando ela cadastrou uma, e a da plataforma quando não;
 * o teto de gasto vale; a chamada fica em `llm_calls` com custo.
 *
 * O modelo recebe só o pedido da pessoa, as falas anteriores e o painel atual
 * (indicadores e títulos). Nenhum dado de cliente, número ou nome sai daqui.
 */
export interface FalaDoChat {
  quem: "pessoa" | "assistente";
  texto: string;
}

export async function montarPainel(input: {
  pedido: string;
  historico: readonly FalaDoChat[];
  painelAtual: PlanoDoPainel | null;
  pool: pg.Pool;
  cfg: LlmEdgeConfig;
  tenantId: string;
}): Promise<{ plano: PlanoDoPainel | null; motivo: "sem_painel" | "formato_inesperado" | null }> {
  const messages: ModelMessage[] = input.historico.map((f) => ({
    role: f.quem === "pessoa" ? ("user" as const) : ("assistant" as const),
    content: f.texto,
  }));
  const contexto = input.painelAtual
    ? `Painel que a pessoa está vendo agora:\n${JSON.stringify({
        titulo: input.painelAtual.titulo,
        cartoes: input.painelAtual.cartoes,
      })}`
    : "A pessoa ainda não tem painel montado.";
  messages.push({
    role: "user",
    content: `${contexto}\n\nPedido: ${input.pedido}\n\nResponda chamando a ferramenta responder.`,
  });

  // Padrão da organização sem chave que responda ⇒ a credencial validada de
  // outro provedor (ver `chave-do-painel.ts`).
  const outraChave = await chaveDoPainel(input.pool, input.cfg, input.tenantId);

  const { result } = await runModelCall(input.pool, input.cfg, {
    tenantId: input.tenantId,
    ...(outraChave
      ? {
          model: outraChave.model,
          llmOverride: { provider: outraChave.provider, credentialId: outraChave.credentialId },
        }
      : {}),
    purpose: "dashboard_assistant",
    system: SISTEMA_DO_PAINEL,
    messages,
    tools: {
      responder: tool({
        description:
          "Responde a pessoa no chat (modo resposta, até 3 indicadores) ou monta o painel completo (modo painel).",
        inputSchema: planoSchema,
        execute: async (args) => args,
      }),
    },
  });

  // Um passo só (o padrão do SDK): `result.toolCalls` do topo é seguro aqui.
  const chamada = result.toolCalls?.find((c) => c.toolName === "responder");
  if (!chamada) {
    return { plano: null, motivo: "sem_painel" };
  }
  const parsed = planoSchema.safeParse(chamada.input);
  if (!parsed.success) {
    return { plano: null, motivo: "formato_inesperado" };
  }
  return { plano: normalizarPlano(parsed.data), motivo: null };
}

export const falaSchema = z.object({
  quem: z.enum(["pessoa", "assistente"]),
  texto: z.string().trim().min(1).max(1200),
});
