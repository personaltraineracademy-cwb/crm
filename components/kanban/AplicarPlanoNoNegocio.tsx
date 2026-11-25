"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/hooks/i18n/useT";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import type { PlanoDeTarefas } from "@/lib/tarefas/plano";
import { FlowArrow } from "@/lib/ui/icons";

/**
 * "Aplicar plano" dentro do negócio: escolhe um plano de tarefas (a sequência
 * por dias cadastrada em Tarefas › Planos) e ele vira as tarefas deste negócio,
 * na ordem e com os prazos do plano.
 *
 * Antes só a automação aplicava plano; quem estava com o negócio aberto não
 * tinha como começar a sequência na hora. A rota usa a mesma função do motor, e
 * reaplicar o mesmo plano não duplica tarefa — a tela diz que já estava aplicado.
 */
export function AplicarPlanoNoNegocio({
  leadId,
  aberto,
  rotulo,
  classeDoGatilho,
}: {
  leadId: string;
  aberto: boolean;
  /** O texto do gatilho. Padrão: "Aplicar plano". O painel novo diz "Escolher template". */
  rotulo?: string;
  /** Troca a aparência do gatilho (o link discreto vira botão largo no painel). */
  classeDoGatilho?: string;
}) {
  const t = useT();
  const queryClient = useQueryClient();

  // A mesma consulta (e a mesma chave) da tela de Planos: um plano criado lá
  // aparece aqui sem recarregar.
  const planos = useQuery({
    queryKey: ["settings", "task-plans"],
    queryFn: async () =>
      apiClient.get<{ data: { planos: PlanoDeTarefas[] } }>("/api/v1/settings/task-plans"),
    enabled: aberto,
    staleTime: 60_000,
  });

  const aplicar = useMutation({
    mutationFn: async (plano: PlanoDeTarefas) =>
      apiClient.post<{ data: { ja_aplicado: boolean; tarefas: number } }>(
        `/api/v1/leads/${leadId}/task-plan`,
        { plano_id: plano.id },
      ),
    onSuccess: async (resposta) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["crm_tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["board"] }),
      ]);
      if (resposta.data.ja_aplicado) {
        toast.info(t("Este plano já tinha sido aplicado a este negócio."));
      } else {
        toast.success(
          t("Plano aplicado: {n} tarefas criadas.").replace("{n}", String(resposta.data.tarefas)),
        );
      }
    },
    onError: (erro) => {
      toast.error(erro instanceof ApiError ? erro.message : t("Erro ao aplicar o plano."));
    },
  });

  const lista = planos.data?.data.planos ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          classeDoGatilho ??
          "flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:opacity-50"
        }
        disabled={aplicar.isPending}
      >
        <FlowArrow size={12} aria-hidden />
        {aplicar.isPending ? t("Aplicando…") : (rotulo ?? t("Aplicar plano"))}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t("Planos de tarefa")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {planos.isLoading ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("Carregando…")}</p>
        ) : planos.isError ? (
          <p className="px-2 py-1.5 text-xs text-destructive">
            {t("Não foi possível carregar os planos.")}
          </p>
        ) : lista.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            {t("Nenhum plano cadastrado ainda.")}
          </p>
        ) : (
          lista.map((plano) => (
            <DropdownMenuItem
              key={plano.id}
              onSelect={() => aplicar.mutate(plano)}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="text-sm font-medium">{plano.nome}</span>
              <span className="text-xs text-muted-foreground">
                {plano.passos.length} {plano.passos.length === 1 ? t("tarefa") : t("tarefas")}
                {" · "}
                {t("até {n} dias").replace(
                  "{n}",
                  String(Math.max(0, ...plano.passos.map((p) => p.vence_em_dias))),
                )}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/tasks/planos">{t("Criar ou editar planos")}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
