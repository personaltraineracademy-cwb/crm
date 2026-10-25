import fs from "node:fs";
import path from "node:path";

import tailwind from "@tailwindcss/postcss";
import postcss, { type Root, type Rule } from "postcss";
import { beforeAll, describe, expect, it } from "vitest";

import { cssDaMarca, ESCOPO_DA_ORGANIZACAO } from "@/lib/branding/css";
import { REGUA_DO_PRODUTO } from "@/lib/branding/regua-do-produto";
import { resolverMarca } from "@/lib/branding/resolve";
import { envelopeDeSemente } from "@/lib/branding/schema";
import { CHAVES_DE_TOKEN_DO_TEMA } from "@/lib/extensions/tema";
import { cssEfetivo, declaracoes } from "../setup/css-efetivo";

/**
 * Compila `app/unnify/app.css` com o MESMO plugin PostCSS do Next
 * (`postcss.config.mjs`) e confere, no CSS gerado, o que chega à tela nos dois
 * temas: utilitários (`bg-primary`, `text-muted-foreground`, `text-sky-500`,
 * `font-bold`, `uppercase`, `ring-ring`, `dark:`…) e os valores das variáveis.
 *
 * Também prova que `tests/setup/css-efetivo.ts` (o texto que os testes de
 * contraste leem) diz o mesmo que o compilador: se a cascata do texto e a do
 * CSS gerado divergirem, este arquivo reprova.
 *
 * Detecta mudança de comportamento numa atualização do Tailwind: o anexo de
 * `text-transform: none` pelo `@utility uppercase` e a substituição de chave
 * por `@theme` posterior não são contrato documentado.
 */

const RAIZ = process.cwd();
const ENTRADA = path.join(RAIZ, "app/unnify/app.css");
let AST: Root;

const ESTADOS = ["warning", "danger", "error", "success", "info"] as const;
const CANDIDATOS_EXTRAS = [
  ...ESTADOS.flatMap((e) => [
    `text-${e}`,
    `text-${e}/80`,
    `dark:text-${e}`,
    `hover:text-${e}`,
    `bg-${e}`,
    `border-${e}`,
    `fill-${e}`,
    `stroke-${e}`,
  ]),
  // Os papéis de ação que a tabela da marca (lib/branding/unnify.ts) fixa.
  "bg-primary-hover",
  "bg-primary-pressed",
  "bg-accent-pressed",
  "bg-interactive",
  "bg-interactive-strong",
  "border-interactive-border",
  "text-interactive-foreground",
  "text-primary-foreground",
];

/**
 * Pontes que este arquivo mede e que as telas podem deixar de usar: o
 * Tailwind só gera o utilitário que lê no código, então, quando a última
 * classe sai de uma tela (a etapa 8B tirou `bg-surface-sunken` e
 * `hover:text-accent-strong` da agenda e `text-sky-500` do funil), a medida
 * ficaria sem o que medir. Declaradas aqui, a ponte continua provada.
 *
 * Na integração das etapas 6 a 8 saíram também a paleta crua remapeada
 * (`text-sky-700`, `bg-amber-500`, `text-amber-800`, `dark:text-sky-400`,
 * `bg-sky-500/10`), o alias `bg-success-bg` e os neutralizados da
 * tipografia (`font-bold`, `tracking-wide*`). O código que chega em cada
 * sincronização com a base pode voltar a usá-los; a ponte segue provada.
 */
const PONTES_SEM_USO_GARANTIDO = [
  "text-sky-500",
  "bg-surface-sunken",
  "hover:text-accent-strong",
  "text-sky-700",
  "bg-amber-500",
  "text-amber-800",
  "dark:text-sky-400",
  "bg-sky-500/10",
  "bg-success-bg",
  "font-bold",
  "tracking-wide",
  "tracking-wider",
  "tracking-widest",
];

