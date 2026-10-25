"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * Interruptor do Unnify (DESIGN-SYSTEM.md §10.4): trilho 44×24 (pequeno 36×24),
 * polegar 20×20; ligado `primary`, desligado `input`. Sem sombra (§1).
 *
 * Medidas: o trilho tem `border-2` transparente, então a caixa de padding é
 * 40×20 (`default`) ou 32×20 (`sm`), e o polegar de 20 corre 20 ou 12.
 *
 * O `::before` é a área de toque: com ponteiro grosso ela passa dos 24 px
 * desenhados a 44. Ele se ancora na caixa de PADDING (20 px de altura), e
 * `-inset-3` soma 12 de cada lado: 20 + 24 = 44. `pointer-coarse:my-2.5` dá a
 * cada interruptor 44 px de passo vertical: numa pilha densa o `::before` do de
 * baixo, pintado depois, cobria a borda do de cima e roubava o toque. Com 10 px
 * de margem em cima e embaixo as áreas encostam sem se sobrepor. Com mouse nada
 * muda. Padrão de `components/contacts/ContactsTable.tsx`.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    size?: "sm" | "default";
  }
>(({ className, size = "default", ...props }, ref) => (
  <SwitchPrimitives.Root
    data-slot="switch"
    data-size={size}
    className={cn(
      "peer group/switch relative inline-flex h-6 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      size === "sm" ? "w-9" : "w-11",
      "transition-colors duration-fast ease-out motion-reduce:transition-none",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:ring-4 aria-invalid:ring-destructive/20",
      "pointer-coarse:my-2.5 pointer-coarse:before:absolute pointer-coarse:before:-inset-3 pointer-coarse:before:content-['']",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      data-slot="switch-thumb"
      className={cn(
        // Branco no claro (o `card`); no escuro, o polegar contrasta com o trilho:
        // `primary-foreground` sobre o azul claro, `foreground` sobre o cinza.
        "pointer-events-none block size-5 rounded-full bg-card ring-0",
        "dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
        "transition-transform duration-fast ease-out data-[state=unchecked]:translate-x-0 motion-reduce:transition-none",
        size === "sm" ? "data-[state=checked]:translate-x-3" : "data-[state=checked]:translate-x-5",
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
