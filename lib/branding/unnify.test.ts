/**
 * A tabela fixa do Unnify (`lib/branding/unnify.ts`) entrega EXATAMENTE os
 * valores do DESIGN-SYSTEM.md §3.2 nos dois temas, pelo caminho real: o mesmo
 * `resolverMarca` + `cssDaMarca` que o `app/layout.tsx` e a tela `/admin/marca`
 * usam. Nenhum valor esperado aqui sai do código testado: são literais do DS.
 */
import { describe, expect, it } from "vitest";

import { derivarMarca, razaoDeContraste, PISOS } from "./contraste";
import { cssDaMarca, ESCOPO_DA_ORGANIZACAO } from "./css";
import { GRAUS, K } from "./rampa";
import { REGUA_DO_PRODUTO } from "./regua-do-produto";
import { camadaDoAmbiente, resolverMarca, type CamadaDeMarca } from "./resolve";
import { envelopeDeSemente } from "./schema";
import { GRAUS_DO_UNNIFY, PAPEIS_DO_UNNIFY } from "./unnify";

/** DESIGN-SYSTEM.md §3.2, copiado à mão — um teste que lê a tabela dela mesma passa sempre. */
const DS = {
  claro: {
    primary: "#24555e",
    primaryForeground: "#ffffff",
    primaryHover: "#1a4951",
    primaryPressed: "#0b3d45",
    accent: "#e6f4f7",
    accentForeground: "#375f62",
    ring: "#24555e",
    interactive: "#e6f4f7",
    interactiveStrong: "#d5eef2",
    interactiveBorder: "#a0bec4",
  },
  escuro: {
    primary: "#8fb3bb",
    primaryForeground: "#001717",
    primaryHover: "#acc6cb",
    primaryPressed: "#85acb3",
    accent: "#1d3b3c",
    accentForeground: "#c3e4eb",
    ring: "#8fb3bb",
    interactive: "#1d3b3c",
    interactiveStrong: "#254142",
    interactiveBorder: "#596e70",
  },
} as const;

/** O bloco que o navegador recebe, por inteiro (mapa de tokens §1.2). */
const DECLARACOES = {
  claro: [
    "--color-brand: #24555e;",
    "--color-accent-50: #e6f4f7;",
    "--color-accent-100: #d5eef2;",
    "--color-accent-200: #bddbe1;",
    "--color-accent-300: #a0bec4;",
    "--color-accent-400: #76969a;",
    "--color-accent-500: #24555e;",
    "--color-accent-600: #24555e;",
    "--color-accent-700: #1a4951;",
    "--color-accent-800: #0b3d45;",
    "--color-accent-900: #122c2c;",
    "--color-accent-950: #002828;",
    "--color-accent: #24555e;",
    "--color-accent-fg: #ffffff;",
    "--color-accent-hover: #1a4951;",
    "--color-accent-soft: #e6f4f7;",
  ],
  escuro: [
    "--color-brand: #24555e;",
    "--color-accent-50: #dff4f8;",
    "--color-accent-100: #c3e4eb;",
    "--color-accent-200: #bad1d6;",
    "--color-accent-300: #acc6cb;",
    "--color-accent-400: #8fb3bb;",
    "--color-accent-500: #85acb3;",
    "--color-accent-600: #596e70;",
    "--color-accent-700: #254142;",
    "--color-accent-800: #1d3b3c;",
    "--color-accent-900: #122c2c;",
    "--color-accent-950: #001717;",
    "--color-accent: #8fb3bb;",
    "--color-accent-fg: #001717;",
    "--color-accent-hover: #acc6cb;",
    "--color-accent-soft: #1d3b3c;",
  ],
} as const;

function bloco(seletor: string, linhas: readonly string[]): string {
  return `${seletor} {\n${linhas.map((l) => `  ${l}`).join("\n")}\n}`;
}

function resolver(camada: CamadaDeMarca) {
  return resolverMarca([camada], REGUA_DO_PRODUTO);
}

const comCor = (principal: string, escura?: string): CamadaDeMarca => ({
  origem: "teste",
  cor: envelopeDeSemente(principal),
  ...(escura ? { corEscura: envelopeDeSemente(escura) } : {}),
});

/** O CSS da instalação para uma camada com estas cores. */
function cssDe(principal: string, escura?: string): string | null {
  const cor = resolver(comCor(principal, escura)).cor;
  return cssDaMarca(cor).css;
}

/** Lê `--nome: valor;` de um bloco. */
function valorNoBloco(css: string, tema: "claro" | "escuro", nome: string): string | undefined {
  const blocos = css.split("\n}");
  const alvo = tema === "claro" ? blocos[0] : blocos[1];
  return alvo?.match(new RegExp(`\\s${nome}: ([^;]+);`))?.[1];
}

