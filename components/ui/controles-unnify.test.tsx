import fs from "node:fs";
import path from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

import { Badge, badgeVariants } from "./badge";
import { Button, buttonVariants } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

/**
 * Contrato dos controles de formulário com o Unnify (DESIGN-SYSTEM.md §10.1 a
 * §10.6 e §9), etapa 3A. jsdom não aplica CSS: aqui fica a guarda barata de que
 * as CLASSES que produzem as medidas e os estados do DS não voltaram atrás. A
 * escala de raio que dá número a essas classes é medida no CSS compilado em
 * `tests/unit/unnify-raios.test.ts`.
 */

const classes = (el: Element) => el.className.split(/\s+/).filter(Boolean);
const deVariante = (v: Parameters<typeof buttonVariants>[0]) =>
  classes({ className: cn(buttonVariants(v)) } as Element);

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

describe("Button (§10.1)", () => {
  it("primária: `primary`, hover `primary-hover`, pressionado `primary-pressed`, raio 8, sem sombra nem deslocamento", () => {
    // `onClick` porque a cerca do botão mudo (tests/unit/controle-decorativo)
    // varre todo .tsx de components/, este teste inclusive.
    render(<Button onClick={() => {}}>Salvar alterações</Button>);
    const c = classes(screen.getByRole("button"));
    for (const k of [
      "bg-primary",
      "text-primary-foreground",
      "hover:bg-primary-hover",
      "active:bg-primary-pressed",
      "rounded-lg",
      "h-9",
      "px-3.5",
      "text-sm",
      "font-medium",
    ]) {
      expect(c).toContain(k);
    }
    expect(c.some((k) => /^(\w+:)?(shadow-|translate-)/.test(k))).toBe(false);
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button");
  });

  it("os nomes antigos do CRM continuam valendo: `primary` = `default` e `md` = `default`", () => {
    expect(cn(buttonVariants({ variant: "primary" }))).toBe(
      cn(buttonVariants({ variant: "default" })),
    );
    expect(cn(buttonVariants({ size: "md" }))).toBe(cn(buttonVariants({ size: "default" })));
    expect(cn(buttonVariants({}))).toBe(
      cn(buttonVariants({ variant: "default", size: "default" })),
    );
  });

  it("secundárias e fantasma usam o `interactive` (fundo suave), nunca a ação cheia", () => {
    for (const variant of ["outline", "secondary", "ghost"] as const) {
      const c = deVariante({ variant });
      expect(c).toContain("hover:bg-interactive");
      expect(c).toContain("active:bg-interactive-strong");
      expect(c).toContain("hover:text-interactive-foreground");
      expect(c.some((k) => /^(hover:)?bg-accent(\/|$)/.test(k))).toBe(false);
    }
    expect(deVariante({ variant: "outline" })).toEqual(
      expect.arrayContaining(["bg-card", "border-border", "hover:border-interactive-border"]),
    );
    expect(deVariante({ variant: "ghost" })).toContain("text-muted-foreground");
  });

  it("destrutiva canônica é a SUAVE; a sólida existe à parte para a confirmação final", () => {
    expect(deVariante({ variant: "destructive" })).toEqual(
      expect.arrayContaining(["bg-destructive/10", "text-destructive", "hover:bg-destructive/20"]),
    );
    expect(deVariante({ variant: "destructive-solid" })).toEqual(
      expect.arrayContaining(["bg-destructive", "text-destructive-foreground"]),
    );
  });

  it.each([
    ["xs", "h-7"],
    ["sm", "h-8"],
    ["default", "h-9"],
    ["lg", "h-10"],
    ["icon-xs", "size-7"],
    ["icon-sm", "size-8"],
    ["icon", "size-9"],
    ["icon-lg", "size-10"],
  ] as const)("tamanho %s mede %s e sobe a 44 no toque", (size, altura) => {
    const c = deVariante({ size });
    expect(c).toContain(altura);
    expect(c).toContain("pointer-coarse:min-h-11");
    if (size.startsWith("icon")) expect(c).toContain("pointer-coarse:min-w-11");
  });

  it("xs tem raio 6 e texto xs; os demais, texto sm", () => {
    expect(deVariante({ size: "xs" })).toEqual(expect.arrayContaining(["rounded-md", "text-xs"]));
    expect(deVariante({ size: "sm" })).toContain("text-sm");
  });

  it("foco 2+2, desabilitado a 0,5, inválido com anel de 4px", () => {
    const c = deVariante({});
    expect(c).toEqual(
      expect.arrayContaining([
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
        "focus-visible:ring-offset-2",
        "disabled:opacity-50",
        "disabled:pointer-events-none",
        "aria-invalid:border-destructive",
        "aria-invalid:ring-4",
        "aria-invalid:ring-destructive/20",
      ]),
    );
  });

  it("a altura que o chamador passa vence a do tamanho", () => {
    render(
      <Button className="h-11" onClick={() => {}}>
        Enviar
      </Button>,
    );
    const c = classes(screen.getByRole("button"));
    expect(c).toContain("h-11");
    expect(c).not.toContain("h-9");
  });
});

