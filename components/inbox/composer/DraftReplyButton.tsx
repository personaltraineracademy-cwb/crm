"use client";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Sparkle } from "@/lib/ui/icons";
import { useDraftReply } from "@/hooks/inbox/useDraftReply";
import { ACAO_DO_CAMPO } from "./acao-do-campo";

interface Props {
  conversationId: string;
  onDraft: (text: string) => void;
  disabled?: boolean;
}

/** Onda 5.1: botão "Sugerir resposta" — gera rascunho via agente publicado, sem enviar. */
export function DraftReplyButton({ conversationId, onDraft, disabled }: Props) {
  const t = useT();
  const mutation = useDraftReply();

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={ACAO_DO_CAMPO}
      aria-label={t("Sugerir resposta")}
      aria-busy={mutation.isPending}
      disabled={disabled || mutation.isPending}
      onClick={() => {
        mutation.mutate(conversationId, {
          onSuccess: (res) => onDraft(res.data.draft),
        });
      }}
    >
      <Sparkle size={16} weight={mutation.isPending ? "duotone" : "regular"} aria-hidden />
    </Button>
  );
}
