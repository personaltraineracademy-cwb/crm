"use client";

import { memo, useState } from "react";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showApiError } from "@/components/feedback/ApiErrorToast";
import { ApiError } from "@/lib/api/types";
import type { FlowGraph } from "@/lib/followup/graph-schema";
import type { PublishValidationError } from "@/lib/followup/validate-publish";
import { useT } from "@/hooks/i18n/useT";
import {
  useDisableFollowupFlow,
  usePublishFollowupFlow,
  useRollbackFollowupFlow,
  useSaveFollowupFlowDraft,
  useUpdateHandoffPolicy,
  type FollowupFlowDetailRow,
} from "@/hooks/followup/useFollowupFlow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClockCounterClockwise, DotsThree, Trash, TreeStructure } from "@/lib/ui/icons";
import { FlowStatusBadge } from "../../_components/FlowStatusBadge";
import { DeleteFollowupFlowButton } from "../../_components/DeleteFollowupFlowButton";
import { RenameFollowupFlowButton } from "../../_components/RenameFollowupFlowButton";
import { TriggerConfigControl } from "./TriggerConfigControl";

interface Props {
  flowId: string;
  flow: FollowupFlowDetailRow;
  graph: FlowGraph;
  /**
   * O grafo NO INSTANTE do clique. O canvas passa `graph` adiado (para não
   * recalcular a cada quadro do arrasto); salvar e publicar leem daqui, para
   * um clique logo depois de digitar nunca gravar o estado de um quadro antes.
   */
  obterGrafo?: () => FlowGraph;
  dirty: boolean;
  selection: "node" | "edge" | null;
  onDeleteSelection: () => void;
  onSaved: (graph: FlowGraph) => void;
  onPublishErrors: (errorsByNode: Record<string, string[]>) => void;
  onPublishSuccess: () => void;
  onAutoFit?: () => void;
  canAutoFit?: boolean;
}

const HANDOFF_LABEL: Record<FollowupFlowDetailRow["handoff_policy"], string> = {
  pause: "Pausar quando um humano assume",
  cancel: "Cancelar quando um humano assume",
  allow: "Continuar quando um humano assume",
};