describe("#24555e pinta exatamente o Unnify", () => {
  const marca = resolver(comCor("#24555e"));
  const css = cssDaMarca(marca.cor).css ?? "";

  it("o bloco da instalação é o do Unnify nos dois temas, linha a linha", () => {
    expect(css).toBe(
      [
        bloco(":root:root", DECLARACOES.claro),
        bloco(':root:root[data-theme="dark"]', DECLARACOES.escuro),
      ].join("\n"),
    );
  });

  it("o bloco da organização é o mesmo, no escopo da organização", () => {
    expect(cssDaMarca(marca.cor, ESCOPO_DA_ORGANIZACAO).css).toBe(
      [
        bloco("body:has([data-marca-org])", DECLARACOES.claro),
        bloco('[data-theme="dark"] body:has([data-marca-org])', DECLARACOES.escuro),
      ].join("\n"),
    );
  });

  it("primary, frente, hover e fundo suave saem nos 4 papéis que o bloco injeta", () => {
    for (const tema of ["claro", "escuro"] as const) {
      expect(valorNoBloco(css, tema, "--color-accent")).toBe(DS[tema].primary);
      expect(valorNoBloco(css, tema, "--color-accent-fg")).toBe(DS[tema].primaryForeground);
      expect(valorNoBloco(css, tema, "--color-accent-hover")).toBe(DS[tema].primaryHover);
      expect(valorNoBloco(css, tema, "--color-accent-soft")).toBe(DS[tema].accent);
    }
  });

  it("pressionado, anel e os três interactive estão na parada que a folha estática lê", () => {
    // A folha declara `var(--color-accent-NNN)`; o bloco injetado entrega a parada.
    const parada = (tema: "claro" | "escuro", grau: number) =>
      valorNoBloco(css, tema, `--color-accent-${grau}`);
    expect(parada("claro", GRAUS_DO_UNNIFY.claro.pressionado)).toBe(DS.claro.primaryPressed);
    expect(parada("escuro", GRAUS_DO_UNNIFY.escuro.pressionado)).toBe(DS.escuro.primaryPressed);
    // O anel do produto é `--ring: var(--color-accent-500)` no claro e `-400` no escuro.
    expect(parada("claro", 500)).toBe(DS.claro.ring);
    expect(parada("escuro", 400)).toBe(DS.escuro.ring);
    expect(parada("claro", 50)).toBe(DS.claro.interactive);
    expect(parada("claro", 100)).toBe(DS.claro.interactiveStrong);
    expect(parada("claro", 300)).toBe(DS.claro.interactiveBorder);
    expect(parada("escuro", 800)).toBe(DS.escuro.interactive);
    expect(parada("escuro", 700)).toBe(DS.escuro.interactiveStrong);
    expect(parada("escuro", 600)).toBe(DS.escuro.interactiveBorder);
    expect(parada("escuro", 100)).toBe(DS.escuro.accentForeground);
  });

  it("o accent-foreground claro (#375f62) NÃO cabe na rampa: a folha estática o declara", () => {
    // É mais claro que o acento (#24555e) e mais escuro que o fundo suave; não
    // há grau livre para ele sem quebrar a ordem da rampa. Este caso existe
    // para a ausência ser decisão escrita, não esquecimento.
    expect(css).not.toContain(DS.claro.accentForeground);
  });

  it("a tabela exportada carrega todos os papéis do DS nos dois temas", () => {
    expect(PAPEIS_DO_UNNIFY).toEqual(DS);
  });

  it("o bloco continua com as mesmas 16 variáveis de sempre (nenhuma nova em runtime)", () => {
    for (const tema of ["claro", "escuro"] as const) {
      const nomes = (css.split("\n}")[tema === "claro" ? 0 : 1] ?? "").match(/--[a-z0-9-]+(?=:)/g);
      expect(nomes).toHaveLength(16);
    }
  });

  it("não gera aviso nenhum na tela de marca", () => {
    expect(marca.motivos).toEqual([]);
    expect(cssDaMarca(marca.cor).motivos).toEqual([]);
  });

  it("o par escuro vem sozinho, da mesma camada", () => {
    expect(marca.cor?.corEscura?.semente).toBe("#8fb3bb");
    expect(marca.origens.cor).toBe("teste");
  });

  it("e-mail e GoTrue (claro, sempre) leem #24555e com frente branca", () => {
    expect(marca.cor?.derivada?.claro.accent).toBe("#24555e");
    expect(marca.cor?.derivada?.claro.accentFg).toBe("#ffffff");
  });

  it("todos os pares medidos pela régua do produto passam no piso", () => {
    const claro = marca.cor?.derivada?.claro;
    const escuro = marca.cor?.corEscura?.derivada.escuro;
    expect(claro?.pares.length).toBeGreaterThan(0);
    expect(escuro?.pares.length).toBeGreaterThan(0);
    expect(claro?.pares.filter((p) => !p.passa)).toEqual([]);
    expect(escuro?.pares.filter((p) => !p.passa)).toEqual([]);
    expect(razaoDeContraste(DS.claro.primaryForeground, DS.claro.primary)).toBeGreaterThanOrEqual(
      PISOS.texto,
    );
    expect(razaoDeContraste(DS.escuro.primaryForeground, DS.escuro.primary)).toBeGreaterThanOrEqual(
      PISOS.texto,
    );
  });
});

