"use client";

import { CartaoDeRegistro } from "@/components/cartao-de-registro";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/i18n/useT";
import type { AgentRow } from "@/hooks/ai/useAgent";
import { aparenciaDoAgente } from "@/lib/ai/agents/aparencia";
import { AvatarDoAgente } from "./AvatarDoAgente";
import { AgentStatusBadge, deriveAgentStatus } from "./AgentStatusBadge";
import { AgentRowMenu } from "./AgentRowMenu";

interface Props {
  agent: AgentRow;
  canWrite: boolean;
}

/**
 * A linha do modelo, dizendo o que está EM VIGOR.
 *
 * Três casos, e cada um existe por um motivo medido:
 *
 *  1. versão publicada → é ela que o runtime lê (`agent-config.ts`), então é ela
 *     que a lista mostra. `ai_agents.model` não é sincronizado ao publicar.
 *  2. `provedor/modelo` → o formato do `rag_bot` legado, onde a coluna É a fonte.
 *  3. id nu → como todo `mcp_agent` nasce (`createMcpAgentAction` grava o id do
 *     catálogo). Antes, o `split("/")[0]` devolvia o próprio modelo e a lista
 *     renderizava "claude-sonnet-4-6 · claude-sonnet-4-6".
 */
/**
 * De ONDE saiu a linha acima — para a tela poder dizer isso a quem olha.
 *
 * Enxertado do PR #267 (@Lucas-BritoDev), que trazia a mesma informação num
 * módulo próprio. A regra ficou a desta função (é a que está em vigor e trata o
 * id nu do `mcp_agent` recém-criado); o que veio de lá é a EXPLICAÇÃO, que aqui
 * não existia: "anthropic · claude-sonnet-5" sozinho não diz se é o que atende
 * o cliente ou o que ficou no rascunho — e essa é exatamente a confusão que
 * custou uma depuração no modelo errado.
 */
export function origemDoModelo(agent: AgentRow): "versao_publicada" | "cadastro" {
  return agent.versao_publicada?.model ? "versao_publicada" : "cadastro";
}

export function modeloEmVigor(agent: AgentRow): string {
  const publicada = agent.versao_publicada;
  if (publicada?.model) {
    return publicada.provider ? `${publicada.provider} · ${publicada.model}` : publicada.model;
  }
  const cadastro = agent.model?.trim() ?? "";
  if (cadastro === "") return "—";
  if (!cadastro.includes("/")) return cadastro;
  const [provedor, ...resto] = cadastro.split("/");
  return `${provedor} · ${resto.join("/")}`;
}

/**
 * O modelo em nome de gente, SÓ para o cartão: «anthropic · claude-sonnet-5» vira
 * «Claude Sonnet 5». O que não segue o padrão (outro provedor, id desconhecido)
 * aparece como veio — nunca se inventa um nome. O valor gravado e o
 * `modeloEmVigor` (que o teste de contrato fixa) não mudam.
 */
export function modeloParaLeigo(modelo: string): string {
  const id = modelo.includes(" · ") ? modelo.split(" · ").slice(1).join(" · ") : modelo;
  const m = /^claude-(opus|sonnet|haiku|fable)-(\d+(?:-\d+)*)$/.exec(id);
  if (!m) return modelo;
  const familia = m[1].charAt(0).toUpperCase() + m[1].slice(1);
  return `Claude ${familia} ${m[2].replace(/-/g, ".")}`;
}

/** O tipo do agente em palavra de gente; o valor técnico (`kind`) segue o mesmo no banco. Tipo desconhecido aparece como veio. */
function tipoDoAgente(kind: string, t: (texto: string) => string): string {
  if (kind === "mcp_agent") return t("Agente com ferramentas");
  if (kind === "rag_bot") return t("Responde pela base de conhecimento");
  return kind;
}

export function AgentCard({ agent, canWrite }: Props) {
  const t = useT();
  const status = deriveAgentStatus(agent);

  return (
    <CartaoDeRegistro
      href={`/app/ai/agents/${agent.id}`}
      titulo={agent.name}
      avatar={<AvatarDoAgente aparencia={aparenciaDoAgente(agent.config, agent.name)} />}
      descricao={agent.description}
      selo={
        <span className="inline-flex items-center gap-1">
          <AgentStatusBadge status={status} />
          {agent.is_default && (
            <Badge variant="secondary" className="text-xs">
              {t("default")}
            </Badge>
          )}
        </span>
      }
      meta={[
        <span
          key="modelo"
          title={
            origemDoModelo(agent) === "versao_publicada"
              ? t("Modelo da versão publicada — é o que atende o cliente.")
              : t("Modelo do cadastro; nenhuma versão publicada ainda.")
          }
        >
          {modeloParaLeigo(modeloEmVigor(agent))}
        </span>,
        // "Agente com ferramentas" é o tipo de quase todo agente: repetido em todo
        // cartão, não diz nada. Só aparece o tipo que FOGE do comum.
        agent.kind === "mcp_agent" || !agent.kind
          ? null
          : `${t("Tipo")}: ${tipoDoAgente(agent.kind, t)}`,
        // A ordem só importa quando alguém a mexeu; "Ordem de preferência: 0" em
        // todo cartão era ruído para quem tem um agente só.
        agent.priority ? `${t("Ordem de preferência")}: ${agent.priority}` : null,
      ]}
      menu={canWrite ? <AgentRowMenu agent={agent} /> : undefined}
    />
  );
}
