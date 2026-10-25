import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { Sidebar } from "@/components/shell/Sidebar";
import { LogotipoDoProduto, SimboloDoProduto } from "@/components/branding/MarcaDoProduto";
import type { ActiveOrg, AuthUser } from "@/lib/auth/types";
import { DEFAULT_APP_NAME, marcaEhADoProduto, type Branding } from "@/lib/branding";
import { MarcaDaInstalacaoProvider } from "@/lib/branding/contexto";
import { LOGOTIPO, NOME_DO_LOGO, SIMBOLO } from "@/lib/branding/desenho";

/**
 * O logo do PRODUTO (Unnify CRM) aparece — e SÓ aparece — quando ninguém
 * configurou logo.
 *
 * Os arquivos vivem em `public/marca/unnify-crm/` (constantes em
 * `lib/branding/desenho.ts`) e a decisão em `marcaEhADoProduto`.
 * Este arquivo mede as duas metades: a regra pura, e a regra ALCANÇANDO a
 * barra lateral (conferir que a Sidebar importa o componente não bastaria — é
 * evidência de símbolo, não de comportamento).
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/app/inbox" }));
vi.mock("@/app/actions/shell/toggleSidebar", () => ({ toggleSidebar: vi.fn() }));
vi.mock("@/hooks/i18n/useT", () => ({ useT: () => (chave: string) => chave }));
vi.mock("@/components/connections/ConnectionHealthDot", () => ({
  ConnectionHealthDot: () => null,
}));
// O contador de casos lê a fila pelo React Query; aqui não há provider, e o
// número não é o objeto destes casos (o dele mora em contador-de-casos.test.tsx).
vi.mock("@/components/shell/ContadorDeCasos", () => ({ ContadorDeCasos: () => null }));
vi.mock("@/components/shell/ContadorDaFila", () => ({ ContadorDaFila: () => null }));
vi.mock("@/components/shell/VersionFooter", () => ({ VersionFooter: () => null }));

const usuario = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "admin@exemplo.test",
  is_platform_admin: false,
  organizations: [],
} as unknown as AuthUser;
const org = {
  orgId: "00000000-0000-4000-8000-0000000000aa",
  name: "Loja da Ana",
  role: "admin",
} as ActiveOrg;
let contexto: { user: AuthUser; activeOrg: ActiveOrg | null } = { user: usuario, activeOrg: org };
vi.mock("@/hooks/auth/AuthProvider", () => ({ useAuth: () => contexto }));

const PADRAO: Branding = { name: DEFAULT_APP_NAME, logoUrl: null, initial: "D" };

function renderSidebar(marca: Branding, collapsed: boolean) {
  return render(
    <MarcaDaInstalacaoProvider marca={marca}>
      <Sidebar collapsed={collapsed} />
    </MarcaDaInstalacaoProvider>,
  );
}

afterEach(() => {
  cleanup();
  contexto = { user: usuario, activeOrg: org };
});

describe("marcaEhADoProduto", () => {
  it("é verdade sem logo configurado", () => {
    expect(marcaEhADoProduto(PADRAO)).toBe(true);
  });

  it("o nome não decide: a instalação com nome próprio e sem logo recebe o logo do produto", () => {
    expect(marcaEhADoProduto({ name: "Acme CRM", logoUrl: null })).toBe(true);
  });

  it("quem subiu logo já tem o dele", () => {
    expect(marcaEhADoProduto({ name: DEFAULT_APP_NAME, logoUrl: "https://cdn.x/logo.png" })).toBe(
      false,
    );
    expect(marcaEhADoProduto({ name: "Acme CRM", logoUrl: "https://cdn.x/logo.png" })).toBe(false);
  });
});

/** As duas artes dentro do `<svg>` do logo, por tema. */
function artes(svg: Element) {
  const claro = svg.querySelector("image[data-tema=claro]");
  const escuro = svg.querySelector("image[data-tema=escuro]");
  return { claro, escuro };
}

