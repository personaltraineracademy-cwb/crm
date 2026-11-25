import { describe, expect, it } from "vitest";

import { ritmoDaMeta } from "./ritmo";

describe("ritmoDaMeta", () => {
  // Novembro tem 30 dias; dia 21 → restam 10 dias contando hoje.
  const dia21 = new Date(2026, 10, 21, 9, 0, 0);

  it("divide o que falta pelos dias que restam, contando hoje", () => {
    const r = ritmoDaMeta({ alvo: 30, realizado: 5 }, dia21);
    expect(r.diasRestantes).toBe(10);
    expect(r.porDia).toBe(2.5);
  });

  it("compara com a linha reta do mês", () => {
    // Dia 21 de 30 → o esperado de uma meta de 30 é 21.
    expect(ritmoDaMeta({ alvo: 30, realizado: 5 }, dia21)).toMatchObject({
      esperadoAteHoje: 21,
      situacao: "atrasado",
    });
    expect(ritmoDaMeta({ alvo: 30, realizado: 21 }, dia21).situacao).toBe("adiantado");
  });

  it("meta batida não pede ritmo", () => {
    const r = ritmoDaMeta({ alvo: 10, realizado: 12 }, dia21);
    expect(r.situacao).toBe("atingida");
    expect(r.porDia).toBe(0);
  });

  it("no último dia do mês resta 1 dia, nunca zero", () => {
    const r = ritmoDaMeta({ alvo: 10, realizado: 7 }, new Date(2026, 10, 30, 23, 0, 0));
    expect(r.diasRestantes).toBe(1);
    expect(r.porDia).toBe(3);
  });

  it("arredonda o ritmo para cima, com uma casa", () => {
    // Faltam 10 em 3 dias (dia 28 de 30) → 3,33… vira 3,4.
    expect(ritmoDaMeta({ alvo: 10, realizado: 0 }, new Date(2026, 10, 28)).porDia).toBe(3.4);
  });
});