describe("as entradas que ligam a tabela", () => {
  const esperado = cssDe("#24555e");

  it.each(["#24555E", "#24555e", " #24555e "])("%s é o mesmo #24555e", (hex) => {
    expect(cssDe(hex.trim())).toBe(esperado);
  });

  it("APP_ACCENT_HEX=#24555e no .env dá o mesmo bloco", () => {
    const cor = resolverMarca(
      [camadaDoAmbiente({ APP_ACCENT_HEX: "#24555e" })],
      REGUA_DO_PRODUTO,
    ).cor;
    expect(cssDaMarca(cor).css).toBe(esperado);
  });

  it.each(["#8fb3bb", "#24555e"])("#24555e + cor do escuro %s dá o mesmo bloco", (escura) => {
    expect(cssDe("#24555e", escura)).toBe(esperado);
  });

  it("#24555e + cor do escuro inválida: o escuro continua sendo o do Unnify, com o motivo", () => {
    const marca = resolver({
      origem: "teste",
      cor: envelopeDeSemente("#24555e"),
      corEscura: envelopeDeSemente("azul"),
    });
    expect(cssDaMarca(marca.cor).css).toBe(esperado);
    expect(marca.motivos.map((m) => m.codigo)).toEqual(["semente_invalida"]);
  });

  it("#24555e + cor do escuro de outra pessoa: o claro é o Unnify, o escuro é o dela", () => {
    const cor = resolver(comCor("#24555e", "#d9ac62")).cor;
    const css = cssDaMarca(cor).css ?? "";
    const [claro] = css.split("\n}");
    expect(`${claro}\n}`).toBe(bloco(":root:root", DECLARACOES.claro));
    const outra = derivarMarca("#d9ac62", REGUA_DO_PRODUTO).escuro;
    expect(valorNoBloco(css, "escuro", "--color-accent")).toBe(outra.accent);
    expect(valorNoBloco(css, "escuro", "--color-accent-hover")).toBe(outra.accentHover);
  });

  it("outra cor principal + escuro #8fb3bb: só o escuro vira o do Unnify", () => {
    const sozinha = cssDe("#7a5cd6") ?? "";
    const css = cssDe("#7a5cd6", "#8fb3bb") ?? "";
    expect(css.split("\n}")[0]).toBe(sozinha.split("\n}")[0]);
    expect(`${(css.split("\n}")[1] ?? "").trimStart()}\n}`).toBe(
      bloco(
        ':root:root[data-theme="dark"]',
        DECLARACOES.escuro.map((l) =>
          l.startsWith("--color-brand") ? "--color-brand: #7a5cd6;" : l,
        ),
      ),
    );
  });

  it("#8fb3bb como cor PRINCIPAL não é o Unnify no claro e segue derivando", () => {
    const cor = resolver(comCor("#8fb3bb")).cor;
    expect(cor?.corEscura).toBeUndefined();
    expect(cor?.derivada?.rampa[K]).toBe("#8fb3bb");
  });
});

describe("a régua do produto aponta para os graus que a tabela preenche", () => {
  it("acento e hover da folha caem nos graus do Unnify", () => {
    const grau = (i: number) => GRAUS[i];
    expect(grau(REGUA_DO_PRODUTO.claro.indices.accent)).toBe(GRAUS_DO_UNNIFY.claro.accent);
    expect(grau(REGUA_DO_PRODUTO.claro.indices.hover)).toBe(GRAUS_DO_UNNIFY.claro.hover);
    expect(grau(REGUA_DO_PRODUTO.escuro.indices.accent)).toBe(GRAUS_DO_UNNIFY.escuro.accent);
    expect(grau(REGUA_DO_PRODUTO.escuro.indices.hover)).toBe(GRAUS_DO_UNNIFY.escuro.hover);
  });
});
