import fs from "node:fs";
import path from "node:path";

import tailwind from "@tailwindcss/postcss";
import postcss, { type Root } from "postcss";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Escala de raio do Unnify (DS §6.1, decisão do dono na etapa 3A), medida no
 * CSS COMPILADO de `app/unnify/app.css` com o mesmo plugin do Next.
 *
 * Duas perguntas, porque o `globals.css` tem duas fontes de raio:
 *   1. o NÚMERO de cada `--radius-*` no `:root` sem camada (o que o utilitário e
 *      todo `var(--radius-*)` leem), pegando a ÚLTIMA declaração, que é a que
 *      vence pela ordem;
 *   2. o UTILITÁRIO `rounded-*`, que tem de ler a variável e não um literal (um
 *      literal mudaria o utilitário e deixaria `var(--radius-md)` no valor velho).
 */

const RAIZ = process.cwd();
const ENTRADA = path.join(RAIZ, "app/unnify/app.css");
let AST: Root;

const ESPERADO = { sm: "4px", md: "6px", lg: "8px", xl: "12px", "2xl": "16px" } as const;

beforeAll(async () => {
  const candidatos = Object.keys(ESPERADO).map((k) => `rounded-${k}`);
  const r = await postcss([tailwind({ base: RAIZ })]).process(
    fs.readFileSync(ENTRADA, "utf8") + `\n@source inline("${candidatos.join(" ")}");\n`,
    { from: ENTRADA },
  );
  AST = postcss.parse(r.css);
}, 180_000);

function noRootSemCamada(): Map<string, string> {
  const vars = new Map<string, string>();
  AST.walkRules((regra) => {
    if (regra.selector.trim() !== ":root") return;
    for (let p = regra.parent; p; p = p.parent as typeof p) {
      if (p.type === "atrule") return;
    }
    regra.walkDecls((d) => void vars.set(d.prop, d.value));
  });
  return vars;
}

describe("escala de raio do Unnify no CSS compilado", () => {
  it.each(Object.entries(ESPERADO))("--radius-%s vale %s no :root", (degrau, px) => {
    expect(noRootSemCamada().get(`--radius-${degrau}`)).toBe(px);
  });

  it("`--radius` (base shadcn, lida por CSS de organização) segue sendo o raio de controle, 8", () => {
    expect(noRootSemCamada().get("--radius")).toBe("var(--radius-lg)");
  });

  it.each(Object.keys(ESPERADO))("rounded-%s lê a variável, não um literal", (degrau) => {
    const valores: string[] = [];
    AST.walkRules((regra) => {
      if (regra.selector === `.rounded-${degrau}`) {
        regra.walkDecls("border-radius", (d) => void valores.push(d.value));
      }
    });
    expect(valores).toEqual([`var(--radius-${degrau})`]);
  });
});
