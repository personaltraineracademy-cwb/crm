/**
 * O CARTÃO DO AGENTE TEM ROSTO, E O DOCUMENTO SE CADASTRA NA TELA DELE.
 *
 * Duas promessas do pedido da dona do produto:
 *   1. o cartão da lista mostra a cara do agente (emoji e cor) e para de repetir
 *      em todo cartão o que é igual para todos ("Agente com ferramentas",
 *      "Ordem de preferência: 0");
 *   2. dentro da tela do agente dá para cadastrar um material, e ele já nasce
 *      marcado para aquele agente.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/ai/agents",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

import { AgentCard } from "@/app/app/ai/agents/_components/AgentCard";
import { BasesDoAgente } from "@/app/app/ai/agents/[id]/_components/BasesDoAgente";
import type { AgentRow } from "@/hooks/ai/useAgent";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function agente(over: Partial<AgentRow> = {}): AgentRow {
  return {
    id: "ag-1",
    organization_id: "org-1",
    name: "Recepção",
    description: "Atende quem chega pelo Instagram.",
    model: "claude-sonnet-5",
    system_prompt: "",
    is_active: true,
    is_default: false,
    config: {},
    guardrails: {},
    active_kb_version_id: null,
    kind: "mcp_agent",
    priority: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...over,
  };
}

function comQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("AgentCard — o cartão tem rosto", () => {
  it("mostra o emoji e a cor que o agente escolheu", () => {
    comQuery(
      <AgentCard
        agent={agente({ config: { aparencia: { emoji: "💪", cor: "verde" } } })}
        canWrite={false}
      />,
    );
    const avatar = screen.getByTestId("avatar-do-agente");
    expect(avatar).toHaveTextContent("💪");
    expect(avatar).toHaveAttribute("data-cor", "verde");
  });

  it("agente que nunca escolheu ganha o robô, e o cartão segue abrindo a tela dele", () => {
    comQuery(<AgentCard agent={agente()} canWrite={false} />);
    expect(screen.getByTestId("avatar-do-agente")).toHaveTextContent("🤖");
    expect(screen.getByRole("link", { name: "Recepção" })).toHaveAttribute(
      "href",
      "/app/ai/agents/ag-1",
    );
  });

  it("não repete em todo cartão o que é igual para todos", () => {
    comQuery(<AgentCard agent={agente()} canWrite={false} />);
    expect(screen.queryByText(/Agente com ferramentas/)).toBeNull();
    expect(screen.queryByText(/Ordem de preferência/)).toBeNull();
  });

  it("mas mostra a ordem quando alguém a mexeu, e o tipo quando foge do comum", () => {
    comQuery(<AgentCard agent={agente({ priority: 30, kind: "rag_bot" })} canWrite={false} />);
    expect(screen.getByText(/Ordem de preferência: 30/)).toBeInTheDocument();
    expect(screen.getByText(/Responde pela base de conhecimento/)).toBeInTheDocument();
  });
});

describe("BasesDoAgente — cadastrar o documento na tela do agente", () => {
  it("sem o retorno de quem hospeda, o bloco é o de sempre: sem botão", () => {
    render(<BasesDoAgente materiais={[]} value={[]} onChange={() => {}} />);
    expect(screen.queryByTestId("agente-adicionar-material")).toBeNull();
  });

  it("o material cadastrado ali já nasce marcado para este agente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ data: { id: "ks-novo", items_count: 1 } }), {
            status: 201,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    const aoMudar = vi.fn();
    const aoCadastrar = vi.fn();
    render(
      <BasesDoAgente
        materiais={[
          { id: "ks-1", name: "Preços", source_type: "documento", chunks_count: 3, last_index_status: "success" },
        ]}
        value={["ks-1"]}
        onChange={aoMudar}
        aoCadastrarMaterial={aoCadastrar}
      />,
    );

    fireEvent.click(screen.getByTestId("agente-adicionar-material"));
    fireEvent.change(screen.getByTestId("material-nome"), { target: { value: "Dúvidas" } });
    fireEvent.change(screen.getByTestId("material-pergunta-0"), { target: { value: "Aceita Pix?" } });
    fireEvent.change(screen.getByTestId("material-resposta-0"), { target: { value: "Sim." } });
    fireEvent.click(screen.getByTestId("material-criar"));

    await waitFor(() => expect(aoMudar).toHaveBeenCalledWith(["ks-1", "ks-novo"]));
    expect(aoCadastrar).toHaveBeenCalledTimes(1);
  });
});
