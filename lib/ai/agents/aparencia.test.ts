import { describe, expect, it } from "vitest";

import {
  CORES_DO_AGENTE,
  EMOJIS_DO_AGENTE,
  aparenciaDoAgente,
  aparenciaDoAgenteSchema,
} from "@/lib/ai/agents/aparencia";
import { agentConfigPatchSchema, agentConfigSchema } from "@/lib/ai/guardrails-schema";

describe("aparência do agente", () => {
  it("devolve a escolha gravada", () => {
    expect(aparenciaDoAgente({ aparencia: { emoji: "💪", cor: "verde" } }, "Qualquer")).toEqual({
      emoji: "💪",
      cor: "verde",
    });
  });

  it("sem escolha (ou com lixo no jsonb), cai no robô com cor tirada do nome — sempre a mesma", () => {
    for (const config of [undefined, null, {}, { aparencia: { emoji: "x", cor: "preto" } }, "texto"]) {
      const a = aparenciaDoAgente(config, "Atendente da manhã");
      expect(a.emoji).toBe("🤖");
      expect(Object.keys(CORES_DO_AGENTE)).toContain(a.cor);
      expect(aparenciaDoAgente(config, "Atendente da manhã")).toEqual(a);
    }
  });

  it("nomes diferentes não nascem todos da mesma cor", () => {
    const cores = new Set(
      ["Recepção", "Vendas", "Renovação", "Cobrança", "Suporte", "Agenda"].map(
        (n) => aparenciaDoAgente({}, n).cor,
      ),
    );
    expect(cores.size).toBeGreaterThan(1);
  });

  it("a lista é fechada: emoji ou cor de fora são recusados, e chave a mais também", () => {
    expect(aparenciaDoAgenteSchema.safeParse({ emoji: "🦄", cor: "verde" }).success).toBe(false);
    expect(aparenciaDoAgenteSchema.safeParse({ emoji: "💪", cor: "#ff0000" }).success).toBe(false);
    expect(
      aparenciaDoAgenteSchema.safeParse({ emoji: "💪", cor: "verde", foto: "http://x" }).success,
    ).toBe(false);
    expect(EMOJIS_DO_AGENTE.length).toBeGreaterThan(8);
  });

  it("o PATCH de config aceita a aparência e não inventa as outras chaves", () => {
    const patch = agentConfigPatchSchema.parse({ aparencia: { emoji: "🥗", cor: "lima" } });
    expect(patch).toEqual({ aparencia: { emoji: "🥗", cor: "lima" } });
  });

  it("config sem aparência continua válida: a chave é opcional e não ganha valor de fábrica", () => {
    expect(agentConfigSchema.parse({}).aparencia).toBeUndefined();
  });
});
