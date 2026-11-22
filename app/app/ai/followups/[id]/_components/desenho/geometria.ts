/**
 * Ponte entre o grafo do follow-up e o roteador: de que lado cada aresta sai,
 * onde ficam as bolinhas e qual texto vai na pílula. Usado pelo canvas (com a
 * medida real do DOM) e pelo teste (com a estimativa de `medidas.ts`).
 */
import {
  branchIdForCondition,
  nodeBranches,
  type FlowEdge,
  type FlowNode,
} from "@/lib/followup/graph-schema";

import { yDaLinhaDoRamo } from "./medidas";
import { larguraDoRotulo, type PedidoDeRota, type Retangulo } from "./rotas";

export type NoGeometrico = {
  id: string;
  node: Pick<FlowNode, "type" | "config">;
  x: number;
  y: number;
  w: number;
  h: number;
  /** y real (relativo ao topo do cartão) de cada bolinha de ramo, quando o DOM já mediu. */
  ramosY?: ReadonlyMap<string, number>;
};

export type ArestaGeometrica = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  condition: FlowEdge["condition"];
};

/** A saída lateral existe quando o nó tem mais de um ramo (uma bolinha por linha). */
export function saidaDaAresta(
  no: Pick<FlowNode, "type" | "config">,
  aresta: Pick<ArestaGeometrica, "sourceHandle" | "condition">,
): { lado: "baixo" | "direita"; ramo: string | null; indice: number } {
  const ramos = nodeBranches(no as FlowNode);
  if (ramos.length <= 1) return { lado: "baixo", ramo: null, indice: 0 };
  const id = aresta.sourceHandle ?? branchIdForCondition(no as FlowNode, aresta.condition);
  const indice = Math.max(
    0,
    ramos.findIndex((r) => r.id === id),
  );
  return { lado: "direita", ramo: ramos[indice]?.id ?? null, indice };
}

export function retangulos(nos: Iterable<NoGeometrico>): Map<string, Retangulo> {
  const mapa = new Map<string, Retangulo>();
  for (const n of nos) mapa.set(n.id, { x: n.x, y: n.y, w: n.w, h: n.h });
  return mapa;
}

export function pedidosDeRota(
  nos: ReadonlyMap<string, NoGeometrico>,
  arestas: readonly ArestaGeometrica[],
  rotulo: (aresta: ArestaGeometrica) => string,
): PedidoDeRota[] {
  const pedidos: PedidoDeRota[] = [];
  for (const a of arestas) {
    const s = nos.get(a.source);
    const t = nos.get(a.target);
    if (!s || !t) continue;
    const saida = saidaDaAresta(s.node, a);
    const yRamo =
      saida.ramo !== null ? (s.ramosY?.get(saida.ramo) ?? yDaLinhaDoRamo(saida.indice)) : 0;
    pedidos.push({
      id: a.id,
      source: a.source,
      target: a.target,
      lado: saida.lado,
      s:
        saida.lado === "baixo"
          ? { x: s.x + s.w / 2, y: s.y + s.h }
          : { x: s.x + s.w, y: s.y + yRamo },
      t: { x: t.x + t.w / 2, y: t.y },
      larguraDoRotulo: larguraDoRotulo(rotulo(a)),
    });
  }
  return pedidos;
}
