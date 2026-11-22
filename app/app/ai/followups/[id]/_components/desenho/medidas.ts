/**
 * Medidas do cartão de nó — a mesma régua para o `NodeCard` (que desenha) e
 * para o layout e o roteador (que estimam antes de o DOM medir).
 *
 * O canvas usa a medida REAL do DOM sempre que ela existe (`node.measured` e
 * as posições das bolinhas que o @xyflow guarda); a estimativa só vale no
 * primeiro quadro e nos testes.
 */
import { nodeBranches, type FlowNode } from "@/lib/followup/graph-schema";

/** Largura do cartão: título de 15px com folga para 26 caracteres. */
export const LARGURA_DO_NO = 272;
/** Altura do corpo (ícone, tipo, título e uma linha de resumo). */
export const ALTURA_DO_CORPO = 84;
/** Altura de cada linha de saída (ramo), com o rótulo numa linha. */
export const ALTURA_DA_LINHA = 34;

export function estimarTamanhoDoNo(node: Pick<FlowNode, "type" | "config">): {
  w: number;
  h: number;
} {
  const ramos = nodeBranches(node as FlowNode);
  const linhas = ramos.length > 1 ? ramos.length : 0;
  return { w: LARGURA_DO_NO, h: ALTURA_DO_CORPO + (linhas > 0 ? 1 + linhas * ALTURA_DA_LINHA : 0) };
}

/** Centro vertical da linha do ramo `indice`, relativo ao topo do cartão. */
export function yDaLinhaDoRamo(indice: number): number {
  return ALTURA_DO_CORPO + 1 + indice * ALTURA_DA_LINHA + ALTURA_DA_LINHA / 2;
}
