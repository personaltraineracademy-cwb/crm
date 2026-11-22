"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { FollowupFlowDetailRow } from "@/hooks/followup/useFollowupFlow";

/**
 * @xyflow/react is a large dependency — this is the ONLY route that loads it.
 * `ssr:false` + dynamic import keeps it out of the main bundle entirely; see
 * the bundle delta note in the task report.
 */
const FlowCanvas = dynamic(() => import("./FlowCanvas").then((m) => m.FlowCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[600px] items-center justify-center p-6">
      <Skeleton className="h-full w-full" />
    </div>
  ),
});

interface Props {
  flowId: string;
  initialData: FollowupFlowDetailRow;
}

export function FlowBuilder({ flowId, initialData }: Props) {
  return (
    // Altura FIXA na janela: o canvas ocupa a tela e quem rola é a paleta, nunca
    // a página. Antes a coluna crescia com o conteúdo (a paleta agrupada passa
    // de 800px) e os controles de zoom e o minimapa caíam para fora da vista.
    // Altura em `app/unnify/fluxo.css` (`.fluxo-construtor`). `flex-none`: com
    // `flex-1` a base flexível venceria a altura e a coluna voltaria a crescer.
    <div className="fluxo-construtor flex flex-none flex-col" data-testid="flow-builder-shell">
      <FlowCanvas flowId={flowId} initialData={initialData} />
    </div>
  );
}
