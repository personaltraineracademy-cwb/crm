/**
 * O tema dos editores de fluxo é o contrato visual que os DOIS construtores
 * (follow-up e automações) compartilham. Estes casos travam as decisões que um
 * ajuste solto num dos editores desfaria sem ninguém notar no outro.
 */
import { describe, expect, it } from "vitest";

import {
  BLOCO_DE_ICONE,
  CHIP_DA_ETAPA,
  CLASSE_DO_CANVAS,
  ROTULO_DA_ARESTA,
  classesDoChipDaEtapa,
  classesDoNo,
} from "./tema-do-fluxo";

describe("classesDoNo", () => {
  it("é um cartão de raio 12, borda 1px e sem sombra, com a largura que o auto-layout mede", () => {
    const c = classesDoNo({}).split(/\s+/);
    expect(c).toEqual(
      expect.arrayContaining([
        "w-56",
        "rounded-xl",
        "border",
        "border-border",
        "bg-card",
        "shadow-none",
      ]),
    );
    expect(c.some((x) => /^shadow-(sm|md|lg|xl)$/.test(x))).toBe(false);
    expect(c.some((x) => x.startsWith("border-l-"))).toBe(false);
  });

  it("selecionado ganha o anel de foco (2px ring + 2px de afastamento)", () => {
    const c = classesDoNo({ selecionado: true }).split(/\s+/);
    expect(c).toEqual(
      expect.arrayContaining(["ring-2", "ring-ring", "ring-offset-2", "ring-offset-background"]),
    );
  });

  it("com erro ganha a borda inválida do Unnify (destructive + anel de 4px a 20%)", () => {
    const c = classesDoNo({ comErro: true }).split(/\s+/);
    expect(c).toEqual(
      expect.arrayContaining(["border-destructive", "ring-4", "ring-destructive/20"]),
    );
  });
});

describe("cabeçalho do nó", () => {
  it("o bloco de ícone é o de 32 dos painéis, em primary/10", () => {
    expect(BLOCO_DE_ICONE.split(/\s+/)).toEqual(
      expect.arrayContaining(["size-8", "rounded-lg", "bg-primary/10", "text-primary"]),
    );
  });
});

describe("QUANDO / SE / ENTÃO", () => {
  it("cada papel é um chip de tom categórico, sem cor de estado nem azul de ação", () => {
    for (const classe of Object.values(CHIP_DA_ETAPA)) {
      expect(classe).toMatch(/^bg-tone-[a-z]+\/12 text-tone-[a-z]+-foreground$/);
    }
    expect(new Set(Object.values(CHIP_DA_ETAPA)).size).toBe(3);
  });

  it("o rótulo é xs/500 em frase normal, raio 6, sem caixa-alta", () => {
    const c = classesDoChipDaEtapa("gatilho");
    expect(c).toContain("text-xs");
    expect(c).toContain("font-medium");
    expect(c).toContain("rounded-md");
    expect(c).not.toMatch(/uppercase|tracking-wide/);
  });
});

describe("tela de desenho", () => {
  it("arestas em border-strong, selecionada em primary, pelas variáveis que o @xyflow lê", () => {
    expect(CLASSE_DO_CANVAS).toContain("[--xy-edge-stroke:var(--border-strong)]");
    expect(CLASSE_DO_CANVAS).toContain("[--xy-edge-stroke-selected:var(--primary)]");
  });

  it("o rótulo da aresta nunca fica abaixo de 12px", () => {
    expect(CLASSE_DO_CANVAS).toContain("[&_.react-flow__edge-text]:text-xs!");
    expect(ROTULO_DA_ARESTA.labelBgBorderRadius).toBe(6);
  });
});
