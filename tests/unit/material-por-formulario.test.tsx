/**
 * ENSINAR O AGENTE SEM APRENDER O FORMATO.
 *
 * Perguntas e respostas pediam `## Pergunta:` e `## Resposta:` escritos à mão,
 * e a tela vazia entregava um campo em branco. Este arquivo guarda as duas
 * portas novas — os campos de pergunta e resposta, e o guia "Sobre o meu
 * negócio" — e o que elas mandam para a API: o MESMO corpo que o indexador já
 * lia. O caminho de colar o texto pronto segue coberto por
 * `fonte-de-conhecimento-cadastro.test.tsx`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const toastErro = vi.fn();
const toastOk = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (m: string) => toastOk(m),
    error: (m: string) => toastErro(m),
    info: (m: string) => toastOk(m),
  },
}));

import { NovoMaterialDialog } from "@/components/ai/NovoMaterialDialog";
import { SobreONegocioDialog } from "@/components/ai/SobreONegocioDialog";
import { parseFaqMarkdown } from "@/lib/ai/rag/ingest/faq";

function dublarFetch() {
  const spy = vi.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ data: { id: "ks-1", items_count: 1 } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}

function corpoEnviado(spy: ReturnType<typeof dublarFetch>): Record<string, unknown> {
  return JSON.parse(String(spy.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
}

function escrever(testId: string, valor: string): void {
  fireEvent.change(screen.getByTestId(testId), { target: { value: valor } });
}

beforeEach(() => {
  toastErro.mockReset();
  toastOk.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NovoMaterialDialog — perguntas e respostas por campos", () => {
  it("dois pares preenchidos chegam à API no formato que o indexador lê", async () => {
    const spy = dublarFetch();
    render(<NovoMaterialDialog aberto onFechar={() => {}} onCriado={() => {}} podeIndexar />);

    escrever("material-nome", "Dúvidas mais comuns");
    escrever("material-pergunta-0", "Quanto custa o plano mensal?");
    escrever("material-resposta-0", "R$ 197 por mês.");
    fireEvent.click(screen.getByTestId("material-par-adicionar"));
    escrever("material-pergunta-1", "Tem avaliação?");
    escrever("material-resposta-1", "Sim, na primeira semana.");
    fireEvent.click(screen.getByTestId("material-criar"));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    const corpo = corpoEnviado(spy);
    expect(corpo).toMatchObject({ source_type: "faq", name: "Dúvidas mais comuns" });
    expect(
      parseFaqMarkdown(String(corpo.markdown_blob)).map((i) => [i.question, i.answer]),
    ).toEqual([
      ["Quanto custa o plano mensal?", "R$ 197 por mês."],
      ["Tem avaliação?", "Sim, na primeira semana."],
    ]);
  });

  it("campos e texto colado entram juntos no mesmo material", async () => {
    const spy = dublarFetch();
    render(<NovoMaterialDialog aberto onFechar={() => {}} onCriado={() => {}} podeIndexar />);

    escrever("material-nome", "Dúvidas");
    escrever("material-pergunta-0", "Aceita Pix?");
    escrever("material-resposta-0", "Sim.");
    escrever("material-conteudo", "## Pergunta: Aceita cartão?\n## Resposta: Em até 12 vezes.");
    fireEvent.click(screen.getByTestId("material-criar"));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(
      parseFaqMarkdown(String(corpoEnviado(spy).markdown_blob)).map((i) => i.question),
    ).toEqual(["Aceita Pix?", "Aceita cartão?"]);
  });

  it("pergunta sem resposta não vira material: avisa e não chama a API", async () => {
    const spy = dublarFetch();
    render(<NovoMaterialDialog aberto onFechar={() => {}} onCriado={() => {}} podeIndexar />);

    escrever("material-nome", "Dúvidas");
    escrever("material-pergunta-0", "Aceita Pix?");
    fireEvent.click(screen.getByTestId("material-criar"));

    await waitFor(() => expect(toastErro).toHaveBeenCalledTimes(1));
    expect(toastErro.mock.calls[0]?.[0]).toMatch(/pergunta com a resposta/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("os campos de pergunta só aparecem no tipo de perguntas e respostas", () => {
    render(<NovoMaterialDialog aberto onFechar={() => {}} onCriado={() => {}} podeIndexar />);
    expect(screen.getByTestId("material-pares")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("material-tipo-documento"));
    expect(screen.queryByTestId("material-pares")).toBeNull();
  });
});

describe("SobreONegocioDialog — o começo guiado", () => {
  it("o que foi respondido vira UM documento, com cada assunto sob o seu título", async () => {
    const spy = dublarFetch();
    const criado = vi.fn();
    render(<SobreONegocioDialog aberto onFechar={() => {}} onCriado={criado} podeIndexar />);

    escrever("negocio-o_que_oferece", "Consultoria online de treino.");
    escrever("negocio-planos_e_precos", "Mensal R$ 197.");
    expect(screen.getByTestId("negocio-contagem")).toHaveTextContent("2 de 6 respondidas");
    fireEvent.click(screen.getByTestId("negocio-guardar"));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0]?.[0]).toBe("/api/v1/ai/knowledge/sources");
    const corpo = corpoEnviado(spy);
    expect(corpo).toMatchObject({ source_type: "documento", name: "Sobre o negócio" });
    expect(corpo.markdown_blob).toBe(
      "# Sobre o negócio\n\n## O que você oferece\nConsultoria online de treino.\n\n## Planos e preços\nMensal R$ 197.",
    );
    await waitFor(() => expect(criado).toHaveBeenCalledTimes(1));
  });

  it("sem nenhuma resposta, avisa e não chama a API", async () => {
    const spy = dublarFetch();
    render(<SobreONegocioDialog aberto onFechar={() => {}} onCriado={() => {}} podeIndexar />);

    fireEvent.click(screen.getByTestId("negocio-guardar"));

    await waitFor(() => expect(toastErro).toHaveBeenCalledTimes(1));
    expect(spy).not.toHaveBeenCalled();
  });
});
