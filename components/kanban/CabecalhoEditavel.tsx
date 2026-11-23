"use client";

import { useActiveOrg } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { useEditLead } from "@/hooks/kanban/useUpdateLead";
import { formatValorDoNegocio, MOEDA_PADRAO, parseReaisToCents } from "@/lib/money";
import { updateLeadSchema, type UpdateLeadInput } from "@/lib/schemas/leads";
import type { Lead } from "@/lib/types/leads";

import { CampoNoLugar } from "./CampoNoLugar";

/**
 * Título e valor do negócio, editáveis NO LUGAR no cabeçalho do dossiê: um
 * clique vira campo, Enter grava, Esc cancela. Cada um grava sozinho, pela
 * MESMA mutação e o MESMO schema do formulário "Dados do negócio" — o
 * formulário acompanha a mudança (ver `LeadFieldsForm`).
 *
 * Peças separadas do `LeadDossier` porque usam a mutação (e portanto a fila de
 * consultas): quem só pode ler o negócio recebe o texto puro, sem elas.
 */
function useGravarNoLugar(lead: Lead, pipelineId: string) {
  const t = useT();
  const editar = useEditLead(pipelineId);
  return async (patch: Record<string, unknown>): Promise<string | void> => {
    const parsed = updateLeadSchema.safeParse(patch);
    if (!parsed.success) return t("Dados inválidos");
    try {
      await editar.mutateAsync({ leadId: lead.id, patch: parsed.data as UpdateLeadInput });
    } catch {
      // O hook já avisa o erro na tela; aqui o campo só continua aberto.
      return t("Não foi possível salvar. Tente de novo.");
    }
  };
}

export function TituloEditavel({ lead, pipelineId }: { lead: Lead; pipelineId: string }) {
  const t = useT();
  const gravar = useGravarNoLugar(lead, pipelineId);
  return (
    <CampoNoLugar
      exibicao={lead.title}
      valorDeEdicao={lead.title}
      rotulo={t("Título")}
      aoSalvar={async (texto) => {
        const titulo = texto.trim();
        if (titulo.length < 2) return t("O título precisa de pelo menos 2 letras.");
        return gravar({ title: titulo });
      }}
      classeDoCampo="w-64 max-w-full font-normal"
    />
  );
}

export function ValorEditavel({ lead, pipelineId }: { lead: Lead; pipelineId: string }) {
  const t = useT();
  const org = useActiveOrg();
  const gravar = useGravarNoLugar(lead, pipelineId);
  const moeda = lead.currency ?? org?.currency ?? MOEDA_PADRAO;
  return (
    <CampoNoLugar
      exibicao={
        lead.value_cents === null
          ? "—"
          : formatValorDoNegocio(lead.value_cents, moeda, { semCentavos: true })
      }
      valorDeEdicao={
        lead.value_cents == null ? "" : (lead.value_cents / 100).toFixed(2).replace(".", ",")
      }
      rotulo={t("Valor")}
      aoSalvar={async (texto) => {
        const reais = texto.trim();
        if (reais === "") return gravar({ value_cents: null });
        const centavos = parseReaisToCents(reais, moeda);
        if (centavos === null) return t("Valor inválido");
        return gravar({ value_cents: centavos });
      }}
      inputMode="decimal"
      placeholder="0,00"
      className="font-medium tabular-nums text-text"
      classeDoCampo="w-28"
    />
  );
}
