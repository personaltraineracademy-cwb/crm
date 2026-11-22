"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/i18n/useT";

/**
 * Diálogo do Unnify (DS §10.14, Work; guia de acabamento §4.3).
 *
 * Esqueleto: cabeçalho FIXO / `DialogBody` que rola / rodapé FIXO. O
 * `DialogContent` é um grid de 3 linhas (auto, 1fr, auto) com `overflow:
 * hidden` e teto de `calc(100dvh − 2rem)`; só o corpo rola, então o botão de
 * ação nunca sai da janela. Formulário que embrulha corpo e rodapé leva
 * `className="contents"`, para os dois continuarem sendo linhas do grid. Largura pela prop `size` (sm 400 · md 560 · lg 720 · xl 960; os
 * números são os tokens `--largura-dialogo-*`). Raio 16, camada `popover`,
 * sombra `--sombra-camada` (com contorno no escuro, onde só o tom não separa).
 *
 * Diálogo legado, sem `DialogBody`, continua valendo: o conteúdo inteiro rola
 * com padding de 24 e o rodapé fica colado embaixo (`position: sticky`). A
 * regra mora em `app/unnify/camadas.css`, junto do movimento (entrada de
 * 200ms desacelerando, saída de 150ms acelerando).
 *
 * X a 12px do canto. Teclado: `Esc` fecha e o foco volta ao gatilho (Radix); `Cmd/Ctrl+Enter`
 * envia o formulário que estiver dentro do diálogo.
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

const LARGURA_DO_DIALOGO = {
  sm: "max-w-[var(--largura-dialogo-sm)]",
  md: "max-w-[var(--largura-dialogo-md)]",
  lg: "max-w-[var(--largura-dialogo-lg)]",
  xl: "max-w-[var(--largura-dialogo-xl)]",
} as const;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /** Mostra o X no canto (padrão). A paleta de comando o esconde, como no Work. */
  showCloseButton?: boolean;
  /** Largura: sm 400 (confirmação) · md 560 (padrão) · lg 720 · xl 960 (editor). */
  size?: keyof typeof LARGURA_DO_DIALOGO;
  /** Cmd/Ctrl+Enter envia o formulário de dentro (padrão). */
  submitShortcut?: boolean;
};

/** Cmd/Ctrl+Enter: envia o formulário do diálogo, o do foco ou o único dentro dele. */
export function enviarPeloAtalho(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey) || e.defaultPrevented) return;
  const alvo = e.target instanceof Element ? e.target.closest("form") : null;
  const form = alvo ?? e.currentTarget.querySelector("form");
  if (!form) return;
  e.preventDefault();
  form.requestSubmit();
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      showCloseButton = true,
      size = "md",
      submitShortcut = true,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const t = useT();
    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          data-slot="dialog-content"
          data-size={size}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (submitShortcut) enviarPeloAtalho(e);
          }}
          className={cn(
            // ⚠️ `translate-x-[-50%] translate-y-[-50%]` é a centralização e não
            // depende da animação: o diálogo anima só opacidade e escala.
            // `w-[calc(100%-2rem)]` com o teto da `size`: no celular sobram 16px
            // de cada lado; quem passa outro `max-w-*` troca só o teto.
            // Esta base é o modo LEGADO (sem `DialogBody`): grid com padding e gap
            // de 24, teto de altura e o conteúdo inteiro rolando por dentro (#2044,
            // guardado por `dialog-base-roda-e-tem-teto.test.ts`). Com `DialogBody`
            // dentro, `.camada-dialogo` (camadas.css) troca para cabeçalho fixo /
            // corpo que rola / rodapé fixo. A sombra também mora lá.
            "camada-dialogo fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-6 overflow-y-auto overscroll-contain",
            LARGURA_DO_DIALOGO[size],
            "rounded-2xl border bg-popover p-6 text-sm text-popover-foreground outline-hidden",
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
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

/** Cabeçalho fixo: padding 24 24 16, com 56px livres à direita para o X. */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-header"
    className={cn("flex shrink-0 flex-col gap-1 px-6 pt-6 pr-14 pb-4 text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/**
 * Corpo: a ÚNICA parte que rola. Padding horizontal 24; o fio sob o cabeçalho
 * só aparece depois que o corpo rolou (`data-rolou`).
 */
const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, onScroll, ...props }, ref) => {
    const [rolou, setRolou] = React.useState(false);
    return (
      <div
        ref={ref}
        data-slot="dialog-body"
        data-rolou={rolou ? "" : undefined}
        onScroll={(e) => {
          onScroll?.(e);
          setRolou(e.currentTarget.scrollTop > 0);
        }}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-transparent px-6 py-1 pb-6",
          "data-[rolou]:border-border-subtle",
          className,
        )}
        {...props}
      />
    );
  },
);
DialogBody.displayName = "DialogBody";

/**
 * Rodapé fixo: padding 16 24, fio de ponta a ponta em cima, fundo `muted/40`,
 * botões à direita com 8 de vão: [Cancelar outline] [Ação principal]. No
 * celular, coluna invertida (a ação principal fica em cima).
 */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      "border-border-subtle flex shrink-0 flex-col-reverse gap-2 rounded-b-2xl border-t bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-end",
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
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  fecharCamadaClassName,
};
