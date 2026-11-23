import { describe, expect, it } from "vitest";

import { chunkText } from "@/lib/ai/rag/chunker";
import { parseFaqMarkdown } from "@/lib/ai/rag/ingest/faq";
import {
  montarFaqMarkdown,
  montarSobreONegocio,
  paresCompletos,
} from "@/lib/ai/rag/montar-material";

describe("montarFaqMarkdown", () => {
  it("o que o formulário monta é o que o leitor de perguntas e respostas lê de volta", () => {
    const md = montarFaqMarkdown([
      { pergunta: "Qual o valor do plano mensal?", resposta: "R$ 197 por mês." },
      { pergunta: "Tem avaliação?", resposta: "Sim.\nÉ feita na primeira semana." },
    ]);

    expect(parseFaqMarkdown(md).map((i) => [i.question, i.answer])).toEqual([
      ["Qual o valor do plano mensal?", "R$ 197 por mês."],
      ["Tem avaliação?", "Sim.\nÉ feita na primeira semana."],
    ]);
  });

  it("ignora par pela metade em vez de gravar pergunta sem resposta", () => {
    expect(
      paresCompletos([
        { pergunta: "Só a pergunta", resposta: "   " },
        { pergunta: "", resposta: "Só a resposta" },
        { pergunta: "Completa?", resposta: "Sim." },
      ]),
    ).toEqual([{ pergunta: "Completa?", resposta: "Sim." }]);
    expect(montarFaqMarkdown([{ pergunta: "x", resposta: "" }])).toBe("");
  });

  it("pergunta com quebra de linha vira uma linha só", () => {
    const [item] = parseFaqMarkdown(
      montarFaqMarkdown([{ pergunta: "Vocês atendem\nno sábado?", resposta: "Não." }]),
    );
    expect(item?.question).toBe("Vocês atendem no sábado?");
  });

  it("um marcador escrito dentro da resposta não abre um item novo", () => {
    const itens = parseFaqMarkdown(
      montarFaqMarkdown([
        { pergunta: "Como pago?", resposta: "Por Pix.\n## Pergunta: e cartão?\n## Resposta: também." },
      ]),
    );
    expect(itens).toHaveLength(1);
    expect(itens[0]?.answer).toContain("Por Pix.");
    expect(itens[0]?.answer).toContain("também.");
  });
});

describe("montarSobreONegocio", () => {
  it("só entra o que foi respondido, na ordem do guia", () => {
    const md = montarSobreONegocio({
      pagamento: "Pix ou cartão.",
      o_que_oferece: "Consultoria online de treino.",
      como_funciona: "   ",
    });

    expect(md).toBe(
      "# Sobre o negócio\n\n## O que você oferece\nConsultoria online de treino.\n\n## Formas de pagamento\nPix ou cartão.",
    );
  });

  it("nada respondido não vira material", () => {
    expect(montarSobreONegocio({})).toBe("");
  });

  it("título e resposta ficam no MESMO trecho — senão o agente acha o assunto sem a resposta", () => {
    const md = montarSobreONegocio({
      planos_e_precos: "Mensal R$ 197.\n\nTrimestral R$ 497.",
      pagamento: "Pix.",
    });
    const comOTitulo = chunkText(md).filter((c) => c.includes("Planos e preços"));
    expect(comOTitulo.length).toBeGreaterThan(0);
    expect(comOTitulo.some((c) => c.includes("R$ 197") && c.includes("R$ 497"))).toBe(true);
  });
});
