import { describe, expect, it } from "vitest";

import {
  TOM_MARCADOR,
  TOM_SUAVE,
  TONS_CATEGORICOS,
  tomDaEtapa,
  tomDaEtiqueta,
  tomMaisProximo,
} from "./tons";

describe("tons categóricos do Unnify no funil", () => {
  it("toda classe é um token `tone-*` ou de estado, nunca paleta crua", () => {
    for (const classe of [...Object.values(TOM_SUAVE), ...Object.values(TOM_MARCADOR)]) {
      expect(classe).toMatch(/^(bg|text)-(tone-[a-z]+|warning|danger|success)/);
      expect(classe).not.toMatch(/-(\d{2,3})\b(?!\/)/);
    }
  });

  it("o chip suave usa 12% e o texto `-foreground`", () => {
    expect(TOM_SUAVE.violet).toBe("bg-tone-violet/12 text-tone-violet-foreground");
    expect(TOM_SUAVE.amber).toBe("bg-warning/12 text-warning-foreground");
  });

  it("ganho é sucesso e perda é perigo, mesmo com cor gravada", () => {
    expect(tomDaEtapa({ is_won: true, color: "#3b82f6" }, 0)).toBe("green");
    expect(tomDaEtapa({ is_lost: true }, 3)).toBe("red");
  });

  it("a cor gravada vira o tom mais próximo; sem cor, o rodízio pela posição", () => {
    expect(tomDaEtapa({ color: "#ec4899" }, 0)).toBe("pink");
    expect(tomDaEtapa({ color: "#14b8a6" }, 0)).toBe("teal");
    expect(tomDaEtapa({ color: null }, 0)).toBe(TONS_CATEGORICOS[0]);
    expect(tomDaEtapa({}, TONS_CATEGORICOS.length + 1)).toBe(TONS_CATEGORICOS[1]);
  });

  it("vermelho, verde e âmbar gravados não viram estado; cinza vira stone", () => {
    for (const hex of ["#ef4444", "#22c55e", "#f59e0b"]) {
      expect(["red", "green", "amber"]).not.toContain(tomMaisProximo(hex));
    }
    expect(tomMaisProximo("#777777")).toBe("stone");
    expect(tomMaisProximo("azul")).toBeNull();
  });

  it("a mesma etiqueta tem sempre o mesmo tom, sem diferenciar caixa nem espaço", () => {
    expect(tomDaEtiqueta("VIP")).toBe(tomDaEtiqueta(" vip "));
    expect(TONS_CATEGORICOS).toContain(tomDaEtiqueta("indicação"));
  });
});
