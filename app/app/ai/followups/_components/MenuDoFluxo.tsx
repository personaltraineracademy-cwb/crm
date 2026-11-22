"use client";

import { useState } from "react";

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
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MenuDoCartao } from "@/components/cartao-de-registro";
import { useT } from "@/hooks/i18n/useT";
import { useDuplicateFollowupFlow, useExportFollowupFlow } from "@/hooks/followup/useFollowupFlows";
import { useDeleteFollowupFlow } from "@/hooks/followup/useFollowupFlow";
import { Copy, DownloadSimple, PencilSimple, Trash } from "@/lib/ui/icons";
import { RenameFollowupFlowDialog } from "./RenameFollowupFlowDialog";

interface Props {
  flowId: string;
  flowName: string;
}

/**
 * Ações do cartão do fluxo na lista: Renomear, Duplicar, Exportar e, depois de
 * um separador, Excluir em vermelho. Cada uma faz o mesmo que o botão do
 * construtor (mesmos hooks e mesmo diálogo); só mudou o lugar.
 *
 * Os diálogos ficam ao lado do menu, não dentro: o conteúdo do menu desmonta ao
 * fechar, e levaria o diálogo junto.
 */
export function MenuDoFluxo({ flowId, flowName }: Props) {
  const t = useT();
  const duplicar = useDuplicateFollowupFlow();
  const exportar = useExportFollowupFlow();
  const excluir = useDeleteFollowupFlow();
  const [renomearAberto, setRenomearAberto] = useState(false);
  const [excluirAberto, setExcluirAberto] = useState(false);

  return (
    <>
      <MenuDoCartao rotulo={`${t("Menu de ações")}: ${flowName}`}>
        <DropdownMenuItem data-testid="rename-followup-flow" onSelect={() => setRenomearAberto(true)}>
          <PencilSimple aria-hidden /> {t("Renomear")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="duplicate-followup-flow"
          disabled={duplicar.isPending}
          onSelect={() => duplicar.mutate(flowId)}
        >
          <Copy aria-hidden /> {duplicar.isPending ? t("Duplicando…") : t("Duplicar")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="export-followup-flow"
          disabled={exportar.isPending}
          onSelect={() => exportar.mutate(flowId)}
        >
          <DownloadSimple aria-hidden /> {exportar.isPending ? t("Exportando…") : t("Exportar")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          data-testid="delete-followup-flow"
          onSelect={() => setExcluirAberto(true)}
        >
          <Trash aria-hidden /> {t("Excluir")}
        </DropdownMenuItem>
      </MenuDoCartao>

      <RenameFollowupFlowDialog
        flowId={flowId}
        flowName={flowName}
        open={renomearAberto}
        onOpenChange={setRenomearAberto}
      />

      <AlertDialog open={excluirAberto} onOpenChange={setExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Excluir “{nome}”?").replace("{nome}", flowName)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Inscrições e versões deste fluxo são apagadas junto. Não é possível desfazer.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluir.isPending}
              onClick={(e) => {
                e.preventDefault();
                excluir.mutate(flowId, { onSuccess: () => setExcluirAberto(false) });
              }}
            >
              {excluir.isPending ? t("Excluindo…") : t("Excluir")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