beforeAll(async () => {
  // `@source inline` acrescenta candidatos que o código ainda não usa, para
  // provar a regra do texto de estado também com opacidade e variante.
  const extra = `\n@source inline("${[...CANDIDATOS_EXTRAS, ...PONTES_SEM_USO_GARANTIDO].join(" ")}");\n`;
  const r = await postcss([tailwind({ base: RAIZ })]).process(
    fs.readFileSync(ENTRADA, "utf8") + extra,
    {
      from: ENTRADA,
    },
  );
  AST = postcss.parse(r.css);
}, 120_000);

function camada(no: Rule): string | null {
  for (let p = no.parent; p; p = p.parent as typeof p) {
    if (p.type === "atrule") {
      const a = p as unknown as { name: string; params: string };
      if (a.name === "layer") return a.params;
      if (a.name === "media" || a.name === "supports") return `@${a.name}`;
    }
  }
  return null;
}

type Tema = "claro" | "escuro";

/** As custom properties que o `<html>` recebe em cada tema, na ordem da cascata. */
function variaveis(tema: Tema): Map<string, string> {
  const casa = new Set([
    ":root",
    tema === "claro" ? '[data-theme="light"]' : '[data-theme="dark"]',
  ]);
  const doTema = new Map<string, string>();
  const semCamada = new Map<string, string>();
  AST.walkRules((r) => {
    const c = camada(r);
    if (c === "theme" && r.selector.replace(/\s/g, "") === ":root,:host") {
      r.walkDecls((d) => void doTema.set(d.prop, d.value));
    } else if (c === null && casa.has(r.selector)) {
      r.walkDecls((d) => void semCamada.set(d.prop, d.value));
    }
  });
  // Declaração sem camada vence a de `@layer theme`.
  return new Map([...doTema, ...semCamada]);
}

const VARS: Record<Tema, Map<string, string>> = {} as never;

function resolver(valor: string, tema: Tema): string {
  let v = valor.trim();
  for (let i = 0; i < 12; i++) {
    const m = /^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/.exec(v);
    if (!m?.[1]) break;
    const prox = VARS[tema].get(m[1]);
    if (prox === undefined) return `<sem ${m[1]}>`;
    v = prox.trim();
  }
  return v.toLowerCase();
}

/** O texto de todas as regras com o seletor, aninhamentos incluídos. */
function regraInteira(seletor: string): string {
  let texto = "";
  AST.walkRules((r) => {
    if (r.selector === seletor) texto += r.toString();
  });
  return texto;
}

/** O valor final de `prop` no utilitário (a última declaração de todas as regras do seletor). */
function utilitario(seletor: string, prop: string): string | undefined {
  let valor: string | undefined;
  AST.walkRules((r) => {
    if (r.selector !== seletor) return;
    r.each((n) => {
      if (n.type === "decl" && n.prop === prop) valor = n.value;
    });
  });
  return valor;
}

