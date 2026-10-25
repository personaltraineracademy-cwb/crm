import { describe, expect, it } from "vitest";

import { prazoRelativo } from "./prazo";

// Meio-dia local: longe da virada do dia em qualquer fuso do runner.
const HOJE = new Date(2026, 9, 24, 12, 0, 0);

describe("prazo relativo do card (DS §13)", () => {
  it("hoje e amanhã por extenso", () => {
    expect(prazoRelativo("2026-10-24", HOJE)?.texto).toBe("Hoje");
    expect(prazoRelativo("2026-10-25", HOJE)?.texto).toBe("Amanhã");
  });

  it("depois, `d de mmm` sem o ponto da abreviação", () => {
    expect(prazoRelativo("2026-10-30", HOJE)?.texto).toBe("30 de out");
  });

  it("outro ano leva o ano", () => {
    expect(prazoRelativo("2027-01-10", HOJE)?.texto).toMatch(/^10 de jan(\.|) de 2027$/);
  });

  it("data de calendário não passa por fuso: o dia é o escrito", () => {
    const p = prazoRelativo("2026-10-23", HOJE);
    expect(p?.vencido).toBe(true);
    expect(p?.completo).toBe("23/10/2026");
    expect(p?.texto).toBe("23 de out");
  });

  it("sem data ou data inválida, nada", () => {
    expect(prazoRelativo(null, HOJE)).toBeNull();
    expect(prazoRelativo("amanhã", HOJE)).toBeNull();
  });

  it("traduz pelo `t`", () => {
    expect(prazoRelativo("2026-10-24", HOJE, () => "Hoy")?.texto).toBe("Hoy");
  });
});
