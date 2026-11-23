/**
 * O formulário do agente mostra primeiro o que o dono decide, e guarda o resto
 * atrás de "Ajustes avançados".
 *
 * O que este arquivo guarda são três promessas:
 *   1. o essencial está FORA do recolhido (quem chega enxerga sem clicar);
 *   2. o avançado está DENTRO, e o recolhido nasce fechado;
 *   3. nada foi tirado: os campos do recolhido continuam montados, então o
 *      valor deles segue no estado do formulário e é salvo igual.
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

import { AgentForm } from "@/app/app/ai/agents/[id]/_components/AgentForm";

function renderizarEditorNovo() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AgentForm mode="create" credentials={[] as never} channelSessions={[] as never} />
    </QueryClientProvider>,
  );
}

function recolhidoDe(titulo: string): Element | null {
  return screen.getByRole("heading", { name: titulo }).closest("details");
}

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

describe("AgentForm — ajustes avançados", () => {
  it("o essencial fica fora do recolhido", () => {
    renderizarEditorNovo();
    for (const titulo of ESSENCIAL) {
      expect(recolhidoDe(titulo), titulo).toBeNull();
    }
  });

  it("o avançado fica dentro de um recolhido que nasce fechado", () => {
    renderizarEditorNovo();
    for (const titulo of AVANCADO) {
      const recolhido = recolhidoDe(titulo);
      expect(recolhido, titulo).not.toBeNull();
      expect(recolhido, titulo).not.toHaveAttribute("open");
    }
  });

  it("são dois recolhidos, um por coluna, e cada um diz o que guarda", () => {
    renderizarEditorNovo();
    const recolhidos = screen.getAllByTestId("ajustes-avancados");
    expect(recolhidos).toHaveLength(2);
    for (const r of recolhidos) {
      const resumo = r.querySelector("summary")?.textContent ?? "";
      expect(resumo).toMatch(/Ajustes avançados/);
      // O rótulo tem de dizer o que há lá dentro, não só "avançado".
      expect(resumo.length).toBeGreaterThan("Ajustes avançados".length + 20);
    }
  });

  it("nada foi tirado: os campos do recolhido continuam montados com o valor de fábrica", () => {
    renderizarEditorNovo();
    const custo = screen.getByLabelText("Custo máximo por atendimento (centavos)");
    expect(custo.closest("details")).not.toBeNull();
    expect((custo as HTMLInputElement).value).not.toBe("");
    expect(
      screen.getByRole("switch", { name: "Habilitar gatilhos automáticos de follow-up" }),
    ).toBeInTheDocument();
  });
});
