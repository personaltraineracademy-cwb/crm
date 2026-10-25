/**
 * Análise → Meta Ads. O que a mídia paga está entregando, ao lado do resto da
 * análise, em vez de numa aba separada do Gerenciador de Anúncios.
 *
 * ─── Por que `manager`, e não `viewer` como Desempenho ──────────────────────
 *
 * A vizinha imediata no menu (`/app/metrics`) é aberta a todo mundo porque
 * mostra o funil e a performance de quem atende — e um `agent` vê as PRÓPRIAS
 * pela RLS. Aqui não há recorte por pessoa: orçamento, custo por lead e
 * criativo são da empresa inteira. É o mesmo grau de Evolução da IA e Audit
 * Log, os outros dois vizinhos do grupo, e os dois são `manager`.
 *
 * ─── Por que o token NÃO passa por aqui ─────────────────────────────────────
 *
 * Esta página pergunta apenas SE existe conexão (`existeConexaoDeLeitura`), que
 * não decifra nada. A única forma de garantir que um segredo não chega ao
 * browser é ele não entrar no componente que renderiza HTML — e a tentação de
 * "já que estou lendo a linha, leio o token junto" é exatamente como ele
 * vazaria para um prop de client component.
 */
import { redirect } from "next/navigation";

import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { ROLE_RANK } from "@/lib/auth/types";
import { traduzir } from "@/lib/i18n/dicionario";
import { existeConexaoDeLeitura } from "@/lib/plataformas-de-anuncio/credenciais-de-leitura";
import { createAdminClient } from "@/lib/supabase/admin";

import { MetaAdsClient } from "./_components/MetaAdsClient";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Megaphone } from "@/lib/ui/icons";

export const metadata = { title: "Meta Ads" };
export const dynamic = "force-dynamic";

export default async function MetaAdsPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) redirect("/app");
  if (!(user.is_platform_admin && !user.support) && ROLE_RANK[activeOrg.role] < ROLE_RANK.manager) {
    redirect("/403");
  }

  const admin = createAdminClient();
  const conexao = await existeConexaoDeLeitura(admin, activeOrg.orgId, "meta_ads");

  const idioma = user.idioma;
  const t = (texto: string) => traduzir(texto, idioma);
  // Quem NÃO pode conectar não deve ler "vá em Configurações" — a tela lá é
  // `admin`, e mandar um manager para uma porta que devolve 403 é pior que
  // dizer a verdade: ele precisa pedir para alguém.
  const podeConectar = (user.is_platform_admin && !user.support) || ROLE_RANK[activeOrg.role] >= ROLE_RANK.admin;

  return (
    /*
      Superfície clara — mesmo escopo de Desempenho, a vizinha no menu. `-m-6`
      cancela o respiro do `<main>` do AppShell para o Paper alcançar a borda, e
      o `p-6` o repõe. Abaixo de `sm` o respiro do `<main>` é `p-4`, e um `-m-6`
      ali alargava a página 16px além da tela: o par acompanha o do AppShell.
    */
    <div
      data-superficie="clara"
      className="-m-4 flex min-h-[calc(100%+2rem)] flex-col gap-6 bg-background p-4 text-foreground sm:-m-6 sm:min-h-[calc(100%+3rem)] sm:p-6"
    >
      <PageHeader
        title={t("Meta Ads")}
        description={t(
            "O desempenho das campanhas que estão trazendo gente para cá. Os números vêm da plataforma no momento em que você clica em Atualizar — nada fica guardado aqui.",
          )}
      />

      {conexao.conectada ? (
        <MetaAdsClient contaPadrao={conexao.contaPadrao} idioma={idioma} />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={Megaphone}
            title={t("Nenhuma conta de anúncios conectada.")}
            description={
              podeConectar
                ? t(
                    "Conecte um token de acesso com permissão de leitura de anúncios para ver as campanhas aqui.",
                  )
                : t(
                    "Peça a quem administra a organização para conectar a conta de anúncios em Configurações.",
                  )
            }
            action={
              podeConectar ? (
                <Button asChild>
                  <a href="/app/settings/meta-ads">{t("Conectar conta de anúncios")}</a>
                </Button>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