describe("Input e Textarea (§10.2)", () => {
  it("campo: 36, raio 8, fundo `card`, borda `input`, hover `interactive-border`, 16→14 em md", () => {
    render(<Input aria-label="Nome" />);
    const c = classes(screen.getByRole("textbox"));
    for (const k of [
      "h-9",
      "rounded-lg",
      "bg-card",
      "border-input",
      "hover:border-interactive-border",
      "focus-visible:border-ring",
      "focus-visible:ring-2",
      "focus-visible:ring-offset-2",
      "aria-invalid:border-destructive",
      "aria-invalid:ring-4",
      "aria-invalid:ring-destructive/20",
      "disabled:opacity-50",
      "text-base",
      "md:text-sm",
      "pointer-coarse:min-h-11",
    ]) {
      expect(c).toContain(k);
    }
  });

  it("área de texto: o mesmo campo, mínimo de 120 e `resize-y`", () => {
    render(<Textarea aria-label="Observação" />);
    const c = classes(screen.getByRole("textbox"));
    expect(c).toEqual(
      expect.arrayContaining([
        "min-h-30",
        "resize-y",
        "rounded-lg",
        "bg-card",
        "border-input",
        "md:text-sm",
      ]),
    );
  });

  it("o `min-h` do chamador vence o de 120 (compositor de uma linha)", () => {
    render(<Textarea aria-label="Mensagem" className="min-h-11" />);
    const c = classes(screen.getByRole("textbox"));
    expect(c).toContain("min-h-11");
    expect(c).not.toContain("min-h-30");
  });
});

