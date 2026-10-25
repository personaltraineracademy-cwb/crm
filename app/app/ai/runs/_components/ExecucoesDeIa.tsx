"use client";

import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";

/**
 * A tela de execuções de IA.
 *
 * Abre pelo RESUMO, não pela lista. A pergunta que traz alguém aqui é "está
 * tudo bem?", e obrigar a ler cem linhas para descobrir isso é como um painel
 * de log para de ser aberto. A lista completa fica logo abaixo, para quem já
 * sabe o que procura.
 *
 * Cada falha mostra três coisas, nesta ordem: o que o CLIENTE viu acontecer, o
 * que fazer a respeito, e só então a mensagem crua do provedor. A ordem é a
 * decisão de desenho mais importante aqui — invertê-la faz a tela abrir com
 * jargão e devolve ao operador o trabalho de adivinhação que ela veio acabar.
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ChipDeEstado } from "@/components/ai/chip-de-estado";
import { CheckCircle, WarningOctagon } from "@/lib/ui/icons";
import { useT } from "@/hooks/i18n/useT";
import { PROVEDOR_DO_JEV } from "@/lib/ai/decisao/credencial";
import { RoteamentoResultados } from "./RoteamentoResultados";

/**
 * O MESMO formato da tela de Uso — as duas leem `llm_calls.cost_cents`, que é
 * centavo de DÓLAR (`pricing.ts` cota o provedor em USD).
 */
const usd = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
  // 6 casas porque uma execução isolada custa fração de centavo, e arredondar
  // mostraria "US$ 0,00" — o zero que não é zero. Com 4, era o caso de TODA
  // medição do Jev (~US$ 0,000016); o cartão dele já usava 6.
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

interface Execucao {
  id: string;
  purpose: string;
  pontoRotulo: string;
  provider: string;
  provedorRotulo: string;
  model: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  http_status: number | null;
  consequencia: string | null;
  oQueFazer: string | null;
  porQueEsteModelo: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number | null;
  latency_ms: number | null;
  created_at: string;
}

interface Resumo {
  total: number;
  erros: number;
  porCodigo: Array<{ codigo: string; quantas: number; oQueFazer: string | null }>;
}

