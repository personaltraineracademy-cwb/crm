/**
 * Tons categóricos do Unnify (DS §3.3 e §10.6) para o funil e a agenda.
 *
 * Dez matizes próprios (`tone-*`) e três que reaproveitam os estados (`amber` =
 * aviso, `red` = perigo, `green` = sucesso). Uso padrão: marcador sólido
 * (`TOM_MARCADOR`) e chip suave a 12% (`TOM_SUAVE`). Nada de paleta crua nem
 * hex em componente: a cor vem do token, que segue o tema.
 *
 * As classes estão por extenso de propósito: o Tailwind só gera o que lê.
 */

export type Tom =
  | "stone"
  | "blue"
  | "violet"
  | "teal"
  | "pink"
  | "cyan"
  | "orange"
  | "lime"
  | "purple"
  | "fuchsia"
  | "amber"
  | "red"
  | "green";

/** Fundo a 12% + texto do tom (chip, etiqueta, bloco de evento). */
export const TOM_SUAVE: Readonly<Record<Tom, string>> = {
  stone: "bg-tone-stone/12 text-tone-stone-foreground",
  blue: "bg-tone-blue/12 text-tone-blue-foreground",
  violet: "bg-tone-violet/12 text-tone-violet-foreground",
  teal: "bg-tone-teal/12 text-tone-teal-foreground",
  pink: "bg-tone-pink/12 text-tone-pink-foreground",
  cyan: "bg-tone-cyan/12 text-tone-cyan-foreground",
  orange: "bg-tone-orange/12 text-tone-orange-foreground",
  lime: "bg-tone-lime/12 text-tone-lime-foreground",
  purple: "bg-tone-purple/12 text-tone-purple-foreground",
  fuchsia: "bg-tone-fuchsia/12 text-tone-fuchsia-foreground",
  amber: "bg-warning/12 text-warning-foreground",
  red: "bg-danger/12 text-danger-foreground",
  green: "bg-success/12 text-success-foreground",
};

/** Marcador sólido do tom (bolinha, barra). */
export const TOM_MARCADOR: Readonly<Record<Tom, string>> = {
  stone: "bg-tone-stone",
  blue: "bg-tone-blue",
  violet: "bg-tone-violet",
  teal: "bg-tone-teal",
  pink: "bg-tone-pink",
  cyan: "bg-tone-cyan",
  orange: "bg-tone-orange",
  lime: "bg-tone-lime",
  purple: "bg-tone-purple",
  fuchsia: "bg-tone-fuchsia",
  amber: "bg-warning",
  red: "bg-danger",
  green: "bg-success",
};

/**
 * Os dez tons próprios, na ordem de rodízio. O azul fica no fim de propósito:
 * azul é ação (DS §3.3), e as primeiras categorias não devem parecer link.
 */
export const TONS_CATEGORICOS: ReadonlyArray<Tom> = [
  "violet",
  "teal",
  "orange",
  "pink",
  "cyan",
  "lime",
  "purple",
  "fuchsia",
  "stone",
  "blue",
];

/**
 * Matiz de referência de cada tom (o valor claro do token, em graus HSL). Só
 * para escolher o tom mais próximo de uma cor antiga gravada em hex; a cor
 * pintada continua sendo a do token.
 */
const MATIZ_DO_TOM: ReadonlyArray<readonly [Tom, number]> = [
  ["blue", 217],
  ["violet", 258],
  ["teal", 173],
  ["pink", 330],
  ["cyan", 189],
  ["orange", 25],
  ["lime", 84],
  ["purple", 271],
  ["fuchsia", 292],
];

function hslDoHex(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1]!, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

/**
 * O tom categórico mais próximo de um hex (`#rrggbb`). Cor apagada (pouca
 * saturação) vira `stone`. Vermelho, verde e âmbar NÃO entram no rodízio: são
 * estado, e uma etapa comum pintada de "erro" mentiria.
 */
export function tomMaisProximo(hex: string): Tom | null {
  const hsl = hslDoHex(hex);
  if (!hsl) return null;
  if (hsl.s < 0.18 || hsl.l < 0.12 || hsl.l > 0.92) return "stone";
  let melhor: Tom = "violet";
  let menor = Number.POSITIVE_INFINITY;
  for (const [tom, matiz] of MATIZ_DO_TOM) {
    const bruto = Math.abs(hsl.h - matiz);
    const distancia = Math.min(bruto, 360 - bruto);
    if (distancia < menor) {
      menor = distancia;
      melhor = tom;
    }
  }
  return melhor;
}

/**
 * O tom do marcador de uma etapa do funil.
 *
 * Ganho é sucesso e perda é perigo (o estado que a etapa representa). As
 * demais usam a cor gravada, traduzida para o tom mais próximo; sem cor, o
 * rodízio pela posição da etapa, que é estável enquanto a ordem não muda.
 */
export function tomDaEtapa(
  etapa: { color?: string | null; is_won?: boolean; is_lost?: boolean },
  posicao: number,
): Tom {
  if (etapa.is_won) return "green";
  if (etapa.is_lost) return "red";
  const daCor = etapa.color ? tomMaisProximo(etapa.color) : null;
  if (daCor) return daCor;
  const i =
    ((posicao % TONS_CATEGORICOS.length) + TONS_CATEGORICOS.length) % TONS_CATEGORICOS.length;
  return TONS_CATEGORICOS[i]!;
}

/**
 * O tom de uma etiqueta, derivado do próprio texto: a mesma etiqueta tem a
 * mesma cor em todo card e em toda tela, sem cadastro de cor.
 */
export function tomDaEtiqueta(etiqueta: string): Tom {
  let h = 0;
  for (const ch of etiqueta.trim().toLowerCase()) {
    h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  }
  return TONS_CATEGORICOS[h % TONS_CATEGORICOS.length]!;
}
