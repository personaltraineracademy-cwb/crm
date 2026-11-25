/**
 * "Organizar": a árvore vertical do construtor, de cima para baixo.
 *
 * Princípios (nota "Pesquisa- construtor de workflow"): direção vertical como
 * HubSpot, Zapier e Intercom; o caminho principal numa coluna reta (a
 * "espinha"); ramos laterais à direita, com espaço para o rótulo da saída e
 * para os canais dos fios; espaçamento uniforme entre camadas.
 *
 * Por que não dagre/elk: não estão instalados, entrariam no lockfile, e o
 * grafo de follow-up tem no máximo dezenas de nós — um layout em camadas de
 * cem linhas resolve, sem dependência e sem custo de bundle.
 *
 * O caminho principal de cada nó é o filho com o caminho mais longo até o fim
 * (no modelo "escada", o "Sem resposta" que leva ao próximo toque); os fins
 * compartilhados descem para a última camada, ao lado da espinha.
 */

export type NoParaOrganizar = { id: string; type: string; w: number; h: number };
export type ArestaParaOrganizar = {
  source: string;
  target: string;
  lado: "baixo" | "direita";
  larguraDoRotulo: number;
};

/** Vão vertical entre camadas: cabe a pílula da saída de baixo e as curvas. */
export const VAO_VERTICAL = 88;
/** Vão horizontal mínimo entre vizinhos da mesma camada. */
export const VAO_HORIZONTAL = 72;
/** Respiro de cada canal de fio que desce pela direita de um nó com ramos. */
const POR_CANAL = 16;

export function organizarFluxo(
  nos: readonly NoParaOrganizar[],
  arestas: readonly ArestaParaOrganizar[],
): Map<string, { x: number; y: number }> {
  const posicoes = new Map<string, { x: number; y: number }>();
  if (nos.length === 0) return posicoes;
  const porId = new Map(nos.map((n) => [n.id, n]));
  const validas = arestas.filter(
    (a) => porId.has(a.source) && porId.has(a.target) && a.source !== a.target,
  );

  // Folga à direita de cada nó: rótulo das saídas laterais + um canal por destino.
  const folgaDireita = new Map<string, number>();
  for (const n of nos) {
    const laterais = validas.filter((a) => a.source === n.id && a.lado === "direita");
    if (laterais.length === 0) continue;
    const rotulo = Math.max(...laterais.map((a) => a.larguraDoRotulo));
    const destinos = new Set(laterais.map((a) => a.target)).size;
    folgaDireita.set(n.id, 28 + rotulo + destinos * POR_CANAL + 24);
  }

  // 1. Arestas "para a frente": DFS a partir dos gatilhos; aresta para um
  //    ancestral é laço e sai do cálculo das camadas.
  const saidas = new Map<string, ArestaParaOrganizar[]>();
  for (const a of validas) saidas.set(a.source, [...(saidas.get(a.source) ?? []), a]);
  const entram = new Map<string, number>();
  for (const a of validas) entram.set(a.target, (entram.get(a.target) ?? 0) + 1);
  const raizes = [...nos]
    .sort((a, b) => peso(a, entram) - peso(b, entram) || a.id.localeCompare(b.id))
    .map((n) => n.id);
  const cor = new Map<string, 0 | 1 | 2>();
  const frente: ArestaParaOrganizar[] = [];
  const visitar = (id: string) => {
    cor.set(id, 1);
    for (const a of saidas.get(id) ?? []) {
      const c = cor.get(a.target) ?? 0;
      if (c === 1) continue;
      frente.push(a);
      if (c === 0) visitar(a.target);
    }
    cor.set(id, 2);
  };
  for (const r of raizes) if ((cor.get(r) ?? 0) === 0) visitar(r);

  const filhos = new Map<string, string[]>();
  const pais = new Map<string, string[]>();
  for (const a of frente) {
    if (!(filhos.get(a.source) ?? []).includes(a.target))
      filhos.set(a.source, [...(filhos.get(a.source) ?? []), a.target]);
    if (!(pais.get(a.target) ?? []).includes(a.source))
      pais.set(a.target, [...(pais.get(a.target) ?? []), a.source]);
  }

  // 2. Camada = caminho mais longo desde a raiz; altura = caminho mais longo até o fim.
  const camada = new Map<string, number>();
  const ordemTopo = ordenarTopologico(
    nos.map((n) => n.id),
    filhos,
    pais,
  );
  for (const id of ordemTopo) {
    const ps = pais.get(id) ?? [];
    camada.set(id, ps.length === 0 ? 0 : Math.max(...ps.map((p) => (camada.get(p) ?? 0) + 1)));
  }
  const altura = new Map<string, number>();
  for (const id of [...ordemTopo].reverse()) {
    const fs = filhos.get(id) ?? [];
    altura.set(id, fs.length === 0 ? 0 : Math.max(...fs.map((f) => (altura.get(f) ?? 0) + 1)));
  }
  const principal = new Map<string, string>();
  for (const [id, fs] of filhos) {
    let melhor: string | null = null;
    for (const f of fs) {
      // Só herda a coluna o filho da camada seguinte que ainda não tem dono.
      if ((camada.get(f) ?? 0) !== (camada.get(id) ?? 0) + 1) continue;
      if ([...principal.values()].includes(f)) continue;
      if (melhor === null || (altura.get(f) ?? 0) > (altura.get(melhor) ?? 0)) melhor = f;
    }
    if (melhor) principal.set(id, melhor);
  }
  const herdeiroDe = new Map([...principal.entries()].map(([pai, filho]) => [filho, pai]));

  // Componentes conectados lado a lado; nós soltos numa coluna à direita.
  const componentes = componentesConectados(
    nos.map((n) => n.id),
    validas,
  );
  const conectados = componentes.filter((c) => c.length > 1);
  const soltos = componentes.filter((c) => c.length === 1).map((c) => c[0]!);

  let deslocamento = 0;
  for (const ids of conectados) {
    const set = new Set(ids);
    const centro = new Map<string, number>();
    const maxCamada = Math.max(...ids.map((id) => camada.get(id) ?? 0));
    const camadas: string[][] = Array.from({ length: maxCamada + 1 }, () => []);
    for (const id of ordemTopo) if (set.has(id)) camadas[camada.get(id) ?? 0]!.push(id);

    // 3. Centro desejado: o herdeiro fica sob o pai; os demais à direita dele.
    for (const ids_ of camadas) {
      const desejado = new Map<string, number>();
      for (const id of ids_) {
        const n = porId.get(id)!;
        const pai = herdeiroDe.get(id);
        if (pai !== undefined && centro.has(pai)) {
          desejado.set(id, centro.get(pai)!);
          continue;
        }
        const ps = (pais.get(id) ?? []).filter((p) => centro.has(p));
        if (ps.length === 0) {
          desejado.set(id, 0);
          continue;
        }
        const direitaDosPais = Math.max(
          ...ps.map(
            (p) =>
              centro.get(p)! +
              porId.get(p)!.w / 2 +
              Math.max(VAO_HORIZONTAL, folgaDireita.get(p) ?? 0),
          ),
        );
        desejado.set(id, direitaDosPais + n.w / 2);
      }
      // 4. Sem sobreposição: varre da esquerda para a direita respeitando a folga.
      const ordem = [...ids_].sort(
        (a, b) =>
          desejado.get(a)! - desejado.get(b)! ||
          (herdeiroDe.has(a) ? -1 : 0) - (herdeiroDe.has(b) ? -1 : 0),
      );
      let limite = -Infinity;
      for (const id of ordem) {
        const n = porId.get(id)!;
        const c = Math.max(desejado.get(id)!, limite + n.w / 2);
        centro.set(id, c);
        limite = c + n.w / 2 + Math.max(VAO_HORIZONTAL, folgaDireita.get(id) ?? 0);
      }
    }

    // 5. Alturas: cada camada começa depois da mais alta da anterior.
    let y = 0;
    let esquerda = Infinity;
    let direita = -Infinity;
    for (const ids_ of camadas) {
      if (ids_.length === 0) continue;
      for (const id of ids_) {
        const n = porId.get(id)!;
        esquerda = Math.min(esquerda, centro.get(id)! - n.w / 2);
        direita = Math.max(direita, centro.get(id)! + n.w / 2 + (folgaDireita.get(id) ?? 0));
      }
    }
    for (const ids_ of camadas) {
      if (ids_.length === 0) continue;
      for (const id of ids_) {
        const n = porId.get(id)!;
        posicoes.set(id, {
          x: Math.round(centro.get(id)! - n.w / 2 - esquerda + deslocamento),
          y: Math.round(y),
        });
      }
      y += Math.max(...ids_.map((id) => porId.get(id)!.h)) + VAO_VERTICAL;
    }
    deslocamento += direita - esquerda + VAO_HORIZONTAL * 2;
  }

  let ySolto = 0;
  for (const id of [...soltos].sort(
    (a, b) => peso(porId.get(a)!, entram) - peso(porId.get(b)!, entram) || a.localeCompare(b),
  )) {
    const n = porId.get(id)!;
    posicoes.set(id, { x: Math.round(deslocamento), y: ySolto });
    ySolto += n.h + 40;
  }
  return posicoes;
}

