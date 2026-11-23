import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CampoNoLugar } from "./CampoNoLugar";

vi.mock("@/hooks/i18n/useT", () => ({ useT: () => (texto: string) => texto }));

function montar(aoSalvar = vi.fn(async () => undefined as string | void)) {
  render(
    <CampoNoLugar exibicao="Lead A" valorDeEdicao="Lead A" rotulo="Título" aoSalvar={aoSalvar} />,
  );
  return aoSalvar;
}

describe("CampoNoLugar", () => {
  it("um clique vira campo e Enter grava o texto novo", async () => {
    const user = userEvent.setup();
    const aoSalvar = montar();
    await user.click(screen.getByRole("button", { name: /Editar: Título/ }));
    const campo = screen.getByRole("textbox", { name: "Título" });
    await user.clear(campo);
    await user.type(campo, "Lead B{Enter}");
    expect(aoSalvar).toHaveBeenCalledTimes(1);
    expect(aoSalvar).toHaveBeenCalledWith("Lead B");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("Esc cancela e não grava", async () => {
    const user = userEvent.setup();
    const aoSalvar = montar();
    await user.click(screen.getByRole("button", { name: /Editar: Título/ }));
    await user.type(screen.getByRole("textbox", { name: "Título" }), " mudou{Escape}");
    expect(aoSalvar).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("sem mudança, fechar o campo não grava", async () => {
    const user = userEvent.setup();
    const aoSalvar = montar();
    await user.click(screen.getByRole("button", { name: /Editar: Título/ }));
    await user.keyboard("{Enter}");
    expect(aoSalvar).not.toHaveBeenCalled();
  });

  it("recusa mantém o campo aberto e mostra o motivo", async () => {
    const user = userEvent.setup();
    montar(vi.fn(async () => "Valor inválido"));
    await user.click(screen.getByRole("button", { name: /Editar: Título/ }));
    await user.type(screen.getByRole("textbox", { name: "Título" }), "x{Enter}");
    expect(screen.getByText("Valor inválido")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Título" })).toBeTruthy();
  });
});
