import type pg from "pg";

import type { LlmEdgeConfig } from "@/lib/agent-engine/edge/llm/credentials";
import { PROVEDOR_POR_ASSINATURA } from "@/lib/ai/pontos/provedores";

/**
 * QUAL CHAVE O PAINEL POR CONVERSA USA — pedido da dona, 25/11/2026: "já tem
 * uma chave cadastrada". A organização tinha o provedor padrão na Anthropic
 * com a chave recusada (401) e uma chave da OpenAI validada, e o chat falhava.
 *
 * A regra: vale o provedor padrão da organização quando ele tem com que
 * responder (credencial validada ou chave da instalação). Quando não tem, o
 * painel usa a credencial VALIDADA mais recente de outro provedor, com um
 * modelo barato que essa chave libera. Nada muda nos agentes: a troca vale só
 * para este ponto, e só enquanto o padrão estiver sem chave.
 */
export interface CredencialDisponivel {
  id: string;
  provider: string;
  models_available: string[] | null;
}

export interface EscolhaDaChave {
  provider: string;
  credentialId: string;
  model: string;
}

/** Modelos baratos e com ferramenta, na ordem de preferência, por provedor. */
const MODELOS_DO_PAINEL: Record<string, readonly string[]> = {
  openai: ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini", "gpt-5", "gpt-4.1", "gpt-4o"],
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-sonnet-5"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro"],
};

export function escolherChaveDoPainel(input: {
  providerPadrao: string;
  padraoTemChaveDaInstalacao: boolean;
  credenciais: readonly CredencialDisponivel[];
}): EscolhaDaChave | null {
  const { providerPadrao, credenciais } = input;
  if (input.padraoTemChaveDaInstalacao) return null;
  if (credenciais.some((c) => c.provider === providerPadrao)) return null;
  for (const c of credenciais) {
    const preferidos = MODELOS_DO_PAINEL[c.provider];
    if (!preferidos) continue;
    const liberados = c.models_available ?? [];
    const model = preferidos.find((m) => liberados.length === 0 || liberados.includes(m));
    if (model) return { provider: c.provider, credentialId: c.id, model };
  }
  return null;
}

function temChaveDaInstalacao(provider: string, cfg: LlmEdgeConfig): boolean {
  if (provider === "anthropic") return Boolean(cfg.anthropicApiKey);
  if (provider === "openai") return Boolean(cfg.openaiApiKey);
  if (provider === "openrouter") return Boolean(cfg.openrouterApiKey);
  return false;
}

/** Lê o provedor padrão e as credenciais validadas da organização e decide. */
export async function chaveDoPainel(
  pool: pg.Pool,
  cfg: LlmEdgeConfig,
  organizationId: string,
): Promise<EscolhaDaChave | null> {
  try {
    const { rows: org } = await pool.query<{ provider: string | null }>(
      `select settings->'llm'->>'provider' as provider from organizations where id = $1`,
      [organizationId],
    );
    const providerPadrao = org[0]?.provider || "anthropic";
    const { rows } = await pool.query<CredencialDisponivel>(
      `select id, provider, models_available
         from ai_provider_credentials
        where organization_id = $1
          and provider <> $2
          and is_active and validated_at is not null
        order by created_at desc`,
      [organizationId, PROVEDOR_POR_ASSINATURA],
    );
    return escolherChaveDoPainel({
      providerPadrao,
      padraoTemChaveDaInstalacao: temChaveDaInstalacao(providerPadrao, cfg),
      credenciais: rows,
    });
  } catch {
    // Sem leitura, segue o caminho de sempre (o padrão da organização).
    return null;
  }
}
