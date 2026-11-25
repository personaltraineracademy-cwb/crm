import { tintaDaCor, type AparenciaDoAgente } from "@/lib/ai/agents/aparencia";
import { cn } from "@/lib/utils";

const TAMANHOS = {
  md: "size-12 rounded-xl text-2xl",
  lg: "size-16 rounded-2xl text-4xl",
} as const;

/**
 * O rosto do agente: o emoji sobre a cor dele. Decorativo (`aria-hidden`) — o
 * nome do agente, que vem ao lado, é o que o leitor de tela anuncia.
 */
export function AvatarDoAgente({
  aparencia,
  tamanho = "md",
  className,
}: {
  aparencia: AparenciaDoAgente;
  tamanho?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const tinta = tintaDaCor(aparencia.cor);
  return (
    <span
      aria-hidden
      data-testid="avatar-do-agente"
      data-cor={aparencia.cor}
      className={cn(
        "grid shrink-0 place-items-center border leading-none select-none",
        TAMANHOS[tamanho],
        className,
      )}
      style={{ backgroundColor: tinta.fundo, borderColor: tinta.contorno }}
    >
      {aparencia.emoji}
    </span>
  );
}
