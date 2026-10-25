"use client";

import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { Brain, Lightbulb, PuzzlePiece } from "@/lib/ui/icons";
import type { TimelineItem } from "@/lib/ai/evolution/aggregate";
import { useT } from "@/hooks/i18n/useT";

/**
 * A linha do tempo do aprendizado. Cada linha responde "o que entrou na cabeça do
 * agente, e quando" — por isso o rótulo do TIPO vem antes do título: sem ele, uma
 * lista de frases soltas não diz se aquilo foi uma regra que o dono escreveu, uma
 * melhoria que ele aprovou ou uma habilidade que instalou. Três origens diferentes,
 * três coisas diferentes a fazer se ele quiser mais.
 */
const TIPOS: Record<TimelineItem["kind"], { rotulo: string; Icone: typeof Brain }> = {
  memory: { rotulo: "Regra que você ensinou", Icone: Brain },
  proposal: { rotulo: "Melhoria que você aprovou", Icone: Lightbulb },
  skill: { rotulo: "Habilidade instalada", Icone: PuzzlePiece },
};

/**
 * O agregador corta o texto da proposta em 120 caracteres (`content.slice(0, 120)`),
 * e sem reticências a frase termina no meio de uma palavra — o dono do negócio lê
 * isso como texto corrompido, não como resumo. O acoplamento ao número 120 é
 * deliberado e está declarado aqui: é o único lugar onde dá para saber que houve
 * corte, porque o payload não carrega o comprimento original.
 */
const CORTE_DO_AGREGADOR = 120;

function titulo(t: string): string {
  return t.length >= CORTE_DO_AGREGADOR ? `${t.trimEnd()}…` : t;
}

function dia(s: string, idioma: string): string {
  // `s` já vem truncado em YYYY-MM-DD pelo agregador; o `T00:00:00Z` evita que o
  // browser leia a data como local e mostre o dia anterior a oeste de Greenwich.
  return new Date(`${s}T00:00:00Z`).toLocaleDateString(idioma, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export function EvolutionTimeline({ items }: { items: TimelineItem[] }) {
  const tagDoIdioma = useTagDeIdioma();
  const t = useT();
  return (
    <ol className="max-h-80 divide-y divide-border overflow-y-auto">
      {items.map((it, i) => {
        const tipo = TIPOS[it.kind];
        return (
          <li key={`${it.day}-${it.kind}-${i}`} className="flex items-start gap-3 py-3">
            {/* O tipo é categoria, não estado: o bloco de ícone é o mesmo
                (`primary/10`) e quem distingue é o ícone e o rótulo. */}
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <tipo.Icone size={16} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground tabular-nums">
                {dia(it.day, tagDoIdioma)} · {t(tipo.rotulo)}
              </p>
              <p className="mt-0.5 text-sm break-words text-foreground">{titulo(it.title)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
