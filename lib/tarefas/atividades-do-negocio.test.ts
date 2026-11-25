import { describe, expect, it } from "vitest";

import {
  atividadeEmFoco,
  diaDoNegocio,
  diasDesde,
  progressoDasAtividades,
  separarAtividades,
} from "./atividades-do-negocio";

function tarefa(id: string, resto: Record<string, unknown> = {}) {
  return {
    id,
    status: "pending",
    due_date: null as string | null,
    created_at: "2026-11-01T12:00:00",
    updated_at: "2026-11-01T12:00:00",
    ...resto,
  } as {
    id: string;
    status: "pending" | "in_progress" | "done" | "cancelled";
    due_date: string | null;
    created_at: string;
    updated_at: string;
  };
}

describe("dia do negócio", () => {
  it("o dia em que o negócio nasceu é o Dia 1", () => {
    expect(diaDoNegocio("2026-11-01T18:00:00", "2026-11-01T09:00:00")).toBe(1);
  });
  it("conta dias de calendário, não janelas de 24h", () => {
    // 23h de diferença, mas virou o dia: Dia 2.
    expect(diaDoNegocio("2026-11-02T08:00:00", "2026-11-01T09:00:00")).toBe(2);
    expect(diaDoNegocio("2026-11-07T08:00:00", "2026-11-01T09:00:00")).toBe(7);
  });
  it("sem prazo não há dia, e prazo antes do negócio fica no Dia 1", () => {
    expect(diaDoNegocio(null, "2026-11-01T09:00:00")).toBeNull();
    expect(diaDoNegocio("2026-10-20T09:00:00", "2026-11-01T09:00:00")).toBe(1);
    expect(diaDoNegocio("lixo", "2026-11-01T09:00:00")).toBeNull();
  });
});

describe("dias desde", () => {
  it("0 no mesmo dia e conta dias de calendário depois", () => {
    const agora = new Date("2026-11-24T10:00:00");
    expect(diasDesde("2026-11-24T01:00:00", agora)).toBe(0);
    expect(diasDesde("2026-11-20T23:00:00", agora)).toBe(4);
    expect(diasDesde(null, agora)).toBeNull();
  });
});

describe("progresso das atividades", () => {
  it("cancelada não conta nem como feita nem como pendente", () => {
    const p = progressoDasAtividades([
      tarefa("a", { status: "done" }),
      tarefa("b"),
      tarefa("c", { status: "in_progress" }),
      tarefa("d", { status: "cancelled" }),
    ]);
    expect(p).toEqual({ concluidas: 1, total: 3, porcentagem: 33 });
  });
  it("sem atividade, 0 de 0 e 0%", () => {
    expect(progressoDasAtividades([])).toEqual({ concluidas: 0, total: 0, porcentagem: 0 });
  });
});

describe("separação e foco", () => {
  const sem = tarefa("sem-prazo");
  const cedo = tarefa("cedo", { due_date: "2026-11-02T09:00:00" });
  const tarde = tarefa("tarde", { due_date: "2026-11-09T09:00:00" });
  const feita = tarefa("feita", { status: "done", updated_at: "2026-11-05T09:00:00" });
  const cancelada = tarefa("cancelada", { status: "cancelled", updated_at: "2026-11-06T09:00:00" });

  it("próximas pelo prazo, sem prazo no fim; encerradas da mais recente", () => {
    const s = separarAtividades([sem, tarde, feita, cedo, cancelada]);
    expect(s.proximas.map((t) => t.id)).toEqual(["cedo", "tarde", "sem-prazo"]);
    expect(s.encerradas.map((t) => t.id)).toEqual(["cancelada", "feita"]);
  });

  it("abre a escolhida; se ela sumiu, a próxima a vencer; sem próximas, a última encerrada", () => {
    const s = separarAtividades([sem, tarde, feita, cedo]);
    expect(atividadeEmFoco(s, "tarde")?.id).toBe("tarde");
    expect(atividadeEmFoco(s, "apagada")?.id).toBe("cedo");
    expect(atividadeEmFoco(separarAtividades([feita]), null)?.id).toBe("feita");
    expect(atividadeEmFoco(separarAtividades([]), null)).toBeNull();
  });
});
