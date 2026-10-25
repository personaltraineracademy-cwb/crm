/**
 * CAMADAS DO UNNIFY (etapa 5): diálogo, diálogo de alerta, painel lateral,
 * popover, menu, dica e avisos seguem o DS (§6.3, §7, §10.14 a §10.19).
 *
 * É catraca de CLASSE, não prova de geometria: o jsdom não computa CSS. Ela
 * segura o contrato no primitivo, que alcança todas as telas de uma vez — e
 * segura, em especial, as duas pendências da etapa 3 que esta frente fecha:
 * a sobreposição `bg-black/80` (agora o token `overlay`) e o realce de menu
 * com a ação CHEIA (`bg-accent`, que no CRM é o azul do botão primário).
 */
import fs from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

afterEach(cleanup);

function classes(el: Element | null): string[] {
  return (el?.getAttribute("class") ?? "").split(/\s+/);
}

/** A sobreposição do Radix é irmã do conteúdo, dentro do portal. */
function sobreposicao(): Element {
  const el = document.querySelector(".camada-cortina");
  expect(el, "a sobreposição sumiu").toBeTruthy();
  return el!;
}

describe("diálogo (DS §10.14)", () => {
  it("raio 16, padding/gap 24, 448 com tela − 32, popover, sombra do Work, teto com rolagem", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar</DialogTitle>
            <DialogDescription>Texto</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const c = classes(screen.getByRole("dialog"));
    expect(c).toEqual(
      expect.arrayContaining([
        "camada-dialogo",
        "rounded-2xl",
        "p-6",
        "gap-6",
        "max-w-md",
        "w-[calc(100%-2rem)]",
        "bg-popover",
        "border",
        "shadow-xl",
        "max-h-[calc(100dvh-2rem)]",
        "overflow-y-auto",
      ]),
    );
    expect(classes(sobreposicao())).toEqual(
      expect.arrayContaining(["bg-overlay", "backdrop-blur-[2px]"]),
    );
  });

  it("cabeçalho com 40px livres; rodapé muted/30 sangrado, invertido no celular", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="cabecalho">
            <DialogTitle>Editar</DialogTitle>
          </DialogHeader>
          <DialogFooter data-testid="rodape">
            <button type="button">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(classes(screen.getByTestId("cabecalho"))).toContain("pr-10");
    expect(classes(screen.getByTestId("rodape"))).toEqual(
      expect.arrayContaining([
        "-mx-6",
        "-mb-6",
        "bg-muted/30",
        "border-t",
        "flex-col-reverse",
        "sm:flex-row",
        "sm:justify-end",
        "gap-3",
      ]),
    );
  });

  it("fechar é ghost icon-sm a 12px do canto, com realce suave e nome acessível", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Editar</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const fechar = screen.getByRole("button", { name: "Fechar" });
    expect(classes(fechar)).toEqual(
      expect.arrayContaining(["absolute", "top-3", "right-3", "size-8", "hover:bg-interactive"]),
    );
    expect(fechar.className).not.toMatch(/(^|\s)(data-\[state=open\]:)?bg-accent(\s|$)/);
  });

  it("showCloseButton={false} tira o X", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Sem X</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole("button", { name: "Fechar" })).toBeNull();
  });

  it("prende o foco e o devolve ao gatilho no Esc", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogTitle>Editar</DialogTitle>
          <input aria-label="Nome" />
        </DialogContent>
      </Dialog>,
    );
    const gatilho = screen.getByRole("button", { name: "Abrir" });
    await user.click(gatilho);
    const dialogo = await screen.findByRole("dialog");
    expect(dialogo.contains(document.activeElement)).toBe(true);
    // Tab circula DENTRO do diálogo
    await user.tab();
    await user.tab();
    expect(dialogo.contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(gatilho);
  });
});

