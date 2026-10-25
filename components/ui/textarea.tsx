import * as React from "react";

import { cn } from "@/lib/utils";

import { CAMPO_BASE } from "./input";

/**
 * Área de texto do Unnify (DESIGN-SYSTEM.md §10.2): o mesmo estilo do campo,
 * altura mínima de 120 e redimensionável só na vertical. Fonte 16px no celular e
 * 14px a partir de `md`, pelo motivo escrito em `components/ui/input.tsx`.
 *
 * Quem precisa de uma área mais baixa (o compositor da conversa, que começa em
 * uma linha) passa o próprio `min-h-*` em `className`, e ele vence.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(CAMPO_BASE, "flex min-h-30 resize-y px-3 py-2", className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
