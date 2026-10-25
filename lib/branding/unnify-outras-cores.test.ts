/**
 * A tabela fixa do Unnify (`lib/branding/unnify.ts`) NÃO pode mudar a cor de
 * mais ninguém.
 *
 * O snapshot deste arquivo foi gravado com o código ORIGINAL, antes de a tabela
 * existir (commit próprio, anterior ao da tabela, na branch `etapa-1/marca`).
 * Cada caso guarda:
 *   - o CSS que a instalação e a organização injetam, por inteiro;
 *   - os tokens principais, legíveis, para o diff do snapshot dizer O QUE mudou;
 *   - o sha256 do objeto resolvido INTEIRO (rampa, tokens, pares medidos,
 *     semânticas e motivos), para pegar qualquer mudança que o CSS não mostra.
 *
 * Ficam de fora, de propósito, só as entradas que a tabela passa a tratar:
 * `#0066cc` (e `#06c`) como cor principal e `#0066cc`/`#75b7ff` como cor do
 * tema escuro. `#75b7ff` como cor PRINCIPAL continua aqui: no tema claro ela é
 * uma cor qualquer e deriva como antes.
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { cssDaMarca, ESCOPO_DA_ORGANIZACAO } from "./css";
import { REGUA_DO_PRODUTO } from "./regua-do-produto";
import { resolverMarca } from "./resolve";
import { envelopeDeSemente } from "./schema";

type Caso = { readonly principal: string; readonly escura?: string };

const CASOS: readonly Caso[] = [
  { principal: "#7a5cd6" },
  { principal: "#67885d" },
  { principal: "#506d48" },
  { principal: "#75b7ff" },
  { principal: "#0b5cff" },
  { principal: "#005bb5" },
  { principal: "#0066cd" },
  { principal: "#1c261d" },
  { principal: "#d9ac62" },
  { principal: "#f5c518" },
  { principal: "#0f172a" },
  { principal: "#808080" },
  { principal: "#ffffff" },
  { principal: "#e11d48" },
  { principal: "#7a5cd6", escura: "#d9ac62" },
  { principal: "#1c261d", escura: "#d9ac62" },
  { principal: "#67885d", escura: "#808080" },
  { principal: "#75b7ff", escura: "#7a5cd6" },
];

function resolver(caso: Caso) {
  return resolverMarca(
    [
      {
        origem: "teste",
        cor: envelopeDeSemente(caso.principal),
        ...(caso.escura ? { corEscura: envelopeDeSemente(caso.escura) } : {}),
      },
    ],
    REGUA_DO_PRODUTO,
  );
}

function sha256(valor: unknown): string {
  return createHash("sha256").update(JSON.stringify(valor)).digest("hex");
}

describe("a tabela do Unnify não muda nenhuma outra cor", () => {
  for (const caso of CASOS) {
    const nome = caso.escura ? `${caso.principal} + escuro ${caso.escura}` : caso.principal;
    it(`${nome} sai igual ao de antes da tabela`, () => {
      const marca = resolver(caso);
      const cor = marca.cor;
      const fonteEscura = cor?.corEscura?.derivada ?? cor?.derivada ?? null;
      expect({
        tokens: {
          claro: cor?.derivada
            ? {
                grau: cor.derivada.claro.grauDoAccent,
                d: cor.derivada.claro.deslocamento,
                accent: cor.derivada.claro.accent,
                fg: cor.derivada.claro.accentFg,
                hover: cor.derivada.claro.accentHover,
                soft: cor.derivada.claro.accentSoft,
              }
            : null,
          escuro: fonteEscura
            ? {
                grau: fonteEscura.escuro.grauDoAccent,
                d: fonteEscura.escuro.deslocamento,
                accent: fonteEscura.escuro.accent,
                fg: fonteEscura.escuro.accentFg,
                hover: fonteEscura.escuro.accentHover,
                soft: fonteEscura.escuro.accentSoft,
              }
            : null,
        },
        cssDaInstalacao: cssDaMarca(cor).css,
        cssDaOrganizacao: cssDaMarca(cor, ESCOPO_DA_ORGANIZACAO).css,
        motivos: marca.motivos.map((m) => `${m.codigo}|${m.tema}|${m.alvo}`),
        sha256DoResolvido: sha256(marca),
      }).toMatchSnapshot();
    });
  }
});
