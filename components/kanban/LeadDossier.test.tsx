// components/kanban/LeadDossier.test.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LeadDossier } from "./LeadDossier";
import type { Lead } from "@/lib/types/leads";
import type { Stage } from "@/lib/kanban/types";

/**
 * A CASCA DO PAINEL DO NEGÓCIO, em abas (desenho de referência, 24/11/2026).
 *
 * Este arquivo cobria a decisão #3181: seções empilhadas na ordem Contato →
 * Dados do negócio → Linha do tempo, recolhíveis e lembradas por navegador. O
 * painel passou a ser em ABAS (Atividades, Mensagens, Contato, Empresa,
 * Negócio, Notas, Histórico), e aquela decisão saiu junto: com abas, cada
 * assunto tem a tela inteira e não há o que recolher.
 *
 * O que continua valendo da #3181, e é medido aqui:
 *   - os campos do negócio continuam a um clique ("Editar campos" leva à aba
 *     Negócio e monta o formulário);
 *   - a linha do tempo inteira continua alcançável (aba Histórico, sem recorte);
 *   - salvar os campos tem botão próprio no rodapé, só onde o formulário está.
 *
 * As peças de dentro das abas são substituídas por marcadores: o objeto deste
 * arquivo é a CASCA — abas, ordem, para onde cada atalho leva. Cada peça tem
 * teste próprio (a regra das atividades em `lib/tarefas/atividades-do-negocio`).
 */

const linhaDoTempo = vi.hoisted(() => ({ itens: [] as Array<{ id: string; type: string }> }));
const atividades = vi.hoisted(() => ({ props: [] as Array<{ novaPedida?: boolean }> }));
const permissao = vi.hoisted(() => ({ moverCard: false }));

vi.mock("@/hooks/i18n/useT", () => ({ useT: () => (chave: string) => chave }));
vi.mock("@/hooks/i18n/useLocaleDeData", () => ({ useTagDeIdioma: () => "pt-BR" }));
vi.mock("@/hooks/auth/AuthProvider", () => ({
  useUser: () => ({ id: "u1", is_platform_admin: false, support: false }),
  useActiveOrg: () => ({ role: "agent" }),
  usePermission: () => permissao.moverCard,
}));
vi.mock("@/hooks/leads/useLeadTimeline", () => ({
  useLeadTimeline: () => ({
    itens: linhaDoTempo.itens,
    chegouAoVivo: new Set<string>(),
    isLoading: false,
    isError: false,
    realtimeStatus: "connected",
    seguranca: { divergencias: 0 },
  }),
}));

vi.mock("./ContatoDoNegocio", () => ({ ContatoDoNegocio: () => <div data-peca="contato" /> }));
vi.mock("./LeadFieldsForm", () => ({ LeadFieldsForm: () => <div data-peca="campos" /> }));
vi.mock("./CabecalhoEditavel", () => ({
  TituloEditavel: ({ lead }: { lead: { title: string } }) => <>{lead.title}</>,
  ValorEditavel: () => <span data-peca="valor" />,
}));
vi.mock("./PropostasDoNegocio", () => ({ PropostasDoNegocio: () => null }));
vi.mock("./ScoreSlot", () => ({ ScoreSlot: () => null }));
vi.mock("./OwnerBadge", () => ({ OwnerBadge: () => null }));
vi.mock("./dossie/AtividadesDoNegocio", () => ({
  AtividadesDoNegocio: (props: { novaPedida?: boolean }) => {
    atividades.props.push(props);
    return <div data-peca="atividades" data-nova-pedida={props.novaPedida ? "sim" : "nao"} />;
  },
}));
vi.mock("./dossie/MensagensDoNegocio", () => ({
  MensagensDoNegocio: () => <div data-peca="mensagens" />,
}));
vi.mock("./dossie/EmpresaDoNegocio", () => ({
  EmpresaDoNegocio: () => <div data-peca="empresa" />,
}));
vi.mock("./dossie/NotasDoNegocio", () => ({ NotasDoNegocio: () => <div data-peca="notas" /> }));
vi.mock("./LeadTimeline", () => ({
  LeadTimeline: ({ itens }: { itens: Array<{ id: string; type: string }> }) => (
    <ul data-peca="linha-do-tempo">
      {itens.map((i) => (
        <li key={i.id} data-entrada={i.id} />
      ))}
    </ul>
  ),
}));

const LEAD = {
  id: "lead-1",
  title: "Viagem Rio",
  contact_id: "contato-1",
  contact_phone: "+5521999999999",
  value_cents: 250000,
  currency: "BRL",
  score: null,
  conversa: null,
  owner_kind: null,
  owner_user_id: null,
  owner_agent_id: null,
  owner_agent: null,
  stage_id: "e1",
  created_at: "2026-11-01T12:00:00Z",
  stage_changed_at: "2026-11-01T12:00:00Z",
} as unknown as Lead;

const ETAPAS = [
  { id: "e1", name: "Novo" },
  { id: "e2", name: "Proposta" },
  { id: "e3", name: "Ganho" },
] as unknown as Stage[];

function montar(extra: Partial<Parameters<typeof LeadDossier>[0]> = {}) {
  return render(
    <LeadDossier
      open
      onOpenChange={() => undefined}
      lead={LEAD}
      pipelineId="funil-1"
      fieldDefs={[]}
      stageName="Novo"
      {...extra}
    />,
  );
}

