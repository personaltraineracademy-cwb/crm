/**
 * Superfícies do Unnify (etapa 3B): o contrato de API que as outras frentes
 * importam e as classes que carregam a especificação (DS §10.7–10.13, 10.19–10.21).
 *
 * É catraca de classe e de semântica: o jsdom não calcula CSS, então medida de
 * verdade (altura, raio, contraste) fica para os prints. O que se segura aqui é
 * que a classe e o atributo que produzem o desenho não saiam num refactor.
 */
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox, LayoutGrid, List } from "lucide-react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Alert } from "./alert";
import { Avatar, AvatarFallback } from "./avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import { SegmentedControl } from "./segmented-control";
import { Skeleton } from "./skeleton";
import { StatCard } from "./stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

function classes(el: Element | null): string[] {
  return (el?.getAttribute("class") ?? "").split(/\s+/);
}

describe("Card", () => {
  it("é a superfície lisa: raio 12, borda de 1px, fundo card e nenhuma sombra", () => {
    const { container } = render(<Card>conteúdo</Card>);
    const c = classes(container.querySelector("[data-slot=card]"));
    expect(c).toEqual(
      expect.arrayContaining(["rounded-xl", "border", "border-border", "bg-card", "text-sm"]),
    );
    expect(c.filter((x) => /^shadow/.test(x))).toEqual([]);
  });

  it("a raiz não traz padding nem gap: o `p-4 space-y-3` de quem usa como caixa continua sozinho", () => {
    const { container } = render(<Card className="space-y-3 p-4">x</Card>);
    const c = classes(container.querySelector("[data-slot=card]"));
    expect(c).toEqual(expect.arrayContaining(["p-4", "space-y-3"]));
    expect(c.filter((x) => /(^|:)(py|px|gap)-/.test(x))).toEqual([]);
  });

  it("o cabeçalho só vira container quando há ação, e a ação ganha coluna a partir de 420px", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Receita</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
          <CardAction>
            <button type="button">Exportar</button>
          </CardAction>
        </CardHeader>
        <CardContent>corpo</CardContent>
        <CardFooter>rodapé</CardFooter>
      </Card>,
    );
    expect(classes(container.querySelector("[data-slot=card-header]"))).toContain(
      "has-data-[slot=card-action]:@container/card-header",
    );
    expect(classes(container.querySelector("[data-slot=card-action]"))).toEqual(
      expect.arrayContaining([
        "@min-[420px]/card-header:col-start-2",
        "@min-[420px]/card-header:justify-self-end",
      ]),
    );
    expect(classes(container.querySelector("[data-slot=card-title]"))).toEqual(
      expect.arrayContaining(["text-base", "font-semibold"]),
    );
    expect(classes(container.querySelector("[data-slot=card-footer]"))).toEqual(
      expect.arrayContaining(["bg-muted/30", "border-t"]),
    );
  });
});

describe("Table", () => {
  it("cabeçalho muted/40 em xs/500, linha de 48, selecionada no azul suave e células 16 × 12", () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow data-state="selected">
            <TableCell>Ana</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(classes(container.querySelector("[data-slot=table-container]"))).toContain(
      "overflow-auto",
    );
    expect(classes(container.querySelector("table"))).toContain("tabular-nums");
    expect(classes(container.querySelector("thead"))).toContain("bg-muted/40");
    expect(classes(container.querySelector("th"))).toEqual(
      expect.arrayContaining([
        "h-12",
        "px-4",
        "py-3",
        "text-xs",
        "font-medium",
        "text-muted-foreground",
      ]),
    );
    const linha = container.querySelector("tbody tr");
    expect(classes(linha)).toEqual(
      expect.arrayContaining(["h-12", "hover:bg-muted/40", "data-[state=selected]:bg-interactive"]),
    );
    expect(classes(container.querySelector("td"))).toEqual(
      expect.arrayContaining(["px-4", "py-3"]),
    );
  });
});

