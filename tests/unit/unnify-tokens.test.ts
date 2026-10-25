import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { blocosDeTopo, cssEfetivo, declaracoes } from "../setup/css-efetivo";

/**
 * Tokens do Unnify (etapa 1): o que vai para a tela, medido no CSS EFETIVO
 * (`app/globals.css` + `app/unnify/*.css`, na ordem da cascata).
 *
 * Os testes do original que leem só o `globals.css` medem a paleta Sage, que
 * não pinta mais nada; estes medem a que pinta. A compilação de verdade (e a
 * prova de que o texto efetivo é fiel a ela) fica em
 * `tests/unit/unnify-css-compilado.test.ts`.
 */

const RAIZ = process.cwd();
const CSS = cssEfetivo();
const TOKENS = fs.readFileSync(path.join(RAIZ, "app/unnify/tokens.css"), "utf8");

function bloco(css: string, seletor: string): Map<string, string> {
  const rx = new RegExp(`^${seletor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`, "m");
  const i = css.search(rx);
  if (i < 0) throw new Error(`não achei o bloco \`${seletor}\``);
  const fim = css.indexOf("\n}", i);
  return new Map(declaracoes(css.slice(css.indexOf("{", i) + 1, fim)));
}

const TEMA = { claro: bloco(CSS, ":root"), escuro: bloco(CSS, '[data-theme="dark"]') } as const;
const PONTE = bloco(CSS, "@theme inline");
type Tema = keyof typeof TEMA;

