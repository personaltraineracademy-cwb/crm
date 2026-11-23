"use client";

import { useT } from "@/hooks/i18n/useT";
import { ORIGEM_AGENDA_DO_CELULAR } from "@/lib/leads/origem-do-contato";
import type { OrigemResumida } from "@/lib/leads/origem-resumida";

/**
 * Rótulo da origem para leigo. Literal por literal: `t()` sobre variável escapa
 * do guardião de idioma. Valor que não é um dos conhecidos (o `utm_source` que
 * o cliente escolheu) aparece como veio.
 */
export function useRotuloDaOrigem(): (origem: string) => string {
  const t = useT();
  return (origem: string) => {
    switch (origem.toLowerCase()) {
      case "sem_origem":
        return t("Sem origem informada");
      case "manual":
        return t("Cadastro manual");
      case "whatsapp":
        return t("WhatsApp direto");
      case ORIGEM_AGENDA_DO_CELULAR:
        return t("Agenda do celular");
      case "site":
        return t("Site");
      case "webhook":
        return t("Integração");
      case "import":
        return t("Importação");
      default:
        return origem;
    }
  };
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-24 shrink-0 text-muted-foreground">{rotulo}</dt>
      <dd className="min-w-0 break-words">{valor}</dd>
    </div>
  );
}

/**
 * De onde este lead veio: origem, meio, campanha, conjunto, anúncio, termo e
 * conteúdo. A mesma peça no dossiê do negócio e no painel ao lado da conversa.
 * Linha sem dado some, em vez de mostrar travessão.
 */
export function OrigemDoLead({ origem }: { origem: OrigemResumida }) {
  const t = useT();
  const rotulo = useRotuloDaOrigem();
  return (
    <dl className="flex flex-col gap-1.5" data-testid="origem-do-lead">
      <Linha rotulo={t("Origem")} valor={rotulo(origem.origem)} />
      <Linha rotulo={t("Meio")} valor={origem.meio} />
      <Linha rotulo={t("Campanha")} valor={origem.campanha} />
      <Linha rotulo={t("Conjunto")} valor={origem.conjunto} />
      <Linha rotulo={t("Anúncio")} valor={origem.anuncio} />
      <Linha rotulo={t("Termo")} valor={origem.termo} />
      <Linha rotulo={t("Conteúdo")} valor={origem.conteudo} />
      {!origem.rastreada ? (
        <p className="text-xs text-muted-foreground">
          {t("Sem UTM nem anúncio: mostramos por onde o cadastro foi feito.")}
        </p>
      ) : null}
    </dl>
  );
}
