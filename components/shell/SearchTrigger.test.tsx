/**
 * A LUPA DO TOPO TEM NOME TAMBÉM NO CELULAR.
 *
 * Abaixo de `lg` o botão mostra só o ícone, que é `aria-hidden`. Com o rótulo em
 * `hidden lg:inline` (`display: none`), o leitor de tela anunciava um botão sem
 * nome. `max-lg:sr-only` esconde o texto do olho e o mantém na árvore de
 * acessibilidade; no computador o rótulo segue à vista como antes.
 *
 * O corte era `md` (768) até a etapa 6, quando a casca passou ao corte do
 * Unnify (`lg` = 1024, DS §5.4): abaixo dele o centro da barra é do título.
 *
 * O jsdom não aplica as classes do Tailwind, então o nome acessível aqui sai do
 * texto de qualquer jeito: o que este caso segura é a CLASSE, que é o que decide
 * o nome no navegador de verdade.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/i18n/useT", () => ({ useT: () => (s: string) => s }));
vi.mock("@/components/shell/CommandPalette", () => ({ CommandPalette: () => null }));

import { SearchTrigger } from "./SearchTrigger";

describe("lupa da busca no topo", () => {
  it("o rótulo fica na árvore de acessibilidade abaixo de lg", () => {
    render(<SearchTrigger />);
    const botao = screen.getByRole("button", { name: /Buscar\.\.\./ });
    const rotulo = within(botao).getByText("Buscar...");
    const c = (rotulo.getAttribute("class") ?? "").split(/\s+/);
    expect(c).toContain("max-lg:sr-only");
    // `hidden` é `display: none`: tira o texto da árvore e o botão fica sem nome.
    expect(c).not.toContain("hidden");
  });
});
