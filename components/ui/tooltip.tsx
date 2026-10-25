"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Dica do Unnify (DS §10.17, Work): INVERSA ao tema — fundo `foreground`
        // e texto `background` —, raio 6, padding 12 × 6, `xs`/500 com
        // entrelinha 16, sombra `md`, acima de tudo (z 70). Entra em 100ms
        // (`camada-dica`, em `app/unnify/camadas.css`).
        //
        // A LARGURA MÁXIMA MORA AQUI, na classe base — não em quem usa o tooltip.
        //
        // O Radix desenha o balão com `minWidth: max-content` (react-popper) e nada
        // o limita: 267 caracteres viraram UMA linha de ~1467 px, com o fim do texto
        // fora da tela em 1280, 1366 e 1440 (#1215). Tooltip também mostra DADO — o
        // motivo da falha da bolha do inbox (`lib/inbox/motivo-da-falha.ts`) pode ser
        // o título que o provedor gravou —, e dado não tem tamanho conhecido nem teto
        // no banco (`text`). Na base, o teto (256, o do DS) vale para todo tooltip, e
        // `break-words` é o par obrigatório disso: sem ele, um erro de provedor sem
        // espaço (URL, hash) é cortado pelo `overflow-hidden` em vez de quebrar.
        "camada-dica z-70 max-w-64 origin-(--radix-tooltip-content-transform-origin) overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs leading-4 font-medium break-words text-background shadow-md",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