describe("Tabs", () => {
  it("sem variante continua segmentada (nada muda para quem já usa)", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Membros</TabsTrigger>
          <TabsTrigger value="b">Convites</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const fila = screen.getByRole("tablist");
    expect(fila).toHaveAttribute("data-variant", "segmented");
    expect(classes(fila)).toEqual(
      expect.arrayContaining(["bg-muted", "rounded-lg", "p-0.5", "h-9", "max-lg:h-auto"]),
    );
    const ativa = screen.getByRole("tab", { name: "Membros" });
    expect(classes(ativa)).toEqual(
      expect.arrayContaining([
        "h-8",
        "rounded-md",
        "data-[state=active]:bg-card",
        "data-[state=active]:shadow-xs",
      ]),
    );
  });

  it("`line` é a navegação de página: aba de 40 com sublinhado de 2px primary que cresce em scaleX", async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant="line" aria-label="Seções">
          <TabsTrigger value="a">Visão geral</TabsTrigger>
          <TabsTrigger value="b">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="a">painel A</TabsContent>
        <TabsContent value="b">painel B</TabsContent>
      </Tabs>,
    );
    const fila = screen.getByRole("tablist", { name: "Seções" });
    expect(fila).toHaveAttribute("data-variant", "line");
    expect(classes(fila)).toEqual(expect.arrayContaining(["border-b", "w-full"]));
    expect(classes(fila)).not.toContain("bg-muted");
    const aba = screen.getByRole("tab", { name: "Histórico" });
    expect(classes(aba)).toEqual(
      expect.arrayContaining([
        "h-10",
        "after:h-0.5",
        "after:inset-x-3",
        "after:bg-primary",
        "after:scale-x-0",
        "data-[state=active]:after:scale-x-100",
      ]),
    );
    await userEvent.click(aba);
    expect(aba).toHaveAttribute("data-state", "active");
    expect(screen.getByText("painel B")).toBeInTheDocument();
    expect(classes(screen.getByRole("tabpanel"))).toContain("mt-6");
  });

  it("as duas rolam sem barra e esmaecem só o lado que tem aba escondida", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant="line">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const fila = screen.getByRole("tablist");
    expect(classes(fila)).toEqual(
      expect.arrayContaining([
        "overflow-x-auto",
        "[scrollbar-width:none]",
        "data-esmaece-inicio:[--esmaece-ini:32px]",
      ]),
    );
    // jsdom não tem layout: sem rolagem medida, nenhum lado esmaece.
    expect(fila).not.toHaveAttribute("data-esmaece-inicio");
    expect(fila).not.toHaveAttribute("data-esmaece-fim");
  });

  it("repassa o ref de quem passa um", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Tabs defaultValue="a">
        <TabsList ref={ref}>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(ref.current).toBe(screen.getByRole("tablist"));
  });
});

