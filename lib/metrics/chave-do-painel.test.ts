import { describe, expect, it } from "vitest";

import { escolherChaveDoPainel } from "./chave-do-painel";

const openai = { id: "c-openai", provider: "openai", models_available: ["gpt-4o", "gpt-5-mini"] };

describe("chave do painel por conversa", () => {
  it("padrão sem credencial validada usa a da OpenAI com modelo barato", () => {
    expect(
      escolherChaveDoPainel({ providerPadrao: "anthropic", padraoTemChaveDaInstalacao: false, credenciais: [openai] }),
    ).toEqual({ provider: "openai", credentialId: "c-openai", model: "gpt-5-mini" });
  });

  it("padrão com credencial validada fica como está", () => {
    const anthropic = { id: "c-a", provider: "anthropic", models_available: null };
    expect(
      escolherChaveDoPainel({
        providerPadrao: "anthropic",
        padraoTemChaveDaInstalacao: false,
        credenciais: [openai, anthropic],
      }),
    ).toBeNull();
  });

  it("padrão com chave da instalação fica como está", () => {
    expect(
      escolherChaveDoPainel({ providerPadrao: "anthropic", padraoTemChaveDaInstalacao: true, credenciais: [openai] }),
    ).toBeNull();
  });

  it("chave que não libera nenhum modelo conhecido não é escolhida", () => {
    expect(
      escolherChaveDoPainel({
        providerPadrao: "anthropic",
        padraoTemChaveDaInstalacao: false,
        credenciais: [{ id: "x", provider: "openai", models_available: ["whisper-1"] }],
      }),
    ).toBeNull();
  });
});
