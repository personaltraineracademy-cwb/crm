import { describe, expect, it } from "vitest";

import {
  duracaoLegivel,
  etapaGargalo,
  etapasDoFunil,
  funilInicial,
  janelaDoPeriodo,
  normalizarDashboard,
  porcentagem,
  variacaoPercentual,
  type EtapaDoDashboard,
} from "./dashboard";

function etapa(parcial: Partial<EtapaDoDashboard>): EtapaDoDashboard {
  return {
    stage_id: "s",
    stage_name: "Etapa",
    position: 0,
    pipeline_id: "p1",
    pipeline_name: "Vendas",
    pipeline_is_default: false,
    abertos: 0,
    parados: 0,
    sem_dono: 0,
    valor_cents: 0,
    ...parcial,
  };
}

describe("janelaDoPeriodo", () => {
  const agora = new Date(2026, 10, 23, 15, 30, 0);

  it("hoje começa à meia-noite local e termina agora", () => {
    const { from, to } = janelaDoPeriodo("hoje", agora);
    expect(new Date(from).getTime()).toBe(new Date(2026, 10, 23, 0, 0, 0).getTime());
    expect(new Date(to).getTime()).toBe(agora.getTime());
  });

  it("7 dias inclui hoje e os seis dias anteriores", () => {
    const { from } = janelaDoPeriodo("7d", agora);
    expect(new Date(from).getTime()).toBe(new Date(2026, 10, 17, 0, 0, 0).getTime());
  });
});

describe("variacaoPercentual e porcentagem", () => {
  it("compara com o período anterior", () => {
    expect(variacaoPercentual(30, 20)).toBe(50);
    expect(variacaoPercentual(10, 20)).toBe(-50);
  });

  it("sem base de comparação devolve null, não infinito", () => {
    expect(variacaoPercentual(12, 0)).toBeNull();
  });

  it("parte de um todo vazio é null", () => {
    expect(porcentagem(5, 30)).toBe(17);
    expect(porcentagem(0, 0)).toBeNull();
  });
});

describe("duracaoLegivel", () => {
  it("null é travessão, nunca 0s", () => {
    expect(duracaoLegivel(null)).toBe("—");
  });

  it("escala de segundos a dias", () => {
    expect(duracaoLegivel(45)).toBe("45s");
    expect(duracaoLegivel(12 * 60)).toBe("12min");
    expect(duracaoLegivel(3 * 3600 + 20 * 60)).toBe("3h 20min");
    expect(duracaoLegivel(2 * 86400 + 4 * 3600)).toBe("2d 4h");
    expect(duracaoLegivel(86400)).toBe("1d");
  });
});

describe("funil", () => {
  const etapas = [
    etapa({ stage_id: "b", position: 2, parados: 4, pipeline_id: "p1" }),
    etapa({ stage_id: "a", position: 1, parados: 1, pipeline_id: "p1" }),
    etapa({ stage_id: "c", position: 1, parados: 9, pipeline_id: "p2", pipeline_is_default: true }),
  ];

  it("abre no funil padrão", () => {
    expect(funilInicial(etapas)).toBe("p2");
    expect(funilInicial([])).toBeNull();
  });

  it("filtra pelo funil e ordena pela posição", () => {
    expect(etapasDoFunil(etapas, "p1").map((e) => e.stage_id)).toEqual(["a", "b"]);
  });

  it("o gargalo é a etapa com mais parados, e não existe sem parado", () => {
    expect(etapaGargalo(etapasDoFunil(etapas, "p1"))?.stage_id).toBe("b");
    expect(etapaGargalo([etapa({ parados: 0 })])).toBeNull();
  });
});

describe("normalizarDashboard", () => {
  it("resposta vazia vira zeros e listas vazias, com a média ainda null", () => {
    const n = normalizarDashboard(null);
    expect(n.totais.leads).toBe(0);
    expect(n.totais.mediana_resposta_segundos).toBeNull();
    expect(n.leads).toEqual([]);
    expect(n.etapas).toEqual([]);
  });
});
