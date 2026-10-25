"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "@/lib/ui/icons";
import { TenantsFilters } from "@/components/admin/tenants/TenantsFilters";
import {
  TenantsTable,
  TenantsTableSkeleton,
} from "@/components/admin/tenants/TenantsTable";
import { useAdminTenants, type AdminTenantsFilters } from "@/hooks/useAdminTenants";
import { useT } from "@/hooks/i18n/useT";
import { PageHeader } from "@/components/ui/page-header";

export function TenantsClient() {
  const t = useT();
  const [filters, setFilters] = useState<AdminTenantsFilters>({});

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAdminTenants(filters);

  const rows = data?.pages.flatMap((p) => p.data ?? []) ?? [];
  const total = rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Tenants")}
        meta={
          <span className="tabular-nums">
            {isLoading ? t("Carregando...") : `${total} tenant${total !== 1 ? "s" : ""}${hasNextPage ? "+" : ""}`}
          </span>
        }
        actions={
          <Button asChild size="sm">
            <Link href="/admin/tenants/new">
              <Plus size={16} aria-hidden />
              {t("Novo tenant")}
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <TenantsFilters filters={filters} onChange={setFilters} />

      {/* Table */}
      {isLoading ? (
        <TenantsTableSkeleton />
      ) : (
        <TenantsTable
          data={rows}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      )}
    </div>
  );
}
