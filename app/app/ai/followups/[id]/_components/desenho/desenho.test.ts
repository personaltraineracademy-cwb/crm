/**
 * O desenho do construtor medido por geometria, não a olho: depois do
 * "Organizar", nenhum fio atravessa um cartão, nenhum cartão encosta em outro,
 * as pílulas dos rótulos não se sobrepõem e o caminho principal fica numa
 * coluna reta. O caso é o grafo real do modelo "Consulta · retomar quem sumiu
 * na marcação" — o da captura da dona (evidence/pedidos-da-dona/construtor-workflow.png).
 */
import { describe, expect, it } from "vitest";

import { MODELOS_DE_CLINICA } from "@/lib/followup/modelos/clinica";
import { conditionLabel } from "@/lib/followup/edge-condition-options";
import { nodeBranches, branchIdForCondition, type FlowGraph } from "@/lib/followup/graph-schema";
import { rotuloDoRamo } from "@/lib/followup/rotulo-do-ramo";

import {
  pedidosDeRota,
  retangulos,
  saidaDaAresta,
  type ArestaGeometrica,
  type NoGeometrico,
} from "./geometria";
import { estimarTamanhoDoNo } from "./medidas";
import { organizarFluxo } from "./organizar";
import { pontosDaRota, posicaoDoRotulo, rotearArestas, type Ponto, type Retangulo } from "./rotas";

function texto(grafo: FlowGraph, a: ArestaGeometrica): string {
  const no = grafo.nodes.find((n) => n.id === a.source)!;
  const ramo = nodeBranches(no).find((b) => b.id === branchIdForCondition(no, a.condition));
  return ramo ? rotuloDoRamo(ramo, {}) : conditionLabel(a.condition);
}

function desenhar(grafo: FlowGraph) {
  const tamanhos = new Map(grafo.nodes.map((n) => [n.id, estimarTamanhoDoNo(n)]));
  const arestas: ArestaGeometrica[] = grafo.edges.map((e) => ({ ...e }));
  const posicoes = organizarFluxo(
    grafo.nodes.map((n) => ({ id: n.id, type: n.type, ...tamanhos.get(n.id)! })),
    arestas.map((a) => {
      const no = grafo.nodes.find((n) => n.id === a.source)!;
      return {
        source: a.source,
        target: a.target,
        lado: saidaDaAresta(no, a).lado,
        larguraDoRotulo: 100,
      };
    }),
  );
  const nos = new Map<string, NoGeometrico>(
    grafo.nodes.map((n) => [
      n.id,
      { id: n.id, node: n, ...posicoes.get(n.id)!, ...tamanhos.get(n.id)! },
    ]),
  );
  const pedidos = pedidosDeRota(nos, arestas, (a) => texto(grafo, a));
  const rotas = rotearArestas(retangulos(nos.values()), pedidos);
  return { nos, pedidos, rotas };
}

/**
 * O segmento passa a menos de `folga` px do cartão. Fio colado na borda conta
 * como defeito: lê-se como contorno do cartão, não como ligação.
 */
function segmentoAtravessa(a: Ponto, b: Ponto, r: Retangulo, folga = 8): boolean {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  return x1 > r.x - folga && x0 < r.x + r.w + folga && y1 > r.y - folga && y0 < r.y + r.h + folga;
}