/** Resolve `--x` até um hex no tema, seguindo `var()`; o escuro herda do `:root`. */
function hex(nome: string, tema: Tema): string {
  let v: string | undefined = nome;
  for (let i = 0; i < 10 && v; i++) {
    const via: string | undefined =
      /^var\(\s*(--[\w-]+)\s*\)$/.exec(v)?.[1] ?? (v.startsWith("--") ? v : undefined);
    if (!via) break;
    v = TEMA[tema].get(via) ?? TEMA.claro.get(via);
  }
  if (!v || !/^#[0-9a-f]{6}$/i.test(v))
    throw new Error(`\`${nome}\` no tema ${tema} resolveu para \`${v}\``);
  return v.toLowerCase();
}

function luminancia(h: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const x = parseInt(h.slice(i, i + 2), 16) / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

describe("ponto de entrada", () => {
  it("o layout raiz importa o CSS do Unnify, que importa o globals.css do original PRIMEIRO", () => {
    const layout = fs.readFileSync(path.join(RAIZ, "app/layout.tsx"), "utf8");
    // Comparação por linha, e não regex: `ts.preProcessFile` (a seleção das
    // cercas, vitest.cercas.ts) lê `import "…"` dentro de regex como import.
    const linhas = layout.split("\n");
    expect(linhas).toContain('import "./unnify/app.css";');
    expect(linhas).not.toContain('import "./globals.css";');
    const entrada = fs.readFileSync(path.join(RAIZ, "app/unnify/app.css"), "utf8");
    const imports = [...entrada.matchAll(/^@import\s+"([^"]+)";/gm)].map((m) => m[1]);
    expect(imports[0]).toBe("../globals.css");
    expect(imports.length).toBeGreaterThan(1);
  });
});

describe("paridade dos três blocos de tema do tokens.css", () => {
  const blocos = new Map(
    blocosDeTopo(TOKENS).map((b) => [
      b.seletor,
      new Map(declaracoes(TOKENS.slice(b.abre + 1, b.fim))),
    ]),
  );
  const raiz = blocos.get(":root")!;
  const espelho = blocos.get('[data-theme="light"]')!;
  const escuro = blocos.get('[data-theme="dark"]')!;

  it("o espelho claro cobre EXATAMENTE as chaves do escuro", () => {
    expect([...espelho.keys()].sort()).toEqual([...escuro.keys()].sort());
    expect(espelho.size).toBeGreaterThan(150); // guarda de vacuidade
  });

  it("o espelho claro repete o `:root` valor a valor", () => {
    const diferentes = [...espelho].filter(([k, v]) => raiz.get(k) !== v).map(([k]) => k);
    expect(diferentes).toEqual([]);
  });
});

/** Valores canônicos do Unnify Work (DESIGN-SYSTEM.md §3.2), com as duas correções. */
const CANONICOS: Record<string, [string, string]> = {
  "--background": ["#f1f3f6", "#181a1e"],
  "--foreground": ["#20242c", "#f3f5f8"],
  "--card": ["#ffffff", "#23262b"],
  "--popover": ["#ffffff", "#292d33"],
  "--muted": ["#e8ecf1", "#202328"],
  "--muted-foreground": ["#626a77", "#b4bbc6"],
  "--secondary": ["#e3e8ef", "#2d3239"],
  "--secondary-foreground": ["#343c48", "#eeeeef"],
  "--border": ["#d2d9e2", "#353a42"],
  "--input": ["#868d98", "#6a717a"], // §18 #3: corrigido para 3:1
  "--ring": ["#0066cc", "#75b7ff"],
  "--primary": ["#0066cc", "#75b7ff"],
  "--primary-foreground": ["#ffffff", "#08131c"],
  "--primary-hover": ["#005bb5", "#91c5ff"],
  "--primary-pressed": ["#004f9e", "#5ca8fb"],
  "--interactive": ["#eaf2fc", "#203750"],
  "--interactive-strong": ["#dceafa", "#203d5c"],
  "--interactive-border": ["#9bbbe0", "#416d98"],
  "--interactive-foreground": ["#0055aa", "#c6e0ff"],
  "--destructive": ["#b42318", "#ff918a"],
  "--destructive-foreground": ["#ffffff", "#08131c"], // decisão 9
  "--success": ["#0c7f57", "#34d399"],
  "--success-foreground": ["#065f46", "#6ee7b7"],
  "--success-soft": ["#ddfbef", "#052e1c"],
  "--success-border": ["#a7f3d0", "#065f46"],
  "--warning": ["#f4a93c", "#fbbf24"],
  "--warning-foreground": ["#92400e", "#fcd34d"],
  "--warning-soft": ["#fef3c7", "#2a1a00"],
  "--warning-border": ["#fde68a", "#78350f"],
  "--danger": ["#dc2626", "#ff918a"],
  "--danger-foreground": ["#b42318", "#ffb4ae"],
  "--danger-soft": ["#fff0ee", "#361f20"],
  "--danger-border": ["#fecdca", "#6b2a2a"],
  "--info": ["#0066cc", "#75b7ff"],
  "--info-foreground": ["#0055aa", "#c6e0ff"],
  "--info-soft": ["#eaf2fc", "#203750"],
  "--info-border": ["#b8d8ff", "#416d98"],
  "--sidebar": ["#e9edf3", "#1e2126"],
  "--sidebar-foreground": ["#29292e", "#f5f5f7"],
  "--sidebar-primary": ["#0066cc", "#75b7ff"],
  "--sidebar-primary-foreground": ["#ffffff", "#08131c"],
  "--sidebar-accent": ["#dde4ec", "#2a2f36"],
  "--sidebar-accent-foreground": ["#29292e", "#c6e0ff"],
  "--sidebar-border": ["#d9dfe7", "#30353d"],
  "--sidebar-ring": ["#0066cc", "#a9d0ff"],
  "--sidebar-muted": ["#626a77", "#b4bbc6"],
  "--sidebar-indicator": ["#0066cc", "#75b7ff"],
  "--border-strong": ["#b4bcc8", "#505863"],
  "--surface-hover": ["#eef1f5", "#2d3239"],
  "--surface-soft": ["#f7f8fb", "#202328"],
  "--elevated": ["#f7f8fb", "#292d33"],
  "--text-disabled": ["#aab2bd", "#66717f"],
  "--chart-1": ["#0b5cff", "#71a8ff"],
  "--chart-2": ["#00a8f6", "#68e2ff"],
  "--chart-3": ["#98a2b3", "#98a2b3"],
  "--chart-4": ["#dc2626", "#f87171"],
};

describe("valores canônicos do Unnify Work, nos dois temas", () => {
  for (const [nome, [claro, escuro]] of Object.entries(CANONICOS)) {
    it(`${nome} = ${claro} / ${escuro}`, () => {
      expect(hex(nome, "claro")).toBe(claro);
      expect(hex(nome, "escuro")).toBe(escuro);
    });
  }
});

/**
 * Os pares de texto do DESIGN-SYSTEM.md §3.4, mais os que o CRM soma: o botão
 * destrutivo (72 `bg-destructive`), o texto destrutivo (243), o `text-danger`
 * que passou a pintar, a seleção de texto, o anel de foco e a borda de campo
 * contra a página. Meta 4,5:1 para texto e 3:1 para borda de controle e anel.
 */
const PARES: Array<[string, string, number]> = [
  ["--foreground", "--background", 4.5],
  ["--foreground", "--card", 4.5],
  ["--muted-foreground", "--background", 4.5],
  ["--muted-foreground", "--card", 4.5],
  ["--muted-foreground", "--muted", 4.5],
  ["--primary-foreground", "--primary", 4.5],
  ["--primary", "--card", 4.5],
  ["--interactive-foreground", "--interactive", 4.5],
  ["--sidebar-foreground", "--sidebar", 4.5],
  ["--sidebar-muted", "--sidebar", 4.5],
  ["--success-foreground", "--success-soft", 4.5],
  ["--warning-foreground", "--warning-soft", 4.5],
  ["--danger-foreground", "--danger-soft", 4.5],
  ["--info-foreground", "--info-soft", 4.5],
  ["--success-foreground", "--card", 4.5],
  ["--danger-foreground", "--card", 4.5],
  ["--destructive-foreground", "--destructive", 4.5],
  ["--destructive", "--card", 4.5],
  ["--danger", "--card", 4.5],
  ["--interactive-foreground", "--interactive-strong", 4.5],
  ["--secondary-foreground", "--secondary", 4.5],
  ["--popover-foreground", "--popover", 4.5],
  ["--input", "--card", 3],
  ["--input", "--background", 3],
  ["--ring", "--card", 3],
  ["--ring", "--background", 3],
];

describe("contraste dos pares de texto (DS §3.4) com os valores finais", () => {
  for (const [frente, fundo, meta] of PARES) {
    for (const tema of ["claro", "escuro"] as const) {
      it(`${frente} sobre ${fundo} (${tema}) ≥ ${meta}:1`, () => {
        expect(contraste(hex(frente, tema), hex(fundo, tema))).toBeGreaterThanOrEqual(meta);
      });
    }
  }
});

describe("nomes que o código já usava e não pintavam (inventário de telas, fato 5)", () => {
  const usados = ["surface-muted", "surface-sunken", "danger", "warning-border", "accent-strong"];
  for (const nome of usados) {
    it(`\`--color-${nome}\` tem ponte e resolve nos dois temas`, () => {
      expect(PONTE.has(`--color-${nome}`)).toBe(true);
      const alvo = PONTE.get(`--color-${nome}`)!;
      expect(hex(alvo, "claro")).toMatch(/^#/);
      expect(hex(alvo, "escuro")).toMatch(/^#/);
    });
  }

  // `danger` sólido é cor de PONTO e BARRA (DS §3.3): sobre a página o claro dá
  // 4,34:1. Como TEXTO, `text-danger` resolve para `danger-foreground` (bloco
  // de texto de estado abaixo); aqui fica só o piso da cor sólida no cartão.
  it("`danger` sólido cumpre 4,5:1 sobre o cartão, nos dois temas", () => {
    for (const tema of ["claro", "escuro"] as const) {
      const cor = hex(PONTE.get("--color-danger")!, tema);
      expect(contraste(cor, hex("--card", tema))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("texto de estado (`text-warning`, `text-error`…) passa 4,5:1 sobre o cartão E a página", () => {
  for (const estado of ["warning", "danger", "error", "success", "info"]) {
    for (const tema of ["claro", "escuro"] as const) {
      it(`text-${estado} (${tema})`, () => {
        const alvo = PONTE.get(`--text-color-${estado}`);
        expect(alvo, `falta --text-color-${estado} no @theme inline`).toBeDefined();
        const cor = hex(alvo!, tema);
        expect(contraste(cor, hex("--card", tema))).toBeGreaterThanOrEqual(4.5);
        expect(contraste(cor, hex("--background", tema))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("gráficos (decisão 8)", () => {
  it("`--chart-N` é hex, então ninguém o lê dentro de `hsl()`", () => {
    const achados: string[] = [];
    for (const pasta of ["app", "components", "hooks", "lib"]) {
      for (const f of fs.readdirSync(path.join(RAIZ, pasta), { recursive: true }) as string[]) {
        if (!/\.tsx?$/.test(f) || /\.test\.tsx?$/.test(f)) continue;
        const texto = fs.readFileSync(path.join(RAIZ, pasta, f), "utf8");
        for (const m of texto.matchAll(/hsl\(\s*var\(--(?:chart|data)-[\w-]+[^)]*\)\s*\)/g))
          achados.push(`${pasta}/${f}: ${m[0]}`);
      }
    }
    expect(achados).toEqual([]);
  });
});
