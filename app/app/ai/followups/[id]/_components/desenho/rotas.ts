/**
 * Roteamento das arestas do construtor: por onde cada fio passa para NUNCA
 * atravessar um nó.
 *
 * O `smoothstep` do @xyflow liga a saída à entrada pelo caminho mais curto e
 * não sabe que existem outros nós no meio — no fluxo "escada" dos modelos, os
 * fios de cada "Quer marcar" para o fim compartilhado cruzavam três cartões
 * (captura em `evidence/pedidos-da-dona/construtor-workflow.png`). Aqui cada
 * aresta ganha um CANAL vertical livre de nós; as horizontais ficam nos vãos.
 *
 * A forma do fio é sempre a mesma, e o componente da aresta a desenha com as
 * coordenadas exatas que o @xyflow entrega:
 *
 *   saída embaixo  (s) ─┐        saída à direita (s) ──[rótulo]──┐
 *                       │ y1                                     │ canal
 *            ┌──────────┘ canal                       ┌──────────┘ y2
 *            └───┐ y2                                 ▼ (t)
 *                ▼ (t)
 *
 * Função pura e determinística (mesma entrada → mesmo desenho), barata o
 * bastante para rodar a cada quadro do arrasto: O(arestas × nós).
 */

export type Ponto = { x: number; y: number };
export type Retangulo = { x: number; y: number; w: number; h: number };

export type PedidoDeRota = {
  id: string;
  source: string;
  target: string;
  /** De onde o fio sai: do rodapé do nó (uma saída) ou da linha do ramo. */
  lado: "baixo" | "direita";
  /** Saída e entrada estimadas (coordenadas do fluxo). */
  s: Ponto;
  t: Ponto;
  /** Largura do rótulo em pílula, para a saída lateral deixar espaço para ele. */
  larguraDoRotulo: number;
};

export type Rota = {
  /** x do trecho vertical. */
  canal: number;
  /** Altura da curva logo abaixo da saída (só na saída de baixo). */
  y1: number;
  /** Altura da curva logo acima da entrada. */
  y2: number;
};

/** Folga entre fio e cartão. */
export const FOLGA = 20;
/** Distância mínima entre dois canais de destinos diferentes. */
const ENTRE_CANAIS = 14;
/** Respiro entre a bolinha de saída lateral e o começo da pílula. */
export const RESPIRO_DO_ROTULO = 14;

type Trecho = { x: number; y0: number; y1: number; target: string };

function cruzaVertical(r: Retangulo, x: number, ya: number, yb: number): boolean {
  const y0 = Math.min(ya, yb);
  const y1 = Math.max(ya, yb);
  return (
    x > r.x - FOLGA && x < r.x + r.w + FOLGA && y1 > r.y - FOLGA / 2 && y0 < r.y + r.h + FOLGA / 2
  );
}

function cruzaHorizontal(r: Retangulo, y: number, xa: number, xb: number): boolean {
  const x0 = Math.min(xa, xb);
  const x1 = Math.max(xa, xb);
  return y > r.y - 6 && y < r.y + r.h + 6 && x1 > r.x - 6 && x0 < r.x + r.w + 6;
}

/**
 * Calcula a rota de cada pedido. `nos` são os retângulos de TODOS os nós (os
 * obstáculos); a origem e o destino de cada aresta também contam, porque um
 * fio que volta para cima precisa contornar o próprio destino.
 */
