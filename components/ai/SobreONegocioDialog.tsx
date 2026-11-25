"use client";

/**
 * "SOBRE O MEU NEGÓCIO" — o começo guiado do acervo.
 *
 * A tela vazia dizia "comece pelo que ele mais vai precisar" e entregava um
 * campo em branco. Quem nunca escreveu um material não sabe o que é "o que ele
 * mais vai precisar". Aqui são seis perguntas que um atendente novo faria no
 * primeiro dia; respondidas, viram UM Documento comum, pela mesma rota e pelo
 * mesmo indexador de qualquer outro material. Nenhuma pergunta é obrigatória:
 * responder duas já é melhor que o agente improvisar.
 */
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { showApiError } from "@/components/feedback/ApiErrorToast";
import { useT } from "@/hooks/i18n/useT";
import { apiClient } from "@/lib/api/client";
import {
  PERGUNTAS_SOBRE_O_NEGOCIO,
  montarSobreONegocio,
  type IdDaPerguntaSobreONegocio,
} from "@/lib/ai/rag/montar-material";

/** O nome do material. Fixo: é assim que a pessoa o reencontra na lista. */
export const NOME_DO_MATERIAL_SOBRE_O_NEGOCIO = "Sobre o negócio";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onCriado: () => void;
  podeIndexar: boolean;
}

export function SobreONegocioDialog({ aberto, onFechar, onCriado, podeIndexar }: Props) {
  const t = useT();
  const [respostas, setRespostas] = useState<Partial<Record<IdDaPerguntaSobreONegocio, string>>>({});
  const [enviando, setEnviando] = useState(false);

  const respondidas = PERGUNTAS_SOBRE_O_NEGOCIO.filter(
    (p) => (respostas[p.id] ?? "").trim().length > 0,
  ).length;

  async function guardar(): Promise<void> {
    const corpo = montarSobreONegocio(respostas);
    if (corpo.length === 0) {
      toast.error(t("Responda pelo menos uma pergunta."));
      return;
    }
    setEnviando(true);
    try {
      await apiClient.post("/api/v1/ai/knowledge/sources", {
        source_type: "documento",
        name: NOME_DO_MATERIAL_SOBRE_O_NEGOCIO,
        markdown_blob: corpo,
      });
      toast.success(
        podeIndexar
          ? t("Material cadastrado. Estou preparando — em instantes o agente já sabe.")
          : t("Material guardado. Ele será preparado quando a leitura de materiais for ligada."),
      );
      setRespostas({});
      onCriado();
      onFechar();
    } catch (err) {
      showApiError(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="right" size="md">
        <SheetHeader>
          <SheetTitle>{t("Sobre o meu negócio")}</SheetTitle>
          <SheetDescription>
            {t(
              "Responda o que souber. É o que um atendente novo precisaria saber no primeiro dia — e o que o agente passa a usar para responder.",
            )}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          {PERGUNTAS_SOBRE_O_NEGOCIO.map((p) => (
            <div key={p.id} className="space-y-2">
              <Label htmlFor={`negocio-${p.id}`}>{t(p.titulo)}</Label>
              <Textarea
                id={`negocio-${p.id}`}
                data-testid={`negocio-${p.id}`}
                rows={3}
                placeholder={t(p.exemplo)}
                value={respostas[p.id] ?? ""}
                onChange={(e) => setRespostas((atual) => ({ ...atual, [p.id]: e.target.value }))}
                disabled={enviando}
              />
            </div>
          ))}
        </SheetBody>
        <SheetFooter>
          <span className="mr-auto text-xs text-muted-foreground" data-testid="negocio-contagem">
            {respondidas} {t("de")} {PERGUNTAS_SOBRE_O_NEGOCIO.length} {t("respondidas")}
          </span>
          <Button variant="outline" onClick={onFechar} disabled={enviando}>
            {t("Cancelar")}
          </Button>
          <Button onClick={guardar} disabled={enviando} data-testid="negocio-guardar">
            {enviando ? t("Guardando…") : t("Guardar")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
