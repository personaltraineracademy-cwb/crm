"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { z } from "zod";

import { useActiveOrg, useUser } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { useDashboard } from "@/hooks/metrics/useDashboard";
import { useAttendantMetrics } from "@/hooks/metrics/useAttendantMetrics";
import { useActivityReport } from "@/hooks/reports/useActivityReport";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import {
  duracaoLegivel,
  etapasDoFunil,
  funilInicial,
  porcentagem,
  variacaoPercentual,
  type DashboardDeLeads,
} from "@/lib/metrics/dashboard";
import { formatarDuracao } from "@/lib/metrics/canais";
import type { FalaDoChat } from "@/lib/metrics/assistente-do-painel";
import {
  CATALOGO_DO_PAINEL,
  MAXIMO_DE_CARTOES,
  PERIODOS_DO_PAINEL,
  cartaoSchema,
  planoSchema,
  type CartaoDoPainel,
  type IndicadorDoCatalogo,
  type PeriodoDoPainel,
  type PlanoDoPainel,
} from "@/lib/metrics/painel-por-conversa";
import { formatValorDoNegocio, MOEDA_PADRAO } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowUp, ChartBar, ChartLineUp, ListChecks, Plus, Trash } from "@/lib/ui/icons";

import {
  AreaPorDia,
  BarrasDeRanking,
  CartaoDeGrafico,
  CartaoDeNumero,
  Rosca,
  numeroCompacto,
} from "./graficos-do-painel";
import { rotuloDaOrigem } from "./rotulo-da-origem";

/**
 * O DASHBOARD POR CONVERSA (pedido da dona, 25/11/2026): um chat no lugar do
 * painel fixo. A pessoa escreve o que quer analisar e a IA monta os cartões.
 *
 * O desenho e a regra de segurança estão em `lib/metrics/painel-por-conversa.ts`:
 * a IA só escolhe indicadores de um catálogo fechado; cada cartão busca o
 * número com as rotas de sempre e a sessão de quem olha. O painel padrão
 * continua a um clique, na aba ao lado.
 *
 * A conversa e o painel montado ficam guardados NESTE navegador, por organização e pessoa
 * (`localStorage`): reabrir o Dashboard mostra o mesmo painel, sem tabela nova.
 */

/** Uma fala do chat; a resposta da IA pode trazer cartões dentro dela. */
type Fala = FalaDoChat & { cartoes?: CartaoDoPainel[] };
interface EstadoSalvo {
  plano: PlanoDoPainel | null;
  falas: Fala[];
}

const VAZIO: EstadoSalvo = { plano: null, falas: [] };
const EVENTO = "painel-por-conversa";
/** Quantas falas vão de contexto para o modelo (as mais recentes). */
const FALAS_NO_CONTEXTO = 8;
/** Quantas falas ficam guardadas no navegador. */
const FALAS_GUARDADAS = 40;

/** Literal por literal dentro de `t`, para o guardião de idioma enxergar cada uma. */
function sugestoes(t: (texto: string) => string): string[] {
  return [
    t("Quantos leads eu tive este mês?"),
    t("De onde estão vindo meus leads nos últimos 7 dias?"),
    t("Quem da equipe está vendendo mais?"),
    t("Monte um painel completo das minhas vendas do mês"),
  ];
}

function chaveDoPainel(orgId: string | undefined, userId: string): string {
  return `painel-por-conversa:${orgId ?? "sem-org"}:${userId}`;
}

const cartoesSchema = z.array(cartaoSchema).max(MAXIMO_DE_CARTOES);

