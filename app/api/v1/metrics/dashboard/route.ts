/**
 * GET /api/v1/metrics/dashboard — os números do Dashboard (tela `/app/radar`).
 *
 * Uma chamada só à RPC `fn_dashboard_de_leads` (migration 0762): leads criados
 * na janela, 1ª resposta por lead, origem/UTM e a foto do funil (parados e sem
 * dono por etapa). A organização vem de `authz.org.orgId`, NUNCA da query, e a
 * RPC roda com o client da sessão — a RLS é quem separa o que cada papel vê.
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/wrappers";
import { isServiceRoleConfigured } from "@/lib/audit";
import { requireRole } from "@/lib/auth/require-role";
import { traduzir } from "@/lib/i18n/dicionario";
import { normalizarDashboard, type DashboardDeLeads } from "@/lib/metrics/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MS_POR_DIA = 24 * 60 * 60 * 1000;
/** O mesmo teto das irmãs `/metrics/channels` e `/reports/*`. */
const DIAS_MAXIMOS = 90;
const FUSO_PADRAO = "America/Sao_Paulo";

const querySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  tz: z.string().min(1).max(64).optional(),
});

/** Fuso IANA que o runtime conhece; qualquer outra coisa cai no padrão. */
function fusoValido(tz: string | undefined): string {
  if (!tz) return FUSO_PADRAO;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return FUSO_PADRAO;
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const requestId = randomUUID();

  // Piso `agent`, como o resto de `/metrics`: a RLS escopa o que cada um lê.
  const authz = await requireRole("agent", { requestId, resource: "metrics" });
  if (!authz.ok) return authz.response;
  const t = (texto: string) => traduzir(texto, authz.user.idioma);

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    tz: url.searchParams.get("tz") ?? undefined,
  });
  if (!parsed.success) {
    return fail("validation_failed", t("Query inválida."), 422, {
      details: parsed.error.flatten().fieldErrors as Record<string, unknown>,
      requestId,
    });
  }

  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - THIRTY_DAYS_MS);
  if (from.getTime() >= to.getTime()) {
    return fail("validation_failed", t("Janela inválida: 'from' deve ser anterior a 'to'."), 422, {
      requestId,
    });
  }
  const dias = Math.ceil((to.getTime() - from.getTime()) / MS_POR_DIA);
  if (dias > DIAS_MAXIMOS) {
    return fail(
      "validation_failed",
      t("Janela de {dias} dias: o dashboard cobre no máximo {maximo} dias.")
        .replace("{dias}", String(dias))
        .replace("{maximo}", String(DIAS_MAXIMOS)),
      422,
      { requestId },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_dashboard_de_leads", {
    p_org: authz.org.orgId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_tz: fusoValido(parsed.data.tz),
  });
  if (error) return fail("internal_error", error.message, 500, { requestId });

  const dashboard = normalizarDashboard(
    data as unknown as Partial<Omit<DashboardDeLeads, "window">> | null,
  );

  // Nome de quem cuida de cada lead (mesmo padrão de /metrics/attendants).
  // Degrada para `null` quando o service role não está configurado (dev).
  const donos = [...new Set(dashboard.leads.map((l) => l.owner_user_id).filter(Boolean))] as string[];
  const nomes = new Map<string, string | null>();
  if (isServiceRoleConfigured() && donos.length > 0) {
    const admin = createAdminClient();
    await Promise.all(
      donos.map(async (id) => {
        const { data: userRes } = await admin.auth.admin.getUserById(id);
        const u = userRes?.user;
        nomes.set(id, (u?.user_metadata?.full_name as string | undefined) ?? u?.email ?? null);
      }),
    );
  }

  return ok(
    {
      window: { from: from.toISOString(), to: to.toISOString() },
      ...dashboard,
      leads: dashboard.leads.map((l) => ({
        ...l,
        owner_name: l.owner_user_id ? (nomes.get(l.owner_user_id) ?? null) : null,
      })),
    },
    { requestId },
  );
}