const sobrepoe = (a: Retangulo, b: Retangulo) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("desenho do construtor — modelo escada", () => {
  const grafo = MODELOS_DE_CLINICA.find((m) => m.id === "clinica-consulta-retomada")!.grafo;
  const { nos, pedidos, rotas } = desenhar(grafo);

  it("o grafo é o da captura: 12 nós", () => {
    expect(grafo.nodes).toHaveLength(12);
  });

  it("nenhum fio atravessa um cartão", () => {
    const atravessamentos: string[] = [];
    for (const p of pedidos) {
      const pts = pontosDaRota(p.lado, p.s, p.t, rotas.get(p.id)!);
      for (let i = 0; i < pts.length - 1; i++) {
        for (const n of nos.values()) {
          // O primeiro trecho nasce na borda da origem e o último morre na do destino.
          if (i === 0 && n.id === p.source) continue;
          if (i === pts.length - 2 && n.id === p.target) continue;
          if (segmentoAtravessa(pts[i]!, pts[i + 1]!, n))
            atravessamentos.push(`${p.id} × ${n.id} (trecho ${i})`);
        }
      }
    }
    expect(atravessamentos).toEqual([]);
  });

  it("nenhum cartão encosta em outro", () => {
    const lista = [...nos.values()];
    const colisoes: string[] = [];
    for (let i = 0; i < lista.length; i++)
      for (let j = i + 1; j < lista.length; j++)
        if (sobrepoe(lista[i]!, lista[j]!)) colisoes.push(`${lista[i]!.id}/${lista[j]!.id}`);
    expect(colisoes).toEqual([]);
  });

  it("as pílulas não se sobrepõem entre si nem a um cartão", () => {
    const pilulas = pedidos.map((p) => {
      const pts = pontosDaRota(p.lado, p.s, p.t, rotas.get(p.id)!);
      const c = posicaoDoRotulo(p.lado, p.s, pts, p.larguraDoRotulo);
      return {
        id: p.id,
        target: p.target,
        r: { x: c.x - p.larguraDoRotulo / 2, y: c.y - 11, w: p.larguraDoRotulo, h: 22 },
      };
    });
    const problemas: string[] = [];
    for (let i = 0; i < pilulas.length; i++) {
      for (let j = i + 1; j < pilulas.length; j++) {
        if (sobrepoe(pilulas[i]!.r, pilulas[j]!.r))
          problemas.push(`${pilulas[i]!.id}/${pilulas[j]!.id}`);
      }
      for (const n of nos.values())
        if (sobrepoe(pilulas[i]!.r, n)) problemas.push(`${pilulas[i]!.id} sobre ${n.id}`);
    }
    expect(problemas).toEqual([]);
  });

  it("o caminho principal fica numa coluna reta, de cima para baixo", () => {
    const espinha = [
      "inicio",
      "msg-1",
      "resposta-1",
      "espera-2",
      "msg-2",
      "resposta-2",
      "espera-3",
      "msg-3",
      "resposta-3",
    ];
    const presentes = espinha.filter((id) => nos.has(id));
    expect(presentes.length).toBeGreaterThanOrEqual(8);
    const centros = new Set(presentes.map((id) => nos.get(id)!.x + nos.get(id)!.w / 2));
    expect(centros.size).toBe(1);
    const ys = presentes.map((id) => nos.get(id)!.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it("vãos uniformes entre camadas consecutivas da espinha", () => {
    const espinha = ["inicio", "msg-1", "resposta-1", "espera-2"].filter((id) => nos.has(id));
    const vaos = espinha
      .slice(1)
      .map((id, i) => nos.get(id)!.y - (nos.get(espinha[i]!)!.y + nos.get(espinha[i]!)!.h));
    expect(new Set(vaos).size).toBe(1);
  });
});

describe("roteador — casos de borda", () => {
  it("aresta que volta para cima (laço) contorna o próprio destino", () => {
    const nos = new Map<string, Retangulo>([
      ["a", { x: 0, y: 0, w: 200, h: 80 }],
      ["b", { x: 0, y: 200, w: 200, h: 80 }],
    ]);
    const s = { x: 100, y: 280 };
    const t = { x: 100, y: 0 };
    const rotas = rotearArestas(nos, [
      { id: "volta", source: "b", target: "a", lado: "baixo", s, t, larguraDoRotulo: 60 },
    ]);
    const pts = pontosDaRota("baixo", s, t, rotas.get("volta")!);
    for (let i = 0; i < pts.length - 1; i++)
      for (const [id, r] of nos) {
        if ((i === 0 && id === "b") || (i === pts.length - 2 && id === "a")) continue;
        expect(segmentoAtravessa(pts[i]!, pts[i + 1]!, r)).toBe(false);
      }
  });

  it("é determinístico: mesma entrada, mesmo desenho", () => {
    const grafo = MODELOS_DE_CLINICA[0]!.grafo;
    const a = desenhar(grafo);
    const b = desenhar(grafo);
    expect([...a.rotas.entries()]).toEqual([...b.rotas.entries()]);
  });
});
