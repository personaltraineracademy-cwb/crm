import fs from "node:fs";
import path from "node:path";

/**
 * O CSS que vai para a tela, em TEXTO, no formato do `app/globals.css`.
 *
 * O `app/layout.tsx` importa `app/unnify/app.css`, que importa o `globals.css`
 * do original e, DEPOIS dele, os arquivos do Unnify. Os testes que leem só o
 * `globals.css` continuariam verdes medindo a paleta antiga, que não pinta mais
 * nada. Este módulo devolve o `globals.css` com os nossos blocos já aplicados,
 * do jeito que a cascata os aplica:
 *
 * - declarações de `:root`, `[data-theme="light"]`, `[data-theme="dark"]`,
 *   `@theme inline` e `@theme` SUBSTITUEM a do bloco de mesmo seletor do
 *   original (mesma especificidade e vêm depois, ou chave de tema posterior),
 *   ou entram no fim desse bloco quando são novas;
 * - qualquer outro bloco (`@layer`, `@media`, `@utility`) vai para o fim.
 *
 * O resultado conserva a FORMA do original (um bloco por seletor, na mesma
 * ordem), então todo leitor que acha `:root {` pela primeira ocorrência e lê a
 * primeira declaração de uma propriedade — o padrão dos testes daqui — passa a
 * ler o valor efetivo sem mudar uma linha da própria lógica.
 *
 * Só usa `node:fs`/`node:path`: cabe no projeto `cercas`.
 * A fidelidade deste texto ao CSS compilado é provada em
 * `tests/unit/unnify-css-compilado.test.ts`, que compila de verdade.
 */

const RAIZ = process.cwd();
export const ENTRADA = "app/unnify/app.css";
const SELETORES_MESCLADOS = [
  ":root",
  '[data-theme="light"]',
  '[data-theme="dark"]',
  "@theme inline",
  "@theme",
];

function semComentarios(t: string): string {
  return t.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
}

type Bloco = { seletor: string; inicio: number; abre: number; fim: number };

/** Blocos de nível superior (`seletor { … }`), por contagem de chaves sem comentários. */
export function blocosDeTopo(css: string): Bloco[] {
  const limpo = semComentarios(css);
  const blocos: Bloco[] = [];
  let i = 0;
  while (i < limpo.length) {
    const abre = limpo.indexOf("{", i);
    const ponto = limpo.indexOf(";", i);
    if (abre < 0) break;
    if (ponto >= 0 && ponto < abre) {
      i = ponto + 1; // `@import …;`
      continue;
    }
    let prof = 0;
    let j = abre;
    for (; j < limpo.length; j++) {
      if (limpo[j] === "{") prof++;
      else if (limpo[j] === "}" && --prof === 0) break;
    }
    const seletor = limpo.slice(i, abre).trim().replace(/\s+/g, " ");
    blocos.push({
      seletor,
      inicio: i + (limpo.slice(i, abre).length - limpo.slice(i, abre).trimStart().length),
      abre,
      fim: j,
    });
    i = j + 1;
  }
  return blocos;
}

/** Declarações `--x: valor;` do primeiro nível de um corpo de bloco, em ordem. */
export function declaracoes(corpo: string): Array<[string, string]> {
  const limpo = semComentarios(corpo);
  const saida: Array<[string, string]> = [];
  let prof = 0;
  let inicioDaLinha = 0;
  for (let k = 0; k < limpo.length; k++) {
    const c = limpo[k];
    if (c === "{") prof++;
    else if (c === "}") prof--;
    else if (c === ";" && prof === 0) {
      const m = /^\s*(--[\w-]+)\s*:\s*([\s\S]*)$/.exec(limpo.slice(inicioDaLinha, k));
      if (m?.[1] && m[2] !== undefined) saida.push([m[1], m[2].trim().replace(/\s+/g, " ")]);
      inicioDaLinha = k + 1;
    } else if (c === "}" || c === "{") inicioDaLinha = k + 1;
  }
  return saida;
}

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mesclarNoBloco(
  base: string,
  seletor: string,
  decls: Array<[string, string]>,
): string | null {
  const rx = new RegExp(`^${escapar(seletor)}\\s*\\{`, "m");
  const ini = base.search(rx);
  if (ini < 0) return null;
  const fim = base.indexOf("\n}", ini);
  let corpo = base.slice(ini, fim);
  const novas: string[] = [];
  for (const [nome, valor] of decls) {
    const rxDecl = new RegExp(`^(\\s*)${escapar(nome)}\\s*:[^;]*;`, "gm");
    if (rxDecl.test(corpo))
      corpo = corpo.replace(rxDecl, (_m, recuo: string) => `${recuo}${nome}: ${valor};`);
    else novas.push(`  ${nome}: ${valor};`);
  }
  if (novas.length) corpo += `\n  /* ↓ acrescentado por ${ENTRADA} */\n${novas.join("\n")}`;
  return base.slice(0, ini) + corpo + base.slice(fim);
}

/** Os arquivos nossos que o ponto de entrada importa, em ordem (sem o `globals.css`). */
export function arquivosDoUnnify(): string[] {
  const entrada = fs.readFileSync(path.join(RAIZ, ENTRADA), "utf8");
  return [...entrada.matchAll(/^@import\s+"([^"]+)";/gm)]
    .map((m) => m[1] as string)
    .filter((f) => !f.endsWith("globals.css"))
    .map((f) => path.join(path.dirname(ENTRADA), f));
}

let emCache: string | null = null;

export function cssEfetivo(): string {
  if (emCache !== null) return emCache;
  let css = fs.readFileSync(path.join(RAIZ, "app/globals.css"), "utf8");
  const resto: string[] = [];
  for (const arq of arquivosDoUnnify()) {
    const texto = fs.readFileSync(path.join(RAIZ, arq), "utf8");
    for (const b of blocosDeTopo(texto)) {
      const corpo = texto.slice(b.abre + 1, b.fim);
      if (SELETORES_MESCLADOS.includes(b.seletor)) {
        const mesclado = mesclarNoBloco(css, b.seletor, declaracoes(corpo));
        if (mesclado !== null) {
          css = mesclado;
          continue;
        }
      }
      resto.push(`/* ↓ de ${arq} */\n${texto.slice(b.inicio, b.fim + 1)}`);
    }
  }
  emCache = `${css}\n${resto.join("\n\n")}\n`;
  return emCache;
}
