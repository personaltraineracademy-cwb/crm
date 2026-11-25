"use client";

import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";

import { useT } from "@/hooks/i18n/useT";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  CartaoDeRegistro,
  CartaoDeRegistroCarregando,
  GradeDeRegistros,
} from "@/components/cartao-de-registro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { FlowArrow, Plus, Sparkle, UploadSimple } from "@/lib/ui/icons";
import { useFollowupFlows, type FollowupFlowPointerRow } from "@/hooks/followup/useFollowupFlows";
import type { FollowupFlowSurface } from "@/lib/followup/api-schemas";
import { FlowStatusBadge } from "./FlowStatusBadge";
import { ImportFlowDialog } from "./ImportFlowDialog";
import { ModelosDialog } from "./ModelosDialog";
import { MenuDoFluxo } from "./MenuDoFluxo";
import { NewFlowDialog } from "./NewFlowDialog";

interface Props {
  initialData: FollowupFlowPointerRow[];
  canWrite: boolean;
  /** Recorte por superfície. Ausente = todos (comportamento atual). */
  surface?: FollowupFlowSurface;
  /**
   * `id` de um elemento do CABEÇALHO da página onde as ações da lista (Importar,
   * Começar de um modelo, Novo fluxo) devem aparecer — na linha do título, à
   * direita (guia 2.6). Sem ele, ou se o elemento não existe, elas ficam acima
   * da lista, como antes.
   */
  idDoAlvoDasAcoes?: string;
}

/** «21/11» no ano corrente; com o ano («21/11/2025») quando é de outro. */
function formatUpdatedAt(iso: string, idioma: string): string {
  const data = new Date(iso);
  const outroAno = data.getFullYear() !== new Date().getFullYear();
  return data.toLocaleDateString(idioma, {
    day: "2-digit",
    month: "2-digit",
    ...(outroAno ? { year: "numeric" as const } : {}),
  });
}

/**
 * A política de handoff em palavra de gente, para o cartão da lista (#3104).
 *
 * A coluna mostrava o valor CRU do banco (`pause`, `cancel`, `allow`) ao lado
 * de «Handoff» — com o perfil em espanhol, «Transferencia: pause». O `value`
 * gravado continua o mesmo; o seletor da barra de publicação mantém as frases
 * longas dele («Pausar quando um humano assume»), porque ali há espaço para explicar.
 */
const HANDOFF_EM_PALAVRA: Record<string, string> = {
  pause: "Pausar",
  cancel: "Cancelar",
  allow: "Continuar",
};

