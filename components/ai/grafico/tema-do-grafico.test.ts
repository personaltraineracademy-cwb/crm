import { describe, expect, it } from "vitest";

import {
  COR_DA_SERIE,
  PROPS_DA_DICA,
  PROPS_DA_GRADE,
  PROPS_DO_EIXO,
  diaDoEixo,
  intervaloDoEixoX,
  numeroCompacto,
  numeroPtBr,
  percentualPtBr,
} from "./tema-do-grafico";

describe("tema dos gráficos (DS §12)", () => {
  it("as séries saem da paleta chart-*, nunca de cor crua", () => {
    for (const cor of Object.values(COR_DA_SERIE)) expect(cor).toMatch(/^var\(--chart-[1-7]\)$/);
  });

  it("eixo de 12px, sem linha de eixo nem traço", () => {
    expect(PROPS_DO_EIXO.tick.fontSize).toBe(12);
    expect(PROPS_DO_EIXO.axisLine).toBe(false);
    expect(PROPS_DO_EIXO.tickLine).toBe(false);
  });

  it("grade só horizontal, em chart-grid", () => {
    expect(PROPS_DA_GRADE.vertical).toBe(false);
    expect(PROPS_DA_GRADE.stroke).toBe("var(--chart-grid)");
  });

  it("a dica segue o padrão: raio 12, popover, texto 12px", () => {
    expect(PROPS_DA_DICA.contentStyle.borderRadius).toBe(12);
    expect(PROPS_DA_DICA.contentStyle.background).toBe("var(--popover)");
    expect(PROPS_DA_DICA.contentStyle.fontSize).toBe(12);
  });
});

describe("valores em pt-BR", () => {
  it("número, compacto e percentual", () => {
    expect(numeroPtBr(1217)).toBe("1.217");
    expect(numeroPtBr(17.62, 1)).toBe("17,6");
    expect(numeroCompacto(1200)).toMatch(/^1,2\smil$/);
    expect(percentualPtBr(34.12)).toBe("34,1%");
  });

  it("data de calendário puro não anda um dia para trás", () => {
    expect(diaDoEixo("2026-10-01", "pt-BR")).toBe("01/10");
  });

  it("no máximo ~8 rótulos no eixo X", () => {
    expect(intervaloDoEixoX(7)).toBe(0);
    expect(intervaloDoEixoX(14)).toBe(1);
    expect(Math.ceil(30 / (intervaloDoEixoX(30) + 1))).toBeLessThanOrEqual(8);
  });
});
