import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { traduzir } from "@/lib/i18n/dicionario";
import { DashboardClient } from "./_components/DashboardClient";
import { PainelPorConversa } from "./_components/PainelPorConversa";
import { RiskRadarList } from "./_components/RiskRadarList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function RadarPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) redirect("/app");
  // `t` local em vez do hook: esta página é componente de SERVIDOR, e lá o
  // idioma vem resolvido em `user.idioma` (a cadeia pessoa → organização →
  // padrão vive em `lib/auth/server.ts`), sem reler o `locale` cru.
  const idioma = user.idioma;
  const t = (texto: string) => traduzir(texto, idioma);

  return (
    <div className="flex h-full flex-col">
      {/* O chat é a primeira visão (pedido da dona, 25/11/2026); o painel de
          sempre, com o Radar de risco, fica na aba "Painel padrão". */}
      <PainelPorConversa
        padrao={
          <div className="flex flex-col gap-6">
            <DashboardClient />

      {/* O Radar de risco continua aqui, como a lista de quem precisa de
          ação agora — o dashboard acima diz ONDE está o problema; esta lista
          diz QUEM. */}
      <section className="flex flex-col gap-3" aria-labelledby="radar-de-risco">
        <div className="flex flex-col gap-1">
          <h2 id="radar-de-risco" className="text-base font-semibold">
            {t("Radar de risco")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              "Demandas abertas que esfriaram e precisam de você. Se o assistente já agendou um retorno, aparece como “em voo”; sem próximo passo, é risco de perder o cliente.",
            )}
          </p>
        </div>
        <RiskRadarList />
      </section>
          </div>
        }
      />
    </div>
  );
}