export function rotearArestas(
  nos: ReadonlyMap<string, Retangulo>,
  pedidos: readonly PedidoDeRota[],
): Map<string, Rota> {
  const obstaculos = [...nos.entries()];
  const ocupados: Trecho[] = [];
  const rotas = new Map<string, Rota>();

  // Ordem estável: de cima para baixo, depois pelo id. Quem é roteado primeiro
  // fica com o canal mais perto — e a ordem não muda de um quadro para o outro.
  const ordenados = [...pedidos].sort(
    (a, b) => a.s.y - b.s.y || a.s.x - b.s.x || a.id.localeCompare(b.id),
  );

  for (const p of ordenados) {
    const { s, t } = p;
    let y2 = t.y - FOLGA - 4;
    let y1 = p.lado === "baixo" ? s.y + FOLGA + 4 : s.y;
    // Pílula na saída de baixo: o primeiro trecho vertical precisa caber nela.
    if (p.lado === "baixo" && t.y > s.y) y1 = Math.max(y1, Math.min(s.y + 44, (s.y + t.y) / 2));

    const livre = (x: number, ya: number, yb: number): boolean => {
      for (const [, r] of obstaculos) if (cruzaVertical(r, x, ya, yb)) return false;
      const y0 = Math.min(ya, yb);
      const yf = Math.max(ya, yb);
      for (const o of ocupados) {
        if (o.target === p.target) continue; // fios para o mesmo destino podem se juntar
        if (Math.abs(o.x - x) < ENTRE_CANAIS && yf > o.y0 - 4 && y0 < o.y1 + 4) return false;
      }
      return true;
    };

    // Trecho vertical do canal: da curva de saída até a curva de chegada.
    const inicioVertical = p.lado === "baixo" ? y1 : s.y;

    // Candidatos: as colunas óbvias primeiro, depois as bordas dos obstáculos e
    // dos canais já ocupados — o canal livre está sempre colado a uma delas.
    const candidatos = new Set<number>();
    const minimoLateral = s.x + RESPIRO_DO_ROTULO + p.larguraDoRotulo + RESPIRO_DO_ROTULO;
    if (p.lado === "baixo") {
      candidatos.add(s.x);
      candidatos.add(t.x);
    } else {
      candidatos.add(minimoLateral);
    }
    for (const [, r] of obstaculos) {
      candidatos.add(r.x - FOLGA - 2);
      candidatos.add(r.x + r.w + FOLGA + 2);
    }
    for (const o of ocupados) {
      candidatos.add(o.x - ENTRE_CANAIS);
      candidatos.add(o.x + ENTRE_CANAIS);
    }

    let melhor: number | null = null;
    let melhorCusto = Infinity;
    for (const x of candidatos) {
      if (p.lado === "direita" && x < minimoLateral) continue;
      if (!livre(x, inicioVertical, y2)) continue;
      // Na saída lateral o trecho horizontal até o canal também não pode
      // atravessar um vizinho da mesma altura.
      if (
        p.lado === "direita" &&
        obstaculos.some(([id, r]) => id !== p.source && cruzaHorizontal(r, s.y, s.x, x))
      ) {
        continue;
      }
      const custo =
        p.lado === "baixo"
          ? Math.abs(x - s.x) + Math.abs(x - t.x) + (x === s.x || x === t.x ? 0 : 8)
          : x - minimoLateral + Math.abs(x - t.x) * 0.25;
      if (custo < melhorCusto) {
        melhorCusto = custo;
        melhor = x;
      }
    }
    // Sem canal livre (nós empilhados à mão uns sobre os outros): à direita de tudo.
    const canal =
      melhor ??
      Math.max(minimoLateral, ...obstaculos.map(([, r]) => r.x + r.w + FOLGA + 2)) +
        ocupados.length * ENTRE_CANAIS;

    // As horizontais moram nos vãos; se um cartão vizinho invadir, a curva
    // sobe (chegada) ou desce (saída) até sair dele.
    for (const [id, r] of obstaculos) {
      if (id === p.target) continue;
      if (cruzaHorizontal(r, y2, canal, t.x)) y2 = Math.min(y2, r.y - 10);
    }
    if (p.lado === "baixo") {
      for (const [id, r] of obstaculos) {
        if (id === p.source) continue;
        if (cruzaHorizontal(r, y1, s.x, canal)) y1 = Math.max(y1, r.y + r.h + 10);
      }
    }

    ocupados.push({
      x: canal,
      y0: Math.min(inicioVertical, y2),
      y1: Math.max(inicioVertical, y2),
      target: p.target,
    });
    rotas.set(p.id, { canal: Math.round(canal), y1: Math.round(y1), y2: Math.round(y2) });
  }
  return rotas;
}

