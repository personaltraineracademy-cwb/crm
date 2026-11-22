"use client";

import { Handle, Position } from "@xyflow/react";

import type { FlowBranch } from "@/lib/followup/graph-schema";
import { rotuloDoRamo } from "@/lib/followup/rotulo-do-ramo";
import type { NomesDeValor } from "@/lib/followup/vocabulario";
import { Warning } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/i18n/useT";
import { useEtapasDoFluxo } from "../EtapasDoFluxo";
import { useEstadoDoNo } from "../EstadoDosNos";
import { CATEGORIA_DO_TIPO, type NodeVisual } from "./nodeVisuals";

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
 * Casca de cartão de todo tipo de nó. Desenho em `app/unnify/fluxo.css`
 * (classes `fluxo-no*`): 272px de largura, título de 15px, tipo e resumo de
 * 13px — legíveis no zoom inicial, que nunca fica abaixo de 93% —, o bloco de
 * ícone na cor da FAMÍLIA do nó (gatilho, esperas, lógica, mensagens, CRM,
 * fim) e um selo de estado: erro do publish (vermelho), falta configurar
 * (âmbar, "Pendente": a mesma validação do publish rodando no navegador; o
 * `title` do cartão diz o que falta) ou rascunho (nó
 * novo ou mudado desde o último "Salvar").
 *
 * ⚠️ SUBTÍTULO E SAÍDA QUEBRAM EM LINHAS, NÃO CORTAM. Eram `truncate` numa
 * linha só, e o que se perdia era sempre o FIM — que é onde mora o valor da
 * regra. "O fluxo já deu pelo menos 0 pas…" e "O lead não está na etapa
 * “Proposta enviada”" chegavam iguais na tela, e o card deixava de responder
 * "qual aresta sai de qual regra", que é a razão de ele existir. O que ainda
 * passar das linhas tem o texto inteiro no `title`. O canvas mede o card pelo
 * DOM, então o card mais alto não desalinha nada.
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
  const estado = useEstadoDoNo(id);
  const Icon = visual.icon;
  const hasError = (errors?.length ?? 0) > 0;
  const pendente = !hasError && (estado.pendencias?.length ?? 0) > 0;
  // Uma saída só continua sendo a bolinha de sempre no rodapé: não há o que
  // rotular, e mexer nisso quebraria o arrasto de todo nó não-ramificado.
  const branchRows = branches !== undefined && branches.length > 1 ? branches : null;
  const categoria = CATEGORIA_DO_TIPO[visual.type];

  const selo = hasError
    ? { tom: "erro", texto: t("Erro") }
    : pendente
      ? { tom: "pendente", texto: t("Pendente") }
      : estado.rascunho
        ? { tom: "rascunho", texto: t("Rascunho") }
        : null;

  return (
    <div
      className="fluxo-no"
      data-categoria={categoria}
      data-selecionado={selected || undefined}
      data-estado={selo?.tom}
      data-testid={`node-card-${id}`}
      title={hasError ? errors!.join("; ") : pendente ? estado.pendencias!.join("; ") : undefined}
    >
      {showTarget && <Handle type="target" position={Position.Top} className="fluxo-bolinha" />}
      <div className="fluxo-no__corpo">
        <span className="fluxo-no__icone">
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="fluxo-no__cabeca">
            <p className="fluxo-no__tipo truncate">{t(visual.paletteLabel)}</p>
            {selo && (
              <span className="fluxo-no__selo" data-tom={selo.tom}>
                {selo.texto}
              </span>
            )}
          </div>
          <p className="fluxo-no__titulo truncate" title={label}>
            {label}
          </p>
          <p className="fluxo-no__resumo line-clamp-2 break-words" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>
      {hasError && (
        <p className="fluxo-no__faixa-erro" data-testid={`node-error-${id}`}>
          <Warning size={14} aria-hidden className="shrink-0" />
          <span>{errors![0]}</span>
        </p>
      )}
      {branchRows !== null && (
        <ul className="fluxo-no__ramos" data-testid={`node-branches-${id}`}>
          {branchRows.map((branch) => {
            const rotulo = t(rotuloDoRamo(branch, nomes));
            const semEtapa = regraSemEtapa(branch, nomes);
            return (
              <li
                key={branch.id}
                className={cn(
                  "fluxo-no__ramo",
                  // A saída de escape é a única que não veio de uma regra do usuário:
                  // fica em itálico e apagada para se ler como "o resto cai aqui".
                  branch.kind === "fallback" && "fluxo-no__ramo--resto",
                  semEtapa && "fluxo-no__ramo--aviso",
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
                  <Warning size={13} aria-hidden className="shrink-0" />
                ) : (
                  <span aria-hidden className="fluxo-no__ponto" />
                )}
                {/* Três linhas, não duas: a frase da regra interpola dado do
                    usuário («Etapa · Funil»), e o que estourava era justamente o
                    fim — o nome do funil, que existe para desambiguar. */}
                <span className="line-clamp-3 break-words">{rotulo}</span>
                <Handle
                  type="source"
                  id={branch.id}
                  position={Position.Right}
                  className="fluxo-bolinha"
                  // Uma bolinha por LINHA: a saída sai ao lado do seu próprio rótulo,
                  // que é o que torna "qual aresta sai de qual regra" visível.
                  style={{ top: "50%" }}
                />
              </li>
            );
          })}
        </ul>
      )}
      {showSource && branchRows === null && (
        <Handle type="source" position={Position.Bottom} className="fluxo-bolinha" />
      )}
    </div>
  );
}
