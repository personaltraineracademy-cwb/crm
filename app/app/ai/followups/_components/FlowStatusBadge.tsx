import { ChipDeEstado, type TomDeEstado } from "@/components/ai/chip-de-estado";
import { useT } from "@/hooks/i18n/useT";
import type { FollowupFlowStatus } from "@/hooks/followup/useFollowupFlows";

const LABEL: Record<FollowupFlowStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  disabled: "Desativado",
};

const TOM: Record<FollowupFlowStatus, TomDeEstado> = {
  draft: "neutro",
  active: "sucesso",
  disabled: "aviso",
};

export function FlowStatusBadge({ status }: { status: FollowupFlowStatus }) {
  const t = useT();
  return (
    <ChipDeEstado tom={TOM[status]} aria-label={`${t("status")}: ${t(LABEL[status])}`}>
      {t(LABEL[status])}
    </ChipDeEstado>
  );
}
