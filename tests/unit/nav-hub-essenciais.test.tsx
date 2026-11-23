/**
 * O hub com `essenciais`: o que o dono ajusta no primeiro mês vem primeiro, em
 * cartões grandes, e o resto do grupo fica recolhido sob "Avançado".
 *
 * A regra que este arquivo guarda é "nada some, só muda de lugar": toda porta
 * que o hub mostrava continua no DOM, uma vez só, e o papel continua decidindo
 * o que vira cartão. O hub SEM `essenciais` é coberto por `nav-hub.test.tsx`.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

import { NavHub } from "@/components/shell/NavHub";
import { DICIONARIO } from "@/lib/i18n/dicionario";
import { hubSections } from "@/lib/navigation/registry";

afterEach(cleanup);

const ESSENCIAIS_DE_IA = ["/app/ai/agents", "/app/ai/knowledge/sources", "/app/ai/followups"];

function hrefs(raiz: HTMLElement = document.body): string[] {
  return within(raiz)
    .getAllByRole("link")
    .map((a) => a.getAttribute("href") ?? "");
}

describe("NavHub com essenciais", () => {
  it("mostra os essenciais primeiro, na ordem pedida, e o resto dentro de Avançado", () => {
    render(
      <NavHub
        modulosLigados={[]}
        group="ia"
        isPlatformAdmin
        role={null}
        title="Agente de IA"
        subtitle=""
        essenciais={ESSENCIAIS_DE_IA}
      />,
    );

    const essencial = screen.getByRole("region", { name: "O essencial" });
    expect(hrefs(essencial)).toEqual(ESSENCIAIS_DE_IA);

    const avancado = screen.getByText("Avançado").closest("details");
    expect(avancado).not.toBeNull();
    // Recolhido de fábrica: quem chega vê três cartões, não quatorze.
    expect(avancado).not.toHaveAttribute("open");
    expect(hrefs(avancado as HTMLElement)).toContain("/app/ai/credentials");
    for (const href of ESSENCIAIS_DE_IA) {
      expect(hrefs(avancado as HTMLElement)).not.toContain(href);
    }
  });

  it("nada some: as portas são as mesmas do hub sem essenciais, cada uma uma vez", () => {
    const esperadas = hubSections("ia", true, null, undefined, [])
      .flatMap((s) => s.items.map((i) => i.href))
      .sort();

    render(
      <NavHub
        modulosLigados={[]}
        group="ia"
        isPlatformAdmin
        role={null}
        title="Agente de IA"
        subtitle=""
        essenciais={ESSENCIAIS_DE_IA}
      />,
    );

    expect(hrefs().sort()).toEqual(esperadas);
  });

  it("aceita porta de outro grupo: o WhatsApp é de Canais e aparece em Configurações", () => {
    render(
      <NavHub
        modulosLigados={[]}
        group="organizacao"
        isPlatformAdmin={false}
        role="admin"
        title="Configurações"
        subtitle=""
        essenciais={["/app/settings/tenant", "/app/connections"]}
      />,
    );

    const essencial = screen.getByRole("region", { name: "O essencial" });
    expect(hrefs(essencial)).toEqual(["/app/settings/tenant", "/app/connections"]);
  });

  it("o papel continua decidindo: o viewer não ganha cartão de porta que não alcança", () => {
    render(
      <NavHub
        modulosLigados={[]}
        group="organizacao"
        isPlatformAdmin={false}
        role="viewer"
        title="Configurações"
        subtitle=""
        essenciais={["/app/settings/tenant", "/app/connections", "/app/settings/profile"]}
      />,
    );

    const essencial = screen.getByRole("region", { name: "O essencial" });
    expect(hrefs(essencial)).toEqual(["/app/settings/profile"]);
    expect(hrefs()).not.toContain("/app/connections");
    expect(hrefs()).not.toContain("/app/settings/tenant");
  });

  it("sem nenhum essencial alcançável, o hub volta a ser o de sempre", () => {
    render(
      <NavHub
        modulosLigados={[]}
        group="organizacao"
        isPlatformAdmin={false}
        role="viewer"
        title="Configurações"
        subtitle=""
        essenciais={["/app/settings/tenant"]}
      />,
    );

    expect(screen.queryByText("Avançado")).toBeNull();
    expect(screen.queryByRole("region", { name: "O essencial" })).toBeNull();
    expect(hrefs()).toContain("/app/settings/profile");
  });

  it("os três textos novos têm tradução em espanhol", () => {
    for (const texto of ["O essencial", "Avançado", "O que se ajusta de vez em quando."]) {
      expect(DICIONARIO[texto]?.es, texto).toBeTruthy();
    }
  });
});
