"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Caixa de seleção do Unnify (DESIGN-SYSTEM.md §10.4, canônico do Pulse):
 * 20×20, raio 6, borda `input`; marcada ou indeterminada, fundo e borda
 * `primary` com a marca em `primary-foreground`. Área de toque estendida de 10px
 * (12px em ponteiro grosso, para chegar aos 44). Foco 2+2.
 *
 * Sem `@radix-ui/react-checkbox` (decisão da etapa 3: nenhuma dependência nova).
 * É um `<button role="checkbox">`, o padrão WAI-ARIA:
 *   - `aria-checked` = `true` | `false` | `mixed` (indeterminado);
 *   - Espaço alterna (o `click` nativo do botão); Enter NÃO alterna, como no
 *     Radix e na recomendação da APG para caixa de seleção;
 *   - `<Label htmlFor>` funciona: `button` é elemento rotulável, e o clique no
 *     rótulo chega ao botão;
 *   - com `name`, um `<input type="hidden">` leva o valor no envio do formulário
 *     só quando marcada, como a caixa nativa.
 *
 * Controlada (`checked` + `onCheckedChange`) ou não (`defaultChecked`).
 * `indeterminate` vence `checked` na apresentação; clicar numa indeterminada
 * pede `true`.
 */
export interface CheckboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value" | "defaultChecked" | "type" | "role"
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  /** Valor enviado no formulário quando marcada (padrão `on`, como o nativo). */
  value?: string;
  required?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      indeterminate = false,
      disabled,
      name,
      value = "on",
      required,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const [checkedLocal, setCheckedLocal] = React.useState(defaultChecked);
    const controlada = checkedProp !== undefined;
    const checked = controlada ? checkedProp : checkedLocal;
    const estado = indeterminate ? "indeterminate" : checked ? "checked" : "unchecked";

    return (
      <>
        <button
          ref={ref}
          type="button"
          role="checkbox"
          aria-checked={indeterminate ? "mixed" : checked}
          aria-required={required || undefined}
          data-slot="checkbox"
          data-state={estado}
          data-disabled={disabled ? "" : undefined}
          disabled={disabled}
          className={cn(
            "peer relative inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-input bg-card text-primary-foreground dark:bg-input/30",
            "transition-colors duration-fast ease-out motion-reduce:transition-none",
            "hover:border-interactive-border",
            "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
            "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
            "after:absolute after:-inset-2.5 after:content-[''] pointer-coarse:after:-inset-3",
            className,
          )}
          onClick={(event) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            const proximo = indeterminate ? true : !checked;
            if (!controlada) setCheckedLocal(proximo);
            onCheckedChange?.(proximo);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.key === "Enter") event.preventDefault();
          }}
          {...props}
        >
          {estado === "indeterminate" ? (
            <Minus aria-hidden="true" className="size-4" strokeWidth={2.5} />
          ) : estado === "checked" ? (
            <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
          ) : null}
        </button>
        {name && checked && !indeterminate ? (
          <input type="hidden" name={name} value={value} disabled={disabled} />
        ) : null}
      </>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
