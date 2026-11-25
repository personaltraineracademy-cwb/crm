/**
 * O padrão único do cartão de lista: o cartão inteiro abre o item (link ou
 * botão esticado), as ações ficam no menu «⋯» e os metadados saem numa linha só,
 * sem vazios.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CartaoDeRegistro, GradeDeRegistros, MenuDoCartao } from "./cartao-de-registro";

describe("CartaoDeRegistro", () => {
  it("o título é o link do item e leva o link esticado sobre o cartão inteiro", () => {
    render(<CartaoDeRegistro href="/app/x/1" titulo="Boas-vindas" />);
    const link = screen.getByRole("link", { name: "Boas-vindas" });
    expect(link.getAttribute("href")).toBe("/app/x/1");
    expect(link.className).toContain("after:inset-0");
    expect(link.className).toContain("line-clamp-2");
  });

  it("sem href, o título é um botão que chama aoAbrir", async () => {
    const aoAbrir = vi.fn();
    render(<CartaoDeRegistro aoAbrir={aoAbrir} titulo="Fonte do site" />);
    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: "Fonte do site" }));
    expect(aoAbrir).toHaveBeenCalledTimes(1);
  });

  it("os metadados saem na ordem, sem os vazios, e o selo entra na mesma linha", () => {
    const { container } = render(
      <CartaoDeRegistro
        href="/x"
        titulo="Fluxo"
        selo={<span>Rascunho</span>}
        meta={["Handoff: Pausar", null, false, "", "Atualizado em 21/11"]}
      />,
    );
    const linha = container.querySelector("[data-slot=cartao-de-registro] .flex-wrap");
    expect(linha?.textContent).toBe("RascunhoHandoff: PausarAtualizado em 21/11");
    expect(linha?.children.length).toBe(3);
  });

  it("o menu abre pelo gatilho nomeado e executa o item escolhido", async () => {
    const renomear = vi.fn();
    render(
      <CartaoDeRegistro
        href="/x"
        titulo="Fluxo"
        menu={
          <MenuDoCartao rotulo="Menu de ações: Fluxo">
            <DropdownMenuItem onSelect={renomear}>Renomear</DropdownMenuItem>
          </MenuDoCartao>
        }
      />,
    );
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByRole("button", { name: "Menu de ações: Fluxo" }));
    await user.click(await screen.findByRole("menuitem", { name: "Renomear" }));
    expect(renomear).toHaveBeenCalledTimes(1);
  });
});

describe("GradeDeRegistros", () => {
  it("usa colunas auto-fill de no mínimo 320px", () => {
    const { container } = render(
      <GradeDeRegistros>
        <li>a</li>
      </GradeDeRegistros>,
    );
    expect(container.querySelector("ul")?.className).toContain("minmax(min(320px,100%),1fr)");
  });
});