describe("SegmentedControl", () => {
  function Visao({ onChange }: { onChange?: (v: string) => void }) {
    const [v, setV] = useState<"grade" | "lista">("grade");
    return (
      <SegmentedControl
        aria-label="Visualização"
        value={v}
        onValueChange={(nova) => {
          setV(nova);
          onChange?.(nova);
        }}
        options={[
          { value: "grade", label: "Grade", icon: <LayoutGrid /> },
          { value: "lista", label: "Lista", icon: <List /> },
        ]}
        iconOnlyOnMobile
      />
    );
  }

  it("é um grupo de botões com aria-pressed, e troca a opção ativa", async () => {
    const onChange = vi.fn();
    render(<Visao onChange={onChange} />);
    const grupo = screen.getByRole("group", { name: "Visualização" });
    const grade = within(grupo).getByRole("button", { name: "Grade" });
    const lista = within(grupo).getByRole("button", { name: "Lista" });
    expect(grade).toHaveAttribute("aria-pressed", "true");
    expect(lista).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(lista);
    expect(onChange).toHaveBeenCalledWith("lista");
    expect(lista).toHaveAttribute("aria-pressed", "true");
    expect(classes(lista)).toEqual(
      expect.arrayContaining(["bg-card", "shadow-xs", "h-7", "text-xs"]),
    );

    // clicar na que já está ativa não dispara troca
    await userEvent.click(lista);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("com iconOnlyOnMobile o rótulo some abaixo de sm e vira nome acessível", () => {
    render(<Visao />);
    const grade = screen.getByRole("button", { name: "Grade" });
    expect(grade).toHaveAttribute("aria-label", "Grade");
    expect(classes(within(grade).getByText("Grade"))).toEqual(["hidden", "sm:inline"]);
  });

  it("md tem a peça de 32", () => {
    render(
      <SegmentedControl
        aria-label="Período"
        size="md"
        value="m"
        onValueChange={() => {}}
        options={[
          { value: "m", label: "Mensal" },
          { value: "a", label: "Anual" },
        ]}
      />,
    );
    expect(classes(screen.getByRole("button", { name: "Mensal" }))).toEqual(
      expect.arrayContaining(["h-8", "text-sm"]),
    );
  });
});

describe("PageHeader", () => {
  it("título h1 24/600, descrição, metadados, selo, ações, volta e abas embaixo", () => {
    render(
      <PageHeader
        title="Contatos"
        description="Pessoas e empresas com quem você conversa."
        meta={<span>1.204 contatos</span>}
        badge={<span>Beta</span>}
        actions={<button type="button">Criar contato</button>}
        back={{ href: "/app", label: "Início" }}
      >
        <nav aria-label="Abas da página">abas</nav>
      </PageHeader>,
    );
    const h1 = screen.getByRole("heading", { level: 1, name: "Contatos" });
    expect(classes(h1)).toEqual(
      expect.arrayContaining(["text-2xl", "font-semibold", "tracking-tight"]),
    );
    expect(screen.getByText("Pessoas e empresas com quem você conversa.")).toBeInTheDocument();
    expect(screen.getByText("1.204 contatos")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar contato" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("navigation", { name: "Abas da página" })).toBeInTheDocument();
  });

  it("variant card tem borda, raio 12 e título xl", () => {
    const { container } = render(<PageHeader variant="card" title="Campanha de outubro" />);
    const header = container.querySelector("[data-slot=page-header]");
    expect(header).toHaveAttribute("data-variant", "card");
    expect(classes(header)).toEqual(expect.arrayContaining(["rounded-xl", "border", "bg-card"]));
    expect(classes(screen.getByRole("heading", { level: 1 }))).toContain("text-xl");
  });
});

describe("StatCard", () => {
  it("rótulo com 2 linhas reservadas, valor tabular e chip de variação", () => {
    const { container } = render(
      <StatCard
        label="Receita do mês"
        value="R$ 48.200"
        delta={{ value: "+12%", trend: "up" }}
        context={
          <>
            vs. <strong>R$ 43.000</strong> no mês anterior
          </>
        }
      />,
    );
    const cartao = container.querySelector("[data-slot=stat-card]");
    expect(classes(cartao)).toEqual(
      expect.arrayContaining(["min-h-[148px]", "rounded-xl", "border"]),
    );
    expect(classes(container.querySelector("[data-slot=stat-label]"))).toEqual(
      expect.arrayContaining(["min-h-10", "line-clamp-2", "text-sm", "font-medium"]),
    );
    expect(classes(container.querySelector("[data-slot=stat-value]"))).toEqual(
      expect.arrayContaining([
        "text-[length:clamp(26px,2.2vw,32px)]",
        "font-semibold",
        "tabular-nums",
      ]),
    );
    const chip = container.querySelector("[data-slot=stat-delta]");
    expect(chip).toHaveTextContent("Subiu: +12%");
    expect(classes(chip)).toEqual(expect.arrayContaining(["rounded-full", "text-value-positive"]));
  });

  it("o tom do chip pode inverter (custo que subiu é ruim)", () => {
    const { container } = render(
      <StatCard
        label="CPA"
        value="R$ 31"
        delta={{ value: "+8%", trend: "up", tone: "negative" }}
      />,
    );
    expect(classes(container.querySelector("[data-slot=stat-delta]"))).toContain(
      "text-value-negative",
    );
  });

  it("meta vira barra de progresso de 8px, limitada a 100%, com o status escrito", () => {
    render(
      <StatCard
        label="Vendas"
        value="132"
        goal={{ progress: 140, status: "ok", label: "Meta batida" }}
        sparkline={[1, 2, 3]}
      />,
    );
    const barra = screen.getByRole("progressbar", { name: "Meta de Vendas" });
    expect(barra).toHaveAttribute("aria-valuenow", "100");
    expect(classes(barra)).toEqual(expect.arrayContaining(["h-2", "bg-primary/15"]));
    expect(classes(barra.firstElementChild)).toContain("bg-success");
    expect(screen.getByText("Meta batida")).toBeInTheDocument();
  });

  it("sem meta, a sparkline desenha um SVG de 28px", () => {
    const { container } = render(<StatCard label="Leads" value="58" sparkline={[3, 5, 4, 8]} />);
    const svg = container.querySelector("[data-slot=sparkline]");
    expect(svg).not.toBeNull();
    expect(classes(svg)).toContain("h-7");
  });

  it("carregando mantém a superfície e marca aria-busy", () => {
    const { container } = render(<StatCard label="Leads" value="58" loading />);
    const cartao = container.querySelector("[data-slot=stat-card]");
    expect(cartao).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll("[data-esqueleto]").length).toBeGreaterThan(0);
    expect(screen.queryByText("58")).toBeNull();
  });
});

describe("Alert", () => {
  it("erro anuncia na hora, tem título, descrição e UMA ação", () => {
    render(
      <Alert
        variant="destructive"
        title="Não deu para carregar os contatos"
        action={<button type="button">Tentar de novo</button>}
      >
        A conexão caiu no meio da busca.
      </Alert>,
    );
    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveAttribute("data-variant", "destructive");
    expect(classes(aviso)).toEqual(
      expect.arrayContaining(["rounded-lg", "border", "border-danger-border"]),
    );
    expect(within(aviso).getByText("Não deu para carregar os contatos")).toBeInTheDocument();
    expect(within(aviso).getByText("A conexão caiu no meio da busca.")).toBeInTheDocument();
    expect(within(aviso).getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(aviso.querySelector("[data-slot=alert-icon] svg")).not.toBeNull();
  });

  it("info é status, usa o trio de estado, e icon={null} tira o ícone", () => {
    render(
      <Alert variant="info" icon={null}>
        Os dados de hoje ainda estão chegando.
      </Alert>,
    );
    const aviso = screen.getByRole("status");
    expect(classes(aviso)).toEqual(
      expect.arrayContaining(["border-info-border", "bg-info-soft", "text-info-foreground"]),
    );
    expect(aviso.querySelector("[data-slot=alert-icon]")).toBeNull();
  });
});

describe("EmptyState", () => {
  it("ícone de 32, frase curta e uma ação", () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="Nenhuma conversa ainda"
        description="Conecte um canal para começar a receber mensagens."
        action={<button type="button">Conectar canal</button>}
      />,
    );
    expect(container.querySelector("[data-slot=empty-state-icon] svg")).not.toBeNull();
    expect(classes(container.querySelector("[data-slot=empty-state-icon] svg"))).toContain(
      "size-8",
    );
    expect(screen.getByText("Nenhuma conversa ainda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conectar canal" })).toBeInTheDocument();
  });

  it("aceita um elemento pronto como ícone", () => {
    render(<EmptyState icon={<Inbox data-testid="icone" />} title="Vazio" />);
    expect(screen.getByTestId("icone")).toBeInTheDocument();
  });
});

