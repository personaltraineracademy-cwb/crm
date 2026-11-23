"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { showApiError } from "@/components/feedback/ApiErrorToast";
import { Card } from "@/components/ui/card";
import { useT } from "@/hooks/i18n/useT";
import { agentsListQueryKey } from "@/hooks/ai/useAgents";
import {
  CORES_DO_AGENTE,
  EMOJIS_DO_AGENTE,
  aparenciaDoAgente,
  tintaDaCor,
  type AparenciaDoAgente as Aparencia,
  type CorDoAgente,
} from "@/lib/ai/agents/aparencia";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { AvatarDoAgente } from "../../_components/AvatarDoAgente";

interface Props {
  agentId: string;
  nome: string;
  /** `ai_agents.config` como está no banco. */
  config: unknown;
  disabled?: boolean;
}

/**
 * Cartão "A cara dele" na tela do AGENTE: escolhe o emoji e a cor que aparecem
 * no cartão da lista. Salva na hora, no mesmo `config` jsonb e pela mesma rota
 * do cartão "Comandos pelo celular" — é do AGENTE, não da versão, e por isso
 * não passa por rascunho nem publicação: é só apresentação.
 */
export function AparenciaDoAgente({ agentId, nome, config, disabled }: Props) {
  const t = useT();
  const qc = useQueryClient();
  const [aparencia, setAparencia] = useState<Aparencia>(() => aparenciaDoAgente(config, nome));
  const [salvando, setSalvando] = useState(false);

  async function escolher(proxima: Aparencia) {
    const anterior = aparencia;
    setAparencia(proxima);
    setSalvando(true);
    try {
      await apiClient.patch(`/api/v1/ai/agents/${agentId}`, { config: { aparencia: proxima } });
      // A lista de agentes guarda a resposta em cache: sem isto, voltar para
      // ela mostraria a cara antiga até recarregar a página.
      void qc.invalidateQueries({ queryKey: agentsListQueryKey });
      toast.success(t("Aparência salva — já aparece no cartão do agente."));
    } catch (err) {
      setAparencia(anterior);
      showApiError(err);
    } finally {
      setSalvando(false);
    }
  }

  const travado = disabled || salvando;

  // Cada nome escrito por extenso, em vez de traduzir a variável: a cerca de
  // tradução só enxerga texto literal, e é assim que ela garante o espanhol.
  const nomeDaCor: Record<CorDoAgente, string> = {
    azul: t("azul"),
    ciano: t("ciano"),
    verde: t("verde"),
    lima: t("lima"),
    amarelo: t("amarelo"),
    laranja: t("laranja"),
    vermelho: t("vermelho"),
    rosa: t("rosa"),
    roxo: t("roxo"),
  };

  return (
    <Card className="space-y-3 p-4" data-testid="aparencia-do-agente">
      <div className="flex items-center gap-3">
        <AvatarDoAgente aparencia={aparencia} tamanho="lg" />
        <div>
          <h3 className="text-sm font-medium">{t("A cara dele")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("O emoji e a cor que identificam este agente na lista. Não muda o atendimento.")}
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-label={t("Emoji do agente")} className="flex flex-wrap gap-1.5">
        {EMOJIS_DO_AGENTE.map((emoji) => {
          const marcado = aparencia.emoji === emoji;
          return (
            <button
              key={emoji}
              type="button"
              role="radio"
              aria-checked={marcado}
              aria-label={emoji}
              disabled={travado}
              onClick={() => escolher({ ...aparencia, emoji })}
              className={cn(
                "grid size-9 place-items-center rounded-lg border text-lg leading-none transition-colors duration-fast",
                marcado ? "border-primary bg-primary/10" : "border-border hover:bg-surface-hover",
                travado && "opacity-60",
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      <div role="radiogroup" aria-label={t("Cor do agente")} className="flex flex-wrap gap-2">
        {(Object.keys(CORES_DO_AGENTE) as CorDoAgente[]).map((cor) => {
          const marcado = aparencia.cor === cor;
          const tinta = tintaDaCor(cor);
          return (
            <button
              key={cor}
              type="button"
              role="radio"
              aria-checked={marcado}
              aria-label={nomeDaCor[cor]}
              title={nomeDaCor[cor]}
              disabled={travado}
              onClick={() => escolher({ ...aparencia, cor })}
              data-testid={`aparencia-cor-${cor}`}
              className={cn(
                "size-7 rounded-full border-2 transition-shadow duration-fast",
                marcado && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                travado && "opacity-60",
              )}
              style={{ backgroundColor: tinta.contorno, borderColor: tinta.contorno }}
            />
          );
        })}
      </div>
    </Card>
  );
}