describe("Select (§10.3)", () => {
  function Seletor() {
    return (
      <Select defaultValue="a">
        <SelectTrigger aria-label="Período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Hoje</SelectItem>
          <SelectItem value="b">Semana</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  it("gatilho igual ao campo, conteúdo raio 12, item 40 com realce suave e marca à direita", async () => {
    const user = userEvent.setup();
    render(<Seletor />);
    const gatilho = screen.getByRole("combobox", { name: "Período" });
    expect(classes(gatilho)).toEqual(
      expect.arrayContaining([
        "h-9",
        "rounded-lg",
        "bg-card",
        "border-input",
        "hover:border-interactive-border",
        "text-sm",
      ]),
    );

    await user.click(gatilho);
    const item = screen.getByRole("option", { name: "Hoje" });
    const ci = classes(item);
    expect(ci).toEqual(
      expect.arrayContaining([
        "min-h-10",
        "rounded-lg",
        "pr-8",
        "focus:bg-interactive",
        "focus:text-interactive-foreground",
      ]),
    );
    expect(ci.some((k) => /bg-accent(\/|$)/.test(k))).toBe(false);
    expect(item.querySelector("span.absolute.right-2 svg")).not.toBeNull();

    const conteudo = document.querySelector("[data-slot=select-content]")!;
    expect(classes(conteudo)).toEqual(
      expect.arrayContaining(["rounded-xl", "border-border", "bg-popover", "shadow-md"]),
    );
  });

  it("`size=sm` mede 32, e a altura do chamador ainda vence", () => {
    const { rerender } = render(
      <Select>
        <SelectTrigger aria-label="Filtro" size="sm">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
      </Select>,
    );
    expect(classes(screen.getByRole("combobox"))).toContain("h-8");
    rerender(
      <Select>
        <SelectTrigger aria-label="Filtro" className="h-7">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
      </Select>,
    );
    const c = classes(screen.getByRole("combobox"));
    expect(c).toContain("h-7");
    expect(c).not.toContain("h-9");
  });
});

describe("Switch (§10.4)", () => {
  it("trilho 44×24, polegar 20; ligado `primary`, desligado `input`", () => {
    render(<Switch aria-label="Ativo" />);
    const trilho = screen.getByRole("switch", { name: "Ativo" });
    expect(classes(trilho)).toEqual(
      expect.arrayContaining([
        "h-6",
        "w-11",
        "data-[state=checked]:bg-primary",
        "data-[state=unchecked]:bg-input",
        "rounded-full",
      ]),
    );
    const polegar = trilho.querySelector("[data-slot=switch-thumb]")!;
    expect(classes(polegar)).toEqual(
      expect.arrayContaining(["size-5", "data-[state=checked]:translate-x-5"]),
    );
    expect(classes(trilho).some((k) => k.startsWith("shadow"))).toBe(false);
  });

  it("o pequeno mede 36×24 e o polegar corre 12", () => {
    render(<Switch aria-label="Compacto" size="sm" />);
    const trilho = screen.getByRole("switch");
    expect(classes(trilho)).toContain("w-9");
    expect(classes(trilho.querySelector("[data-slot=switch-thumb]")!)).toContain(
      "data-[state=checked]:translate-x-3",
    );
  });
});

describe("Badge (§10.6)", () => {
  it("24 de altura, `xs`/500, raio 6; padrão suave", () => {
    render(<Badge>Novo</Badge>);
    const el = screen.getByText("Novo");
    expect(el.tagName).toBe("SPAN");
    expect(classes(el)).toEqual(
      expect.arrayContaining([
        "min-h-6",
        "text-xs",
        "font-medium",
        "rounded-md",
        "px-2",
        "bg-primary/10",
        "text-primary",
        "border-primary/20",
      ]),
    );
  });

  it.each(["success", "warning", "info"] as const)(
    "%s usa o trio soft/border/foreground",
    (estado) => {
      expect(cn(badgeVariants({ variant: estado }))).toContain(
        `border-${estado}-border bg-${estado}-soft text-${estado}-foreground`,
      );
    },
  );

  it("destrutiva suave com texto `danger-foreground`; os apelidos do CRM apontam para as do Unnify", () => {
    expect(cn(badgeVariants({ variant: "destructive" }))).toContain(
      "bg-destructive/10 text-danger-foreground",
    );
    expect(cn(badgeVariants({ variant: "error" }))).toBe(
      cn(badgeVariants({ variant: "destructive" })),
    );
    expect(cn(badgeVariants({ variant: "neutral" }))).toBe(
      cn(badgeVariants({ variant: "secondary" })),
    );
  });
});

describe("Label (§10.2)", () => {
  it("`sm`/500 com entrelinha 20; desabilitado a 0,5", () => {
    render(<Label>E-mail</Label>);
    expect(classes(screen.getByText("E-mail"))).toEqual(
      expect.arrayContaining(["text-sm", "font-medium", "leading-5", "peer-disabled:opacity-50"]),
    );
  });
});

describe("contrato do Unnify nos arquivos da 3A (reference/enforcement)", () => {
  const ARQUIVOS = [
    "button",
    "input",
    "textarea",
    "select",
    "switch",
    "label",
    "badge",
    "checkbox",
  ].map((n) => path.join(__dirname, `${n}.tsx`));
  const PALETA =
    "slate|gray|zinc|neutral|stone|red|emerald|green|amber|yellow|orange|lime|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
  const REGRAS: Array<[string, RegExp]> = [
    ["tamanho de fonte arbitrário", /text-\[[0-9.]+(px|rem|em)\]/],
    ["peso acima de 600", /\bfont-(bold|extrabold|black)\b/],
    ["caixa-alta ou tracking largo", /\buppercase\b|\btracking-(wide|wider|widest)\b/],
    ["raio 2xl/3xl fora de sobreposição", /\brounded(-[a-z]{1,2})?-(2xl|3xl)\b/],
    ["raio arbitrário", /rounded(-[a-z]{1,2})?-\[(?!inherit\])[^\]]+\]/],
    [
      "cor crua da paleta",
      new RegExp(
        `(^|[\\s"'\`:])(text|bg|border|ring|fill|stroke|outline)-(${PALETA})-[0-9]{2,3}\\b`,
      ),
    ],
    ["hexadecimal solto", /(text|bg|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/],
    ["branco/preto fixo", /(^|[\s"'`:])(bg|text|border)-(white|black)\b/],
  ];

  it.each(REGRAS)("nenhum %s", (_nome, padrao) => {
    const achados: string[] = [];
    for (const arquivo of ARQUIVOS) {
      fs.readFileSync(arquivo, "utf8")
        .split("\n")
        .forEach((linha, i) => {
          if (padrao.test(linha)) achados.push(`${path.basename(arquivo)}:${i + 1}`);
        });
    }
    expect(achados).toEqual([]);
  });
});