describe("diálogo de alerta (DS §10.14, Work)", () => {
  it("ícone em bloco de 40, título base/500, rodapé muted/50 sangrado e as duas ações", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia data-testid="midia">!</AlertDialogMedia>
            <AlertDialogTitle>Excluir?</AlertDialogTitle>
            <AlertDialogDescription>Não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-testid="rodape">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive-solid">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(classes(screen.getByRole("alertdialog"))).toEqual(
      expect.arrayContaining(["rounded-2xl", "bg-popover", "shadow-xl", "max-w-sm"]),
    );
    expect(classes(screen.getByTestId("midia"))).toEqual(
      expect.arrayContaining(["size-10", "rounded-md", "bg-muted"]),
    );
    expect(classes(screen.getByText("Excluir?"))).toEqual(
      expect.arrayContaining(["text-base", "font-medium"]),
    );
    expect(classes(screen.getByTestId("rodape"))).toEqual(
      expect.arrayContaining(["-mx-4", "-mb-4", "bg-muted/50", "border-t"]),
    );
    expect(classes(screen.getByRole("button", { name: "Cancelar" }))).toContain("border");
    // A destrutiva é a variante do botão, não uma cor escrita à mão.
    expect(classes(screen.getByRole("button", { name: "Excluir" }))).toContain("bg-destructive");
    expect(classes(sobreposicao())).toContain("bg-overlay");
  });

  it("tamanho sm estreita para 320", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent size="sm">
          <AlertDialogTitle>Sair?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const c = classes(screen.getByRole("alertdialog"));
    expect(c).toContain("max-w-xs");
    expect(c).not.toContain("max-w-sm");
  });
});

describe("painel lateral (DS §10.15, Work)", () => {
  it("75% até 384, popover, desliza pelo lado, título lg/600 com entrelinha 32 e 64px para o X", () => {
    render(
      <Sheet open>
        <SheetContent side="left">
          <SheetHeader data-testid="cabecalho">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <SheetFooter data-testid="rodape">
            <button type="button">Aplicar</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    const painel = screen.getByRole("dialog");
    expect(painel.getAttribute("data-lado")).toBe("left");
    expect(classes(painel)).toEqual(
      expect.arrayContaining(["camada-gaveta", "w-3/4", "sm:max-w-sm", "bg-popover", "shadow-xl"]),
    );
    expect(classes(screen.getByText("Filtros"))).toEqual(
      expect.arrayContaining(["text-lg", "leading-8", "font-semibold"]),
    );
    // 24 do padding + 40 = 64 livres à direita
    expect(classes(screen.getByTestId("cabecalho"))).toContain("pr-10");
    expect(classes(screen.getByTestId("rodape"))).toEqual(
      expect.arrayContaining(["mt-auto", "bg-muted/30", "border-t", "-mx-6", "-mb-6"]),
    );
    expect(classes(sobreposicao())).toEqual(
      expect.arrayContaining(["bg-overlay", "backdrop-blur-xs"]),
    );
  });
});

describe("popover (DS §10.16)", () => {
  it("raio 12, padding 12, largura 288, no máximo a tela − 32", () => {
    render(
      <Popover open>
        <PopoverTrigger>abrir</PopoverTrigger>
        <PopoverContent data-testid="pop">conteúdo</PopoverContent>
      </Popover>,
    );
    expect(classes(screen.getByTestId("pop"))).toEqual(
      expect.arrayContaining([
        "camada-painel",
        "rounded-xl",
        "p-3",
        "w-72",
        "max-w-[calc(100vw-2rem)]",
        "bg-popover",
        "border",
        "shadow-md",
      ]),
    );
  });
});

describe("menu (DS §10.18)", () => {
  function abrirMenu() {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>abrir</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Conta</DropdownMenuLabel>
          <DropdownMenuItem>
            Perfil <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
  }

  it("raio 12, padding 4, mínimo 128", () => {
    abrirMenu();
    expect(classes(screen.getByRole("menu"))).toEqual(
      expect.arrayContaining(["rounded-xl", "p-1", "min-w-32", "bg-popover", "shadow-md"]),
    );
  });

  it("item de 36 com raio 8 e realce SUAVE, nunca a ação cheia", () => {
    abrirMenu();
    const item = screen.getByRole("menuitem", { name: /Perfil/ });
    const c = classes(item);
    expect(c).toEqual(
      expect.arrayContaining([
        "min-h-9",
        "rounded-lg",
        "data-[highlighted]:bg-interactive",
        "data-[highlighted]:text-interactive-foreground",
      ]),
    );
    expect(c.filter((x) => /(^|:)bg-accent(\/\d+)?$/.test(x))).toEqual([]);
  });

  it("destrutivo: danger-foreground sobre destructive/10", () => {
    abrirMenu();
    const item = screen.getByRole("menuitem", { name: "Excluir" });
    expect(item.getAttribute("data-variant")).toBe("destructive");
    expect(classes(item)).toEqual(
      expect.arrayContaining([
        "data-[variant=destructive]:text-danger-foreground",
        "data-[variant=destructive]:data-[highlighted]:bg-destructive/10",
      ]),
    );
  });

  it("rótulo xs/600 muted e atalho xs muted", () => {
    abrirMenu();
    expect(classes(screen.getByText("Conta"))).toEqual(
      expect.arrayContaining(["text-xs", "font-semibold", "text-muted-foreground"]),
    );
    expect(classes(screen.getByText("⌘P"))).toEqual(
      expect.arrayContaining(["text-xs", "text-muted-foreground"]),
    );
  });
});

describe("dica (DS §10.17)", () => {
  it("inversa ao tema, raio 6, 12 × 6, xs/500, máximo 256, acima de tudo (z 70)", () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>gatilho</TooltipTrigger>
          <TooltipContent data-testid="dica">dica</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(classes(screen.getByTestId("dica"))).toEqual(
      expect.arrayContaining([
        "camada-dica",
        "bg-foreground",
        "text-background",
        "rounded-md",
        "px-3",
        "py-1.5",
        "text-xs",
        "font-medium",
        "max-w-64",
        "z-70",
      ]),
    );
  });
});

