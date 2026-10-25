"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// `block` é LOAD-BEARING, e não estilo: `<label>` nasce `display: inline`, e
// elemento inline IGNORA margem vertical. Isso não custava nada no Tailwind 3 —
// lá o `space-y-*` punha `margin-top` no filho SEGUINTE (`> :not([hidden]) ~
// :not([hidden])`), e o rótulo, sendo o primeiro, nunca recebia margem. O
// Tailwind 4 inverteu o seletor para `:where(> :not(:last-child))` e passou a
// pôr `margin-bottom` no filho ANTERIOR — que é justamente o rótulo. A margem
// caía num elemento inline e evaporava.
//
// Sintoma medido na migração: todo grupo `space-y-2` de formulário encolhia
// exatamente 8px (`--space-2`), colando o rótulo no campo. Na tela de boas-vindas
// eram três grupos, 24px de página a menos, sem erro nenhum em lugar nenhum.
// Ver `tests/sonda-tailwind-4-antes-depois.ts` e o par em `evidence/tailwind-4/`.
//
// `inline-block` e não `block`, por duas medidas: o rótulo continua com largura
// shrink-to-fit (é o que `inline` dava, e `block` esticaria para a linha
// inteira), e `inline-block` respeita a margem do `space-y-*`.
//
// Etapa 3A (Unnify, DS §4.2 e §10.2): rótulo de campo é `sm`/500 com a
// entrelinha do degrau, 20px (`leading-5`). O `leading-none` que vinha daqui
// deixava a caixa do rótulo com 14px; com o rótulo `inline-block`, o token passou
// a valer, e a escolha que a migração do Tailwind 4 deixou em aberto ("decisão de
// design, não de migração") foi tomada pelo DS: cada grupo rótulo + campo cresce
// 6px. Desabilitado a 0,5, como todo controle (DS §9.1).
//
// `flex` (o rótulo do Work) ficou de fora de propósito: com ele, todo filho do
// rótulo vira item flexível, e o texto corrido com link ou negrito no meio
// ("Aceito os <a>termos</a>") perderia os espaços entre as palavras.
const labelVariants = cva(
  "inline-block text-sm leading-5 font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    data-slot="label"
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
