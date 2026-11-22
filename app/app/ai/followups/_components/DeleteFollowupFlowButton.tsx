"use client";

import { useT } from "@/hooks/i18n/useT";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { Button } from "@/components/ui/button";
import { Trash } from "@/lib/ui/icons";
import { useDeleteFollowupFlow } from "@/hooks/followup/useFollowupFlow";

type Props = {
  flowId: string;
  flowName: string;
  /** Depois de apagar o fluxo aberto no editor, volta pra lista. */
  redirectToList?: boolean;
  /** Lista para onde voltar após excluir (a da superfície atual). */
  listHref?: string;
  variant?: "outline" | "ghost";
  size?: "sm" | "default";
  /**
   * Só o ícone (o texto fica para o leitor de tela e no `title`). Usado na
   * barra do construtor, onde a ação destrutiva não disputa peso com Publicar.
   */
  iconOnly?: boolean;
};

export function DeleteFollowupFlowButton({
  flowId,
  flowName,
  redirectToList = false,
  listHref = "/app/ai/followups",
  variant = "outline",
  size = "sm",
  iconOnly = false,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const del = useDeleteFollowupFlow();

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={iconOnly ? "icon" : size}
        className={
          iconOnly ? "size-9 text-muted-foreground hover:text-destructive" : "text-destructive"
        }
        title={iconOnly ? t("Excluir") : undefined}
        disabled={del.isPending}
        data-testid="delete-followup-flow"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Trash size={iconOnly ? 16 : 14} aria-hidden className={iconOnly ? undefined : "mr-1"} />
        {iconOnly ? <span className="sr-only">{t("Excluir")}</span> : t("Excluir")}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Excluir “{nome}”?").replace("{nome}", flowName)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("Inscrições e versões deste fluxo são apagadas junto. Não é possível desfazer.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(flowId, {
                  onSuccess: () => {
                    setOpen(false);
                    if (redirectToList) router.push(listHref);
                  },
                });
              }}
            >
              {del.isPending ? t("Excluindo…") : t("Excluir")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