function PublishBarBase({
  flowId,
  flow,
  graph,
  obterGrafo,
  dirty,
  selection,
  onDeleteSelection,
  onSaved,
  onPublishErrors,
  onPublishSuccess,
  onAutoFit,
  canAutoFit = false,
}: Props) {
  const t = useT();
  const [openDeleteSelection, setOpenDeleteSelection] = useState(false);
  const save = useSaveFollowupFlowDraft(flowId);
  const publish = usePublishFollowupFlow(flowId);
  const disable = useDisableFollowupFlow(flowId);
  const rollback = useRollbackFollowupFlow(flowId);
  const handoffPolicy = useUpdateHandoffPolicy(flowId);
  const deRoteiro = flow.surface === "atendimento";

  const onSave = () => {
    const atual = obterGrafo?.() ?? graph;
    save.mutate(atual, { onSuccess: () => onSaved(atual) });
  };

  const onPublish = async () => {
    const atual = obterGrafo?.() ?? graph;
    try {
      await save.mutateAsync(atual);
      onSaved(atual);
    } catch {
      return; // save's own onError already toasted — don't attempt publish on a failed save
    }

    publish.mutate(undefined, {
      onSuccess: () => onPublishSuccess(),
      onError: (err) => {
        if (err instanceof ApiError && err.code === "validation_failed") {
          const errors = (err.details?.errors as PublishValidationError[] | undefined) ?? [];
          const byNode: Record<string, string[]> = {};
          const flowLevel: string[] = [];
          for (const e of errors) {
            if (e.node_id) (byNode[e.node_id] ??= []).push(e.message);
            else flowLevel.push(e.message);
          }
          onPublishErrors(byNode);
          toast.error(t("Fluxo reprovado na validação — corrija os nós destacados."), {
            description: flowLevel.length > 0 ? flowLevel.join(" ") : undefined,
          });
          return;
        }
        showApiError(err);
      },
    });
  };

  const onDisable = () => disable.mutate();

  const canRollback = flow.versions_count > 1 && flow.previous_version_id !== null;
  const onRollback = () => {
    if (!flow.previous_version_id) return;
    rollback.mutate(flow.previous_version_id);
  };

  const busy = save.isPending || publish.isPending || disable.isPending || rollback.isPending;

  return (
    <div className="fluxo-barra" data-testid="flow-toolbar">
      <div className="fluxo-barra__titulo">
        <h1 className="truncate text-base font-semibold text-foreground" title={flow.name}>
          {flow.name}
        </h1>
        <RenameFollowupFlowButton
          flowId={flowId}
          flowName={flow.name}
          variant="ghost"
          size="icon"
        />
        <FlowStatusBadge status={flow.status} />
        {dirty && (
          <Badge variant="warning" data-testid="dirty-indicator">
            {t("Alterações não salvas")}
          </Badge>
        )}
      </div>

      <div className="fluxo-barra__principal">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dirty || busy}
          onClick={onSave}
        >
          {save.isPending ? t("Salvando…") : t("Salvar")}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={onPublish}
          data-testid="publish-button"
        >
          {publish.isPending ? t("Publicando…") : t("Publicar")}
        </Button>
      </div>

      <div className="fluxo-barra__ferramentas">
        {/* Configuração do fluxo: o que dispara e o que fazer no handoff.
            O roteiro de atendimento começa por palavra-gatilho ou roteador (no
            Início do grafo) e encerra quando um humano assume (0397): o gatilho
            de relógio e a política de handoff do follow-up não valem para ele —
            na prova do #1130 esta barra aparecia igual e confundia. */}
        {!deRoteiro && <TriggerConfigControl flowId={flowId} triggerConfig={flow.trigger_config} />}

        {!deRoteiro && (
          <Select
            value={flow.handoff_policy}
            onValueChange={(v) =>
              handoffPolicy.mutate(v as FollowupFlowDetailRow["handoff_policy"])
            }
          >
            <SelectTrigger size="sm" className="w-80" aria-label={t("Quando um humano assume")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(HANDOFF_LABEL) as Array<keyof typeof HANDOFF_LABEL>).map((k) => (
                <SelectItem key={k} value={k}>
                  {t(HANDOFF_LABEL[k])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <span aria-hidden className="fluxo-barra__divisor" />

        {/* Ferramentas do desenho e da versão: peso baixo (ghost). */}
        {onAutoFit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canAutoFit}
            onClick={onAutoFit}
            data-testid="auto-fit-flow"
            title={t("Organizar")}
          >
            <TreeStructure size={16} aria-hidden className="mr-1" />
            {t("Organizar")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy || !canRollback}
          onClick={onRollback}
          data-testid="rollback-button"
          title={t("Voltar para a versão anterior")}
        >
          <ClockCounterClockwise size={16} aria-hidden className="mr-1" />
          {t("Versão anterior")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label={t("Mais ações")}
              title={t("Mais ações")}
            >
              <DotsThree size={18} weight="bold" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={busy || flow.status === "disabled"} onSelect={onDisable}>
              {t("Desativar")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Destrutivas: só ícone, separadas da ação principal, sempre com confirmação. */}
        {selection ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              data-testid="delete-selection"
              onClick={() => setOpenDeleteSelection(true)}
            >
              <Trash size={14} aria-hidden className="mr-1" />
              {selection === "node" ? t("Excluir nó") : t("Excluir aresta")}
            </Button>
            <AlertDialog open={openDeleteSelection} onOpenChange={setOpenDeleteSelection}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selection === "node" ? t("Excluir este nó?") : t("Excluir esta aresta?")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {selection === "node"
                      ? t(
                          "Este nó e as arestas ligadas a ele são apagados. Não é possível desfazer.",
                        )
                      : t("A aresta entre os dois nós é apagada. Não é possível desfazer.")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenDeleteSelection(false);
                      onDeleteSelection();
                    }}
                  >
                    {t("Excluir")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <DeleteFollowupFlowButton
            flowId={flowId}
            flowName={flow.name}
            redirectToList
            listHref={deRoteiro ? "/app/ai/atendimento" : "/app/ai/followups"}
            variant="ghost"
            iconOnly
          />
        )}
      </div>

      {/* A ação principal fica no fim, sozinha com peso de primária. No celular
            ela sobe para a linha de baixo do título e nunca sai da tela. */}
    </div>
  );
}

/** `memo`: o canvas passa callbacks estáveis e o grafo adiado — a barra não re-renderiza a cada quadro do arrasto. */
export const PublishBar = memo(PublishBarBase);
