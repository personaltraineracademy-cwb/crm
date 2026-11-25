"use client";

import { useState } from "react";

import { useT } from "@/hooks/i18n/useT";
import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { useEditLead } from "@/hooks/kanban/useUpdateLead";
import type { TimelineItemView } from "@/lib/types/contacts";
import type { Lead } from "@/lib/types/leads";

/**
 * A ABA "NOTAS" do painel do negócio.
 *
 * Duas coisas, nenhuma nova no banco:
 *
 *   1. O bloco de notas do negócio é a DESCRIÇÃO dele (`crm_leads.description`,
 *      até 2.000 caracteres), gravada pela MESMA rota e pela MESMA mutação do
 *      formulário "Dados do negócio". Por isso o formulário da aba Negócio só
 *      monta com a aba aberta: nasce do valor atual e não sobrescreve a nota.
 *   2. As anotações que o sistema registrou na linha do tempo (`type = "note"`,
 *      por exemplo o consentimento vindo de um formulário de captação).
 */
const LIMITE = 2000;

export function NotasDoNegocio({
  lead,
  pipelineId,
  podeEditar,
  anotacoes,
}: {
  lead: Lead;
  pipelineId: string;
  podeEditar: boolean;
  anotacoes: TimelineItemView[];
}) {
  const t = useT();
  const tag = useTagDeIdioma();
  const editar = useEditLead(pipelineId);
  const [texto, setTexto] = useState(lead.description ?? "");
  const [salvo, setSalvo] = useState<"nada" | "salvo" | "erro">("nada");
  const mudou = texto !== (lead.description ?? "");

  async function salvar() {
    try {
      await editar.mutateAsync({
        leadId: lead.id,
        patch: { description: texto.trim() === "" ? null : texto },
      });
      setSalvo("salvo");
    } catch {
      setSalvo("erro");
    }
  }

  return (
    <div className="flex flex-col gap-6 py-2" data-aba-notas>
      <section className="flex flex-col gap-2">
        <label htmlFor="notas-do-negocio" className="text-sm font-semibold text-foreground">
          {t("Notas do negócio")}
        </label>
        <textarea
          id="notas-do-negocio"
          value={texto}
          maxLength={LIMITE}
          readOnly={!podeEditar}
          onChange={(e) => {
            setTexto(e.target.value);
            setSalvo("nada");
          }}
          placeholder={t("O que o time precisa saber sobre este negócio: objeções, combinados, contexto.")}
          className="min-h-40 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm leading-6 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {texto.length}/{LIMITE}
          </span>
          <div className="flex items-center gap-3">
            {salvo === "salvo" && !mudou && <span>{t("Nota salva.")}</span>}
            {salvo === "erro" && (
              <span className="text-destructive">{t("Não foi possível salvar. Tente de novo.")}</span>
            )}
            {podeEditar && (
              <button
                type="button"
                disabled={!mudou || editar.isPending}
                onClick={() => void salvar()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {editar.isPending ? t("Salvando…") : t("Salvar nota")}
              </button>
            )}
          </div>
        </div>
      </section>

      {anotacoes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t("Anotações do sistema")}</h3>
          <ul className="flex flex-col gap-2">
            {anotacoes.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm whitespace-pre-wrap text-foreground">{a.reason ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.performed_at).toLocaleString(tag)}
                  {a.actor_user_name ? ` · ${a.actor_user_name}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
