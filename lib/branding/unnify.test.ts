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
} as const;

/** O bloco que o navegador recebe, por inteiro (mapa de tokens §1.2). */
const DECLARACOES = {
  claro: [
    "--color-brand: #0066cc;",
    "--color-accent-50: #eaf2fc;",
    "--color-accent-100: #dceafa;",
    "--color-accent-200: #b8d8ff;",
    "--color-accent-300: #9bbbe0;",
    "--color-accent-400: #5992d7;",
    "--color-accent-500: #0066cc;",
    "--color-accent-600: #0066cc;",
    "--color-accent-700: #005bb5;",
    "--color-accent-800: #004f9e;",
    "--color-accent-900: #0e2747;",
    "--color-accent-950: #071a32;",
    "--color-accent: #0066cc;",
    "--color-accent-fg: #ffffff;",
    "--color-accent-hover: #005bb5;",
    "--color-accent-soft: #eaf2fc;",
  ],
  escuro: [
    "--color-brand: #0066cc;",
    "--color-accent-50: #e5f1ff;",
    "--color-accent-100: #c6e0ff;",
    "--color-accent-200: #a9d0ff;",
    "--color-accent-300: #91c5ff;",
    "--color-accent-400: #75b7ff;",
    "--color-accent-500: #5ca8fb;",
    "--color-accent-600: #416d98;",
    "--color-accent-700: #203d5c;",
    "--color-accent-800: #203750;",
    "--color-accent-900: #0e2747;",
    "--color-accent-950: #08131c;",
    "--color-accent: #75b7ff;",
    "--color-accent-fg: #08131c;",
    "--color-accent-hover: #91c5ff;",
    "--color-accent-soft: #203750;",
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

describe("#0066cc pinta exatamente o Unnify", () => {
  const marca = resolver(comCor("#0066cc"));
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

  it("o accent-foreground claro (#0055aa) NÃO cabe na rampa: a folha estática o declara", () => {
    // Fica entre o hover (#005bb5) e o pressionado (#004f9e) em luminosidade;
    // não há grau livre para ele sem quebrar a ordem da rampa. Este caso existe
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
    expect(marca.cor?.corEscura?.semente).toBe("#75b7ff");
    expect(marca.origens.cor).toBe("teste");
  });

  it("e-mail e GoTrue (claro, sempre) leem #0066cc com frente branca", () => {
    expect(marca.cor?.derivada?.claro.accent).toBe("#0066cc");
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
  const esperado = cssDe("#0066cc");

  it.each(["#06c", "#0066CC", " #0066cc "])("%s é o mesmo #0066cc", (hex) => {
    expect(cssDe(hex.trim())).toBe(esperado);
  });

  it("APP_ACCENT_HEX=#0066cc no .env dá o mesmo bloco", () => {
    const cor = resolverMarca(
      [camadaDoAmbiente({ APP_ACCENT_HEX: "#0066cc" })],
      REGUA_DO_PRODUTO,
    ).cor;
    expect(cssDaMarca(cor).css).toBe(esperado);
  });

  it.each(["#75b7ff", "#0066cc"])("#0066cc + cor do escuro %s dá o mesmo bloco", (escura) => {
    expect(cssDe("#0066cc", escura)).toBe(esperado);
  });

  it("#0066cc + cor do escuro inválida: o escuro continua sendo o do Unnify, com o motivo", () => {
    const marca = resolver({
      origem: "teste",
      cor: envelopeDeSemente("#0066cc"),
      corEscura: envelopeDeSemente("azul"),
    });
    expect(cssDaMarca(marca.cor).css).toBe(esperado);
    expect(marca.motivos.map((m) => m.codigo)).toEqual(["semente_invalida"]);
  });

  it("#0066cc + cor do escuro de outra pessoa: o claro é o Unnify, o escuro é o dela", () => {
    const cor = resolver(comCor("#0066cc", "#d9ac62")).cor;
    const css = cssDaMarca(cor).css ?? "";
    const [claro] = css.split("\n}");
    expect(`${claro}\n}`).toBe(bloco(":root:root", DECLARACOES.claro));
    const outra = derivarMarca("#d9ac62", REGUA_DO_PRODUTO).escuro;
    expect(valorNoBloco(css, "escuro", "--color-accent")).toBe(outra.accent);
    expect(valorNoBloco(css, "escuro", "--color-accent-hover")).toBe(outra.accentHover);
  });

  it("outra cor principal + escuro #75b7ff: só o escuro vira o do Unnify", () => {
    const sozinha = cssDe("#7a5cd6") ?? "";
    const css = cssDe("#7a5cd6", "#75b7ff") ?? "";
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

  it("#75b7ff como cor PRINCIPAL não é o Unnify no claro e segue derivando", () => {
    const cor = resolver(comCor("#75b7ff")).cor;
    expect(cor?.corEscura).toBeUndefined();
    expect(cor?.derivada?.rampa[K]).toBe("#75b7ff");
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