/** O chat salvo, lido do navegador sem quebrar a hidratação (o servidor vê o vazio). */
function usePainelSalvo(chave: string): [EstadoSalvo, (novo: EstadoSalvo) => void] {
  const bruto = useSyncExternalStore(
    (avisar) => {
      window.addEventListener("storage", avisar);
      window.addEventListener(EVENTO, avisar);
      return () => {
        window.removeEventListener("storage", avisar);
        window.removeEventListener(EVENTO, avisar);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(chave);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const estado = useMemo<EstadoSalvo>(() => {
    if (!bruto) return VAZIO;
    try {
      const obj = JSON.parse(bruto) as { plano?: unknown; falas?: unknown };
      // Painel salvo antes dos dois modos não tinha `modo`: era sempre painel.
      const plano =
        obj.plano && typeof obj.plano === "object"
          ? planoSchema.safeParse({ modo: "painel", ...(obj.plano as object) })
          : null;
      const falas: Fala[] = [];
      if (Array.isArray(obj.falas)) {
        for (const f of obj.falas as Array<Record<string, unknown>>) {
          if (!f || (f.quem !== "pessoa" && f.quem !== "assistente") || typeof f.texto !== "string") continue;
          const cartoes = f.cartoes ? cartoesSchema.safeParse(f.cartoes) : null;
          falas.push({
            quem: f.quem,
            texto: f.texto,
            ...(cartoes?.success && cartoes.data.length > 0 ? { cartoes: cartoes.data } : {}),
          });
        }
      }
      return { plano: plano?.success ? plano.data : null, falas };
    } catch {
      return VAZIO;
    }
  }, [bruto]);
  const salvar = (novo: EstadoSalvo) => {
    try {
      window.localStorage.setItem(chave, JSON.stringify(novo));
    } catch {
      // Aba privada ou armazenamento cheio: o chat vale só nesta visita.
    }
    window.dispatchEvent(new Event(EVENTO));
  };
  return [estado, salvar];
}

export function PainelPorConversa({ padrao }: { padrao: ReactNode }) {
  const t = useT();
  const user = useUser();
  const org = useActiveOrg();
  const [estadoSalvo, salvar] = usePainelSalvo(chaveDoPainel(org?.orgId, user.id));
  // Sem armazenamento (aba privada), o estado da visita fica em memória.
  const [naMemoria, setNaMemoria] = useState<EstadoSalvo | null>(null);
  const estado = naMemoria ?? estadoSalvo;
  const [aba, setAba] = useState<"meu" | "padrao">("meu");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; semChave: boolean } | null>(null);
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const primeiroNome = (user.full_name ?? "").trim().split(/\s+/)[0] ?? "";
  const fimDaConversa = useRef<HTMLLIElement | null>(null);

  // A conversa rola sozinha até a última fala, como num chat.
  const totalDeFalas = estado.falas.length;
  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [totalDeFalas, enviando]);

  function guardar(novo: EstadoSalvo) {
    const enxuto = { ...novo, falas: novo.falas.slice(-FALAS_GUARDADAS) };
    setNaMemoria(enxuto);
    salvar(enxuto);
  }

  async function enviar(pedido: string) {
    const limpo = pedido.trim();
    if (!limpo || enviando) return;
    setEnviando(true);
    setAviso(null);
    const falas: Fala[] = [...estado.falas, { quem: "pessoa", texto: limpo }];
    guardar({ ...estado, falas });
    setTexto("");
    try {
      const res = await apiClient.post<{
        data: { disponivel: boolean; plano: PlanoDoPainel | null; motivo: string | null };
      }>("/api/v1/metrics/painel-por-conversa", {
        pedido: limpo,
        historico: estado.falas.slice(-FALAS_NO_CONTEXTO).map((f) => ({ quem: f.quem, texto: f.texto })),
        painel_atual: estado.plano,
      });
      const { disponivel, plano, motivo } = res.data;
      if (!disponivel || !plano) {
        setAviso({
          texto: motivo ?? t("O assistente não conseguiu responder esse pedido."),
          semChave: !disponivel,
        });
        return;
      }
      if (plano.modo === "painel") {
        guardar({ plano, falas: [...falas, { quem: "assistente", texto: plano.resposta }] });
      } else {
        guardar({
          plano: estado.plano,
          falas: [
            ...falas,
            {
              quem: "assistente",
              texto: plano.resposta,
              ...(plano.cartoes.length > 0 ? { cartoes: plano.cartoes } : {}),
            },
          ],
        });
      }
    } catch (err) {
      setAviso({
        texto: err instanceof ApiError ? err.message : t("Não foi possível falar com o assistente agora."),
        semChave: false,
      });
    } finally {
      setEnviando(false);
    }
  }

  const conversa = estado.falas.length > 0 || enviando;

  // TELA CHEIA (pedido da dona): sem painel montado, o chat ocupa a área de
  // trabalho inteira, como Inbox e Funis (`casca-ferramenta`). Antes da
  // primeira pergunta, o título grande no centro; depois, a conversa ocupa a
  // tela e a caixa de pergunta fica embaixo, como num chat.
  const telaCheia = aba === "meu" && !estado.plano;

  const abas = (
    <div
      role="tablist"
      aria-label={t("Visão do Dashboard")}
      className={cn(
        "inline-flex w-fit gap-1 rounded-full p-1",
        telaCheia ? "absolute top-4 left-4 z-10 bg-card/80 shadow-sm backdrop-blur" : "bg-muted",
      )}
    >
      {(
        [
          ["meu", t("Meu painel")],
          ["padrao", t("Painel padrão")],
        ] as const
      ).map(([valor, rotulo]) => (
        <button
          key={valor}
          type="button"
          role="tab"
          aria-selected={aba === valor}
          onClick={() => setAba(valor)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            aba === valor ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={cn(telaCheia ? "casca-ferramenta relative flex flex-col" : "flex flex-col gap-6 md:p-6")}
      data-painel-por-conversa
      data-tela-cheia={telaCheia || undefined}
    >
      <h1 className={telaCheia ? "sr-only" : "text-2xl font-semibold tracking-tight"}>{t("Dashboard")}</h1>
      {abas}

      {aba === "padrao" ? (
        padrao
      ) : (
        <>
          {/* ─── O chat (desenho de referência: título grande, caixa arredondada
              e degradê nas cores do Unnify). Pergunta comum é respondida aqui
              mesmo, com até 3 cartões dentro da mensagem; o painel completo só
              quando a pessoa pede, e ele vem embaixo do chat. ─── */}
          <section
            aria-label={t("Chat do painel")}
            data-chat-do-painel={estado.plano ? "compacto" : conversa ? "conversa" : "inicio"}
            className={cn(
              "relative isolate flex flex-col items-center overflow-hidden px-4 sm:px-8",
              estado.plano
                ? "rounded-3xl border border-border py-8"
                : cn("h-full min-h-[28rem] flex-1 rounded-xl", conversa ? "pt-16 pb-6" : "justify-center py-16"),
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background: [
                  "radial-gradient(70% 55% at 50% 108%, color-mix(in srgb, var(--grafico-1) 70%, transparent), transparent 72%)",
                  "radial-gradient(45% 45% at 8% 92%, color-mix(in srgb, var(--grafico-2) 60%, transparent), transparent 72%)",
                  "radial-gradient(45% 45% at 92% 92%, color-mix(in srgb, var(--primary) 70%, transparent), transparent 72%)",
                  "radial-gradient(60% 40% at 50% 0%, color-mix(in srgb, var(--card) 100%, transparent), transparent 80%)",
                  "var(--card)",
                ].join(", "),
                opacity: estado.plano || conversa ? 0.45 : 1,
              }}
            />

            {!conversa && !estado.plano && (
              <>
                <h2 className="max-w-3xl text-center text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                  {primeiroNome
                    ? t("O que vamos analisar hoje, {nome}?").replace("{nome}", primeiroNome)
                    : t("O que vamos analisar hoje?")}
                </h2>
                <p className="mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
                  {t("Pergunte o que quiser sobre seus leads, vendas e equipe. Se quiser, peça um painel completo.")}
                </p>
              </>
            )}

            {conversa && (
              <ol
                className={cn(
                  "flex w-full max-w-3xl flex-col gap-3 overflow-y-auto pr-1",
                  estado.plano ? "max-h-[26rem]" : "min-h-0 flex-1",
                )}
                data-falas
              >
                {estado.falas.map((f, i) => (
                  <li
                    key={`${i}-${f.texto.slice(0, 16)}`}
                    data-fala={f.quem}
                    className={cn(
                      "rounded-2xl text-sm shadow-sm",
                      f.quem === "pessoa"
                        ? "max-w-[85%] self-end bg-primary px-3.5 py-2 whitespace-pre-wrap text-primary-foreground"
                        : cn(
                            "self-start border border-border/60 bg-card/95 text-foreground",
                            f.cartoes?.length ? "w-full p-3" : "max-w-[85%] px-3.5 py-2",
                          ),
                    )}
                  >
                    <p className={cn("whitespace-pre-wrap", f.cartoes?.length && "px-0.5 pb-3")}>{f.texto}</p>
                    {f.cartoes && f.cartoes.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2" data-cartoes-da-resposta>
                        {f.cartoes.map((c) => (
                          <CartaoMontado key={`${c.indicador}:${c.periodo}`} cartao={c} />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
                {enviando && (
                  <li
                    className="self-start rounded-2xl border border-border/60 bg-card/95 px-3.5 py-2 text-sm text-muted-foreground shadow-sm"
                    aria-busy
                  >
                    {t("Pensando…")}
                  </li>
                )}
                <li ref={fimDaConversa} aria-hidden className="h-px shrink-0" />
              </ol>
            )}

            {aviso && (
              <p className="mt-4 w-full max-w-3xl rounded-xl border border-warning-border bg-warning-soft px-3 py-2 text-sm text-warning-foreground" data-aviso-do-chat>
                {aviso.texto}
                {aviso.semChave && (
                  <>
                    {" "}
                    <Link href="/app/ai/credentials" className="font-medium underline">
                      {t("Cadastrar a chave de IA")}
                    </Link>
                  </>
                )}
              </p>
            )}

            <form
              className={cn(
                "w-full max-w-3xl shrink-0 rounded-[28px] border border-border/70 bg-card p-3 shadow-[0_24px_64px_-24px_rgba(7,26,50,0.45)]",
                conversa ? "mt-4" : "mt-8",
              )}
              onSubmit={(e) => {
                e.preventDefault();
                void enviar(texto);
              }}
            >
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar(texto);
                  }
                }}
                rows={2}
                maxLength={500}
                aria-label={t("O que você quer analisar?")}
                placeholder={
                  estado.plano
                    ? t("Pergunte algo ou peça um ajuste no painel…")
                    : t("Pergunte sobre seus leads, vendas ou equipe…")
                }
                className="block w-full resize-none bg-transparent px-3 pt-2 text-base text-foreground outline-hidden placeholder:text-muted-foreground"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSugestoesAbertas((v) => !v)}
                  aria-expanded={sugestoesAbertas}
                  aria-label={t("Ver sugestões")}
                  title={t("Ver sugestões")}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Plus size={16} aria-hidden />
                </button>
                <div className="flex items-center gap-2">
                  {(estado.plano || estado.falas.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        guardar(VAZIO);
                        setAviso(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Trash size={12} aria-hidden />
                      {t("Começar de novo")}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={enviando || texto.trim() === ""}
                    aria-label={t("Enviar")}
                    className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                  >
                    <ArrowUp size={16} aria-hidden />
                  </button>
                </div>
              </div>
            </form>

            {(sugestoesAbertas || (!conversa && !estado.plano)) && (
              <div className="mt-4 flex w-full max-w-3xl flex-wrap justify-center gap-2" data-sugestoes>
                {sugestoes(t).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSugestoesAbertas(false);
                      void enviar(s);
                    }}
                    className="rounded-full border border-border/70 bg-card/85 px-3.5 py-1.5 text-xs text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ─── O painel completo, quando a pessoa pediu um ─── */}
          {estado.plano ? (
            <section className="flex flex-col gap-4" aria-label={estado.plano.titulo} data-painel-montado>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{estado.plano.titulo}</h2>
                <button
                  type="button"
                  onClick={() => guardar({ ...estado, plano: null })}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Trash size={12} aria-hidden />
                  {t("Tirar o painel")}
                </button>
              </div>
              {estado.plano.cartoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("Nenhum cartão para esse pedido. Tente descrever de outro jeito.")}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {estado.plano.cartoes.map((c) => (
                    <CartaoMontado key={`${c.indicador}:${c.periodo}`} cartao={c} />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

const ROTULO_DO_PERIODO: Record<PeriodoDoPainel, string> = {
  hoje: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};
const DIAS: Record<PeriodoDoPainel, number> = { hoje: 1, "7d": 7, "30d": 30, "90d": 90 };

const ICONE_DO_FORMATO = {
  linha: ChartLineUp,
  barras: ChartBar,
  pizza: ChartBar,
  tabela: ListChecks,
  numero: ChartBar,
} as const;

/**
 * Um cartão do painel. Número vira cartão de número; o resto vira cartão de
 * gráfico, no padrão do Unnify Pulse (`graficos-do-painel.tsx`).
 */
function CartaoMontado({ cartao }: { cartao: CartaoDoPainel }) {
  const t = useT();
  const ind = CATALOGO_DO_PAINEL[cartao.indicador] as IndicadorDoCatalogo;
  const periodo = PERIODOS_DO_PAINEL.includes(cartao.periodo) ? t(ROTULO_DO_PERIODO[cartao.periodo]) : "";
  const conteudo =
    ind.fonte === "leads" ? (
      <DaFonteLeads cartao={cartao} periodo={periodo} />
    ) : ind.fonte === "vendedores" ? (
      <DaFonteVendedores cartao={cartao} />
    ) : (
      <DaFonteAtividades cartao={cartao} />
    );
  if (ind.formato === "numero") {
    return <div data-cartao={cartao.indicador}>{conteudo}</div>;
  }
  return (
    <div className="sm:col-span-2" data-cartao={cartao.indicador}>
      <CartaoDeGrafico titulo={cartao.titulo} subtitulo={periodo} Icone={ICONE_DO_FORMATO[ind.formato]} className="h-full">
        {conteudo}
      </CartaoDeGrafico>
    </div>
  );
}

function Carregando({ numero = false }: { numero?: boolean }) {
  const t = useT();
  const texto = (
    <p className="text-sm text-muted-foreground" aria-busy>
      {t("Carregando…")}
    </p>
  );
  return numero ? (
    <article className="flex min-h-[148px] items-center rounded-xl border border-border bg-card p-4 sm:p-5">{texto}</article>
  ) : (
    texto
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{texto}</p>;
}

function DaFonteLeads({ cartao, periodo }: { cartao: CartaoDoPainel; periodo: string }) {
  const t = useT();
  const org = useActiveOrg();
  const { data, isLoading, isError } = useDashboard(cartao.periodo);
  const ehNumero = (CATALOGO_DO_PAINEL[cartao.indicador] as IndicadorDoCatalogo).formato === "numero";
  if (isError) return <Vazio texto={t("Não consegui carregar os números.")} />;
  if (isLoading || !data) return <Carregando numero={ehNumero} />;
  const d: DashboardDeLeads = data.data;
  const moeda = org?.currency ?? MOEDA_PADRAO;
  const tot = d.totais;
  const dinheiro = (n: number) => formatValorDoNegocio(n, moeda, { semCentavos: true });
  const porOrigem = (campo: "leads" | "ganhos") => {
    const somas = new Map<string, number>();
    for (const o of d.origens) {
      const nome = rotuloDaOrigem(o.origem, t);
      somas.set(nome, (somas.get(nome) ?? 0) + o[campo]);
    }
    return [...somas.entries()]
      .map(([rotulo, valor]) => ({ rotulo, valor }))
      .filter((i) => i.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  };
  const etapas = etapasDoFunil(d.etapas, funilInicial(d.etapas));
  const rotuloDoDia = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
  const contexto = (rotulo: string, valor: string) => (
    <>
      <span>{rotulo}</span>
      <span className="ml-1.5 font-medium text-foreground tabular-nums">{valor}</span>
    </>
  );

  switch (cartao.indicador) {
    case "leads_no_periodo":
      return (
        <CartaoDeNumero
          rotulo={cartao.titulo}
          valor={numeroCompacto(tot.leads)}
          variacao={variacaoPercentual(tot.leads, d.leads_periodo_anterior)}
          contexto={contexto(t("Período anterior"), numeroCompacto(d.leads_periodo_anterior))}
        />
      );
    case "taxa_de_venda": {
      const pct = porcentagem(tot.ganhos, tot.leads);
      return (
        <CartaoDeNumero
          rotulo={cartao.titulo}
          valor={pct === null ? "—" : `${pct}%`}
          contexto={contexto(t("Ganhos"), `${tot.ganhos} · ${tot.perdidos} ${t("perdidos")}`)}
        />
      );
    }
    case "valor_vendido":
      return <CartaoDeNumero rotulo={cartao.titulo} valor={dinheiro(tot.valor_ganho_cents)} contexto={periodo} />;
    case "tempo_de_resposta":
      return (
        <CartaoDeNumero
          rotulo={cartao.titulo}
          valor={tot.mediana_resposta_segundos == null ? "—" : duracaoLegivel(tot.mediana_resposta_segundos)}
          contexto={
            tot.mediana_resposta_segundos == null ? t("Nenhum lead do período foi respondido ainda") : t("mediana")
          }
        />
      );
    case "leads_sem_resposta":
      return (
        <CartaoDeNumero
          rotulo={cartao.titulo}
          valor={numeroCompacto(tot.sem_resposta)}
          contexto={contexto(t("Já receberam resposta"), numeroCompacto(tot.respondidos))}
        />
      );
    case "ganhos_e_perdidos":
      if (tot.ganhos + tot.perdidos + tot.abertos === 0) return <Vazio texto={t("Nada no período.")} />;
      return (
        <Rosca
          fatias={[
            { rotulo: t("Ganhos"), valor: tot.ganhos },
            { rotulo: t("Em aberto"), valor: tot.abertos },
            { rotulo: t("Perdidos"), valor: tot.perdidos },
          ]}
        />
      );
    case "leads_por_dia":
      if (d.por_dia.length === 0) return <Vazio texto={t("Nenhum lead no período.")} />;
      return (
        <AreaPorDia
          pontos={d.por_dia.map((p) => ({ dia: p.dia, valor: p.leads }))}
          nome={t("Leads")}
          rotuloDoDia={rotuloDoDia}
        />
      );
    case "leads_por_origem": {
      const itens = porOrigem("leads");
      return itens.length === 0 ? <Vazio texto={t("Nada no período.")} /> : <BarrasDeRanking itens={itens} nome={t("Leads")} />;
    }
    case "vendas_por_origem": {
      const itens = porOrigem("ganhos");
      return itens.length === 0 ? <Vazio texto={t("Nada no período.")} /> : <BarrasDeRanking itens={itens} nome={t("Ganhos")} />;
    }
    case "abertos_por_etapa":
      return etapas.length === 0 ? (
        <Vazio texto={t("Nada no período.")} />
      ) : (
        <BarrasDeRanking itens={etapas.map((e) => ({ rotulo: e.stage_name, valor: e.abertos }))} nome={t("Em aberto")} />
      );
    case "parados_por_etapa":
      return etapas.length === 0 ? (
        <Vazio texto={t("Nada no período.")} />
      ) : (
        <BarrasDeRanking itens={etapas.map((e) => ({ rotulo: e.stage_name, valor: e.parados }))} nome={t("Parados")} />
      );
    case "valor_por_etapa":
      return etapas.length === 0 ? (
        <Vazio texto={t("Nada no período.")} />
      ) : (
        <BarrasDeRanking
          itens={etapas.map((e) => ({ rotulo: e.stage_name, valor: e.valor_cents }))}
          nome={t("Valor")}
          formatar={dinheiro}
        />
      );
    case "lista_sem_resposta": {
      const sem = d.leads.filter((l) => l.resposta_segundos == null).slice(0, 10);
      if (sem.length === 0) return <Vazio texto={t("Todos os leads do período foram respondidos.")} />;
      return (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {sem.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate font-medium">{l.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {rotuloDaOrigem(l.origem, t)} · {l.stage_name ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      );
    }
    default:
      return null;
  }
}

function DaFonteVendedores({ cartao }: { cartao: CartaoDoPainel }) {
  const t = useT();
  const { data, isLoading, isError } = useAttendantMetrics(null);
  if (isError) return <Vazio texto={t("Não consegui carregar o desempenho")} />;
  if (isLoading || !data) return <Carregando />;
  const vendedores = data.data.attendants;
  if (vendedores.length === 0) {
    return <Vazio texto={t("Sem atividade no período (ganhos/perdidos, conversas ou respostas).")} />;
  }
  const nome = (v: (typeof vendedores)[number]) => v.name ?? v.email ?? t("Atendente");
  if (cartao.indicador === "vendas_por_vendedor") {
    return (
      <BarrasDeRanking
        itens={vendedores.map((v) => ({ rotulo: nome(v), valor: v.won })).sort((a, b) => b.valor - a.valor)}
        nome={t("Ganhos")}
      />
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th className="pb-2 font-medium">{t("Vendedor")}</th>
          <th className="pb-2 text-right font-medium">{t("Ganhos")}</th>
          <th className="pb-2 text-right font-medium">{t("Perdidos")}</th>
          <th className="pb-2 text-right font-medium">{t("Conversas")}</th>
          <th className="pb-2 text-right font-medium">{t("1ª resposta")}</th>
        </tr>
      </thead>
      <tbody>
        {vendedores.map((v) => (
          <tr key={v.user_id} className="border-t border-border">
            <td className="max-w-40 truncate py-2 font-medium">{nome(v)}</td>
            <td className="py-2 text-right tabular-nums">{v.won}</td>
            <td className="py-2 text-right tabular-nums">{v.lost}</td>
            <td className="py-2 text-right tabular-nums">{v.conversations_handled}</td>
            <td className="py-2 text-right tabular-nums">{formatarDuracao(v.median_first_response_seconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DaFonteAtividades({ cartao }: { cartao: CartaoDoPainel }) {
  const t = useT();
  const { data, isLoading, isError } = useActivityReport(DIAS[cartao.periodo]);
  if (isError) return <Vazio texto={t("Erro ao carregar o relatório.")} />;
  if (isLoading || !data) return <Carregando />;
  const r = data.data.resumo;
  if (r.pessoas + r.agentes + r.automatico === 0) return <Vazio texto={t("Nada no período.")} />;
  return (
    <Rosca
      fatias={[
        { rotulo: t("Equipe"), valor: r.pessoas },
        { rotulo: t("Agentes de IA"), valor: r.agentes },
        { rotulo: t("Automático"), valor: r.automatico },
      ]}
    />
  );
}
