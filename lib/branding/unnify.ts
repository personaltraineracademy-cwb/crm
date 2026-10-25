/**
 * A TABELA FIXA da marca Unnify — o único lugar onde a derivação da cor deixa
 * de ser calculada e passa a ser lida.
 *
 * ── Por que uma tabela, e não um ajuste na derivação ──────────────────────────
 *
 * Derivar `#0066cc` pela régua do produto (`derivarMarca`, em `contraste.ts`)
 * acerta o botão do tema claro e erra todo o resto do Unnify (medido em
 * `docs/unnify/mapa-de-tokens.md` §3.3): o hover claro sai `#0f529f` em vez de
 * `#005bb5`, e o escuro sai `#4b9aff` / texto `#000000` / hover `#82b8ff` em vez
 * de `#75b7ff` / `#08131c` / `#91c5ff`. Mudar o algoritmo para acertar esses
 * valores mudaria a cor de TODO revendedor e de toda organização com marca
 * própria — e a decisão foi não mexer nisso. A tabela troca a derivação SÓ para
 * as sementes do Unnify; qualquer outro hex continua no caminho de sempre, byte
 * a byte (prova: `unnify-outras-cores.test.ts`, com snapshot gravado antes deste
 * arquivo existir).
 *
 * ── Quando ela vale ───────────────────────────────────────────────────────────
 *
 *  - Cor principal `#0066cc` (ou `#06c`): o claro vem da tabela clara E, se a
 *    camada não declarou cor para o tema escuro, o escuro vem da tabela escura
 *    (o par `#0066cc` + `#75b7ff` do Unnify, montado sozinho).
 *  - Cor do tema escuro `#75b7ff` ou `#0066cc`: o escuro vem da tabela escura,
 *    qualquer que seja a cor principal.
 *  - `#75b7ff` como cor PRINCIPAL não é o Unnify no claro (o claro do Unnify é
 *    `#0066cc`), então segue derivando como qualquer outra cor.
 *
 * ── Por que duas `Marca`, uma por tema ────────────────────────────────────────
 *
 * Uma `Marca` tem UMA rampa, e o bloco CSS de cada tema emite as 11 paradas a
 * partir dela (`css.ts`). As rampas do Unnify são diferentes nos dois temas (a
 * 50 clara é `#eaf2fc`, a 50 escura é `#e5f1ff`), então nenhum deslocamento de
 * uma rampa só reproduz as duas. O escuro sai pelo mesmo mecanismo da segunda
 * cor (#2482, `corEscura`), que já existe justamente para o escuro ter rampa
 * própria — `css.ts`, a tela de marca e a tira de tons já o entendem.
 *
 * ── As rampas ─────────────────────────────────────────────────────────────────
 *
 * São as do `docs/unnify/mapa-de-tokens.md` §1.2: os hex de PAPEL do Unnify
 * (DESIGN-SYSTEM.md §3.2) postos nos graus em que a folha do produto lê cada
 * papel. NÃO são a rampa `brand-*` do DS (o azul vivo `#0b5cff`): ela é a cor
 * do símbolo e dos gráficos, e o 600 dela é `#0047d9`, não o `#0066cc` do botão.
 *
 *  claro: acento 600, hover 700, pressionado 800, fundo suave 50, anel 500;
 *  escuro: acento 400, hover 300, pressionado 500, fundo suave 800, anel 400.
 *
 * O 500 claro repete o 600 de propósito: o anel de foco do produto é
 * `var(--color-accent-500)` (e `focus-visible:ring-accent-500` direto nos
 * componentes), e o anel do Unnify é o próprio `#0066cc`.
 *
 * ── O pressionado ─────────────────────────────────────────────────────────────
 *
 * O bloco injetado continua com as MESMAS 16 variáveis de antes: o pressionado
 * não é emitido em runtime. Ele mora numa parada da rampa (800 no claro, 500 no
 * escuro), que o bloco já emite, e a folha estática declara
 * `--color-accent-pressed: var(--color-accent-800)` / `var(--color-accent-500)`.
 * Assim ele vale para TODA marca (a de qualquer revendedor ganha o pressionado
 * da própria rampa, já deslocada pelo piso de contraste) sem mudar uma linha da
 * saída de quem não é o Unnify — e não vaza de um tema para o outro, o que um
 * token emitido só pela tabela faria quando a cor do escuro é de outra pessoa.
 */

