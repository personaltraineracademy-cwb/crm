"use client";

import Link from "next/link";
import { useState } from "react";

import { useT } from "@/hooks/i18n/useT";
import { useDashboard } from "@/hooks/metrics/useDashboard";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetaNoDashboard } from "./MetaNoDashboard";
import {
  duracaoLegivel,
  etapaGargalo,
  etapasDoFunil,
  funilInicial,
  funisDoDashboard,
  porcentagem,
  variacaoPercentual,
  type LeadDoDashboard,
  type PeriodoDoDashboard,
} from "@/lib/metrics/dashboard";

/** Quantos leads a tabela mostra antes do "Ver mais". */
const LEADS_VISIVEIS = 10;

/**
 * O Dashboard: o que entrou no período, em quanto tempo foi atendido, de onde
 * veio e onde está parado. Uma consulta só (`/api/v1/metrics/dashboard`), e o
 * período escolhido vale para tudo — menos para o funil, que é a foto de AGORA
 * (lead parado é problema de hoje, não do período).
 */
export function DashboardClient() {
  const t = useT();
  const [periodo, setPeriodo] = useState<PeriodoDoDashboard>("30d");
  const [funilEscolhido, setFunilEscolhido] = useState<string | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useDashboard(periodo);

  const seletor = (
    <SegmentedControl
      aria-label={t("Período")}
      size="md"
      value={periodo}
      onValueChange={(v) => {
        setPeriodo(v);
        setVerTodos(false);
      }}
      options={[
        { value: "hoje", label: t("Hoje") },
        { value: "7d", label: t("7 dias") },
        { value: "30d", label: t("30 dias") },
        { value: "90d", label: t("90 dias") },
      ]}
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label={t("Carregando o dashboard")}>
        {seletor}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6">
        {seletor}
        <Alert
          variant="destructive"
          title={t("Não consegui carregar o dashboard")}
          action={
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              {t("Tentar de novo")}
            </Button>
          }
        >
          {t("Pode ser uma falha de rede. Tente de novo em alguns segundos.")}
        </Alert>
      </div>
    );
  }

  const d = data.data;
  const { totais } = d;
  const variacao = variacaoPercentual(totais.leads, d.leads_periodo_anterior);
  const conversao = porcentagem(totais.ganhos, totais.leads);

  const funis = funisDoDashboard(d.etapas);
  const funilAtivo =
    funilEscolhido && funis.some((f) => f.id === funilEscolhido)
      ? funilEscolhido
      : funilInicial(d.etapas);
  const etapas = etapasDoFunil(d.etapas, funilAtivo);
  const gargalo = etapaGargalo(etapas);
  const maiorEtapa = Math.max(1, ...etapas.map((e) => e.abertos));
  const abertosAgora = etapas.reduce((acc, e) => acc + e.abertos, 0);
  const paradosAgora = etapas.reduce((acc, e) => acc + e.parados, 0);
  const semDonoAgora = etapas.reduce((acc, e) => acc + e.sem_dono, 0);

  const maiorDia = Math.max(1, ...d.por_dia.map((p) => p.leads));
  const maiorOrigem = Math.max(1, ...d.origens.map((o) => o.leads));
  const leadsNaTela = verTodos ? d.leads : d.leads.slice(0, LEADS_VISIVEIS);

  /** Rótulo da origem: literal por literal, para o guardião de idioma enxergar. */
  const rotuloDaOrigem = (origem: string): string => {
    switch (origem.toLowerCase()) {
      case "sem_origem":
        return t("Sem origem informada");
      case "manual":
        return t("Cadastro manual");
      case "whatsapp":
        return t("WhatsApp direto");
      case "whatsapp_agenda":
        return t("Agenda do celular");
      case "site":
        return t("Site");
      case "webhook":
        return t("Integração");
      case "import":
        return t("Importação");
      default:
        return origem;
    }
  };

  const celulaDaResposta = (lead: LeadDoDashboard) => {
    if (lead.resposta_segundos == null) {
      return <Badge variant="warning">{t("Sem resposta")}</Badge>;
    }
    return (
      <span className="tabular-nums">
        {duracaoLegivel(lead.resposta_segundos)}
        <span className="text-muted-foreground">
          {" · "}
          {lead.respondido_por === "pessoa" ? t("pessoa") : t("assistente")}
        </span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6" data-carregando={isFetching ? "sim" : "nao"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {seletor}
        <Button asChild size="sm" variant="outline">
          <Link href="/app/metrics">{t("Ver desempenho da equipe")}</Link>
        </Button>
      </div>

      {/* ─── Os números do período ─── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4">
        <StatCard
          label={t("Leads no período")}
          value={totais.leads}
          delta={
            variacao === null
              ? undefined
              : {
                  value: `${variacao > 0 ? "+" : ""}${variacao}%`,
                  trend: variacao > 0 ? "up" : variacao < 0 ? "down" : "neutral",
                }
          }
          context={
            <>
              <strong>{d.leads_periodo_anterior}</strong> {t("no período anterior")}
            </>
          }
          sparkline={d.por_dia.length > 1 ? d.por_dia.map((p) => p.leads) : undefined}
        />
        <StatCard
          label={t("Tempo até a 1ª resposta")}
          value={duracaoLegivel(totais.mediana_resposta_segundos)}
          context={
            totais.respondidos === 0 ? (
              t("Nenhum lead do período foi respondido ainda")
            ) : (
              <>
                {t("Metade dos leads é respondida até aqui. Média:")}{" "}
                <strong>{duracaoLegivel(totais.media_resposta_segundos)}</strong>
              </>
            )
          }
        />
        <StatCard
          label={t("Leads sem resposta")}
          value={totais.sem_resposta}
          context={
            <>
              <strong>{totais.respondidos}</strong> {t("já receberam resposta")}
            </>
          }
        />
        <StatCard
          label={t("Viraram venda")}
          value={conversao === null ? "—" : `${conversao}%`}
          context={
            <>
              <strong>{totais.ganhos}</strong> {t("ganhos")} · <strong>{totais.perdidos}</strong>{" "}
              {t("perdidos")} · <strong>{totais.abertos}</strong> {t("em aberto")}
            </>
          }
        />
      </div>

      {/* ─── Meta do mês e ritmo ─── */}
      <MetaNoDashboard />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── De onde vieram ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("De onde os leads vieram")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {d.origens.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Nenhum lead no período.")}</p>
            ) : (
              d.origens.slice(0, 8).map((o) => (
                <div
                  key={`${o.origem}|${o.meio ?? ""}|${o.campanha ?? ""}`}
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{rotuloDaOrigem(o.origem)}</span>
                      {o.meio || o.campanha ? (
                        <span className="text-muted-foreground">
                          {" · "}
                          {[o.meio, o.campanha].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {o.leads}
                      {o.ganhos > 0 ? (
                        <span className="text-success-foreground">
                          {" · "}
                          {o.ganhos} {o.ganhos === 1 ? t("venda") : t("vendas")}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${(o.leads / maiorOrigem) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">
              {t(
                "A origem vem da UTM do link (utm_source, utm_medium, utm_campaign) ou do anúncio. Sem UTM, mostramos por onde o lead foi cadastrado.",
              )}
            </p>
          </CardContent>
        </Card>

        {/* ─── Leads por dia ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Leads por dia")}</CardTitle>
          </CardHeader>
          <CardContent>
            {d.por_dia.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Nenhum lead no período.")}</p>
            ) : (
              <div className="flex h-40 items-end gap-1" role="img" aria-label={t("Leads por dia")}>
                {d.por_dia.map((p) => (
                  <div
                    key={p.dia}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    title={`${p.dia.slice(8, 10)}/${p.dia.slice(5, 7)} · ${p.leads}`}
                  >
                    <span className="text-xs tabular-nums text-muted-foreground">{p.leads}</span>
                    <div
                      className="w-full max-w-10 rounded-t bg-primary"
                      style={{ height: `${Math.max(4, (p.leads / maiorDia) * 112)}px` }}
                    />
                    <span className="truncate text-[10px] text-muted-foreground">
                      {p.dia.slice(8, 10)}/{p.dia.slice(5, 7)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── O funil agora ─── */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{t("Funil agora: onde os leads estão")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{abertosAgora}</strong> {t("em aberto")} ·{" "}
              <strong className="text-foreground">{paradosAgora}</strong>{" "}
              {t("parados há mais de 24 h")} ·{" "}
              <strong className="text-foreground">{semDonoAgora}</strong> {t("sem dono")}
            </p>
          </div>
          {funis.length > 1 && funilAtivo ? (
            <Select value={funilAtivo} onValueChange={setFunilEscolhido}>
              <SelectTrigger className="h-8 w-full max-w-56" aria-label={t("Funil")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {funis.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {etapas.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Nenhuma etapa configurada.")}</p>
          ) : (
            etapas.map((e) => (
              <div key={e.stage_id} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{e.stage_name}</span>
                    {gargalo?.stage_id === e.stage_id ? (
                      <Badge variant="warning">{t("Mais leads parados")}</Badge>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 tabular-nums">
                    {e.parados > 0 ? (
                      <span className="text-warning-foreground">
                        {e.parados} {e.parados === 1 ? t("parado") : t("parados")}
                      </span>
                    ) : null}
                    {e.sem_dono > 0 ? (
                      <span className="text-muted-foreground">
                        {e.sem_dono} {t("sem dono")}
                      </span>
                    ) : null}
                    <strong>{e.abertos}</strong>
                  </span>
                </div>
                {/* A barra é o total da etapa; o trecho de aviso é a parte parada. */}
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="flex h-full overflow-hidden rounded-full bg-primary transition-[width]"
                    style={{ width: `${(e.abertos / maiorEtapa) * 100}%` }}
                  >
                    <div
                      className="h-full bg-warning"
                      style={{ width: `${e.abertos > 0 ? (e.parados / e.abertos) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-warning" aria-hidden="true" />
              {t("Parado: sem atividade há mais de 24 h")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
              {t("Em andamento")}
            </span>
            <Link href="/app/kanban" className="text-primary underline-offset-4 hover:underline">
              {t("Abrir o funil")}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ─── Lead por lead ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Tempo de resposta de cada lead")}</CardTitle>
        </CardHeader>
        <CardContent>
          {d.leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Nenhum lead no período.")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Lead")}</TableHead>
                    <TableHead>{t("Chegou em")}</TableHead>
                    <TableHead>{t("Origem")}</TableHead>
                    <TableHead>{t("Etapa")}</TableHead>
                    <TableHead>{t("Dono")}</TableHead>
                    <TableHead className="text-right">{t("1ª resposta")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsNaTela.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/app/leads/${lead.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {lead.title}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {new Date(lead.created_at).toLocaleString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {rotuloDaOrigem(lead.origem)}
                        {lead.campanha ? (
                          <span className="text-muted-foreground"> · {lead.campanha}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>{lead.stage_name ?? "—"}</TableCell>
                      <TableCell>
                        {lead.owner_name ??
                          (lead.tem_dono ? (
                            t("Assistente")
                          ) : (
                            <span className="text-muted-foreground">{t("Sem dono")}</span>
                          ))}
                      </TableCell>
                      <TableCell className="text-right">{celulaDaResposta(lead)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {d.leads.length > LEADS_VISIVEIS ? (
                <div className="mt-3 flex justify-center">
                  <Button size="sm" variant="ghost" onClick={() => setVerTodos((v) => !v)}>
                    {verTodos ? t("Mostrar menos") : t("Ver mais leads")}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
