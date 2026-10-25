// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O ícone do Unnify CRM na aba, no iPhone e no app instalado — e só quando
 * ninguém configurou logo nem subiu ícone.
 *
 * A régua é o ARQUIVO do pacote de marca: onde há PNG pronto (64, 192, 512), a
 * rota devolve os mesmos bytes; onde o desenho tem de ocupar o lado inteiro
 * (180 do iPhone e `maskable`), o PNG gerado não pode ter canto transparente,
 * porque o iPhone o pinta de preto.
 */

vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_SUPABASE_URL: "https://storage.example" } }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
const marcaDaSaida = vi.fn();
vi.mock("@/lib/branding/saida", () => ({
  NEUTROS_DE_SAIDA: { fundo: "#ffffff" },
  marcaDaSaida: (...args: unknown[]) => marcaDaSaida(...args),
}));

import Icon from "@/app/icon";
import { lerAtivoDaMarca } from "@/lib/branding/ativos-da-marca";
import { ICONE_DO_APP } from "@/lib/branding/desenho";
import { gerarIconeDoApp } from "@/lib/branding/icone-do-app";
import { lerPng } from "../helpers/png-sintetico";

const RAIZ = process.cwd();
const arquivo = (publico: string) => fs.readFileSync(path.join(RAIZ, "public", publico));

const SEM_LOGO = {
  // O nome da instalação NÃO decide: com nome próprio e sem logo, vale o do produto.
  nome: "Central do Cliente",
  logoUrl: null,
  accent: "#0000ff",
  accentFg: "#ffffff",
  origens: { nome: "instalacao", cor: "instalacao" },
} as const;
const COM_LOGO = { ...SEM_LOGO, logoUrl: "https://cdn.exemplo.test/logo.png" } as const;

beforeEach(() => {
  marcaDaSaida.mockReset();
});

describe("os arquivos do pacote de marca estão onde o código os procura", () => {
  it("cada PNG declarado existe e tem o lado do nome", () => {
    for (const [lado, publico] of Object.entries(ICONE_DO_APP.png)) {
      const png = lerPng(arquivo(publico));
      expect([png.largura, png.altura]).toEqual([Number(lado), Number(lado)]);
    }
    expect(arquivo(ICONE_DO_APP.svg).toString("utf8")).toMatch(/^<svg /);
  });

  it("a leitura do disco não sai de public/marca", async () => {
    await expect(lerAtivoDaMarca("/marca/../../package.json")).rejects.toThrow(
      /fora de public\/marca/,
    );
    await expect(lerAtivoDaMarca("/rastreio/v1.js")).rejects.toThrow(/fora de public\/marca/);
  });
});

describe("a aba (/icon)", () => {
  it("sem logo configurado, é o PNG de 64 do Unnify CRM, byte a byte", async () => {
    marcaDaSaida.mockResolvedValue(SEM_LOGO);
    const resposta = await Icon();
    expect(resposta.headers.get("content-type")).toBe("image/png");
    expect(resposta.headers.get("cache-control")).toMatch(/max-age=60/);
    expect(Buffer.from(await resposta.arrayBuffer())).toEqual(arquivo(ICONE_DO_APP.png[64]));
  });

  it("com logo configurado, segue a cor + inicial de quem tem marca própria", async () => {
    marcaDaSaida.mockResolvedValue(COM_LOGO);
    const corpo = Buffer.from(await (await Icon()).arrayBuffer());
    expect(corpo).not.toEqual(arquivo(ICONE_DO_APP.png[64]));
    const { rgba, largura } = lerPng(corpo);
    // O canto é o accent da marca: nada do ícone do produto vazou.
    expect([...rgba.subarray(0, 3)]).toEqual([0, 0, 255]);
    expect(largura).toBe(64);
  });
});

describe("o app instalado (/app-icon)", () => {
  it.each([192, 512] as const)(
    "%i sem logo nem ícone subido é o PNG pronto do pacote",
    async (lado) => {
      const corpo = Buffer.from(await gerarIconeDoApp(lado, SEM_LOGO, null));
      expect(corpo).toEqual(arquivo(ICONE_DO_APP.png[lado]));
    },
  );

  it.each([
    [180, 0.8],
    [512, 0.56],
  ] as const)(
    "%i (conteúdo %f) ocupa o lado inteiro: canto opaco e navy, nó branco no centro",
    async (lado, conteudo) => {
      const corpo = Buffer.from(await gerarIconeDoApp(lado, SEM_LOGO, null, conteudo));
      const { rgba, largura, altura } = lerPng(corpo);
      expect([largura, altura]).toEqual([lado, lado]);
      const pixel = (x: number, y: number) => [
        ...rgba.subarray(4 * (y * lado + x), 4 * (y * lado + x) + 4),
      ];
      for (const [x, y] of [
        [0, 0],
        [lado - 1, 0],
        [0, lado - 1],
        [lado - 1, lado - 1],
      ] as const) {
        const [r, , b, a] = pixel(x, y);
        expect(a, `canto ${x},${y} transparente`).toBe(255);
        // Gradiente navy (#0F4BC9 → #071A32): azul domina, nada de branco nem preto.
        expect(b!).toBeGreaterThan(r!);
        expect(b!).toBeGreaterThan(40);
      }
      // O nó branco passa pelo terço de cima, na vertical do centro.
      const coluna = Array.from({ length: Math.round(lado * 0.3) }, (_, i) =>
        pixel(Math.floor(lado / 2), Math.round(lado * 0.2) + i),
      );
      expect(coluna.some(([r, g, b]) => r! > 240 && g! > 240 && b! > 240)).toBe(true);
    },
  );

  it("ícone subido em /admin/marca vence o do produto", async () => {
    // PNG vermelho 1×1.
    const vermelho =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC";
    const corpo = Buffer.from(await gerarIconeDoApp(192, SEM_LOGO, vermelho));
    const { rgba } = lerPng(corpo);
    const i = 4 * (96 * 192 + 96);
    expect([...rgba.subarray(i, i + 3)]).toEqual([255, 0, 0]);
  });

  it("com logo configurado e sem ícone subido, segue a inicial na cor da marca", async () => {
    const corpo = Buffer.from(await gerarIconeDoApp(192, COM_LOGO, null));
    expect(corpo).not.toEqual(arquivo(ICONE_DO_APP.png[192]));
    const { rgba } = lerPng(corpo);
    expect([...rgba.subarray(0, 3)]).toEqual([0, 0, 255]);
  });
});