describe("o logo na barra lateral", () => {
  it("aberta e sem logo, mostra o horizontal do Unnify CRM (SVG, não <img>)", () => {
    renderSidebar(PADRAO, false);
    const logotipo = screen.getByRole("img", { name: NOME_DO_LOGO });
    expect(logotipo.tagName.toLowerCase()).toBe("svg");
    expect(logotipo.getAttribute("viewBox")).toBe(`0 0 ${LOGOTIPO.largura} ${LOGOTIPO.altura}`);
    expect(artes(logotipo).claro?.getAttribute("href")).toBe("/marca/unnify-crm/horizontal.svg");
    // O e2e `marca-logo.spec.ts` lê "barra sem <img>" como "sem logo do
    // revendedor"; um <img> do produto aqui faria a spec medir a coisa errada.
    expect(document.querySelector("img")).toBeNull();
    // Nem o nome em texto: o logo já o escreve.
    expect(screen.queryByText(DEFAULT_APP_NAME)).toBeNull();
  });

  it("recolhida, mostra só o símbolo — e não a inicial em texto", () => {
    renderSidebar(PADRAO, true);
    const simbolo = screen.getByRole("img", { name: NOME_DO_LOGO });
    expect(simbolo.tagName.toLowerCase()).toBe("svg");
    expect(artes(simbolo).claro?.getAttribute("href")).toBe("/marca/unnify-crm/simbolo.svg");
    // Bloco de 32px: acima do mínimo de 24px que o símbolo sozinho pede.
    expect(simbolo.getAttribute("class")).toContain("h-8 w-8");
    expect(screen.queryByText("D")).toBeNull();
  });

  it("com nome da instalação e sem logo, é o logo do produto — e o nome não vira legenda dele", () => {
    renderSidebar({ name: "Sistema do Revendedor", logoUrl: null, initial: "S" }, false);
    expect(screen.getByRole("img", { name: NOME_DO_LOGO })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Sistema do Revendedor" })).toBeNull();
  });

  it("com nome da ORGANIZAÇÃO e sem logo, também é o logo do produto", () => {
    contexto = { user: usuario, activeOrg: { ...org, marca: { nome: "Loja da Ana" } } };
    renderSidebar(PADRAO, false);
    expect(screen.getByRole("img", { name: NOME_DO_LOGO })).toBeTruthy();
  });

  it("com logo da instalação, a imagem enviada vence o logo do produto", () => {
    renderSidebar({ ...PADRAO, logoUrl: "https://cdn.exemplo.test/logo.png" }, false);
    expect(screen.getByRole("img").tagName.toLowerCase()).toBe("img");
    expect(document.querySelector("[data-marca-do-produto]")).toBeNull();
  });

  it("com logo da organização, a imagem dela vence o logo do produto", () => {
    contexto = {
      user: usuario,
      activeOrg: {
        ...org,
        marca: { nome: "Loja da Ana", logoUrl: "https://cdn.exemplo.test/ana.png" },
      },
    };
    renderSidebar(PADRAO, false);
    expect(screen.getByRole("img").getAttribute("src")).toBe("https://cdn.exemplo.test/ana.png");
    expect(document.querySelector("[data-marca-do-produto]")).toBeNull();
  });
});

describe("o tema", () => {
  it.each([
    ["horizontal", LogotipoDoProduto, LOGOTIPO],
    ["símbolo", SimboloDoProduto, SIMBOLO],
  ] as const)("%s: a versão escura no tema escuro, a clara no claro, as duas no DOM", (_, Logo, arte) => {
    render(<Logo />);
    const { claro, escuro } = artes(screen.getByRole("img", { name: NOME_DO_LOGO }));
    expect(claro?.getAttribute("href")).toBe(arte.claro);
    expect(escuro?.getAttribute("href")).toBe(arte.escuro);
    expect(arte.escuro).toMatch(/-escuro\.svg$/);
    // O CSS escolhe pelo `data-theme` do <html> (`@custom-variant dark` em
    // `app/globals.css`), gravado antes da primeira pintura: não pisca, e
    // nenhum efeito do React decide o tema.
    expect(claro?.getAttribute("class")?.split(" ")).toEqual(["dark:hidden"]);
    expect(escuro?.getAttribute("class")?.split(" ")).toEqual(["hidden", "dark:inline"]);
  });

  it("os arquivos das duas versões existem em public/", () => {
    for (const arte of [LOGOTIPO, SIMBOLO]) {
      for (const publico of [arte.claro, arte.escuro]) {
        const svg = fs.readFileSync(path.join(process.cwd(), "public", publico), "utf8");
        // O `viewBox` do arquivo é o mesmo que o componente declara.
        expect(svg).toContain(`viewBox="0 0 ${arte.largura} ${arte.altura}"`);
        expect(svg).not.toMatch(/<script|\son[a-z]+=|href=/i);
      }
    }
  });
});

describe("acessibilidade", () => {
  it("o nome acessível é o que o logo escreve, não o nome que quem chama passa", () => {
    render(<LogotipoDoProduto nome="Marca X" />);
    expect(screen.getByRole("img", { name: NOME_DO_LOGO })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Marca X" })).toBeNull();
    expect(NOME_DO_LOGO).toBe("Unnify CRM");
  });

  it("decorativo esconde do leitor de tela — dentro de link ou ao lado do nome, não lê duas vezes", () => {
    render(
      <a href="/app">
        <SimboloDoProduto decorativo />
        Unnify CRM
      </a>,
    );
    const svg = document.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBeNull();
    expect(screen.getByRole("link").textContent).toBe("Unnify CRM");
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("o favicon segue a mesma regra", () => {
  const icone = fs.readFileSync(path.join(process.cwd(), "app/icon.tsx"), "utf8");

  it("serve o ícone do produto quando não há logo, e a inicial quando há", () => {
    expect(icone).toMatch(/marcaEhADoProduto\(\{ name: marca\.nome, logoUrl: marca\.logoUrl \}\)/);
    expect(icone).toMatch(/lerAtivoDaMarca\(ICONE_DO_APP\.png\[64\]\)/);
    expect(icone).toMatch(/letraDoIcone\(marca\.nome\)/);
  });
});

describe("o cabeçalho do onboarding segue a mesma regra do favicon", () => {
  const layout = fs.readFileSync(path.join(process.cwd(), "app/onboarding/layout.tsx"), "utf8");

  it("a marca padrão segue com o SVG que acompanha o tema, e o <img> só vale para marca própria", () => {
    // O `/icon` é um PNG sempre claro: desenhá-lo para a marca padrão punha um
    // ladrilho creme no tema escuro (PR #1942). A escolha passa pela MESMA regra
    // de `app/icon.tsx`, e o SVG vem antes do <img>.
    expect(layout).toMatch(
      /iconeUrl === ICONE_DESENHADO &&\s*marcaEhADoProduto\(\{ name: marcaDoIcone\.nome, logoUrl: marcaDoIcone\.logoUrl \}\)/,
    );
    expect(layout).toMatch(/simboloDoProduto \? \(\s*<SimboloDoProduto[^>]*decorativo/);
  });

  it("o ícone é decorativo: o nome já está escrito ao lado", () => {
    const img = layout.slice(layout.indexOf("<img"), layout.indexOf("/>", layout.indexOf("<img")));
    expect(img).toMatch(/alt=""/);
  });
});
