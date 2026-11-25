import { describe, expect, it } from "vitest";

import {
  CATALOGO_DO_PAINEL,
  INDICADORES_DO_PAINEL,
  MAXIMO_DE_CARTOES,
  MAXIMO_NA_RESPOSTA,
  SISTEMA_DO_PAINEL,
  normalizarPlano,
  planoSchema,
} from "./painel-por-conversa";

describe("plano do painel por conversa", () => {
  it("aceita um plano dentro do catálogo", () => {
    const r = planoSchema.safeParse({
      modo: "painel",
      resposta: "Montei a visão de vendas do mês.",
      titulo: "Vendas do mês",
      cartoes: [{ indicador: "leads_no_periodo", periodo: "30d", titulo: "Leads" }],
    });
    expect(r.success).toBe(true);
  });

  it("recusa indicador fora do catálogo: a IA não inventa métrica", () => {
    const r = planoSchema.safeParse({
      modo: "resposta",
      resposta: "x",
      titulo: "x",
      cartoes: [{ indicador: "faturamento_por_cpf", periodo: "30d", titulo: "x" }],
    });
    expect(r.success).toBe(false);
  });

  it("recusa período maior que 90 dias e mais cartões que o teto", () => {
    expect(
      planoSchema.safeParse({
        modo: "painel",
        resposta: "x",
        titulo: "x",
        cartoes: [{ indicador: "leads_no_periodo", periodo: "365d", titulo: "x" }],
      }).success,
    ).toBe(false);
    const muitos = Array.from({ length: MAXIMO_DE_CARTOES + 1 }, () => ({
      indicador: "leads_no_periodo",
      periodo: "30d",
      titulo: "x",
    }));
    expect(planoSchema.safeParse({ modo: "painel", resposta: "x", titulo: "x", cartoes: muitos }).success).toBe(false);
  });

  it("indicador de janela fixa ganha o período dele, e repetido sai", () => {
    const plano = normalizarPlano({
      modo: "painel",
      resposta: "x",
      titulo: "x",
      cartoes: [
        { indicador: "desempenho_por_vendedor", periodo: "7d", titulo: "Vendedores" },
        { indicador: "leads_no_periodo", periodo: "7d", titulo: "Leads" },
        { indicador: "leads_no_periodo", periodo: "7d", titulo: "Leads de novo" },
      ],
    });
    expect(plano.cartoes).toEqual([
      { indicador: "desempenho_por_vendedor", periodo: "30d", titulo: "Vendedores" },
      { indicador: "leads_no_periodo", periodo: "7d", titulo: "Leads" },
    ]);
  });

  it("no modo resposta, no máximo 3 cartões; no modo painel, todos", () => {
    const cartoes = (
      ["leads_no_periodo", "taxa_de_venda", "valor_vendido", "tempo_de_resposta"] as const
    ).map((indicador) => ({ indicador, periodo: "30d" as const, titulo: "x" }));
    expect(normalizarPlano({ modo: "resposta", resposta: "x", titulo: "x", cartoes }).cartoes).toHaveLength(
      MAXIMO_NA_RESPOSTA,
    );
    expect(normalizarPlano({ modo: "painel", resposta: "x", titulo: "x", cartoes }).cartoes).toHaveLength(4);
  });

  it("recusa resposta sem modo", () => {
    expect(planoSchema.safeParse({ resposta: "x", titulo: "x", cartoes: [] }).success).toBe(false);
  });

  it("o prompt lista todos os indicadores do catálogo, na mesma ordem", () => {
    let pos = -1;
    for (const id of INDICADORES_DO_PAINEL) {
      const aqui = SISTEMA_DO_PAINEL.indexOf(`- ${id} [`);
      expect(aqui, `${id} fora do prompt`).toBeGreaterThan(pos);
      pos = aqui;
    }
    expect(Object.keys(CATALOGO_DO_PAINEL).length).toBe(INDICADORES_DO_PAINEL.length);
  });
});
