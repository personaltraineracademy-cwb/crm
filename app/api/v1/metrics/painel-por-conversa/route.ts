/**
 * POST /api/v1/metrics/painel-por-conversa — a pessoa escreve o que quer
 * analisar; a resposta é o PLANO do painel (indicadores do catálogo, período e
 * título), nunca números. A tela busca cada número pelas rotas de sempre, com a
 * sessão de quem olha. Ver `lib/metrics/painel-por-conversa.ts`.
 *
 * Não grava nada no banco (o painel fica no navegador de quem o montou), então
 * não audita; o gasto com IA fica em `llm_calls`, como todo ponto do seam.
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { requireSupportWrite } from "@/lib/impersonate/support";
import { env } from "@/lib/env";
import { llmEdgeConfigFromEnv } from "@/lib/agent-engine/edge/llm/credentials";
import {
  LlmBudgetExceededError,
  LlmModelNotEnabledError,
  LlmProviderUnknownError,
} from "@/lib/agent-engine/edge/llm/run-model-call";
import { getSkillsPool } from "@/lib/ai/skills/db";
import { traduzir } from "@/lib/i18n/dicionario";
import { logger } from "@/lib/logger";
import { falaSchema, montarPainel } from "@/lib/metrics/assistente-do-painel";
import { planoSchema } from "@/lib/metrics/painel-por-conversa";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  pedido: z.string().trim().min(1).max(500),
  /** As últimas falas, para "agora tira o gráfico de origem" fazer sentido. */
  historico: z.array(falaSchema).max(12).default([]),
  painel_atual: planoSchema.nullable().default(null),
});

export async function POST(req: NextRequest): Promise<Response> {
  // Gasta crédito de IA da organização: quem só acompanha (suporte somente
  // leitura) não dispara gasto em nome dela.
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();
  // A MESMA régua da rota que entrega os números (`/api/v1/metrics/dashboard`).
  const authz = await requireRole("agent", { requestId, resource: "metrics" });
  if (!authz.ok) return authz.response;
  const t = (texto: string) => traduzir(texto, authz.user.idioma);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("validation_failed", t("Campos inválidos."), 422, {
      details: parsed.error.flatten().fieldErrors as Record<string, unknown>,
      requestId,
    });
  }

  try {
    const { plano, motivo } = await montarPainel({
      pedido: parsed.data.pedido,
      historico: parsed.data.historico,
      painelAtual: parsed.data.painel_atual,
      pool: getSkillsPool(),
      cfg: llmEdgeConfigFromEnv(env),
      tenantId: authz.org.orgId,
    });
    const texto =
      motivo === "sem_painel"
        ? t("O assistente não conseguiu montar o painel com esse pedido.")
        : motivo === "formato_inesperado"
          ? t("O assistente devolveu um painel em formato inesperado.")
          : null;
    return ok({ disponivel: true, plano, motivo: texto }, { requestId });
  } catch (err) {
    // Sem chave, sem modelo habilitado ou teto de gasto: a tela explica, em vez
    // de um erro genérico.
    if (
      err instanceof LlmBudgetExceededError ||
      err instanceof LlmProviderUnknownError ||
      err instanceof LlmModelNotEnabledError
    ) {
      return ok({ disponivel: false, plano: null, motivo: err.message }, { requestId });
    }
    // Qualquer outra falha do provedor (chave recusada, fora do ar, tempo
    // esgotado) também vira explicação na tela: o painel é leitura, e um 500
    // genérico deixaria a pessoa sem saber que o problema é a chave de IA.
    logger.warn("painel_por_conversa_falhou", {
      organization_id: authz.org.orgId,
      request_id: requestId,
      erro: err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300),
    });
    return ok(
      {
        disponivel: false,
        plano: null,
        motivo: t(
          "Não foi possível falar com a IA agora. Confira se a chave cadastrada em Agente de IA › Credenciais está válida.",
        ),
      },
      { requestId },
    );
  }
}