describe("Skeleton e Avatar", () => {
  it("o esqueleto mantém a âncora de teste e lê as cores do Unnify", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const el = container.querySelector("[data-esqueleto]") as HTMLElement;
    expect(classes(el)).toEqual(
      expect.arrayContaining(["ds-esqueleto", "rounded-lg", "h-4", "w-20"]),
    );
    expect(el.style.getPropertyValue("--ds-esqueleto-corpo")).toBe("var(--skeleton-base)");
    expect(el.style.getPropertyValue("--ds-esqueleto-brilho")).toBe("var(--skeleton-highlight)");
  });

  it("avatar em 24/32/40, e a medida de quem passa h-* w-* vence", () => {
    const { container } = render(
      <>
        <Avatar size="sm">
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>BR</AvatarFallback>
        </Avatar>
        <Avatar className="h-12 w-12">
          <AvatarFallback>CD</AvatarFallback>
        </Avatar>
      </>,
    );
    const [p, m, g] = Array.from(container.querySelectorAll("[data-slot=avatar]"));
    expect(classes(p ?? null)).toEqual(expect.arrayContaining(["h-6", "w-6"]));
    expect(classes(m ?? null)).toEqual(
      expect.arrayContaining(["h-8", "w-8", "after:border-border"]),
    );
    const cg = classes(g ?? null);
    expect(cg).toEqual(expect.arrayContaining(["h-12", "w-12"]));
    expect(cg).not.toContain("h-8");
    expect(classes(screen.getByText("BR"))).toEqual(
      expect.arrayContaining(["bg-muted", "text-sm"]),
    );
  });
});
