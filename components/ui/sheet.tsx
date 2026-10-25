"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/i18n/useT";
import { fecharCamadaClassName } from "@/components/ui/dialog";

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
 * Painel lateral do Unnify (DS §10.15, Work).
 *
 * Largura de 75% da tela até 384 (`sm:max-w-sm`), altura total, fundo
 * `popover` com borda do lado de dentro e a sombra do Work (`shadow-xl`).
 * Coluna flexível: o `SheetFooter` desce com `mt-auto`.
 *
 * O movimento (desliza 2,5rem + opacidade, 180ms) é `camada-gaveta`, em
 * `app/unnify/camadas.css`; o lado vem de `data-lado`, porque o
 * `Dialog.Content` do Radix não emite `data-side`. O padding continua na base
 * (24, e 16 no topo, como o cabeçalho do DS): os painéis do produto escrevem
 * o corpo direto no conteúdo.
 */
const sheetVariants = cva(
  "camada-gaveta fixed z-50 flex flex-col gap-4 bg-popover p-6 pt-4 text-sm text-popover-foreground shadow-xl outline-hidden",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto border-b",
        bottom: "inset-x-0 bottom-0 h-auto border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
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
>(({ side = "right", className, children, showCloseButton = true, ...props }, ref) => {
  const t = useT();
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        data-lado={side}
        className={cn(sheetVariants({ side }), className)}
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
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="sheet-header"
    className={cn("flex flex-col gap-0.5 pr-10 text-left", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

/**
 * Rodapé `muted/30` com borda superior, sangrado até as bordas (devolve o
 * padding de 24) e preso embaixo com `mt-auto`. Botões à direita; coluna
 * invertida no celular.
 */
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="sheet-footer"
    className={cn(
      "-mx-6 mt-auto -mb-6 flex flex-col-reverse gap-3 border-t bg-muted/30 p-6 sm:flex-row sm:justify-end",
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
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