const ABAS = ["Atividades", "Mensagens", "Contato", "Empresa", "Negócio", "Notas", "Histórico"];

beforeEach(() => {
  linhaDoTempo.itens = [];
  atividades.props = [];
  permissao.moverCard = false;
});

describe("as abas do painel do negócio", () => {
  it("⭐ as sete abas, na ordem do desenho, e Atividades aberta ao chegar", () => {
    montar();
    const lista = screen.getByRole("tablist", { name: "Seções do negócio" });
    expect(within(lista).getAllByRole("tab").map((a) => a.textContent)).toEqual(ABAS);
    expect(screen.getByRole("tab", { name: "Atividades" })).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector('[data-peca="atividades"]')).not.toBeNull();
  });

  it("cada aba mostra a sua peça", async () => {
    const user = userEvent.setup();
    montar();
    const pecas: Record<string, string> = {
      Mensagens: "mensagens",
      Contato: "contato",
      Empresa: "empresa",
      Negócio: "campos",
      Notas: "notas",
      Histórico: "linha-do-tempo",
    };
    for (const [aba, peca] of Object.entries(pecas)) {
      await user.click(screen.getByRole("tab", { name: aba }));
      expect(document.querySelector(`[data-peca="${peca}"]`), `a aba ${aba} não mostra ${peca}`).not.toBeNull();
    }
  });

  it("o Histórico mostra a linha do tempo INTEIRA, sem recorte", async () => {
    linhaDoTempo.itens = ["a6", "a5", "a4", "a3", "a2", "a1"].map((id) => ({ id, type: "stage_changed" }));
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole("tab", { name: "Histórico" }));
    expect([...document.querySelectorAll("[data-entrada]")].map((n) => n.getAttribute("data-entrada"))).toEqual([
      "a6",
      "a5",
      "a4",
      "a3",
      "a2",
      "a1",
    ]);
  });
});

describe("os campos do negócio continuam a um clique", () => {
  it("'Editar campos' leva à aba Negócio e monta o formulário", async () => {
    const user = userEvent.setup();
    montar();
    expect(document.querySelector('[data-peca="campos"]')).toBeNull();
    await user.click(screen.getByRole("button", { name: "Editar campos" }));
    expect(screen.getByRole("tab", { name: "Negócio" })).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector('[data-peca="campos"]')).not.toBeNull();
  });

  it("o Salvar do rodapé só existe na aba Negócio, onde o formulário está", async () => {
    const user = userEvent.setup();
    montar();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Negócio" }));
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveAttribute("form", "dossie-dados-do-negocio");
    await user.click(screen.getByRole("tab", { name: "Notas" }));
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });
});

describe("o '+ Criar tarefa' do card", () => {
  it("⭐ abre em Atividades com o pedido de atividade nova, mesmo vindo de outra aba", async () => {
    const user = userEvent.setup();
    const { rerender } = montar();
    await user.click(screen.getByRole("tab", { name: "Notas" }));
    rerender(
      <LeadDossier
        open
        onOpenChange={() => undefined}
        lead={LEAD}
        pipelineId="funil-1"
        fieldDefs={[]}
        stageName="Novo"
        novaTarefaPedida
      />,
    );
    expect(screen.getByRole("tab", { name: "Atividades" })).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector('[data-peca="atividades"]')).toHaveAttribute("data-nova-pedida", "sim");
  });

  it("sem pedido, a aba Atividades não abre formulário nenhum", () => {
    montar();
    expect(document.querySelector('[data-peca="atividades"]')).toHaveAttribute("data-nova-pedida", "nao");
  });
});

describe("a faixa de etapas", () => {
  it("mostra o caminho FUNIL / ETAPA e a etapa atual com os dias nela", () => {
    montar({ etapas: ETAPAS, nomeDoFunil: "Vendas" });
    expect(document.querySelector("[data-caminho-do-negocio]")?.textContent).toBe("Vendas / Novo");
    const faixa = screen.getByRole("list", { name: "Etapas do funil" });
    const atual = within(faixa).getAllByRole("listitem").find((li) => li.getAttribute("aria-current") === "step");
    expect(atual?.textContent).toContain("Novo");
    expect(atual?.textContent).toMatch(/\d+ dias|1 dia/);
  });

  it("sem permissão de mover, a faixa é só leitura — nenhum botão que recusaria no clique", () => {
    montar({ etapas: ETAPAS, onMudarEtapa: () => undefined });
    expect(screen.queryByRole("button", { name: /Mover para/ })).toBeNull();
  });

  it("com permissão, clicar numa etapa pede o movimento com o id dela", async () => {
    permissao.moverCard = true;
    const onMudarEtapa = vi.fn();
    const user = userEvent.setup();
    montar({ etapas: ETAPAS, onMudarEtapa });
    await user.click(screen.getByRole("button", { name: "Mover para Proposta" }));
    expect(onMudarEtapa).toHaveBeenCalledWith("e2");
    // A etapa atual não é botão: mover para onde já está não faz nada.
    expect(screen.queryByRole("button", { name: "Mover para Novo" })).toBeNull();
  });
});