describe("fonte dos primitivos e do movimento", () => {
  const RAIZ = process.cwd();
  const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");
  const PRIMITIVOS = [
    "components/ui/dialog.tsx",
    "components/ui/alert-dialog.tsx",
    "components/ui/sheet.tsx",
    "components/ui/popover.tsx",
    "components/ui/dropdown-menu.tsx",
    "components/ui/tooltip.tsx",
    "components/ui/sonner.tsx",
    "components/shell/CommandPalette.tsx",
  ];

  it("nenhuma camada usa sobreposição preta cravada nem realce com a ação cheia", () => {
    for (const arquivo of PRIMITIVOS) {
      const fonte = ler(arquivo);
      expect(fonte, arquivo).not.toMatch(/bg-black\//);
      expect(fonte, arquivo).not.toMatch(
        /(hover|focus|focus-visible|data-\[[^\]]+\]):bg-accent(\/\d+)?(?![\w-])/,
      );
    }
  });

  it("os avisos pintam o richColors com os tokens de estado", () => {
    const fonte = ler("components/ui/sonner.tsx");
    for (const estado of ["success", "info", "warning", "error"]) {
      expect(fonte).toContain(`"--${estado}-bg": "var(--color-${estado}-bg)"`);
      expect(fonte).toContain(`"--${estado}-text": "var(--color-${estado}-fg)"`);
    }
    expect(fonte).toMatch(/position="bottom-right"/);
    expect(fonte).toMatch(/richColors/);
    // O layout monta o Toaster do produto, não o do pacote cru.
    expect(ler("app/layout.tsx")).toMatch(/import \{ Toaster \} from "@\/components\/ui\/sonner"/);
  });

  it("o movimento segue o DS §7 e respeita movimento reduzido", () => {
    const css = ler("app/unnify/camadas.css");
    expect(ler("app/unnify/app.css")).toContain('@import "./camadas.css";');
    // Diálogo: zoom 0,985 em 120ms com a curva emphasized
    expect(css).toMatch(/scale:\s*0\.985/);
    expect(css).toMatch(
      /\.camada-dialogo\[data-state="open"\]\s*\{\s*animation:[^;]*var\(--duration-fast\)\s+var\(--ease-out-slow\)/,
    );
    // Painel lateral: 2,5rem em 180ms
    expect(css).toMatch(/--camada-gaveta-de:\s*2\.5rem 0/);
    expect(css).toMatch(
      /\.camada-gaveta\[data-state="open"\]\s*\{\s*animation:[^;]*var\(--duration-base\)/,
    );
    // Dica: 100ms
    expect(css).toMatch(/camada-dica-entra 100ms/);
    // Movimento reduzido: todas as camadas sem animação
    const reduzido = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const c of ["cortina", "dialogo", "gaveta", "painel", "dica"]) {
      expect(reduzido).toContain(`.camada-${c}`);
    }
    expect(reduzido).toMatch(/animation:\s*none\s*!important/);
  });
});
