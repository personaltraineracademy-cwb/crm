import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * OS ESTADOS DA CAIXA DE ENTRADA (Unnify §10.21), num lugar só.
 *
 * Carregando é esqueleto com a FORMA FINAL — mesma altura e largura do que vem
 * —, para a tela não saltar quando os dados chegam. Por isso as medidas daqui
 * repetem as da linha (`ConversationListItem`: 56 de altura, avatar de 40) e do
 * balão (`MessageBubble`: raio 12 com a quina de 4). Mudou lá, muda aqui.
 *
 * Erro é inline, com a causa em linguagem simples e UMA ação.
 */

/** Uma linha da lista de conversas, do tamanho da de verdade. */
function EsqueletoDaLinha({ largura }: { largura: string }) {
  return (
    <div className="flex h-14 items-center gap-3 border-b border-border px-3" aria-hidden>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className={cn("h-3.5", largura)} />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

/** Larguras alternadas do nome: oito linhas iguais parecem grade, não lista. */
const LARGURAS_DO_NOME = ["w-2/5", "w-1/2", "w-1/3", "w-3/5"] as const;

/** A lista carregando: 8 linhas de 56. */
export function EsqueletoDaLista({ linhas = 8 }: { linhas?: number }) {
  return (
    <div data-testid="esqueleto-da-lista">
      {Array.from({ length: linhas }, (_, i) => (
        <EsqueletoDaLinha key={i} largura={LARGURAS_DO_NOME[i % LARGURAS_DO_NOME.length]!} />
      ))}
    </div>
  );
}

/** O fio carregando: balões alternados, do cliente à esquerda e da equipe à direita. */
const BALOES: { lado: "cliente" | "equipe"; classe: string }[] = [
  { lado: "cliente", classe: "h-10 w-1/2" },
  { lado: "cliente", classe: "h-16 w-3/5" },
  { lado: "equipe", classe: "h-10 w-2/5" },
  { lado: "cliente", classe: "h-10 w-1/3" },
  { lado: "equipe", classe: "h-16 w-1/2" },
];

export function EsqueletoDoFio() {
  return (
    <div className="space-y-2 px-4 py-4" data-testid="esqueleto-do-fio" aria-hidden>
      <div className="flex justify-center pb-1">
        <Skeleton className="h-5 w-16" />
      </div>
      {BALOES.map((b, i) => (
        <div key={i} className={cn("flex", b.lado === "equipe" ? "justify-end" : "justify-start")}>
          <Skeleton
            className={cn(
              "max-w-[75%] rounded-xl",
              b.lado === "equipe" ? "rounded-br-sm" : "rounded-bl-sm",
              b.classe,
            )}
          />
        </div>
      ))}
    </div>
  );
}

/** Erro inline: a frase e UMA ação ("Tentar novamente"). */
export function ErroComAcao({
  mensagem,
  acao,
  className,
}: {
  mensagem: ReactNode;
  acao: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <p>{mensagem}</p>
      {acao}
    </div>
  );
}
