"use client";

/**
 * Meta do mês e progresso no Desempenho (issue #3025, fatia 1).
 *
 * ─── Por que este painel existe ─────────────────────────────────────────────
 * A tela mostrava só o realizado. Sem ALVO não há percentual, e a comparação
 * mês a mês ficava na cabeça de quem cobra o time. Aqui estão os quatro números,
 * com a MESMA régua de barra do card de funil logo abaixo: o que muda de um
 * painel para o outro é o denominador, não o desenho.
 *
 * ─── Por que o estado chega por prop ────────────────────────────────────────
 * Quem busca é o `MetricsClient` (um pedido só para a tela). O painel recebe
 * carregando/erro/vazio/ok e por isso é medido em DOM sem banco e sem mock de
 * rede — o que precisa de prova aqui é o DESFECHO de cada estado, e o mais
 * importante deles é o VAZIO: "sem meta" é ausência de cadastro, e mostrar
 * `0 de 0` ali seria afirmar que a empresa não vendeu nada.
 *
 * ─── O caso atingido ───────────────────────────────────────────────────────
 * Percentual acima de 100 é informação (vendeu mais do que a meta), mas a barra
 * para em 100% e "quanto falta" fica ausente em vez de negativo: `-7` seria uma
 * dívida que não existe.
 */
import { useT } from "@/hooks/i18n/useT";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { mesLegivel } from "@/lib/metas/periodo";
import Link from "next/link";

export interface MetaDaEmpresa {
  id: string;
  escopo: "empresa" | "funil";
  pipeline_id: string | null;
  pipeline_nome: string | null;
  alvo: number;
  realizado: number;
  percentual: number;
  falta: number;
  atingida: boolean;
}

export type EstadoDaMeta = "carregando" | "erro" | "vazio" | "ok";

interface Props {
  estado: EstadoDaMeta;
  /** O 1º dia do mês da meta, como `YYYY-MM-01`; nulo quando não há meta. */
  periodo: string | null;
  metas: readonly MetaDaEmpresa[];
  /** manager+: mostra a porta do cadastro em Configurações. */
  podeConfigurar: boolean;
}

export function MetaDoMesPanel({ estado, periodo, metas, podeConfigurar }: Props) {
  const t = useT();
  const mes = mesLegivel(periodo);

  // Seção com título e uma grade de cartões de métrica (DS §10.11 e §11.3), e
  // não um cartão com cartões dentro: cada meta é um `StatCard`, com o
  // realizado como valor, o alvo e o percentual no contexto e a barra de 8px
  // da meta embaixo.
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">
        {t("Meta do mês")}
        {mes ? ` · ${mes}` : ""}
      </h2>

      {estado === "carregando" ? (
        <div aria-label={t("Carregando a meta do mês")} className={GRADE}>
          <StatCard loading label="" value="" />
        </div>
      ) : null}

      {estado === "erro" ? (
        <Alert variant="warning">
          {t(
            "Não consegui carregar a meta do mês — isto é uma falha de leitura, não a ausência de meta.",
          )}
        </Alert>
      ) : null}

      {estado === "vazio" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            {t("Nenhuma meta cadastrada para este mês.")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              "Defina a meta em Configurações › Meta de vendas para ver aqui o quanto já foi feito e o quanto falta.",
            )}
          </p>
          {podeConfigurar ? (
            <Link
              href="/app/settings/metas"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("Definir a meta")}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Só quem administra a empresa define a meta.")}
            </p>
          )}
        </div>
      ) : null}

      {estado === "ok" ? (
        <div className={GRADE}>
          {metas.map((m) => (
            <StatCard
              key={m.id}
              label={m.escopo === "funil" ? (m.pipeline_nome ?? t("Funil")) : t("Empresa")}
              value={<span data-meta="realizado">{m.realizado}</span>}
              context={
                <>
                  {t("de")} <strong data-meta="alvo">{m.alvo}</strong> {t("Vendas ganhas")} ·{" "}
                  <strong data-meta="percentual">{m.percentual}%</strong> {t("da meta")}
                </>
              }
              goal={{
                progress: m.percentual,
                status: "ok",
                label: m.atingida
                  ? t("Meta atingida.")
                  : `${t("Faltam")} ${m.falta} ${t("para a meta")}`,
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Grade de KPIs: as colunas se ajustam à largura (DS §11.3). */
const GRADE = "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]";
