"use client";
import Link from "next/link";
import { Info } from "@/lib/ui/icons";
import { useT } from "@/hooks/i18n/useT";

export function DBAOnlyNotice() {
  const t = useT();
  return (
    <div
      role="note"
      className="border-info-border bg-info-soft text-info-foreground flex gap-3 rounded-xl border p-4"
    >
      <Info size={20} className="text-info-foreground mt-0.5 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-semibold">
          {t("Gerenciamento de Platform Admins é restrito ao DBA")}
        </p>
        <p className="text-info-foreground text-sm leading-relaxed">
          {t("Conforme Spec 01 §3.4 T-04: adição, remoção ou alteração de")}{" "}
          <code className="rounded-lg bg-info-soft px-1 font-mono text-xs">
            platform_admins
          </code>{" "}
          {t("é feita exclusivamente via SQL pelo DBA, com nota explicativa em")}{" "}
          <code className="rounded-lg bg-info-soft px-1 font-mono text-xs">
            api_audit_log
          </code>
          {t(
            ". Esta página é informativa e read-only — nenhum botão de modificação está disponível por design.",
          )}
        </p>
        <p className="pt-1">
          <Link
            href="/runbook/platform-admin-management.md"
            className="text-info-foreground hover:text-info-foreground text-xs font-medium underline underline-offset-2"
          >
            {t("Ver runbook →")}
          </Link>
        </p>
      </div>
    </div>
  );
}
