import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * POST /api/v1/leads/[id]/task-plan — aplica um plano de tarefas a ESTE negócio
 * pela tela (o dossiê do funil).
 *
 * Até aqui o plano só era aplicado por automação (`apply_task_plan`): quem
 * estava com o negócio aberto e queria iniciar a sequência na hora não tinha
 * botão. A regra é a MESMA função do motor (`aplicarPlanoDeTarefas`): mesma
 * ordem, mesmos prazos, mesma marca de idempotência — aplicar duas vezes o
 * mesmo plano no mesmo negócio não duplica tarefa.
 *
 * Duas chaves, nesta ordem:
 *  1. O negócio é lido com o client da SESSÃO — a RLS decide se esta pessoa
 *     enxerga o negócio. Não enxerga, é 404.
 *  2. Só então o plano é aplicado com o client de serviço (a função grava
 *     tarefas e a marca da aplicação), com `organization_id` vindo de
 *     `authz.org.orgId`, nunca do corpo.
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/wrappers";
import { audit, isServiceRoleConfigured } from "@/lib/audit";
import { requireRole } from "@/lib/auth/require-role";
import { traduzir } from "@/lib/i18n/dicionario";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { aplicarPlanoDeTarefas } from "@/lib/tarefas/plano";

export const dynamic = "force-dynamic";

const corpoSchema = z.object({ plano_id: z.string().min(1).max(120) });

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const negado = await requireSupportWrite();
  if (negado) return negado;

  const requestId = randomUUID();
  const { id: leadId } = await ctx.params;

  const authz = await requireRole("agent", { requestId, resource: "crm_tasks" });
  if (!authz.ok) return authz.response;
  const t = (texto: string) => traduzir(texto, authz.user.idioma);

  const parsed = corpoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(leadId).success) {
    return fail("validation_failed", t("Escolha um plano de tarefas."), 422, { requestId });
  }

  // (1) A RLS decide se esta pessoa enxerga o negócio.
  const supabase = await createClient();
  const { data: negocio, error: erroDoNegocio } = await supabase
    .from("crm_leads")
    .select("id")
    .eq("id", leadId)
    .eq("organization_id", authz.org.orgId)
    .maybeSingle();
  if (erroDoNegocio) {
    return fail("internal_error", t("Erro ao aplicar o plano."), 500, { requestId });
  }
  if (!negocio) return fail("not_found", t("Negócio não encontrado."), 404, { requestId });

  if (!isServiceRoleConfigured()) {
    return fail("internal_error", t("Erro ao aplicar o plano."), 500, { requestId });
  }

  // (2) A mesma função do motor de automação.
  const resultado = await aplicarPlanoDeTarefas(createAdminClient(), {
    organizationId: authz.org.orgId,
    leadId,
    planoId: parsed.data.plano_id,
    origem: "tela:lead",
    requestId,
  });

  if (!resultado.ok) {
    switch (resultado.codigo) {
      case "plano_nao_encontrado":
        return fail("not_found", t("Este plano não existe mais. Atualize a tela."), 404, {
          requestId,
        });
      case "sem_dono":
        return fail(
          "validation_failed",
          t("Este plano atribui tarefas ao dono do negócio, e este negócio está sem dono. Defina o dono e aplique de novo."),
          422,
          { requestId },
        );
      case "falha":
        return fail("internal_error", t("Erro ao aplicar o plano."), 500, { requestId });
      default:
        return fail("validation_failed", t("Não foi possível aplicar este plano a este negócio."), 422, {
          requestId,
        });
    }
  }

  // Só audita quando houve efeito: reaplicar um plano já aplicado não grava nada.
  if (!resultado.ja_aplicado) {
    await audit({
      organizationId: authz.org.orgId,
      actorUserId: authz.user.id,
      action: "crm_task_plan.applied",
      resourceType: "crm_leads",
      resourceId: leadId,
      requestId,
      metadata: { plano_id: parsed.data.plano_id, tarefas: resultado.tarefa_ids.length },
    });
  }

  return ok(
    { ja_aplicado: resultado.ja_aplicado, tarefas: resultado.tarefa_ids.length },
    { requestId, status: resultado.ja_aplicado ? 200 : 201 },
  );
}
