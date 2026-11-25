"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/hooks/i18n/useT";
import { useAttendantMetrics } from "@/hooks/metrics/useAttendantMetrics";
import { useActivityReport } from "@/hooks/reports/useActivityReport";
import { formatarDuracao } from "@/lib/metrics/canais";

/**
 * A EQUIPE NO DASHBOARD — o essencial das telas Desempenho e Atividades,
 * trazido para cá quando o grupo "Análise" saiu do menu (pedido da dona,
 * 25/11/2026: "remover tudo isso e aplicar no dashboard de maneira mais
 * simplificada").
 *
 * Duas perguntas, dois cartões, as MESMAS rotas daquelas telas:
 *   - "Como cada vendedor está indo?" — ganhos, perdidos, conversas e a
 *     mediana da 1ª resposta (`/api/v1/metrics/attendants`, últimos 30 dias,
 *     a janela fixa daquela rota);
 *   - "Quem fez o trabalho?" — quanto foi a equipe, os agentes de IA e o
 *     automático, e quem mais fez (`/api/v1/reports/activities`, no período
 *     escolhido no topo do Dashboard).
 *
 * Os relatórios completos continuam nas rotas de sempre (`/app/metrics`,
 * `/app/activities`), com o link "Ver relatório completo" daqui como porta.
 */
export function EquipeNoDashboard({ dias }: { dias: number }) {
  const t = useT();
  const desempenho = useAttendantMetrics(null);
  const atividades = useActivityReport(dias);
  const vendedores = desempenho.data?.data.attendants ?? [];
  const relatorio = atividades.data?.data;
  const resumo = relatorio?.resumo;
  const totalOrigem = resumo ? resumo.pessoas + resumo.agentes + resumo.automatico : 0;
  const fatia = (n: number) => (totalOrigem === 0 ? 0 : Math.round((n / totalOrigem) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-equipe-no-dashboard>
      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between gap-3">
          <CardTitle className="text-base">{t("Desempenho por vendedor")}</CardTitle>
          <Link href="/app/metrics" className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t("Ver relatório completo")}
          </Link>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">{t("Últimos 30 dias.")}</p>
          {desempenho.isError ? (
            <p className="text-sm text-destructive">{t("Não consegui carregar o desempenho")}</p>
          ) : desempenho.isLoading ? (
            <p className="text-sm text-muted-foreground" aria-busy>
              {t("Carregando…")}
            </p>
          ) : vendedores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("Sem atividade no período (ganhos/perdidos, conversas ou respostas).")}
            </p>
          ) : (
            <table className="w-full text-sm" data-desempenho-por-vendedor>
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
                    <td className="max-w-40 truncate py-2 font-medium">
                      {v.name ?? v.email ?? t("Atendente")}
                    </td>
                    <td className="py-2 text-right tabular-nums">{v.won}</td>
                    <td className="py-2 text-right tabular-nums">{v.lost}</td>
                    <td className="py-2 text-right tabular-nums">{v.conversations_handled}</td>
                    <td
                      className="py-2 text-right tabular-nums"
                      title={t("Mediana do tempo até a 1ª resposta humana")}
                    >
                      {formatarDuracao(v.median_first_response_seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between gap-3">
          <CardTitle className="text-base">{t("Quem fez o trabalho")}</CardTitle>
          <Link href="/app/activities" className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t("Ver relatório completo")}
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {atividades.isError ? (
            <p className="text-sm text-destructive">{t("Erro ao carregar o relatório.")}</p>
          ) : atividades.isLoading || !relatorio || !resumo ? (
            <p className="text-sm text-muted-foreground" aria-busy>
              {t("Carregando…")}
            </p>
          ) : relatorio.total === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Nenhuma atividade no período.")}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {relatorio.total}
                </span>{" "}
                {t("atividades no período")}
              </p>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full bg-primary" style={{ width: `${fatia(resumo.pessoas)}%` }} />
                <div className="h-full bg-primary/50" style={{ width: `${fatia(resumo.agentes)}%` }} />
                <div className="h-full bg-muted-foreground/40" style={{ width: `${fatia(resumo.automatico)}%` }} />
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm" data-quem-fez>
                {(
                  [
                    [t("Equipe"), resumo.pessoas, "bg-primary"],
                    [t("Agentes de IA"), resumo.agentes, "bg-primary/50"],
                    [t("Automático"), resumo.automatico, "bg-muted-foreground/40"],
                  ] as const
                ).map(([rotulo, n, cor]) => (
                  <div key={rotulo} className="flex flex-col gap-0.5">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span aria-hidden className={`size-2 rounded-full ${cor}`} />
                      {rotulo}
                    </dt>
                    <dd className="font-semibold tabular-nums">
                      {n} <span className="text-xs font-normal text-muted-foreground">({fatia(n)}%)</span>
                    </dd>
                  </div>
                ))}
              </dl>
              {relatorio.atores.length > 0 && (
                <ul className="flex flex-col gap-2 border-t border-border pt-3">
                  {relatorio.atores.slice(0, 5).map((a) => (
                    <li key={a.chave} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">{a.nome}</span>
                      <span className="text-muted-foreground tabular-nums">{a.quantidade}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
