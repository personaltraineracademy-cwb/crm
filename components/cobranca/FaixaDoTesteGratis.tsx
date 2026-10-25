"use client";

import Link from "next/link";

import { useT } from "@/hooks/i18n/useT";
import { fraseDaFaixa } from "@/lib/cobranca/faixa";

/**
 * A faixa de teste grátis em `/app` (spec da cobrança §9): só para o admin da
 * empresa, só com a cobrança ligada, nos últimos 7 dias. É porta, não trava:
 * leva ao painel do plano.
 */
export function FaixaDoTesteGratis({ dias }: { dias: number }) {
  const t = useT();
  return (
    <div
      role="status"
      className="border-info-border bg-info-soft text-info-foreground flex flex-wrap items-center justify-center gap-2 border-b px-4 py-2 text-sm"
    >
      <span>{t(fraseDaFaixa(dias)).replace("{n}", String(dias))}</span>
      <Link href="/app/settings/billing" className="font-medium underline">
        {t("Ver o plano")}
      </Link>
    </div>
  );
}
