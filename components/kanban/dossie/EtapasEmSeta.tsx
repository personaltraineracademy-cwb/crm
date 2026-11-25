"use client";

import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";

/**
 * A FAIXA DE ETAPAS do painel do negócio (desenho de referência): uma seta por
 * etapa do funil, a atual preenchida com quantos dias o negócio está nela, as
 * que ficaram para trás num tom mais leve.
 *
 * Clicar numa etapa MOVE o negócio, pelo mesmo caminho do seletor de etapa de
 * antes (`onMudar`, que no quadro é o "mover pela lista": confirma perda,
 * cobra campos obrigatórios). Quem não pode mover vê a faixa só para leitura.
 */
export interface EtapaDaFaixa {
  id: string;
  name: string;
}

export function EtapasEmSeta({
  etapas,
  etapaAtual,
  diasNaEtapa,
  podeMover,
  onMudar,
}: {
  etapas: readonly EtapaDaFaixa[];
  etapaAtual: string;
  diasNaEtapa: number | null;
  podeMover: boolean;
  onMudar?: (stageId: string) => void;
}) {
  const t = useT();
  const indiceAtual = etapas.findIndex((e) => e.id === etapaAtual);

  return (
    <ol
      className="flex w-full min-w-0 items-stretch gap-1 overflow-x-auto"
      aria-label={t("Etapas do funil")}
      data-faixa-de-etapas
    >
      {etapas.map((etapa, i) => {
        const atual = i === indiceAtual;
        const passou = indiceAtual >= 0 && i < indiceAtual;
        const primeira = i === 0;
        const ultima = i === etapas.length - 1;
        // A seta: ponta à direita e entalhe à esquerda; a primeira não tem
        // entalhe e a última não tem ponta, para a faixa fechar reta nas pontas.
        const forma = `polygon(0 0, calc(100% - ${ultima ? "0px" : "14px"}) 0, 100% 50%, calc(100% - ${ultima ? "0px" : "14px"}) 100%, 0 100%, ${primeira ? "0px" : "14px"} 50%)`;
        const rotuloDias =
          atual && diasNaEtapa !== null
            ? diasNaEtapa === 1
              ? t("1 dia")
              : t("{n} dias").replace("{n}", String(diasNaEtapa))
            : null;
        const conteudo = (
          <>
            <span className="truncate">{etapa.name}</span>
            {rotuloDias && <span className="shrink-0 font-normal opacity-80">({rotuloDias})</span>}
          </>
        );
        const classes = cn(
          "flex h-10 w-full min-w-28 items-center justify-center gap-1 px-5 text-xs font-medium transition-colors",
          atual
            ? "bg-primary text-primary-foreground"
            : passou
              ? "bg-primary/15 text-foreground"
              : "bg-muted text-muted-foreground",
        );
        return (
          <li
            key={etapa.id}
            className="min-w-0 flex-1"
            style={{ clipPath: ultima && primeira ? undefined : forma }}
            aria-current={atual ? "step" : undefined}
          >
            {podeMover && onMudar && !atual ? (
              <button
                type="button"
                onClick={() => onMudar(etapa.id)}
                className={cn(classes, "hover:bg-primary/25 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring")}
                title={`${t("Mover para")} ${etapa.name}`}
                aria-label={`${t("Mover para")} ${etapa.name}`}
              >
                {conteudo}
              </button>
            ) : (
              <span className={classes} title={etapa.name}>
                {conteudo}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
