/**
 * O título da barra de cima abaixo de 1024px sai do catálogo de navegação, com
 * a mesma régua de "onde estou" da barra lateral: prefixo mais longo, e o
 * detalhe de um destino continua sendo o destino.
 */
import { describe, expect, it } from "vitest";

import { tituloDaRota } from "./titulo-da-rota";

describe("título da tela na barra de cima", () => {
  it("o detalhe de uma conversa continua sendo o Inbox", () => {
    expect(tituloDaRota("/app/inbox")?.label).toBe("Inbox");
    expect(tituloDaRota("/app/inbox/abc-123")?.label).toBe("Inbox");
  });

  it("o destino que mudou de nome usa o nome do catálogo", () => {
    expect(tituloDaRota("/app/kanban")?.label).toBe("Funis");
  });

  it("hub mostra o nome do grupo, e o do rodapé o nome que o menu dá a ele", () => {
    expect(tituloDaRota("/app/crm")?.label).toBe("CRM");
    expect(tituloDaRota("/app/settings")?.label).toBe("Configurações");
  });

  it("não confunde prefixo de texto com prefixo de caminho", () => {
    expect(tituloDaRota("/app/inboxes")).toBeNull();
  });

  it("fora do catálogo não inventa título", () => {
    expect(tituloDaRota("/app/nao-existe")).toBeNull();
  });
});