import {
  medirPares,
  type Marca,
  type Regua,
  type TemaDaRegua,
  type TokensDoTema,
} from "./contraste";
import { ehHexValido, normalizarHex, type Grau, type Rampa } from "./rampa";

/** A cor do botão do Unnify no tema claro — a semente que liga a tabela. */
export const SEMENTE_DO_UNNIFY = "#0066cc";
/** A cor do botão do Unnify no tema escuro. */
export const SEMENTE_ESCURA_DO_UNNIFY = "#75b7ff";

/** Os papéis do Unnify por tema, como o DESIGN-SYSTEM.md §3.2 os declara. */
export type PapeisDoUnnify = {
  readonly primary: string;
  readonly primaryForeground: string;
  readonly primaryHover: string;
  readonly primaryPressed: string;
  /** Fundo suave da ação (`--color-accent-soft` no CRM). */
  readonly accent: string;
  /** Texto sobre o fundo suave. */
  readonly accentForeground: string;
  readonly ring: string;
  readonly interactive: string;
  readonly interactiveStrong: string;
  readonly interactiveBorder: string;
};

export const PAPEIS_DO_UNNIFY: { readonly claro: PapeisDoUnnify; readonly escuro: PapeisDoUnnify } =
  {
    claro: {
      primary: "#0066cc",
      primaryForeground: "#ffffff",
      primaryHover: "#005bb5",
      primaryPressed: "#004f9e",
      accent: "#eaf2fc",
      accentForeground: "#0055aa",
      ring: "#0066cc",
      interactive: "#eaf2fc",
      interactiveStrong: "#dceafa",
      interactiveBorder: "#9bbbe0",
    },
    escuro: {
      primary: "#75b7ff",
      primaryForeground: "#08131c",
      primaryHover: "#91c5ff",
      primaryPressed: "#5ca8fb",
      accent: "#203750",
      accentForeground: "#c6e0ff",
      ring: "#75b7ff",
      interactive: "#203750",
      interactiveStrong: "#203d5c",
      interactiveBorder: "#416d98",
    },
  };

/** A rampa do tema claro, de 50 a 950 (mapa de tokens §1.2). */
export const RAMPA_CLARA_DO_UNNIFY: Rampa = [
  "#eaf2fc", // 50  accent, interactive, info-soft
  "#dceafa", // 100 interactive-strong
  "#b8d8ff", // 200 info-border
  "#9bbbe0", // 300 interactive-border
  "#5992d7", // 400 interpolação OKLCh entre 300 e 600
  "#0066cc", // 500 ring (repete o 600 de propósito)
  "#0066cc", // 600 primary
  "#005bb5", // 700 primary-hover
  "#004f9e", // 800 primary-pressed
  "#0e2747", // 900 ink-soft
  "#071a32", // 950 ink
];

/** A rampa do tema escuro, de 50 a 950 (mapa de tokens §1.2). */
export const RAMPA_ESCURA_DO_UNNIFY: Rampa = [
  "#e5f1ff", // 50  ponta clara
  "#c6e0ff", // 100 accent-foreground, info-foreground
  "#a9d0ff", // 200 sidebar-ring
  "#91c5ff", // 300 primary-hover
  "#75b7ff", // 400 primary, ring
  "#5ca8fb", // 500 primary-pressed
  "#416d98", // 600 interactive-border, info-border
  "#203d5c", // 700 interactive-strong
  "#203750", // 800 accent, interactive, info-soft
  "#0e2747", // 900 ink-soft
  "#08131c", // 950 primary-foreground
];

/**
 * Em que grau de cada rampa mora cada papel. É o contrato com a folha estática:
 * ela aponta `var(--color-accent-NNN)` para estes graus, e o bloco injetado
 * entrega a parada exata.
 */