/** Gatilho primeiro, depois quem não recebe aresta, depois o resto. */
function peso(n: NoParaOrganizar, entram: Map<string, number>): number {
  if (n.type === "trigger") return 0;
  if ((entram.get(n.id) ?? 0) === 0) return n.type === "end" ? 3 : 1;
  return 2;
}

function ordenarTopologico(
  ids: string[],
  filhos: Map<string, string[]>,
  pais: Map<string, string[]>,
): string[] {
  const grau = new Map(ids.map((id) => [id, (pais.get(id) ?? []).length]));
  const fila = ids.filter((id) => grau.get(id) === 0);
  const saida: string[] = [];
  while (fila.length > 0) {
    const id = fila.shift()!;
    saida.push(id);
    for (const f of filhos.get(id) ?? []) {
      grau.set(f, grau.get(f)! - 1);
      if (grau.get(f) === 0) fila.push(f);
    }
  }
  for (const id of ids) if (!saida.includes(id)) saida.push(id);
  return saida;
}

function componentesConectados(ids: string[], arestas: readonly ArestaParaOrganizar[]): string[][] {
  const pai = new Map(ids.map((id) => [id, id]));
  const achar = (id: string): string => {
    const p = pai.get(id)!;
    if (p === id) return id;
    const r = achar(p);
    pai.set(id, r);
    return r;
  };
  for (const a of arestas) {
    const ra = achar(a.source);
    const rb = achar(a.target);
    if (ra !== rb) pai.set(ra, rb);
  }
  const grupos = new Map<string, string[]>();
  for (const id of ids) grupos.set(achar(id), [...(grupos.get(achar(id)) ?? []), id]);
  // O componente do gatilho primeiro, depois os maiores.
  return [...grupos.values()].sort((a, b) => b.length - a.length || a[0]!.localeCompare(b[0]!));
}
