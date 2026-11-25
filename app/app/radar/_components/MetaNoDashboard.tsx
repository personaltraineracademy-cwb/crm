"use client";

import Link from "next/link";
import { useState } from "react";

import { useT } from "@/hooks/i18n/useT";
import { useMetasDoMes } from "@/hooks/metrics/useMetasDoMes";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { janelaDoMes, mesLegivel, mesLocal } from "@/lib/metas/periodo";
import { ritmoDaMeta } from "@/lib/metas/ritmo";

const GRADE = "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]";

/**
 * A meta do mês no Dashboard, com o RITMO: quanto já foi feito, quanto falta e
 * quantas vendas por dia fecham a conta até o fim do mês. A meta é a mesma de
 * Desempenho (`/api/v1/metrics/metas`) e é mensal — por isso não segue o
 * seletor de período do Dashboard.
 */
export function MetaNoDashboard() {
  const t = useT();
  // Fixada uma vez por montagem, como em Desempenho: o mês é o de quem olha.
  const [janela] = useState(() => janelaDoMes(mesLocal()));
  const { data, isLoading, isError } = useMetasDoMes(janela);
  const mes = mesLegivel(data?.data.periodo ?? null);
  const metas = data?.data.metas ?? [];
  const semMeta = !isLoading && !isError && (data?.data.motivo === "sem_meta" || metas.length === 0);

  return (
    <section className="flex flex-col gap-3" data-testid="meta-no-dashboard">
      <h2 className="text-base font-semibold">
        {t("Meta do mês")}
        {mes ? ` · ${mes}` : ""}
      </h2>

      {isLoading ? (
        <div aria-label={t("Carregando a meta do mês")} className={GRADE}>
          <StatCard loading label="" value="" />
        </div>
      ) : null}

      {isError ? (
        <Alert variant="warning">
          {t(
            "Não consegui carregar a meta do mês — isto é uma falha de leitura, não a ausência de meta.",
          )}
        </Alert>
      ) : null}

      {semMeta ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            {t(
              "Nenhuma meta cadastrada para este mês. Com a meta definida, o Dashboard mostra quanto falta e quantas vendas por dia você precisa para chegar lá.",
            )}
          </p>
          <Link
            href="/app/settings/metas"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("Definir a meta")}
          </Link>
        </div>
      ) : null}

      {!isLoading && !isError && metas.length > 0 ? (
        <div className={GRADE}>
          {metas.map((m) => {
            const ritmo = ritmoDaMeta(m);
            return (
              <StatCard
                key={m.id}
                label={m.escopo === "funil" ? (m.pipeline_nome ?? t("Funil")) : t("Empresa")}
                value={<span data-meta="realizado">{m.realizado}</span>}
                context={
                  <>
                    {t("de")} <strong>{m.alvo}</strong> {t("Vendas ganhas")} ·{" "}
                    <strong>{m.percentual}%</strong> {t("da meta")}
                    {ritmo.situacao !== "atingida" ? (
                      <>
                        {" · "}
                        {t("o esperado até hoje era")} <strong>{ritmo.esperadoAteHoje}</strong>
                      </>
                    ) : null}
                  </>
                }
                goal={{
                  progress: m.percentual,
                  status: ritmo.situacao === "atrasado" ? "warning" : "ok",
                  label:
                    ritmo.situacao === "atingida"
                      ? t("Meta atingida.")
                      : `${t("Faltam")} ${m.falta}: ${ritmo.porDia.toLocaleString()} ${t(
                          "por dia nos próximos",
                        )} ${ritmo.diasRestantes} ${ritmo.diasRestantes === 1 ? t("dia") : t("dias")}`,
                }}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
