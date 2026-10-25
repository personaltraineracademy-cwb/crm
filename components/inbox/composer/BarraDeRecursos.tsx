"use client";
import { useT } from "@/hooks/i18n/useT";
import { ehRecursoDeAudio, type Recurso } from "@/lib/inbox/recursos";

/**
 * A barra de recursos do Inbox (#2833): um botão por TÍTULO cadastrado. É o
 * que a issue pede — "botões automáticos e clicáveis diretamente no Inbox" —
 * em vez de obrigar o operador a decorar um atalho de barra.
 *
 * O clique NÃO envia nada: só entrega o recurso escolhido ao compositor, que o
 * passa ao MESMO `applyTemplate` do `/` — texto cai no campo editável, mídia
 * (imagem OU áudio) entra na fila de anexos. Por isso este componente é burro de
 * propósito: ele não conhece envio nem a natureza do recurso além do ícone.
 */
interface Props {
  recursos: Recurso[];
  onEscolher: (recurso: Recurso) => void;
  disabled?: boolean;
}

export function BarraDeRecursos({ recursos, onEscolher, disabled = false }: Props) {
  const t = useT();
  if (recursos.length === 0) return null;
  return (
    <div
      data-testid="barra-de-recursos"
      role="toolbar"
      aria-label={t("Respostas rápidas")}
      className="mb-1.5 flex flex-wrap gap-1"
    >
      {recursos.map((recurso) => (
        <button
          key={recurso.id}
          type="button"
          disabled={disabled}
          data-recurso-id={recurso.id}
          data-recurso-tipo={ehRecursoDeAudio(recurso) ? "audio" : "texto"}
          onClick={() => onEscolher(recurso)}
          title={t("Prepara no compositor — você revisa e envia")}
          className="ds-alvo-44 hover:border-interactive-border hover:bg-interactive hover:text-interactive-foreground inline-flex h-7 items-center rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        >
          {ehRecursoDeAudio(recurso) ? `🎧 ${recurso.title}` : recurso.title}
        </button>
      ))}
    </div>
  );
}
