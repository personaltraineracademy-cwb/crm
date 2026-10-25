import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CLASSES_DO_TOM, ChipDeEstado } from "./chip-de-estado";

describe("ChipDeEstado", () => {
  it("todo tom de estado usa o trio soft + border + foreground (DS §3.3)", () => {
    for (const tom of ["sucesso", "aviso", "perigo", "info"] as const) {
      const est = { sucesso: "success", aviso: "warning", perigo: "danger", info: "info" }[tom];
      expect(CLASSES_DO_TOM[tom]).toBe(
        `border-${est}-border bg-${est}-soft text-${est}-foreground`,
      );
    }
  });

  it("chip de raio 6, xs/500, sem caixa-alta", () => {
    render(<ChipDeEstado tom="perigo">Crítico</ChipDeEstado>);
    const chip = screen.getByText("Crítico");
    expect(chip.className).toContain("rounded-md");
    expect(chip.className).toContain("text-xs");
    expect(chip.className).toContain("font-medium");
    expect(chip.className).not.toContain("uppercase");
    expect(chip.getAttribute("data-tom")).toBe("perigo");
  });
});
