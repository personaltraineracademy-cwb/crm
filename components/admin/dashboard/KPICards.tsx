"use client";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardKPIs } from "@/app/api/v1/admin/dashboard/kpis/route";
import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  subtitle: string;
  accent?: boolean;
  danger?: boolean;
}

/**
 * Um KPI do painel no `StatCard` do DS (§10.11): rótulo, valor tabular e
 * contexto. O valor fica sempre em `foreground`; o estado (aviso ou perigo)
 * aparece no contexto, em frase, para a cor não ser o único sinal.
 */
function KPICard({ label, value, subtitle, accent, danger }: KPICardProps) {
  return (
    <StatCard
      label={label}
      value={value.toLocaleString("pt-BR")}
      context={
        <span
          className={cn(
            danger && "text-danger-foreground font-medium",
            !danger && accent && "text-warning-foreground font-medium",
          )}
        >
          {subtitle}
        </span>
      }
    />
  );
}

interface KPICardsProps {
  kpis: DashboardKPIs;
}

export function KPICards({ kpis }: KPICardsProps) {
  const t = useT();
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-4">
      <KPICard
        label={t("Tenants ativos")}
        value={kpis.tenants_active}
        subtitle={t("organizações ativas")}
      />
      <KPICard
        label={t("Pendentes >10min")}
        value={kpis.conv_pending_10min}
        subtitle={t("conversas sem resposta")}
        accent={kpis.conv_pending_10min > 0}
      />
      <KPICard
        // SEM `t()`, e não é esquecimento: "Alertas WAHA" é nome próprio, e o
        // espanhol seria idêntico — a entrada no dicionário não mudaria uma
        // letra na tela. O que ela mudaria é a superfície: `lint:channels`
        // proíbe nomear o provider fora de `lib/channels/`, este arquivo já é
        // dívida DECLARADA (issue #118) e o dicionário não era. Traduzir aqui
        // espalharia o acoplamento para um arquivo novo em troca de nada.
        //
        // Quando o rótulo virar neutro de canal (Fase 3a, junto do seletor de
        // canal), ele passa a ter tradução de verdade e volta para `t()`.
        label="Alertas WAHA"
        value={kpis.waha_ban_alerts}
        subtitle={t("sessões com problema")}
        accent={kpis.waha_ban_alerts > 0}
      />
      <KPICard
        label={t("LGPD em risco")}
        value={kpis.lgpd_at_risk}
        subtitle={t("requisições próximas do prazo")}
        danger={kpis.lgpd_at_risk > 0}
      />
      {/* "acumulado", e não "no mês": o número vem de
          `ai_budgets.current_month_consumed_cents`, um contador que o gatilho
          soma sem olhar a data e que nada zera — ele é o gasto desde a
          instalação. O rótulo antigo dizia "uso ≥80%" sobre um teto MENSAL, e a
          divergência cresce com o tempo. Ver o comentário do cálculo em
          `app/api/v1/admin/dashboard/kpis/route.ts`. */}
      <KPICard
        label={t("Budgets IA")}
        value={kpis.ai_budget_warnings}
        subtitle={t("tenants com gasto acumulado ≥80% do teto")}
        accent={kpis.ai_budget_warnings > 0}
      />
    </div>
  );
}
