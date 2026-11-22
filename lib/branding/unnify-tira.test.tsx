/**
 * A régua de tons da tela `/admin/marca` (`TiraDeTons`), com `#24555e` digitado,
 * mostra os valores REAIS da tabela do Unnify — antes de salvar.
 *
 * O formulário é o de verdade (`FormularioDaMarca`); só sai do escopo o que não
 * é medição de cor (navegação, toast, server action, upload de logo), do mesmo
 * jeito que `tests/unit/marca-contraste-do-tema-escuro.test.tsx` faz.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/hooks/i18n/useT", () => ({ useT: () => (texto: string) => texto }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/actions/settings/updateBranding", () => ({ updateBranding: vi.fn() }));
vi.mock("@/components/branding/CampoDeLogo", () => ({ CampoDeLogo: () => null }));
vi.mock("@/components/branding/CampoDoIconeDaAba", () => ({ CampoDoIconeDaAba: () => null }));

import { FormularioDaMarca } from "@/app/admin/(protected)/marca/_form";

afterEach(cleanup);

/** mapa de tokens §1.2 — literais, não lidos da tabela. */
const RAMPA_CLARA = [
  "#e6f4f7",
  "#d5eef2",
  "#bddbe1",
  "#a0bec4",
  "#76969a",
  "#24555e",
  "#24555e",
  "#1a4951",
  "#0b3d45",
  "#122c2c",
  "#002828",
];
const RAMPA_ESCURA = [
  "#dff4f8",
  "#c3e4eb",
  "#bad1d6",
  "#acc6cb",
  "#8fb3bb",
  "#85acb3",
  "#596e70",
  "#254142",
  "#1d3b3c",
  "#122c2c",
  "#001717",
];

function renderizar(corPrincipal: string, corEscura: string | null) {
  render(
    <FormularioDaMarca
      gravada={{
        app_name: null,
        logo_url: null,
        logo_path: null,
        accent_hex: corPrincipal,
        accent_dark_hex: corEscura,
        show_powered_by: false,
      }}
      nomeEmVigor="Produto"
      logoEmVigor={null}
      logoDoAmbiente={null}
      origens={{ nome: "tela", logoUrl: "tela", cor: "tela" }}
      definidoNestaTela
      fallbackEm={null}
      fallbackMotivo={null}
    />,
  );
}

function tiras(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[role="img"][aria-label^="Escala de"]'),
  );
}

function tons(tira: HTMLElement): string[] {
  return Array.from(tira.querySelectorAll<HTMLElement>("[title]")).map((c) => c.title);
}

/** Índices das células marcadas (a borda `inset` que a tira desenha). */
function marcados(tira: HTMLElement): number[] {
  return Array.from(tira.querySelectorAll<HTMLElement>("[title]"))
    .map((c, i) => (c.style.boxShadow !== "" ? i : -1))
    .filter((i) => i >= 0);
}

function linhaDaLegenda(rotulo: string): string {
  const item = screen.getByText(rotulo).closest("li");
  if (!item) throw new Error(`sem a linha ${rotulo}`);
  return item.textContent ?? "";
}

describe("tira de tons de /admin/marca com #24555e", () => {
  it.each([
    ["só #24555e", null],
    ["#24555e + escuro #8fb3bb", "#8fb3bb"],
  ])("%s: as duas escalas são as do Unnify, marcadas nos graus do Unnify", (_nome, escura) => {
    renderizar("#24555e", escura);

    const [clara, escuraTira, ...resto] = tiras();
    if (!clara || !escuraTira) throw new Error("as duas tiras não foram desenhadas");
    expect(resto).toHaveLength(0);

    expect(tons(clara)).toEqual(RAMPA_CLARA);
    // "Sua cor" e "Botões no modo claro": os dois no 600.
    expect(marcados(clara)).toEqual([6]);

    expect(tons(escuraTira)).toEqual(RAMPA_ESCURA);
    // "Botões no modo escuro": o 400.
    expect(marcados(escuraTira)).toEqual([4]);

    expect(linhaDaLegenda("Sua cor")).toContain("#24555e");
    expect(linhaDaLegenda("Botões no modo claro")).toContain("#24555e");
    expect(linhaDaLegenda("Botões no modo escuro")).toContain("#8fb3bb");
  });
});
