import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Estado vazio (Unnify DS §10.21, §11.5, §14).
 *
 * Compacto: ícone de 32 em muted, uma frase curta que diz o que fazer e NO
 * MÁXIMO uma ação. Sem ilustração grande. O título nomeia a situação ("Nenhum
 * contato ainda"); a descrição orienta ("Importe uma planilha ou crie o
 * primeiro contato."); a ação é verbo + objeto ("Criar contato").
 *
 * Os três estados de uma área, juntos:
 * - **Vazio** → `EmptyState`.
 * - **Carregando** → `Skeleton` com a forma final do conteúdo (nunca spinner
 *   solto); botão que dispara ação mantém a largura.
 * - **Erro** → `Alert variant="destructive"` com a causa em linguagem simples
 *   e 1 ação ("Tentar de novo"). Nunca só um código.
 *
 * Ele não desenha superfície: dentro de um cartão, vai direto no `CardContent`;
 * solto na página, já fica sobre o fundo.
 */
export interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Um componente de ícone (ex.: `Inbox` do lucide) ou um elemento pronto. */
  icon: React.ElementType<{ className?: string }> | React.ReactElement;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** A única ação (um `Button`). */
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  let icone: React.ReactNode;
  if (React.isValidElement(icon)) {
    icone = icon;
  } else {
    const Icone = icon as React.ElementType<{ className?: string }>;
    icone = <Icone className="size-8" />;
  }

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-10 text-center",
        className,
      )}
      {...props}
    >
      <span
        data-slot="empty-state-icon"
        aria-hidden="true"
        className="text-muted-foreground [&_svg]:size-8 [&_svg]:shrink-0"
      >
        {icone}
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p
          data-slot="empty-state-title"
          className="text-base leading-6 font-semibold text-balance text-foreground"
        >
          {title}
        </p>
        {description ? (
          <div
            data-slot="empty-state-description"
            className="text-sm leading-5 text-pretty text-muted-foreground"
          >
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="mt-1 flex items-center justify-center">{action}</div> : null}
    </div>
  );
}
