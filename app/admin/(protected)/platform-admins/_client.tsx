"use client";
import { DBAOnlyNotice } from "@/components/admin/platform-admins/DBAOnlyNotice";
import {
  PlatformAdminsTable,
  PlatformAdminsTableSkeleton,
} from "@/components/admin/platform-admins/PlatformAdminsTable";
import { useAdminPlatformAdmins } from "@/hooks/useAdminPlatformAdmins";
import { useT } from "@/hooks/i18n/useT";
import { PageHeader } from "@/components/ui/page-header";

export function PlatformAdminsClient() {
  const t = useT();
  const { data, isLoading, isError } = useAdminPlatformAdmins();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("Platform Admins")}
        description={t("Administradores com acesso privilegiado à plataforma")}
      />

      {/* T-04 Notice — proeminente, antes da tabela */}
      <DBAOnlyNotice />

      {/* Table */}
      {isLoading ? (
        <PlatformAdminsTableSkeleton />
      ) : isError ? (
        <div className="flex items-center justify-center rounded-lg border py-12 text-sm text-muted-foreground">
          {t("Erro ao carregar platform admins. Tente recarregar.")}
        </div>
      ) : (
        <PlatformAdminsTable data={data ?? []} />
      )}
    </div>
  );
}
