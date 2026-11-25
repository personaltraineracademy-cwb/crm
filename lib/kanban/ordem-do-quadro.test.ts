import { describe, expect, it } from "vitest";

import { compararNaOrdem, ehOrdemDoQuadro } from "./ordem-do-quadro";

function card(id: string, resto: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    position_in_stage: 0,
    created_at: "2026-11-01T12:00:00Z",
    value_cents: null as number | null,
    last_activity_at: null as string | null,
    updated_at: "2026-11-01T12:00:00Z",
    ...resto,
  } as Parameters<ReturnType<typeof compararNaOrdem>>[0];
}

const ids = (lista: { id: string }[]) => lista.map((c) => c.id);

describe("ordem dos cards no quadro", () => {
  const a = card("a", { position_in_stage: 3, created_at: "2026-11-03T00:00:00Z", value_cents: 100 });
  const b = card("b", { position_in_stage: 1, created_at: "2026-11-01T00:00:00Z", value_cents: 900 });
  const c = card("c", { position_in_stage: 2, created_at: "2026-11-02T00:00:00Z", value_cents: null });

  it("manual segue a posição que o time arrastou", () => {
    expect(ids([a, b, c].sort(compararNaOrdem("manual")))).toEqual(["b", "c", "a"]);
  });

  it("criadas por último e criadas primeiro são o inverso uma da outra", () => {
    expect(ids([a, b, c].sort(compararNaOrdem("recentes")))).toEqual(["a", "c", "b"]);
    expect(ids([a, b, c].sort(compararNaOrdem("antigas")))).toEqual(["b", "c", "a"]);
  });

  it("maior valor põe o negócio sem valor no fim", () => {
    expect(ids([a, b, c].sort(compararNaOrdem("valor")))).toEqual(["b", "a", "c"]);
  });

  it("atividade recente usa a última atividade e, sem ela, a última alteração", () => {
    const x = card("x", { last_activity_at: "2026-11-10T00:00:00Z" });
    const y = card("y", { updated_at: "2026-11-20T00:00:00Z" });
    expect(ids([x, y].sort(compararNaOrdem("atividade")))).toEqual(["y", "x"]);
  });

  it("empate não troca de lugar entre recargas: desempata pela ordem manual e pelo id", () => {
    const p = card("p", { position_in_stage: 2 });
    const q = card("q", { position_in_stage: 1 });
    expect(ids([p, q].sort(compararNaOrdem("recentes")))).toEqual(["q", "p"]);
    const r = card("r");
    const s = card("s");
    expect(ids([s, r].sort(compararNaOrdem("valor")))).toEqual(["r", "s"]);
  });

  it("só aceita as ordens conhecidas", () => {
    expect(ehOrdemDoQuadro("valor")).toBe(true);
    expect(ehOrdemDoQuadro("qualquer")).toBe(false);
    expect(ehOrdemDoQuadro(undefined)).toBe(false);
  });
});
