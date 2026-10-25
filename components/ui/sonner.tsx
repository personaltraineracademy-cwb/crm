"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Avisos do Unnify (DS §10.19, Work): Sonner no canto inferior direito,
 * `richColors` e botão de fechar, com as cores dos TOKENS de estado — e não a
 * paleta embutida do Sonner (verde, azul e vermelho próprios, que não mudam
 * com a marca nem com o tema do produto).
 *
 * As variáveis vão no `style` do `<ol data-sonner-toaster>`: estilo em linha
 * vence o `[data-sonner-toaster][data-sonner-theme=…]` da folha do Sonner, e
 * cada `var(--…)` segue o `data-theme` do `<html>`, então claro e
 * escuro saem certos sem o Sonner saber de qual tema se trata.
 */
const CORES_DO_UNNIFY = {
  "--normal-bg": "var(--popover)",
  "--normal-border": "var(--border)",
  "--normal-text": "var(--popover-foreground)",
  "--success-bg": "var(--color-success-bg)",
  "--success-border": "var(--color-success-border)",
  "--success-text": "var(--color-success-fg)",
  "--info-bg": "var(--color-info-bg)",
  "--info-border": "var(--color-info-border)",
  "--info-text": "var(--color-info-fg)",
  "--warning-bg": "var(--color-warning-bg)",
  "--warning-border": "var(--color-warning-border)",
  "--warning-text": "var(--color-warning-fg)",
  "--error-bg": "var(--color-error-bg)",
  "--error-border": "var(--color-error-border)",
  "--error-text": "var(--color-error-fg)",
  "--border-radius": "var(--radius-lg)",
  // O Sonner crava a própria pilha de fontes; a do produto vem do `<body>`.
  fontFamily: "inherit",
} as React.CSSProperties;

/**
 * O tema do produto mora em `data-theme` no `<html>` (`lib/theme.tsx`), e o
 * `Toaster` é montado FORA do `ThemeProvider` (`app/layout.tsx`), então ele
 * lê o atributo direto. As cores já vêm dos tokens; o tema só acerta o que o
 * Sonner pinta por conta própria (descrição, botão de fechar).
 */
function lerTema(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function inscreverNoTema(avisar: () => void): () => void {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observador.disconnect();
}

const Toaster = ({ style, ...props }: ToasterProps) => {
  const tema = React.useSyncExternalStore(inscreverNoTema, lerTema, () => "light" as const);

  return (
    <Sonner
      theme={tema}
      position="bottom-right"
      richColors
      closeButton
      className="toaster group"
      style={{ ...CORES_DO_UNNIFY, ...style }}
      toastOptions={{
        classNames: {
          toast: "group toast shadow-lg",
          description: "text-sm opacity-90",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