describe("CSS compilado do Unnify", () => {
  beforeAll(() => {
    VARS.claro = variaveis("claro");
    VARS.escuro = variaveis("escuro");
  });

  const CORES: Array<[string, string, string, string]> = [
    [".bg-primary", "background-color", "#0066cc", "#75b7ff"],
    [".text-primary", "color", "#0066cc", "#75b7ff"],
    [".bg-background", "background-color", "#f1f3f6", "#181a1e"],
    [".bg-card", "background-color", "#ffffff", "#23262b"],
    [".text-muted-foreground", "color", "#626a77", "#b4bbc6"],
    [".text-foreground", "color", "#20242c", "#f3f5f8"],
    [".bg-muted", "background-color", "#e8ecf1", "#202328"],
    [".bg-popover", "background-color", "#ffffff", "#292d33"],
    [".border-border", "border-color", "#d2d9e2", "#353a42"],
    [".border-input", "border-color", "#868d98", "#6a717a"],
    [".ring-ring", "--tw-ring-color", "#0066cc", "#75b7ff"],
    [".bg-destructive", "background-color", "#b42318", "#ff918a"],
    [".text-destructive", "color", "#b42318", "#ff918a"],
    [".text-destructive-foreground", "color", "#ffffff", "#08131c"],
    [".bg-accent", "background-color", "#0066cc", "#75b7ff"],
    [".bg-accent-soft", "background-color", "#eaf2fc", "#203750"],
    [".text-accent-foreground", "color", "#ffffff", "#08131c"],
    [".text-sky-500", "color", "#0066cc", "#0066cc"],
    [".text-sky-700", "color", "#0055aa", "#0055aa"],
    [".bg-amber-500", "background-color", "#f4a93c", "#f4a93c"],
    [".text-amber-800", "color", "#92400e", "#92400e"],
    [".text-danger", "color", "#b42318", "#ffb4ae"], // texto de estado = foreground
    [".border-warning-border", "border-color", "#fde68a", "#78350f"],
    [".bg-surface-sunken", "background-color", "#e8ecf1", "#202328"],
    [".hover\\:text-accent-strong:hover", "color", "#005bb5", "#91c5ff"],
    [".bg-success-bg", "background-color", "#ddfbef", "#052e1c"],
    [".text-error-fg", "color", "#b42318", "#ffb4ae"],
  ];

  for (const [seletor, prop, claro, escuro] of CORES) {
    it(`${seletor} → ${claro} / ${escuro}`, () => {
      const valor = utilitario(seletor, prop);
      expect(valor, `o compilador não gerou ${seletor} { ${prop} }`).toBeDefined();
      expect(resolver(valor!, "claro")).toBe(claro);
      expect(resolver(valor!, "escuro")).toBe(escuro);
    });
  }

  describe("texto de estado usa o `-foreground`; fundo, borda, fill e stroke ficam sólidos", () => {
    const SOLIDA: Record<(typeof ESTADOS)[number], [string, string]> = {
      warning: ["#f4a93c", "#fbbf24"],
      danger: ["#dc2626", "#ff918a"],
      error: ["#dc2626", "#ff918a"],
      success: ["#0c7f57", "#34d399"],
      info: ["#0066cc", "#75b7ff"],
    };
    const TEXTO: Record<(typeof ESTADOS)[number], [string, string]> = {
      warning: ["#92400e", "#fcd34d"],
      danger: ["#b42318", "#ffb4ae"],
      error: ["#b42318", "#ffb4ae"],
      success: ["#065f46", "#6ee7b7"],
      info: ["#0055aa", "#c6e0ff"],
    };
    for (const e of ESTADOS) {
      it(`${e}: texto ${TEXTO[e].join(" / ")}, sólida ${SOLIDA[e].join(" / ")}`, () => {
        const texto = [
          utilitario(`.text-${e}`, "color"),
          utilitario(`.hover\\:text-${e}:hover`, "color"),
          utilitario(
            `.dark\\:text-${e}:where([data-theme="dark"], [data-theme="dark"] *)`,
            "color",
          ),
        ];
        for (const v of texto) {
          expect(v).toBeDefined();
          expect(resolver(v!, "claro")).toBe(TEXTO[e][0]);
          expect(resolver(v!, "escuro")).toBe(TEXTO[e][1]);
        }
        // Opacidade: o `color-mix` (dentro do `@supports`) mistura o `-foreground`.
        expect(regraInteira(`.text-${e}\\/80`)).toMatch(
          /color-mix\(in oklab, var\(--color-[a-z]+-fg\) 80%/,
        );
        for (const [sel, prop] of [
          [`.bg-${e}`, "background-color"],
          [`.border-${e}`, "border-color"],
          [`.fill-${e}`, "fill"],
          [`.stroke-${e}`, "stroke"],
        ] as const) {
          const v = utilitario(sel, prop);
          expect(v, `${sel} não gerado`).toBeDefined();
          expect(resolver(v!, "claro")).toBe(SOLIDA[e][0]);
          expect(resolver(v!, "escuro")).toBe(SOLIDA[e][1]);
        }
      });
    }
  });

  it("`dark:` continua pela variante do produto e pinta com a paleta remapeada", () => {
    const seletor = '.dark\\:text-sky-400:where([data-theme="dark"], [data-theme="dark"] *)';
    const valor = utilitario(seletor, "color");
    expect(valor).toBeDefined();
    expect(resolver(valor!, "escuro")).toBe("#75b7ff");
  });

  it("opacidade sobre a paleta remapeada tem fallback com a cor certa", () => {
    // Sem `color-mix`, o Tailwind usa o hex literal calculado — por isso a
    // paleta está em `@theme` sem `inline` (mapa §5.2).
    expect(utilitario(".bg-sky-500\\/10", "background-color")).toMatch(/#0066cc/i);
  });

  it("pesos acima de 600 não existem", () => {
    // `font-extrabold`/`font-black` não têm uso hoje, então não são gerados;
    // a chave de tema deles está em `app/unnify/tipografia.css`.
    expect(utilitario(".font-bold", "font-weight")).toBe("600");
  });

  it("`uppercase` sai neutralizado e `first-letter:uppercase` é reposto", () => {
    expect(utilitario(".uppercase", "text-transform")).toBe("none");
    expect(utilitario(".first-letter\\:uppercase::first-letter", "text-transform")).toBe(
      "uppercase",
    );
  });

  it("`tracking-wide*` não espaça letra", () => {
    for (const t of ["wide", "wider", "widest"]) {
      expect(utilitario(`.tracking-${t}`, "letter-spacing")).toBe("0em");
    }
  });

  it("`font-sans` e `font-mono` são as pilhas de sistema do Work", () => {
    expect(utilitario(".font-sans", "font-family")).toMatch(/^-apple-system, BlinkMacSystemFont/);
    expect(utilitario(".font-mono", "font-family")).toMatch(/^ui-monospace/);
  });

  it("o texto efetivo dos testes (tests/setup/css-efetivo.ts) bate com o compilador", () => {
    const css = cssEfetivo();
    const divergentes: string[] = [];
    for (const [tema, seletor] of [
      ["claro", ":root"],
      ["escuro", '[data-theme="dark"]'],
    ] as const) {
      const i = css.search(new RegExp(`^${seletor.replace(/[[\]"]/g, "\\$&")}\\s*\\{`, "m"));
      const decls = declaracoes(css.slice(css.indexOf("{", i) + 1, css.indexOf("\n}", i)));
      for (const [prop, valor] of decls) {
        const doTexto = /^var\(/.test(valor) ? resolver(valor, tema) : valor.toLowerCase();
        const doCompilador = resolver(`var(${prop})`, tema);
        if (doTexto.replace(/\s/g, "") !== doCompilador.replace(/\s/g, "")) {
          divergentes.push(`${tema} ${prop}: texto=${doTexto} compilado=${doCompilador}`);
        }
      }
      expect(decls.length).toBeGreaterThan(150);
    }
    expect(divergentes).toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   Marca × folha estática: o mesmo pixel com e sem a marca do Unnify.

   A tabela fixa da marca (`lib/branding/unnify.ts`) faz a semente `#0066cc`
   injetar EXATAMENTE as paradas e os papéis que `app/unnify/tokens.css` já
   declara. Aqui isso é medido em cascata de verdade (herança `<html>` →
   `<body>` → elemento), no CSS COMPILADO, com o bloco que o `app/layout.tsx`
   injeta (instalação, no `<html>`) e o que `app/app/layout.tsx` injeta
   (organização, no `<body>`).
   ───────────────────────────────────────────────────────────────────────── */

type Decls = Array<[string, string]>;
type Computado = Map<string, string>;

const normalizar = (s: string) => s.replace(/["'\s]/g, "");

/** Declarações sem camada das regras com este seletor, na ordem do documento. */
function declsDe(raiz: Root, seletor: string): Decls {
  const alvo = normalizar(seletor);
  const saida: Decls = [];
  raiz.walkRules((r) => {
    if (camada(r) === null && normalizar(r.selector) === alvo) {
      r.each((n) => void (n.type === "decl" && saida.push([n.prop, n.value])));
    }
  });
  return saida;
}

/** As de `@layer theme` (`:root, :host`), que perdem para qualquer outra. */
function declsDoTema(): Decls {
  const saida: Decls = [];
  AST.walkRules((r) => {
    if (camada(r) === "theme" && normalizar(r.selector) === ":root,:host") {
      r.walkDecls((d) => void saida.push([d.prop, d.value]));
    }
  });
  return saida;
}

/** Troca cada `var(--x)` pelo valor lido, de dentro para fora. */
function substituir(valor: string, ler: (nome: string) => string | undefined): string {
  let v = valor;
  for (let i = 0; i < 40; i++) {
    const m = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/.exec(v);
    if (!m?.[1]) break;
    const r = ler(m[1]) ?? m[2]?.trim() ?? `<sem ${m[1]}>`;
    v = v.slice(0, m.index) + r + v.slice(m.index + m[0].length);
  }
  return v.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Os valores COMPUTADOS de um elemento: as próprias declarações (a última
 * vence) resolvidas contra ele mesmo e, no que ele não declara, o valor JÁ
 * computado que herdou do pai — como o navegador faz com custom property.
 */
function computar(proprias: Decls, herdado: Computado = new Map()): Computado {
  const decl = new Map(proprias);
  const memo = new Map<string, string>();
  const ler = (nome: string, pilha: Set<string>): string | undefined => {
    if (!decl.has(nome)) return herdado.get(nome);
    const pronto = memo.get(nome);
    if (pronto !== undefined) return pronto;
    if (pilha.has(nome)) return undefined;
    pilha.add(nome);
    const v = substituir(decl.get(nome)!, (n) => ler(n, pilha));
    pilha.delete(nome);
    memo.set(nome, v);
    return v;
  };
  const saida = new Map(herdado);
  for (const nome of decl.keys()) saida.set(nome, ler(nome, new Set()) ?? `<sem ${nome}>`);
  return saida;
}

const HTML = { claro: [":root"], escuro: [":root", '[data-theme="dark"]'] } as const;
const BODY = {
  claro: ["body:has([data-marca-org])"],
  escuro: ["body:has([data-marca-org])", '[data-theme="dark"] body:has([data-marca-org])'],
} as const;
const INJETADO_HTML = {
  claro: [":root:root"],
  escuro: [":root:root", ':root:root[data-theme="dark"]'],
};
const INJETADO_BODY = {
  claro: [ESCOPO_DA_ORGANIZACAO[0][0]],
  escuro: [ESCOPO_DA_ORGANIZACAO[0][0], ESCOPO_DA_ORGANIZACAO[1][0]],
};

/** O `<style>` que o resolvedor real produz para uma instalação/organização com esta cor. */
function blocoDaMarca(hex: string, escopo?: typeof ESCOPO_DA_ORGANIZACAO): Root {
  const { cor } = resolverMarca(
    [{ origem: "teste", cor: envelopeDeSemente(hex) }],
    REGUA_DO_PRODUTO,
  );
  const css = cssDaMarca(cor, escopo).css;
  if (!css) throw new Error(`a marca ${hex} não gerou CSS`);
  return postcss.parse(css);
}

type Cenario = { instalacao?: Root; organizacao?: Root };

/** `<html>` e `<body>` da área logada, computados num tema. */
function cascata(tema: Tema, c: Cenario = {}): { html: Computado; body: Computado } {
  const doHtml: Decls = [...declsDoTema(), ...HTML[tema].flatMap((s) => declsDe(AST, s))];
  if (c.instalacao) doHtml.push(...INJETADO_HTML[tema].flatMap((s) => declsDe(c.instalacao!, s)));
  const html = computar(doHtml);
  const doBody: Decls = BODY[tema].flatMap((s) => declsDe(AST, s));
  if (c.organizacao) doBody.push(...INJETADO_BODY[tema].flatMap((s) => declsDe(c.organizacao!, s)));
  return { html, body: computar(doBody, html) };
}

/** DESIGN-SYSTEM.md §3.2, à mão (os mesmos literais de lib/branding/unnify.test.ts). */
const UNNIFY: Record<Tema, Record<string, string>> = {
  claro: {
    primary: "#0066cc",
    "primary-foreground": "#ffffff",
    "primary-hover": "#005bb5",
    "primary-pressed": "#004f9e",
    "accent-pressed": "#004f9e",
    "accent-soft": "#eaf2fc",
    ring: "#0066cc",
    foco: "#0066cc",
    interactive: "#eaf2fc",
    "interactive-strong": "#dceafa",
    "interactive-border": "#9bbbe0",
    "interactive-foreground": "#0055aa",
    "selecao-fundo": "#dceafa",
    "selecao-texto": "#0055aa",
  },
  escuro: {
    primary: "#75b7ff",
    "primary-foreground": "#08131c",
    "primary-hover": "#91c5ff",
    "primary-pressed": "#5ca8fb",
    "accent-pressed": "#5ca8fb",
    "accent-soft": "#203750",
    ring: "#75b7ff",
    foco: "#75b7ff",
    interactive: "#203750",
    "interactive-strong": "#203d5c",
    "interactive-border": "#416d98",
    "interactive-foreground": "#c6e0ff",
    "selecao-fundo": "#203d5c",
    "selecao-texto": "#c6e0ff",
  },
};

/** Onde cada papel chega à tela: utilitário compilado ou a variável que a `base.css` lê. */
const SONDAS: Record<string, string | [string, string]> = {
  primary: [".bg-primary", "background-color"],
  "primary-foreground": [".text-primary-foreground", "color"],
  "primary-hover": [".bg-primary-hover", "background-color"],
  "primary-pressed": [".bg-primary-pressed", "background-color"],
  "accent-pressed": [".bg-accent-pressed", "background-color"],
  "accent-soft": [".bg-accent-soft", "background-color"],
  ring: [".ring-ring", "--tw-ring-color"],
  foco: "var(--ring)", // `:focus-visible` da base.css
  interactive: [".bg-interactive", "background-color"],
  "interactive-strong": [".bg-interactive-strong", "background-color"],
  "interactive-border": [".border-interactive-border", "border-color"],
  "interactive-foreground": [".text-interactive-foreground", "color"],
  "selecao-fundo": "var(--interactive-strong)", // `::selection` da base.css
  "selecao-texto": "var(--interactive-foreground)",
};

function medir(onde: Computado): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const [papel, sonda] of Object.entries(SONDAS)) {
    const valor = typeof sonda === "string" ? sonda : utilitario(sonda[0], sonda[1]);
    if (valor === undefined) throw new Error(`o compilador não gerou ${String(sonda)}`);
    saida[papel] = substituir(valor, (n) => onde.get(n));
  }
  return saida;
}

/** Sem `--color-brand`: a marca o declara sempre, e ele não tem consumidor (lib/branding/css.ts). */
function semBrand(m: Computado): Computado {
  const c = new Map(m);
  c.delete("--color-brand");
  return c;
}

/** Tudo que a marca da organização ou o tema de extensão reescrevem no `<body>`. */
const PRIMITIVOS_DO_BODY = new Set([
  ...CHAVES_DE_TOKEN_DO_TEMA,
  ...declsDe(blocoDaMarca("#e11d48", ESCOPO_DA_ORGANIZACAO), ESCOPO_DA_ORGANIZACAO[0][0]).map(
    ([n]) => n,
  ),
]);

describe("marca #0066cc × folha estática: o mesmo pixel", () => {
  for (const tema of ["claro", "escuro"] as const) {
    describe(tema, () => {
      it("SEM marca, a folha sozinha dá os papéis do Unnify, fora e dentro de /app", () => {
        const { html, body } = cascata(tema);
        expect(medir(html)).toEqual(UNNIFY[tema]);
        expect(medir(body)).toEqual(UNNIFY[tema]);
      });

      it("COM a marca da instalação #0066cc injetada, TODA variável computada é idêntica", () => {
        const sem = cascata(tema);
        const com = cascata(tema, { instalacao: blocoDaMarca("#0066cc") });
        expect(medir(com.html)).toEqual(UNNIFY[tema]);
        expect(semBrand(com.html)).toEqual(semBrand(sem.html));
        expect(semBrand(com.body)).toEqual(semBrand(sem.body));
        expect(com.html.get("--color-brand")).toBe("#0066cc");
      });

      it("COM a marca da organização #0066cc injetada no <body>, idem", () => {
        const sem = cascata(tema);
        const com = cascata(tema, {
          organizacao: blocoDaMarca("#0066cc", ESCOPO_DA_ORGANIZACAO),
        });
        expect(medir(com.body)).toEqual(UNNIFY[tema]);
        expect(semBrand(com.body)).toEqual(semBrand(sem.body));
      });

      it("organização com OUTRA cor: anel, pressionado e interactive seguem a rampa DELA", () => {
        const org = blocoDaMarca("#e11d48", ESCOPO_DA_ORGANIZACAO);
        const injetado = new Map(INJETADO_BODY[tema].flatMap((s) => declsDe(org, s)));
        const parada = (g: number) => injetado.get(`--color-accent-${g}`)!.toLowerCase();
        const graus =
          tema === "claro"
            ? { anel: 500, pressionado: 800, forte: 100, borda: 300 }
            : { anel: 400, pressionado: 500, forte: 700, borda: 600 };
        const { html, body } = cascata(tema, { organizacao: org });
        const dentro = medir(body);
        expect(dentro.ring).toBe(parada(graus.anel));
        expect(dentro.foco).toBe(parada(graus.anel));
        expect(dentro["accent-pressed"]).toBe(parada(graus.pressionado));
        expect(dentro["primary-pressed"]).toBe(parada(graus.pressionado));
        expect(dentro["interactive-strong"]).toBe(parada(graus.forte));
        expect(dentro["interactive-border"]).toBe(parada(graus.borda));
        expect(dentro.ring).not.toBe(UNNIFY[tema].ring);
        // Fora de /app (login, erro) continua a instalação, isto é, o Unnify.
        expect(medir(html)).toEqual(UNNIFY[tema]);
        // E sem o bloco do <body> o anel ficaria com a cor da instalação:
        const semBloco = computar(
          INJETADO_BODY[tema].flatMap((s) => declsDe(org, s)),
          html,
        );
        expect(substituir("var(--ring)", (n) => semBloco.get(n))).toBe(UNNIFY[tema].ring);
      });
    });
  }

  it("o <body> redeclara TODO apelido que depende do que a marca/tema de extensão reescreve, com o valor do <html>", () => {
    const faltando: string[] = [];
    for (const tema of ["claro", "escuro"] as const) {
      const doHtml = new Map(HTML[tema].flatMap((s) => declsDe(AST, s)));
      const doBody = new Map(declsDe(AST, BODY[tema].at(-1)!));
      const depende = (nome: string, vistos = new Set<string>()): boolean => {
        for (const m of (doHtml.get(nome) ?? "").matchAll(/var\(\s*(--[\w-]+)/g)) {
          const ref = m[1]!;
          if (PRIMITIVOS_DO_BODY.has(ref)) return true;
          if (!vistos.has(ref) && (vistos.add(ref), depende(ref, vistos))) return true;
        }
        return false;
      };
      for (const nome of doHtml.keys()) {
        if (PRIMITIVOS_DO_BODY.has(nome) || !depende(nome)) continue;
        const v = doBody.get(nome);
        if (v === undefined) faltando.push(`${tema}: ${nome} não está no <body>`);
        else if (normalizar(v) !== normalizar(doHtml.get(nome)!))
          faltando.push(`${tema}: ${nome} = ${v} no <body>, ${doHtml.get(nome)} no <html>`);
      }
      // E o que o <body> declara a mais tem o valor do <html> (paridade dos dois blocos).
      for (const [nome, v] of doBody) {
        if (normalizar(v) !== normalizar(doHtml.get(nome) ?? ""))
          faltando.push(`${tema}: ${nome} = ${v} no <body>, ${doHtml.get(nome)} no <html>`);
      }
    }
    expect(faltando).toEqual([]);
    const chaves = (s: string) =>
      declsDe(AST, s)
        .map(([n]) => n)
        .sort();
    expect(chaves(BODY.escuro[1])).toEqual(chaves(BODY.claro[0]));
  });
});
