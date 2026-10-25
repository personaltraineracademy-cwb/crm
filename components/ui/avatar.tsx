"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

/**
 * Avatar (Unnify DS §10.20): círculo de 24 (`sm`), 32 (padrão) ou 40 (`lg`),
 * imagem `object-cover`, anel interno de 1px na cor da borda e iniciais `sm`
 * (`xs` no pequeno) sobre `muted`. O tamanho vem de `h-*`/`w-*` (e não de
 * `size-*`) para o `h-12 w-12` de quem já passa medida própria continuar
 * vencendo pelo `tailwind-merge`.
 */
type AvatarSize = "sm" | "default" | "lg";

const TAMANHO: Record<AvatarSize, string> = {
  sm: "h-6 w-6",
  default: "h-8 w-8",
  lg: "h-10 w-10",
};

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { size?: AvatarSize }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex shrink-0 rounded-full select-none",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
        TAMANHO[size],
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square h-full w-full rounded-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className,
      )}
      {...props}
    />
  );
}

/** Selo de status: 10px, `primary`, anel de 2px na cor do fundo. */
function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 size-2.5 rounded-full bg-primary ring-2 ring-background",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge };
export type { AvatarSize };
