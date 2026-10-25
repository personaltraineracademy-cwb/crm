"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/auth/AuthProvider";
import { destinosDaInterface } from "@/lib/navigation/interface";

import { useAgentInbox } from "@/hooks/ai/useAgentInbox";
import { useSonsDaCentral } from "@/hooks/notifications/useSonsDaCentral";
import { useT } from "@/hooks/i18n/useT";
import { Bell } from "@/lib/ui/icons";

/**
 * Sino da central de avisos (Operação Visível F1): contador de avisos abertos
 * do runtime do agente no header; clique leva a /app/ai/inbox.
 */
export function AlertsBell() {
  const { user, activeOrg } = useAuth();
  if (
    !destinosDaInterface(
      activeOrg?.interface_settings,
      user.is_platform_admin && !user.support,
      activeOrg?.role ?? null,
    ).some((d) => d.href === "/app/ai/inbox")
  )
    return null;
  return <VisibleAlertsBell />;
}
function VisibleAlertsBell() {
  const t = useT();
  const { data } = useAgentInbox("open");
  // O som da organização para a etapa que avisa e o pedido de pessoa.
  useSonsDaCentral(data?.items);
  const count = data?.open_count ?? 0;

  return (
    <Link
      href="/app/ai/inbox"
      aria-label={
        count > 0
          ? `${t("Central de avisos")} — ${count} ${t("em aberto")}`
          : t("Central de avisos")
      }
      data-testid="alerts-bell"
      className="hover:bg-interactive hover:text-interactive-foreground relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast lg:h-9 lg:w-9"
    >
      <Bell size={18} aria-hidden />
      {count > 0 ? (
        <span
          data-testid="alerts-bell-count"
          // Selo `primary` com texto de 12px (DS §10.6 e §10.20), e não mais o
          // vermelho de 10px: aviso em aberto é trabalho a fazer, não erro, e o
          // vermelho nesta casa é reservado a `destructive`. O anel na cor do
          // fundo separa o selo do desenho do sino.
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs leading-none font-medium text-primary-foreground tabular-nums ring-2 ring-background"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
