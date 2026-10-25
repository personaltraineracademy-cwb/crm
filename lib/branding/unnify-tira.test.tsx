/**
 * A régua de tons da tela `/admin/marca` (`TiraDeTons`), com `#0066cc` digitado,
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
  "#eaf2fc",
  "#dceafa",
  "#b8d8ff",
  "#9bbbe0",
  "#5992d7",
  "#0066cc",
  "#0066cc",
  "#005bb5",
  "#004f9e",
  "#0e2747",
  "#071a32",
];
const RAMPA_ESCURA = [
  "#e5f1ff",
  "#c6e0ff",
  "#a9d0ff",
  "#91c5ff",
  "#75b7ff",
  "#5ca8fb",
  "#416d98",
  "#203d5c",
  "#203750",
  "#0e2747",
  "#08131c",
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

describe("tira de tons de /admin/marca com #0066cc", () => {
  it.each([
    ["só #0066cc", null],
    ["#0066cc + escuro #75b7ff", "#75b7ff"],
  ])("%s: as duas escalas são as do Unnify, marcadas nos graus do Unnify", (_nome, escura) => {
    renderizar("#0066cc", escura);

    const [clara, escuraTira, ...resto] = tiras();
    if (!clara || !escuraTira) throw new Error("as duas tiras não foram desenhadas");
    expect(resto).toHaveLength(0);

    expect(tons(clara)).toEqual(RAMPA_CLARA);
    // "Sua cor" e "Botões no modo claro": os dois no 600.
    expect(marcados(clara)).toEqual([6]);

    expect(tons(escuraTira)).toEqual(RAMPA_ESCURA);
    // "Botões no modo escuro": o 400.
    expect(marcados(escuraTira)).toEqual([4]);

    expect(linhaDaLegenda("Sua cor")).toContain("#0066cc");
    expect(linhaDaLegenda("Botões no modo claro")).toContain("#0066cc");
    expect(linhaDaLegenda("Botões no modo escuro")).toContain("#75b7ff");
  });
});