export const GRAUS_DO_UNNIFY = {
  claro: { accent: 600, hover: 700, pressionado: 800, soft: 50, anel: 500 },
  escuro: { accent: 400, hover: 300, pressionado: 500, soft: 800, anel: 400 },
} as const satisfies Record<"claro" | "escuro", Record<string, Grau>>;

function tokensDoTema(
  tema: TemaDaRegua,
  rampa: Rampa,
  papeis: PapeisDoUnnify,
  grau: Grau,
): TokensDoTema {
  return {
    grauDoAccent: grau,
    deslocamento: 0,
    accent: papeis.primary,
    accentFg: papeis.primaryForeground,
    accentHover: papeis.primaryHover,
    accentSoft: papeis.accent,
    // As semânticas do produto ficam como estão: no Unnify o `info` É o azul de
    // ação, e a reconciliação que as afastaria do accent é decisão para a marca
    // de outra pessoa, não para a nossa.
    semanticas: Object.fromEntries(tema.semanticas.map((s) => [s.nome, s.hex])),
    // Medidos de verdade, com a régua de quem chamou: a tela de marca e o
    // diagnóstico continuam lendo os pares do pixel que o bloco pinta.
    pares: medirPares(tema, rampa, 0),
  };
}

type ParDoUnnify = { readonly clara: Marca; readonly escura: Marca };

/** Uma por régua, como o cache de `resolve.ts`: teste e prévia passam réguas diferentes. */
const memoria = new WeakMap<Regua, ParDoUnnify>();

function tabelas(regua: Regua): ParDoUnnify {
  const guardada = memoria.get(regua);
  if (guardada) return guardada;
  const claro = tokensDoTema(regua.claro, RAMPA_CLARA_DO_UNNIFY, PAPEIS_DO_UNNIFY.claro, 600);
  const escuro = tokensDoTema(regua.escuro, RAMPA_ESCURA_DO_UNNIFY, PAPEIS_DO_UNNIFY.escuro, 400);
  const par: ParDoUnnify = {
    // `escuro` aqui só é lido por quem chama `derivarMarca` direto: pelo
    // resolvedor, a cor principal do Unnify sempre leva a `corEscura` abaixo.
    clara: {
      marca: SEMENTE_DO_UNNIFY,
      rampa: RAMPA_CLARA_DO_UNNIFY,
      origemDaRampa: "semente",
      claro,
      escuro,
      motivos: [],
    },
    escura: {
      marca: SEMENTE_ESCURA_DO_UNNIFY,
      rampa: RAMPA_ESCURA_DO_UNNIFY,
      origemDaRampa: "semente",
      claro,
      escuro,
      motivos: [],
    },
  };
  memoria.set(regua, par);
  return par;
}

function normalizada(semente: string): string | null {
  return ehHexValido(semente) ? normalizarHex(semente) : null;
}

/** A `Marca` da cor PRINCIPAL quando ela é o `#0066cc`; `null` para qualquer outra. */
export function marcaDoUnnify(semente: string, regua: Regua): Marca | null {
  return normalizada(semente) === SEMENTE_DO_UNNIFY ? tabelas(regua).clara : null;
}

/** A `Marca` da cor do TEMA ESCURO quando ela é do Unnify; `null` para qualquer outra. */
export function escuroDoUnnify(semente: string, regua: Regua): Marca | null {
  const hex = normalizada(semente);
  return hex === SEMENTE_ESCURA_DO_UNNIFY || hex === SEMENTE_DO_UNNIFY
    ? tabelas(regua).escura
    : null;
}

/**
 * O par automático: com a cor principal do Unnify e nenhuma cor de escuro
 * declarada (ou uma recusada), o escuro é o do Unnify. `undefined` para
 * qualquer outra cor principal — a chave continua AUSENTE, como antes.
 */
export function corEscuraDoUnnify(
  sementePrincipal: string,
  regua: Regua,
): { readonly semente: string; readonly derivada: Marca } | undefined {
  if (!marcaDoUnnify(sementePrincipal, regua)) return undefined;
  return { semente: SEMENTE_ESCURA_DO_UNNIFY, derivada: tabelas(regua).escura };
}
