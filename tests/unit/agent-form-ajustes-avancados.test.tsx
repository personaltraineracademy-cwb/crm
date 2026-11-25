/**
 * O formulário do agente em seções (ver o bloco de descrição abaixo).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/ai/agents/new",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

import { AgentForm, type SecaoDoAgente } from "@/app/app/ai/agents/[id]/_components/AgentForm";

function renderizarEditorNovo() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AgentForm mode="create" credentials={[] as never} channelSessions={[] as never} />
    </QueryClientProvider>,
  );
}

function renderizarSecao(secao: SecaoDoAgente) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AgentForm mode="create" secao={secao} credentials={[] as never} channelSessions={[] as never} />
    </QueryClientProvider>,
  );
}

/** O bloco da seção que contém o título — escondido pela classe `hidden`. */
function blocoDe(titulo: string): Element | null {
  return screen.getByRole("heading", { name: titulo }).closest("[data-secao]");
}

/**
 * O editor em SEÇÕES (pedido da dona, 25/11/2026: menu à esquerda com Perfil,
 * Trabalho, Treinamentos, Canais, Integrações e Configurações). Substitui os
 * dois recolhidos de "Ajustes avançados": o que era avançado mora agora nas abas
 * de Configurações. As promessas que continuam valendo:
 *   1. o essencial aparece na seção certa, e o resto fica escondido;
 *   2. nada foi tirado: os campos das outras seções continuam MONTADOS, com o
 *      valor no estado do formulário, e são salvos igual.
 */
const ESSENCIAL = [
  "Quem é este agente",
  "A inteligência que ele usa",
  "Por qual número ele atende",
  "As instruções dele",
  "O que o agente pode fazer",
  "Passar para uma pessoa",
];

const AVANCADO = [
  "Freios de segurança",
  "Quando ele entra em ação",
  "Pedir ajuda sem sair da conversa",
  "Propostas comerciais",
  "Follow-up",
];

const SECAO_DE: Record<string, SecaoDoAgente> = {
  "Quem é este agente": "perfil",
  "A inteligência que ele usa": "perfil",
  "As instruções dele": "perfil",
  "Por qual número ele atende": "canais",
  "O que o agente pode fazer": "trabalho",
  "Passar para uma pessoa": "trabalho",
  "Pedir ajuda sem sair da conversa": "trabalho",
  "Propostas comerciais": "trabalho",
  "Freios de segurança": "configuracoes",
  "Quando ele entra em ação": "configuracoes",
  "Follow-up": "configuracoes",
};

describe("AgentForm — seções do editor", () => {
  it("sem seção (tela de criar, testes), tudo aparece e nada fica recolhido", () => {
    renderizarEditorNovo();
    for (const titulo of [...ESSENCIAL, ...AVANCADO]) {
      expect(screen.getByRole("heading", { name: titulo }).closest("details"), titulo).toBeNull();
    }
  });

  it("no Perfil, só o que é do perfil fica visível", () => {
    renderizarSecao("perfil");
    for (const [titulo, secao] of Object.entries(SECAO_DE)) {
      const bloco = blocoDe(titulo);
      expect(bloco, titulo).not.toBeNull();
      if (secao === "perfil") expect(bloco, titulo).not.toHaveClass("hidden");
      else expect(bloco, titulo).toHaveClass("hidden");
    }
  });

  it("em Configurações, a aba Conversa mostra os gatilhos e esconde follow-up e limites", () => {
    renderizarSecao("configuracoes");
    expect(blocoDe("Quando ele entra em ação")).not.toHaveClass("hidden");
    expect(blocoDe("Follow-up")).toHaveClass("hidden");
    expect(blocoDe("Freios de segurança")).toHaveClass("hidden");
    expect(screen.getByRole("tablist", { name: "Configurações do agente" })).toBeInTheDocument();
  });

  it("nada foi tirado: os campos de outra seção continuam montados com o valor de fábrica", () => {
    renderizarSecao("perfil");
    const custo = screen.getByLabelText("Custo máximo por atendimento (centavos)");
    expect((custo as HTMLInputElement).value).not.toBe("");
    expect(
      screen.getByRole("switch", { name: "Habilitar gatilhos automáticos de follow-up" }),
    ).toBeInTheDocument();
  });
});
