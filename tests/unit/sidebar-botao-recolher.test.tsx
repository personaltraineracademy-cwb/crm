/**
 * O controle de recolher a barra lateral — onde ele mora.
 *
 * Issue #2722 o tinha posto no ALTO da barra lateral, na linha da logo. Na
 * etapa 6 (casca do Unnify, DS §5.6) ele mudou de lugar de novo, por decisão
 * do dono de seguir o Unnify à risca: mora à ESQUERDA da barra de cima
 * (`TopBar`), e a barra lateral fica só com marca, navegação e conta.
 *
 * O que estes testes protegem:
 *
 *  - a barra lateral, aberta ou recolhida, NÃO tem mais o botão — é o que
 *    impede que ele volte para dentro dela num refactor e apareça duas vezes;
 *  - a barra de cima tem o botão, com o nome do que o clique FAZ (Recolher
 *    aberta, Expandir recolhida) e o `aria-expanded` do estado atual;
 *  - clicar chama quem grava a preferência (a casca, que chama
 *    `toggleSidebar` com o estado ATUAL — a mesma semântica de antes);
 *  - sem quem grave, não há botão: controle que não controla nada não entra.
 *
 * E, da #2722 / review #2723, o que continua valendo para a MARCA na linha do
 * topo da barra lateral: imagem com teto que encolhe e nome que trunca.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { MarcaDaInstalacaoProvider } from "@/lib/branding/contexto";
import type { ActiveOrg, AuthUser } from "@/lib/auth/types";

const authRef: { user: Pick<AuthUser, "is_platform_admin">; activeOrg: ActiveOrg | null } = {
  user: { is_platform_admin: false },
  activeOrg: null,
};

vi.mock("@/hooks/auth/AuthProvider", () => ({
  useAuth: () => authRef,
  usePermission: () => false,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/inbox",
}));
vi.mock("@/components/connections/ConnectionHealthDot", () => ({
  ConnectionHealthDot: () => null,
}));
vi.mock("@/components/shell/ContadorDeCasos", () => ({
  ContadorDeCasos: () => null,
}));
vi.mock("@/components/shell/ContadorDaFila", () => ({
  ContadorDaFila: () => null,
}));
vi.mock("@/app/actions/shell/toggleSidebar", () => ({
  toggleSidebar: vi.fn(),
}));
vi.mock("@/components/shell/VersionFooter", () => ({
  VersionFooter: () => null,
}));
// As peças da barra de cima que leem React Query, tema ou idioma: o que se
// mede aqui é só o botão de recolher.
vi.mock("@/components/shell/AlertsBell", () => ({ AlertsBell: () => null }));
vi.mock("@/components/shell/AvisoDePropostaEmDestaque", () => ({
  AvisoDePropostaEmDestaque: () => null,
}));
vi.mock("@/components/shell/TenantSwitcher", () => ({ TenantSwitcher: () => null }));
vi.mock("@/components/shell/UserMenu", () => ({
  UserMenu: () => null,
  ContaNaBarraLateral: () => null,
}));
vi.mock("@/components/shell/SearchTrigger", () => ({ SearchTrigger: () => null }));
vi.mock("@/components/shell/SeletorDeIdioma", () => ({ SeletorDeIdioma: () => null }));
vi.mock("@/components/shell/MobileSidebar", () => ({ MobileSidebar: () => null }));
vi.mock("@/components/theme/theme-toggle", () => ({ ThemeToggle: () => null }));

function comoPapel(role: ActiveOrg["role"]) {
  authRef.user = { is_platform_admin: false };
  authRef.activeOrg = { orgId: "org-1", name: "Org", role };
}

afterEach(cleanup);

describe("recolher a barra lateral mora na barra de cima (DS §5.6)", () => {
  it("a barra lateral não tem mais o botão, aberta nem recolhida", () => {
    comoPapel("admin");
    const { unmount } = render(<Sidebar collapsed={false} />);
    expect(screen.queryByRole("button", { name: /Recolher sidebar|Expandir sidebar/ })).toBeNull();
    unmount();
    render(<Sidebar collapsed />);
    expect(screen.queryByRole("button", { name: /Recolher sidebar|Expandir sidebar/ })).toBeNull();
  });

  it("aberta: a barra de cima oferece Recolher, e o clique chama quem grava", async () => {
    comoPapel("admin");
    const alternar = vi.fn();
    const user = userEvent.setup();
    render(<TopBar barraRecolhida={false} aoAlternarBarra={alternar} />);
    const botao = screen.getByRole("button", { name: "Recolher sidebar" });
    expect(botao).toHaveAttribute("aria-expanded", "true");
    await user.click(botao);
    expect(alternar).toHaveBeenCalledTimes(1);
  });

  it("recolhida: o nome diz o que o clique faz — Expandir, não Recolher", () => {
    comoPapel("admin");
    render(<TopBar barraRecolhida aoAlternarBarra={vi.fn()} />);
    const botao = screen.getByRole("button", { name: "Expandir sidebar" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
  });

  it("enquanto a troca vai ao servidor, o botão espera em vez de empilhar cliques", () => {
    comoPapel("admin");
    render(<TopBar barraRecolhida={false} aoAlternarBarra={vi.fn()} alternando />);
    expect(screen.getByRole("button", { name: "Recolher sidebar" })).toBeDisabled();
  });

  it("sem quem grave a preferência, não há botão", () => {
    comoPapel("admin");
    render(<TopBar />);
    expect(screen.queryByRole("button", { name: /Recolher sidebar|Expandir sidebar/ })).toBeNull();
  });
});

describe("Sidebar — a marca na linha do topo (#2722 / review #2723)", () => {
  it("com marca própria: a imagem tem teto que encolhe, e o wrapper é min-w-0", () => {
    authRef.user = { is_platform_admin: false };
    authRef.activeOrg = {
      orgId: "org-1",
      name: "Org",
      role: "admin",
      marca: { nome: "Clínica Sorriso Feliz", logoUrl: "https://marca/logo.png" },
    };
    render(<Sidebar collapsed={false} />);
    const img = document.querySelector("img")!;
    // O review provou a pegadinha: `max-w-full` + `max-w-[10rem]` disputam a
    // MESMA propriedade e só um vale. O teto tem de ser um único `min()`.
    expect(img.className).toContain("max-w-[min(10rem,100%)]");
    expect(img.className).not.toContain("max-w-[10rem]");
    // `min-w-0` porque item de flex não encolhe abaixo do `min-width: auto`.
    expect(img.parentElement?.className).toContain("min-w-0");
  });

  it("sem logo: o logo do produto encolhe antes de empurrar o botão", () => {
    // Sem logo configurado, a barra mostra o logo do produto, mesmo com nome
    // próprio. O horizontal tem proporção de 5,5:1 (176px a 32px de altura) e a
    // linha tem ~207px úteis com o botão: `min-w-0` deixa o item de flex
    // encolher, e `max-w-full` impede que passe da linha.
    authRef.user = { is_platform_admin: false };
    authRef.activeOrg = {
      orgId: "org-1",
      name: "Org",
      role: "admin",
      marca: { nome: "Clínica Odontológica Sorriso Feliz", logoUrl: null },
    };
    render(
      <MarcaDaInstalacaoProvider
        marca={{ name: "Sistema do Revendedor", logoUrl: null, initial: "S" }}
      >
        <Sidebar collapsed={false} />
      </MarcaDaInstalacaoProvider>,
    );
    const logo = screen.getByRole("img", { name: "Unnify CRM" });
    expect(logo.getAttribute("class")).toContain("min-w-0");
    expect(logo.getAttribute("class")).toContain("max-w-full");
    expect(screen.queryByText("Clínica Odontológica Sorriso Feliz")).toBeNull();
  });

  it("só com a arte do escuro: o nome do tema claro também trunca (é bloco)", () => {
    // Instalação que cadastrou só a arte do tema escuro: no claro a barra mostra
    // o NOME dentro do wrapper da marca, que não é flex. Ali o `<span>` é inline,
    // e `truncate` (overflow + ellipsis) não vale em elemento inline — medido
    // numa réplica, o nome ia até x=255 numa barra de 240px, por cima do botão.
    // `block` é o que faz o corte valer.
    authRef.user = { is_platform_admin: false };
    authRef.activeOrg = {
      orgId: "org-1",
      name: "Org",
      role: "admin",
      marca: {
        nome: "Clínica Odontológica Sorriso Feliz",
        logoUrl: null,
        logoDarkUrl: "https://marca/logo-escuro.png",
      },
    };
    render(
      <MarcaDaInstalacaoProvider
        marca={{ name: "Sistema do Revendedor", logoUrl: null, initial: "S" }}
      >
        <Sidebar collapsed={false} />
      </MarcaDaInstalacaoProvider>,
    );
    const nome = screen.getByText("Clínica Odontológica Sorriso Feliz");
    expect(nome.className).toContain("truncate");
    expect(nome.className.split(/\s+/)).toContain("block");
  });
});
