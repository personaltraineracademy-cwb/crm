"use client";

import { memo } from "react";
import { BaseEdge, getSmoothStepPath, Position, type Edge, type EdgeProps } from "@xyflow/react";

import type { RFEdgeData } from "@/lib/followup/graph-mappers";
import {
  caminhoArredondado,
  larguraDoRotulo,
  pontosDaRota,
  posicaoDoRotulo,
  type PedidoDeRota,
  type Rota,
} from "./desenho/rotas";

/**
 * O fio do construtor. Recebe do canvas a ROTA (canal vertical livre de nós,
 * `desenho/rotas.ts`) e desenha com as coordenadas exatas das bolinhas que o
 * @xyflow passa — o canvas estima, a aresta acerta o pixel.
 *
 * O rótulo continua sendo o `EdgeText` do @xyflow (via `BaseEdge`), em SVG e
 * DENTRO do grupo da aresta: é ele que as specs clicam
 * (`[data-testid="rf__edge-<id>"] .react-flow__edge-textbg`) e é o alvo de
 * clique mais generoso para abrir o painel da aresta. A forma de pílula vem do
 * raio e do padding; cor e tipografia, de `app/unnify/fluxo.css`.
 *
 * `memo`: durante o arrasto só re-renderizam as arestas cuja rota ou ponta
 * mudou (o canvas preserva a identidade dos objetos que não mudaram).
 */
export type ArestaDoFluxoData = RFEdgeData & {
  lado?: PedidoDeRota["lado"];
  rota?: Rota;
};
export type ArestaDoFluxoEdge = Edge<ArestaDoFluxoData, "fluxo">;

function ArestaDoFluxoBase({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  markerEnd,
  style,
}: EdgeProps<ArestaDoFluxoEdge>) {
  const texto = typeof label === "string" ? label : "";
  const largura = larguraDoRotulo(texto);
  const s = { x: sourceX, y: sourceY };
  const t = { x: targetX, y: targetY };

  let caminho: string;
  let rotuloX: number;
  let rotuloY: number;
  if (data?.rota && data.lado) {
    const pontos = pontosDaRota(data.lado, s, t, data.rota);
    caminho = caminhoArredondado(pontos, 12);
    const p = posicaoDoRotulo(data.lado, s, pontos, largura);
    rotuloX = p.x;
    rotuloY = p.y;
  } else {
    // Primeiro quadro, antes de o canvas medir: o degrau padrão.
    [caminho, rotuloX, rotuloY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: sourcePosition ?? Position.Bottom,
      targetPosition: targetPosition ?? Position.Top,
      borderRadius: 12,
    });
  }

  // A seta: o último trecho sempre ENTRA PELO TOPO do destino, de cima para
  // baixo (é o que o roteador garante), então ela aponta sempre para baixo.
  // Desenhada aqui e não como `markerEnd`: o marcador do @xyflow gera o id a
  // partir da cor, e cor em variável CSS (tema claro/escuro) vira id inválido.
  const seta = `M ${targetX - 5} ${targetY - 8} L ${targetX} ${targetY - 1} L ${targetX + 5} ${targetY - 8} Z`;

  return (
    <>
      <BaseEdge
        id={id}
        path={caminho}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={24}
        label={texto || undefined}
        labelX={rotuloX}
        labelY={rotuloY}
        labelShowBg
        labelBgPadding={[10, 5]}
        labelBgBorderRadius={11}
      />
      <path d={seta} className="fluxo-aresta__seta" aria-hidden />
    </>
  );
}

export const ArestaDoFluxo = memo(ArestaDoFluxoBase);