/**
 * Os vértices do fio, da saída à entrada, sem pontos repetidos nem colineares.
 * `s` e `t` são as coordenadas EXATAS que o @xyflow passa ao componente.
 */
export function pontosDaRota(lado: PedidoDeRota["lado"], s: Ponto, t: Ponto, rota: Rota): Ponto[] {
  const { canal, y1, y2 } = rota;
  const bruto: Ponto[] =
    lado === "baixo"
      ? [s, { x: s.x, y: y1 }, { x: canal, y: y1 }, { x: canal, y: y2 }, { x: t.x, y: y2 }, t]
      : [s, { x: canal, y: s.y }, { x: canal, y: y2 }, { x: t.x, y: y2 }, t];
  const sem: Ponto[] = [];
  for (const p of bruto) {
    const ultimo = sem[sem.length - 1];
    if (ultimo && Math.abs(ultimo.x - p.x) < 0.5 && Math.abs(ultimo.y - p.y) < 0.5) continue;
    sem.push(p);
  }
  const limpos: Ponto[] = [];
  for (let i = 0; i < sem.length; i++) {
    const a = limpos[limpos.length - 1];
    const b = sem[i]!;
    const c = sem[i + 1];
    if (
      a &&
      c &&
      ((Math.abs(a.x - b.x) < 0.5 && Math.abs(b.x - c.x) < 0.5) ||
        (Math.abs(a.y - b.y) < 0.5 && Math.abs(b.y - c.y) < 0.5))
    ) {
      continue;
    }
    limpos.push(b);
  }
  return limpos;
}

/** Caminho SVG com cantos arredondados (raio limitado pela metade do trecho). */
export function caminhoArredondado(pontos: readonly Ponto[], raio = 10): string {
  if (pontos.length === 0) return "";
  let d = `M ${pontos[0]!.x} ${pontos[0]!.y}`;
  for (let i = 1; i < pontos.length; i++) {
    const b = pontos[i]!;
    const a = pontos[i - 1]!;
    const c = pontos[i + 1];
    if (!c) {
      d += ` L ${b.x} ${b.y}`;
      break;
    }
    const lenAB = Math.hypot(b.x - a.x, b.y - a.y);
    const lenBC = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(raio, lenAB / 2, lenBC / 2);
    const p1 = {
      x: b.x - ((b.x - a.x) / (lenAB || 1)) * r,
      y: b.y - ((b.y - a.y) / (lenAB || 1)) * r,
    };
    const p2 = {
      x: b.x + ((c.x - b.x) / (lenBC || 1)) * r,
      y: b.y + ((c.y - b.y) / (lenBC || 1)) * r,
    };
    d += ` L ${p1.x} ${p1.y} Q ${b.x} ${b.y} ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Onde a pílula do rótulo senta: na saída lateral, no trecho horizontal logo
 * depois da bolinha (cada ramo tem a sua linha, então as pílulas nunca se
 * empilham); na saída de baixo, no primeiro trecho vertical, no vão abaixo do
 * nó de origem.
 */
export function posicaoDoRotulo(
  lado: PedidoDeRota["lado"],
  s: Ponto,
  pontos: readonly Ponto[],
  larguraDoRotulo: number,
): Ponto {
  if (lado === "direita") return { x: s.x + RESPIRO_DO_ROTULO + larguraDoRotulo / 2, y: s.y };
  const segundo = pontos[1] ?? s;
  return { x: s.x, y: (s.y + segundo.y) / 2 };
}

/** Largura estimada da pílula (texto de 12px, padding 10 de cada lado). */
export function larguraDoRotulo(texto: string): number {
  return Math.min(180, Math.max(44, Math.round(texto.length * 6.4 + 22)));
}
