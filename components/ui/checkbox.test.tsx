import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";
import { Label } from "./label";

function Controlada({ inicial = false }: { inicial?: boolean }) {
  const [marcada, setMarcada] = useState(inicial);
  return (
    <>
      <Checkbox id="aceite" checked={marcada} onCheckedChange={setMarcada} />
      <Label htmlFor="aceite">Aceito os termos</Label>
    </>
  );
}

describe("Checkbox — semântica e teclado (WAI-ARIA)", () => {
  it("é uma caixa de seleção nomeada pelo rótulo, e o clique no rótulo alterna", async () => {
    const user = userEvent.setup();
    render(<Controlada />);
    const caixa = screen.getByRole("checkbox", { name: "Aceito os termos" });
    expect(caixa).toHaveAttribute("aria-checked", "false");
    expect(caixa).toHaveAttribute("data-state", "unchecked");

    await user.click(screen.getByText("Aceito os termos"));
    expect(caixa).toHaveAttribute("aria-checked", "true");
    expect(caixa).toHaveAttribute("data-state", "checked");

    await user.click(caixa);
    expect(caixa).toHaveAttribute("aria-checked", "false");
  });

  it("Espaço alterna e Enter não", async () => {
    const user = userEvent.setup();
    render(<Controlada />);
    const caixa = screen.getByRole("checkbox");
    caixa.focus();
    await user.keyboard(" ");
    expect(caixa).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Enter}");
    expect(caixa).toHaveAttribute("aria-checked", "true");
  });

  it("indeterminada diz `mixed`, mostra o traço e pede `true` ao ser clicada", async () => {
    const user = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Checkbox aria-label="Todos" checked={false} indeterminate onCheckedChange={aoMudar} />);
    const caixa = screen.getByRole("checkbox", { name: "Todos" });
    expect(caixa).toHaveAttribute("aria-checked", "mixed");
    expect(caixa).toHaveAttribute("data-state", "indeterminate");
    expect(caixa.querySelector("svg")).not.toBeNull();
    await user.click(caixa);
    expect(aoMudar).toHaveBeenCalledWith(true);
  });

  it("desabilitada não muda e não chama o callback", async () => {
    const user = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Checkbox aria-label="Bloqueada" disabled onCheckedChange={aoMudar} />);
    const caixa = screen.getByRole("checkbox", { name: "Bloqueada" });
    expect(caixa).toBeDisabled();
    await user.click(caixa);
    expect(aoMudar).not.toHaveBeenCalled();
    expect(caixa).toHaveAttribute("aria-checked", "false");
  });

  it("não controlada parte do `defaultChecked` e guarda o próprio estado", () => {
    render(<Checkbox aria-label="Lembrar" defaultChecked />);
    const caixa = screen.getByRole("checkbox", { name: "Lembrar" });
    expect(caixa).toHaveAttribute("aria-checked", "true");
    fireEvent.click(caixa);
    expect(caixa).toHaveAttribute("aria-checked", "false");
  });

  it("não envia o formulário (type=button) e, com `name`, leva o valor só quando marcada", async () => {
    const user = userEvent.setup();
    const enviar = vi.fn((e: React.FormEvent) => e.preventDefault());
    const { container } = render(
      <form onSubmit={enviar}>
        <Checkbox aria-label="Novidades" name="novidades" value="sim" />
      </form>,
    );
    const formulario = container.querySelector("form")!;
    const caixa = screen.getByRole("checkbox", { name: "Novidades" });
    expect(caixa).toHaveAttribute("type", "button");
    expect(new FormData(formulario).get("novidades")).toBeNull();
    await user.click(caixa);
    expect(enviar).not.toHaveBeenCalled();
    expect(new FormData(formulario).get("novidades")).toBe("sim");
  });

  it("segue a forma do Unnify: 20×20, raio 6, `primary` quando marcada, foco 2+2", () => {
    render(<Checkbox aria-label="Forma" checked onCheckedChange={() => {}} />);
    const classes = screen.getByRole("checkbox").className.split(/\s+/);
    for (const c of [
      "size-5",
      "rounded-md",
      "border-input",
      "data-[state=checked]:bg-primary",
      "data-[state=checked]:border-primary",
      "text-primary-foreground",
      "focus-visible:ring-2",
      "focus-visible:ring-offset-2",
      "after:-inset-2.5",
    ]) {
      expect(classes).toContain(c);
    }
  });
});
