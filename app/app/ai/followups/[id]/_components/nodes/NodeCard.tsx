"use client";

import { Handle, Position } from "@xyflow/react";

import type { FlowBranch } from "@/lib/followup/graph-schema";
import { rotuloDoRamo } from "@/lib/followup/rotulo-do-ramo";
import type { NomesDeValor } from "@/lib/followup/vocabulario";
import { Warning } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/i18n/useT";
import { BLOCO_DE_ICONE, FAIXA_DO_NO, classesDoNo } from "@/components/fluxo/tema-do-fluxo";
import { useEtapasDoFluxo } from "../EtapasDoFluxo";
import type { NodeVisual } from "./nodeVisuals";

/**
 * A regra de etapa que não aponta para etapa ativa nenhuma: o nome digitado à
 * mão antes do seletor ("PAGO"), ou uma etapa apagada/arquivada. O motor compara
 * o `stage_id`, então essa saída nunca é tomada — e o card é onde o dono olha
 * sem abrir nada. `null` do resolvedor é "não existe"; reticências (lista ainda
 * carregando) e resolvedor ausente não acusam.
 */
function regraSemEtapa(branch: FlowBranch, nomes: NomesDeValor): boolean {
  const check = branch.check;
  if (check === null || check.field !== "lead_stage") return false;
  const valor = String(check.value).trim();
  return valor !== "" && nomes.etapa?.(valor) === null;
}

interface Props {
  id: string;
  visual: NodeVisual;
  label: string;
  subtitle: string;
  selected?: boolean;
  errors?: string[];
  showTarget?: boolean;
  showSource?: boolean;
  /**
   * As saídas do nó, quando ele tem mais de uma. Cada ramo vira UMA linha com
   * rótulo legível e a sua própria bolinha — era isso que faltava: com um handle
   * só não havia onde ligar "a aresta da regra 2", e desenhar bolinhas iguais
   * sem nome trocaria um problema por outro.
   */
  branches?: FlowBranch[];
}

/**
 * Casca de cartão de todo tipo de nó, no tema do Unnify (`tema-do-fluxo`):
 * cartão de raio 12 sem sombra, bloco de ícone de 32 (`primary/10`), o TIPO em
 * `xs` muted, o título e o subtítulo. Selecionado, o anel de foco; com `errors`
 * (o 422 do publish ancorado neste nó, que a PublishBar liga), a borda
 * inválida e a mensagem em linha.
 *
 * ⚠️ SUBTÍTULO E SAÍDA QUEBRAM EM DUAS LINHAS, NÃO CORTAM. Eram `truncate` numa
 * linha só dentro de um card de 224px, e o que se perdia era sempre o FIM — que
 * é onde mora o valor da regra. "O fluxo já deu pelo menos 0 pas…" e "O lead não
 * está na etapa “Proposta enviada”" chegavam iguais na tela, e o card deixava de
 * responder "qual aresta sai de qual regra", que é a razão de ele existir. Duas
 * linhas cobrem toda frase do vocabulário (medido); o que ainda passar disso tem
 * o texto inteiro no `title`. O canvas mede o card pelo DOM (`FlowCanvas` passa
 * `measured` ao auto-layout), então o card mais alto não desalinha nada.
 */
export function NodeCard({
  id,
  visual,
  label,
  subtitle,
  selected,
  errors,
  showTarget = true,
  showSource = true,
  branches,
}: Props) {
  const t = useT();
  const { nomes } = useEtapasDoFluxo();
  const Icon = visual.icon;
  const hasError = (errors?.length ?? 0) > 0;
  // Uma saída só continua sendo a bolinha de sempre no rodapé: não há o que
  // rotular, e mexer nisso quebraria o arrasto de todo nó não-ramificado.
  const branchRows = branches !== undefined && branches.length > 1 ? branches : null;

  return (
    <div
      className={classesDoNo({ selecionado: selected, comErro: hasError })}
      data-testid={`node-card-${id}`}
      title={hasError ? errors!.join("; ") : undefined}
    >
      {showTarget && <Handle type="target" position={Position.Top} />}
      <div className="flex items-start gap-3 p-3">
        <span className={BLOCO_DE_ICONE}>
          <Icon size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{t(visual.paletteLabel)}</p>
          <p className="truncate text-sm font-medium text-foreground" title={label}>
            {label}
          </p>
          <p
            className="mt-0.5 line-clamp-2 text-xs break-words text-muted-foreground"
            title={subtitle}
          >
            {subtitle}
          </p>
        </div>
      </div>
      {hasError && (
        <p
          className={cn(FAIXA_DO_NO, "border-danger-border text-danger-foreground leading-snug")}
          data-testid={`node-error-${id}`}
        >
          {errors![0]}
        </p>
      )}
      {branchRows !== null && (
        <ul className="border-t border-border" data-testid={`node-branches-${id}`}>
          {branchRows.map((branch) => {
            const rotulo = t(rotuloDoRamo(branch, nomes));
            const semEtapa = regraSemEtapa(branch, nomes);
            return (
              <li
                key={branch.id}
                className={cn(
                  "relative flex items-center gap-1.5 border-t border-border px-3 py-1.5 first:border-t-0",
                  // A saída de escape é a única que não veio de uma regra do usuário:
                  // fica em itálico e apagada para se ler como "o resto cai aqui".
                  branch.kind === "fallback" && "text-muted-foreground italic",
                  semEtapa && "text-warning-foreground",
                )}
                data-testid={`node-branch-${id}-${branch.id}`}
                data-regra-sem-etapa={semEtapa || undefined}
                title={
                  semEtapa
                    ? `${rotulo} — ${t("Esta regra não aponta para uma etapa ativa do funil. Abra o nó e escolha a etapa na lista.")}`
                    : rotulo
                }
              >
                {semEtapa ? (
                  <Warning size={12} aria-hidden className="shrink-0" />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      branch.kind === "fallback" ? "bg-muted-foreground/50" : "bg-primary",
                    )}
                  />
                )}
                {/* Três linhas, não duas: a frase da regra interpola dado do
                    usuário («Etapa · Funil»), e o que estourava era justamente o
                    fim — o nome do funil, que existe para desambiguar. */}
                <span className="line-clamp-3 break-words text-xs leading-tight">{rotulo}</span>
                <Handle
                  type="source"
                  id={branch.id}
                  position={Position.Right}
                  // Uma bolinha por LINHA: a saída sai ao lado do seu próprio rótulo,
                  // que é o que torna "qual aresta sai de qual regra" visível. No
                  // rodapé elas ficariam lado a lado, sem espaço para nome nenhum.
                  style={{ top: "50%" }}
                />
              </li>
            );
          })}
        </ul>
      )}
      {showSource && branchRows === null && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
}
