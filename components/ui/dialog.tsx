"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/i18n/useT";

/**
 * Diálogo do Unnify (DS §10.14, Work).
 *
 * Raio 16, padding e espaçamento de 24, largura de 448 (a tela − 32 no
 * celular), teto de altura com rolagem por dentro, fundo `popover` com borda e
 * a sombra do Work (`shadow-xl` já é a do Work no claro e a rasa no escuro).
 * Sobreposição `overlay` com 2px de desfoque. O movimento (fade + zoom 0,985
 * em 120ms) está em `app/unnify/camadas.css`.
 *
 * Foco preso e devolvido ao gatilho e `Esc` para fechar são do Radix.
 */

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

/**
 * O botão de fechar das camadas: `ghost` `icon-sm` (32) do DS, com o realce
 * SUAVE (`interactive`), nunca a ação cheia. Escrito aqui e não com o `Button`
 * porque o tamanho `icon-sm` é da frente de controles; o desenho é o mesmo.
 *
 * Alvo de toque: o `::before` cresce 6px de cada lado só com ponteiro grosso,
 * o que dá 44px sem mover o ícone (o mesmo truque do `Switch`).
 */
const fecharCamadaClassName = cn(
  "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground",
  "transition-[color,background-color] duration-fast ease-out",
  "hover:bg-interactive hover:text-interactive-foreground active:bg-interactive-strong",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover focus-visible:outline-hidden",
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-1.5 pointer-coarse:before:content-['']",
);

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("camada-cortina fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /** Mostra o X no canto (padrão). A paleta de comando o esconde, como no Work. */
  showCloseButton?: boolean;
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showCloseButton = true, ...props }, ref) => {
  const t = useT();
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          // ⚠️ `translate-x-[-50%] translate-y-[-50%]` é a centralização e não
          // depende da animação: o diálogo anima só opacidade e escala.
          // `w-[calc(100%-2rem)]` com `max-w-md`: no celular sobram 16px de
          // cada lado; quem passa outro `max-w-*` troca só o teto.
          "camada-dialogo fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-6 overflow-y-auto overscroll-contain",
          "rounded-2xl border bg-popover p-6 text-sm text-popover-foreground shadow-xl outline-hidden",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className={cn(fecharCamadaClassName, "absolute top-3 right-3")}>
            <X aria-hidden="true" />
            <span className="sr-only">{t("Fechar")}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

/** Título e descrição, com 40px livres à direita para não bater no X. */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-header"
    className={cn("flex flex-col gap-2 pr-10 text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/**
 * Rodapé `muted/30` com borda superior que SANGRA até as bordas do diálogo
 * (as margens negativas devolvem o padding de 24 do conteúdo). Botões à
 * direita; no celular, coluna invertida (a ação principal fica em cima).
 */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      "-mx-6 -mb-6 flex flex-col-reverse gap-3 rounded-b-2xl border-t bg-muted/30 p-6 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg leading-7 font-semibold text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  fecharCamadaClassName,
};