export function FlowsList({ initialData, canWrite, surface, idDoAlvoDasAcoes }: Props) {
  const tagDoIdioma = useTagDeIdioma();
  const t = useT();
  const { data, isLoading } = useFollowupFlows({ initialData, ...(surface ? { surface } : {}) });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modelosOpen, setModelosOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const deAtendimento = surface === "atendimento";
  // O alvo mora no cabeçalho (componente de servidor); só existe no DOM depois da hidratação.
  const [alvoDasAcoes, setAlvoDasAcoes] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setAlvoDasAcoes(idDoAlvoDasAcoes ? document.getElementById(idDoAlvoDasAcoes) : null);
  }, [idDoAlvoDasAcoes]);

  const flows = data ?? [];
  // Cada superfície tem a SUA rota de editor: abrir um fluxo de atendimento não
  // pode jogar o usuário na lista de Follow-ups.
  const baseHref = deAtendimento ? "/app/ai/atendimento" : "/app/ai/followups";

  // ⚠️ Na tela VAZIA, "Começar de um modelo" é o botão cheio: quem chega aqui numa
  // instalação nova não sabe o que é nó, ramo ou prazo de graça, e mandá-lo para
  // uma tela em branco é o caminho mais curto para a clínica nunca ter follow-up
  // nenhum. Na LISTA (já há fluxos) a ação principal é "Novo fluxo", e o modelo
  // e a importação ficam como secundários.
  const modelosButton = (cheio: boolean) => (
    <Button
      onClick={() => setModelosOpen(true)}
      variant={cheio ? "default" : "outline"}
      className="w-full sm:w-auto"
    >
      <Sparkle size={14} aria-hidden /> {t("Começar de um modelo")}
    </Button>
  );

  const newFlowButton = (cheio: boolean, className?: string) => (
    <Button
      onClick={() => setDialogOpen(true)}
      variant={cheio ? "default" : "outline"}
      className={cn("w-full sm:w-auto", className)}
    >
      <Plus size={14} aria-hidden />
      {deAtendimento ? t("Novo fluxo de atendimento") : t("Novo fluxo")}
    </Button>
  );

  // Importar é o caminho de quem JÁ tem um fluxo pronto (exportado aqui ou em
  // outra conta): sempre secundário.
  const importButton = (
    <Button
      onClick={() => setImportOpen(true)}
      variant="outline"
      className="w-full sm:w-auto"
      data-testid="import-followup-flow"
    >
      <UploadSimple size={14} aria-hidden /> {t("Importar fluxo")}
    </Button>
  );

  const dialogos = canWrite && (
    <>
      <NewFlowDialog open={dialogOpen} onOpenChange={setDialogOpen} surface={surface} />
      <ImportFlowDialog open={importOpen} onOpenChange={setImportOpen} baseHref={baseHref} />
      {!deAtendimento && (
        <ModelosDialog
          open={modelosOpen}
          onOpenChange={setModelosOpen}
          nomesExistentes={flows.map((f) => f.name)}
        />
      )}
    </>
  );

  if (isLoading && flows.length === 0) {
    return (
      <GradeDeRegistros aria-busy="true">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <CartaoDeRegistroCarregando />
          </li>
        ))}
      </GradeDeRegistros>
    );
  }

  if (flows.length === 0) {
    return (
      <>
        <Card>
          <EmptyState
            icon={FlowArrow}
            title={deAtendimento ? t("Nenhum fluxo de atendimento ainda") : t("Nenhum fluxo de follow-up ainda")}
            description={
              deAtendimento
                ? t(
                    "Os fluxos de atendimento cadastram as perguntas que a IA faz durante a conversa e o que acontece ao concluir — os dados ficam guardados por cliente.",
                  )
                : t(
                    "Follow-ups reengajam contatos após silêncio, mudança de etapa, uma regra em Webhooks ou a resposta do contato — sem depender de alguém lembrar de mandar mensagem.",
                  )
            }
            action={
              canWrite ? (
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  {deAtendimento ? newFlowButton(true) : modelosButton(true)}
                  {!deAtendimento && newFlowButton(false)}
                  {importButton}
                </div>
              ) : undefined
            }
          />
        </Card>
        {dialogos}
      </>
    );
  }

  // Os diálogos ficam no MESMO lugar da árvore nos dois ramos — segundo filho do fragmento.
  // Dentro da <div> deste ramo, a primeira importação (a lista vai de 0 para 1) remontava o diálogo e o
  // resultado sumia: o que resolver antes de publicar e o link « Abrir o fluxo » nunca apareciam.
  return (
    <>
      <div className="flex flex-col gap-4">
        {canWrite &&
          (() => {
            const acoes = (
              <>
                {importButton}
                {!deAtendimento && modelosButton(false)}
                {/* No celular a ação principal sobe para o topo da pilha. */}
                {newFlowButton(true, "max-sm:order-first")}
              </>
            );
            return alvoDasAcoes ? (
              createPortal(acoes, alvoDasAcoes)
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                {acoes}
              </div>
            );
          })()}

        <GradeDeRegistros>
          {flows.map((flow) => (
            <li key={flow.id}>
              <CartaoDeRegistro
                href={`${baseHref}/${flow.id}`}
                titulo={flow.name}
                selo={<FlowStatusBadge status={flow.status} />}
                meta={[
                  <>
                    <span>{t("Quando um humano assume")}</span>: {t(HANDOFF_EM_PALAVRA[flow.handoff_policy] ?? flow.handoff_policy)}
                  </>,
                  `${t("Atualizado em")} ${formatUpdatedAt(flow.updated_at, tagDoIdioma)}`,
                ]}
                menu={canWrite ? <MenuDoFluxo flowId={flow.id} flowName={flow.name} /> : undefined}
              />
            </li>
          ))}
        </GradeDeRegistros>
      </div>
      {dialogos}
    </>
  );
}