export function ExecucoesDeIa() {
  const tagDoIdioma = useTagDeIdioma();
  const t = useT();
  const [execucoes, setExecucoes] = useState<Execucao[] | null>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [soErros, setSoErros] = useState(false);
  // O provedor mora na URL, e não em estado: é por ela que o cartão do Jev
  // traz a pessoa já filtrada ("Ver as decisões do Jev").
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const provider = parametros.get("provider");
  const abaRoteamento = parametros.get("tab") === "roteamento";
  const soOJev = provider === PROVEDOR_DO_JEV;

  const carregar = useCallback(async () => {
    // Mesmo tratamento do painel de provedores, e pela mesma razão medida lá:
    // sem ele, uma resposta não-JSON prende a tela em "Carregando…" sem nada
    // explicando — a falha muda que estas telas existem para acabar.
    try {
      const busca = new URLSearchParams();
      if (soErros) busca.set("status", "erro");
      if (provider) busca.set("provider", provider);
      const res = await fetch(`/api/v1/ai/runs${busca.toString() ? `?${busca}` : ""}`);
      const texto = await res.text();
      let json: { data?: { execucoes: Execucao[]; resumo: Resumo }; error?: { message?: string } };
      try {
        json = JSON.parse(texto);
      } catch {
        setErro(`${t("resposta inesperada do servidor")} (${res.status}): ${texto.slice(0, 200)}`);
        return;
      }
      if (!res.ok) {
        setErro(
          json?.error?.message ? t(json.error.message) : `${t("não consegui carregar")} (${res.status})`,
        );
        return;
      }
      setErro(null);
      setExecucoes(json.data!.execucoes);
      setResumo(json.data!.resumo);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t("não consegui falar com o servidor"));
    }
  }, [soErros, provider, t]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (abaRoteamento) return <RoteamentoResultados />;

  if (erro) {
    return (
      <div className="p-6">
        <Card className="border-danger-border p-6">
          <h2 className="text-danger-foreground font-medium">
            {t("Não consegui carregar as execuções")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{erro}</p>
          <Button className="mt-4" variant="outline" onClick={() => void carregar()}>
            {t("Tentar de novo")}
          </Button>
        </Card>
      </div>
    );
  }

  if (!execucoes || !resumo) {
    return <div className="p-6 text-sm text-muted-foreground">{t("Carregando…")}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-6" data-testid="execucoes-de-ia">
      <PageHeader
        className="mb-6"
        title={t("Execuções de IA")}
        description={t(
          "Tudo que a inteligência artificial fez por aqui — e, quando algo falhou, o que aconteceu e o que fazer.",
        )}
        meta={
          <nav className="flex gap-3">
            <span aria-current="page" className="font-medium text-foreground">
              {t("Execuções")}
            </span>
            <a
              href="/app/ai/runs?tab=roteamento"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("Roteamento")}
            </a>
          </nav>
        }
      />

      {/* O resumo responde "está tudo bem?" antes da lista. */}
      <Card className="mb-6 p-4" data-testid="resumo">
        {resumo.erros === 0 ? (
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} aria-hidden className="text-success-foreground shrink-0" />
            <span>
              <span className="text-success-foreground font-medium">{t("Nenhuma falha")}</span>{" "}
              {t("nas últimas")} <span className="tabular-nums">{resumo.total}</span>{" "}
              {t("execuções.")}
            </span>
          </p>
        ) : (
          <div>
            <p
              className="text-danger-foreground flex items-center gap-2 text-sm font-medium"
              data-testid="tem-falhas"
            >
              <WarningOctagon size={16} aria-hidden className="shrink-0" />
              <span className="tabular-nums">
                {resumo.erros} {t("de")} {resumo.total}
              </span>{" "}
              {t("execuções falharam.")}
            </p>
            <ul className="mt-3 space-y-2">
              {resumo.porCodigo.map((c) => (
                <li key={c.codigo} className="text-sm">
                  <Badge variant="outline" className="mr-2 tabular-nums">
                    {c.quantas}×
                  </Badge>
                  {c.oQueFazer ? t(c.oQueFazer) : c.codigo}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={soErros ? "default" : "outline"}
          onClick={() => setSoErros((v) => !v)}
          data-testid="filtro-erros"
        >
          {soErros ? t("Mostrando só as falhas") : t("Ver só as falhas")}
        </Button>
        {/* Só onde o Jev existe: numa instalação sem ele, o filtro seria ruído. */}
        {(soOJev || execucoes.some((e) => e.provider === PROVEDOR_DO_JEV)) && (
          <Button
            size="sm"
            variant={soOJev ? "default" : "outline"}
            aria-pressed={soOJev}
            onClick={() =>
              router.replace(soOJev ? pathname : `${pathname}?provider=${PROVEDOR_DO_JEV}`)
            }
            data-testid="filtro-jev"
          >
            {soOJev ? t("Mostrando só o Jev") : t("Só o Jev")}
          </Button>
        )}
      </div>

      {execucoes.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground" data-testid="lista-vazia">
          {soErros
            ? t("Nenhuma falha registrada.")
            : soOJev
              ? t("O Jev ainda não mediu nenhuma mensagem.")
              : t("Nenhuma execução ainda. Assim que o agente atender alguém, aparece aqui.")}
        </Card>
      ) : (
        // Linha do tempo (§2.6 do inventário): uma superfície só, itens sem
        // cartão separados por linha fina, ícone de estado à esquerda e o
        // metadado em `xs` tabular.
        <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {execucoes.map((e) => {
            const falhou = e.status === "erro";
            const Icone = falhou ? WarningOctagon : CheckCircle;
            return (
              <li
                key={e.id}
                className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                data-testid={`execucao-${e.id}`}
                data-status={e.status}
              >
                <Icone
                  size={16}
                  aria-hidden
                  className={`mt-0.5 shrink-0 ${falhou ? "text-danger-foreground" : "text-success-foreground"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {t(e.pontoRotulo)}
                      </span>
                      {falhou && <ChipDeEstado tom="perigo">{t("falhou")}</ChipDeEstado>}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {e.provedorRotulo} · {e.model}
                    </span>
                  </div>

                  {falhou ? (
                    <div className="mt-2 space-y-1.5 text-sm">
                      {/* 1º: o que o CLIENTE viu. */}
                      {e.consequencia && (
                        <p data-testid="consequencia">
                          <span className="font-medium">{t("O que aconteceu:")}</span>{" "}
                          {t(e.consequencia)}
                        </p>
                      )}
                      {/* 2º: o que fazer. */}
                      {e.oQueFazer && (
                        <p className="text-muted-foreground" data-testid="o-que-fazer">
                          <span className="font-medium text-foreground">{t("O que fazer:")}</span>{" "}
                          {t(e.oQueFazer)}
                        </p>
                      )}
                      {/* 3º: só então, o texto cru — para quem for investigar. */}
                      {e.error_message && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer">
                            {t("Mensagem técnica do provedor")}
                          </summary>
                          <pre className="mt-1 overflow-x-auto rounded-lg bg-muted/40 p-2 font-mono break-words whitespace-pre-wrap">
                            {e.error_message}
                            {e.http_status ? `\n(${t("código")} ${e.http_status})` : ""}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {e.input_tokens + e.output_tokens} {t("tokens")}
                      {e.latency_ms !== null ? ` · ${e.latency_ms} ms` : ""}
                      {/* `cost_cents` está em CENTAVOS: dividir por 100 dá REAIS, e o
                          rótulo dizia "centavos" — uma execução de 25 centavos
                          aparecia como "0.2500 centavos", 100× menor que o mesmo
                          evento na tela de Uso, sem nenhuma das duas dizer qual
                          estava certa. Aqui vale o mesmo formato de lá: reais. */}
                      {e.cost_cents !== null ? ` · ${usd.format(e.cost_cents / 100)}` : ""}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    <time dateTime={e.created_at}>
                      {new Date(e.created_at).toLocaleString(tagDoIdioma)}
                    </time>
                    {e.porQueEsteModelo ? ` · ${t(e.porQueEsteModelo)}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
