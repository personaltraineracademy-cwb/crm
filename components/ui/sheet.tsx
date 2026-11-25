"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/i18n/useT";
import { enviarPeloAtalho, fecharCamadaClassName } from "@/components/ui/dialog";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    // Sobreposição `overlay` com desfoque `xs` no painel lateral (DS §6.3).
    className={cn("camada-cortina fixed inset-0 z-50 bg-overlay backdrop-blur-xs", className)}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

/**
 * Painel lateral do Unnify (DS §10.15, Work; guia de acabamento §4.4).
 *
 * `side="right"` é o painel de detalhe: FLUTUA como a barra lateral (8px de
 * recuo do topo, da direita e de baixo), raio 16, camada `popover`, sombra
 * `--sombra-camada`, e no celular ocupa a tela inteira. Largura pela prop
 * `size`: sm 400 · md 480 · lg 640 (`--largura-painel-*`; o sm é o 400 do guia).
 * Cabeçalho FIXO / `SheetBody` que rola / `SheetFooter` FIXO (só em formulário).
 *
 * Os outros lados (`left`, `top`, `bottom`) são gavetas de navegação e seguem
 * encostados na borda, como eram.
 *
 * Painel legado, sem `SheetBody`, continua valendo: o conteúdo inteiro rola
 * com o padding de antes e o rodapé fica colado embaixo (`camadas.css`).
 *
 * O movimento (desliza 24px + opacidade, 250ms entrando e 200ms saindo) é
 * `camada-gaveta`, em `app/unnify/camadas.css`; o lado vem de `data-lado`,
 * porque o `Dialog.Content` do Radix não emite `data-side`.
 */
const sheetVariants = cva(
  "camada-gaveta fixed z-50 flex flex-col gap-4 bg-popover p-6 pt-4 text-sm text-popover-foreground outline-hidden",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto border-b",
        bottom: "inset-x-0 bottom-0 h-auto border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right:
          "inset-0 w-full border sm:inset-auto sm:top-2 sm:right-2 sm:bottom-2 sm:w-[calc(100%-1rem)] sm:rounded-2xl",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },
    compoundVariants: [
      { side: "right", size: "sm", className: "sm:max-w-[400px]" },
      { side: "right", size: "md", className: "sm:max-w-[var(--largura-painel-md)]" },
      { side: "right", size: "lg", className: "sm:max-w-[var(--largura-painel-lg)]" },
    ],
    defaultVariants: {
      side: "right",
      size: "sm",
    },
  },
);

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Mostra o X no canto (padrão). */
  showCloseButton?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(
  (
    { side = "right", size, className, children, showCloseButton = true, onKeyDown, ...props },
    ref,
  ) => {
    const t = useT();
    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          ref={ref}
          data-slot="sheet-content"
          data-lado={side}
          data-size={size ?? "sm"}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            enviarPeloAtalho(e);
          }}
          className={cn(sheetVariants({ side, size }), className)}
          {...props}
        >
          {children}
          {/*
          `ghost` `icon-sm` (32) alinhado ao título: o título tem entrelinha de
          32 e começa no padding de 16 do topo, a mesma altura do X (16 do
          topo e da borda). O cabeçalho reserva 64px à direita (24 do padding
          + `pr-10`). Nas gavetas `p-0` (navegação) o X fica onde já estava.
        */}
          {showCloseButton && (
            <SheetPrimitive.Close className={cn(fecharCamadaClassName, "absolute top-4 right-4")}>
              <X aria-hidden="true" />
              <span className="sr-only">{t("Fechar")}</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

/** Cabeçalho fixo: título, linha de contexto e ações; 40px livres para o X. */
const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="sheet-header"
    className={cn("flex shrink-0 flex-col gap-0.5 pr-10 text-left", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

/** Corpo: a ÚNICA parte que rola. */
const SheetBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}
      {...props}
    />
  ),
);
SheetBody.displayName = "SheetBody";

/**
 * Rodapé fixo, com fio de ponta a ponta em cima e fundo `muted/40`; botões à
 * direita, coluna invertida no celular. Só para painel de formulário.
 */
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="sheet-footer"
    className={cn(
      "border-border-subtle mt-auto flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg leading-8 font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
