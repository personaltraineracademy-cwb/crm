"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { AlertCircle, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/i18n/useT";
import { Label } from "@/components/ui/label";

/**
 * Primitivos de campo de formulário (guia de acabamento §4.6).
 *
 * Antes, cada formulário montava rótulo, ajuda e erro à mão: "(opcional)" ia
 * dentro do texto do rótulo num, a ajuda ficava ENTRE o rótulo e o campo em
 * outro, e nenhum ligava o erro ao campo por `aria-describedby`.
 *
 *   <Field invalid={!!erros.nome}>
 *     <FieldLabel opcional>Sobrenome</FieldLabel>
 *     <FieldControl><Input name="sobrenome" /></FieldControl>
 *     <FieldHint>Como aparece na conversa.</FieldHint>
 *     <FieldError>{erros.nome}</FieldError>
 *   </Field>
 *
 * O `FieldControl` empresta ao controle o `id`, o `aria-describedby` (ajuda ou
 * erro) e o `aria-invalid`. Controle que não passa por ele (um `Select` do
 * Radix, por exemplo) usa `useCampo()` e espalha o retorno no gatilho.
 *
 * Medidas: rótulo → campo 6; campo → ajuda ou erro 6; entre campos 16 (o
 * `FieldSection` e o `FieldRow` cuidam do resto). Um só critério por
 * formulário: quando a maioria é obrigatória, marque só o "Opcional"; quando a
 * maioria é opcional, marque o "Obrigatório".
 */

type CampoContexto = {
  id: string;
  hintId: string;
  errorId: string;
  invalid: boolean;
  temErro: boolean;
  temAjuda: boolean;
  registrar: (parte: "hint" | "error", presente: boolean) => void;
};

const CampoCtx = React.createContext<CampoContexto | null>(null);

/** Props de acessibilidade do controle do campo atual. */
function useCampo() {
  const ctx = React.useContext(CampoCtx);
  if (!ctx) return {};
  const descritores = [ctx.temErro ? ctx.errorId : null, ctx.temAjuda ? ctx.hintId : null].filter(
    Boolean,
  );
  return {
    id: ctx.id,
    "aria-invalid": ctx.invalid || undefined,
    "aria-describedby": descritores.length ? descritores.join(" ") : undefined,
  } as const;
}

function Field({
  className,
  invalid = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { invalid?: boolean }) {
  const base = React.useId();
  const [partes, setPartes] = React.useState({ hint: false, error: false });
  const registrar = React.useCallback((parte: "hint" | "error", presente: boolean) => {
    setPartes((p) => (p[parte] === presente ? p : { ...p, [parte]: presente }));
  }, []);
  const valor = React.useMemo<CampoContexto>(
    () => ({
      id: `${base}-campo`,
      hintId: `${base}-ajuda`,
      errorId: `${base}-erro`,
      invalid,
      temErro: partes.error,
      temAjuda: partes.hint,
      registrar,
    }),
    [base, invalid, partes, registrar],
  );
  return (
    <CampoCtx.Provider value={valor}>
      <div
        data-slot="field"
        data-invalid={invalid ? "" : undefined}
        className={cn("flex min-w-0 flex-col gap-1.5", className)}
        {...props}
      />
    </CampoCtx.Provider>
  );
}

/**
 * Rótulo (14/20, medium). A marca vai à direita, em `text-xs` muted, e nunca
 * dentro do texto do rótulo: `opcional` escreve "Opcional", `obrigatorio`
 * escreve "Obrigatório". Um só critério por formulário.
 */
function FieldLabel({
  className,
  children,
  opcional,
  obrigatorio,
  ...props
}: React.ComponentProps<typeof Label> & { opcional?: boolean; obrigatorio?: boolean }) {
  const t = useT();
  const ctx = React.useContext(CampoCtx);
  const marca = opcional ? t("Opcional") : obrigatorio ? t("Obrigatório") : null;
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Label htmlFor={ctx?.id} className={cn("min-w-0", className)} {...props}>
        {children}
      </Label>
      {marca && (
        <span data-slot="field-mark" className="shrink-0 text-xs leading-4 text-muted-foreground">
          {marca}
        </span>
      )}
    </div>
  );
}

/** Empresta `id`, `aria-describedby` e `aria-invalid` ao controle filho. */
function FieldControl(props: React.ComponentProps<typeof Slot>) {
  return <Slot {...useCampo()} {...props} />;
}

/** Ajuda (12/16 muted), abaixo do controle. Some quando há erro. */
function FieldHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const ctx = React.useContext(CampoCtx);
  const registrar = ctx?.registrar;
  React.useEffect(() => {
    registrar?.("hint", true);
    return () => registrar?.("hint", false);
  }, [registrar]);
  if (ctx?.temErro) return null;
  return (
    <p
      id={ctx?.hintId}
      data-slot="field-hint"
      className={cn("text-xs leading-4 text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Erro (12/16 destructive, com ícone). Substitui a ajuda; sem conteúdo, não renderiza. */
function FieldError({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const ctx = React.useContext(CampoCtx);
  const registrar = ctx?.registrar;
  const presente =
    children !== undefined && children !== null && children !== false && children !== "";
  React.useEffect(() => {
    registrar?.("error", presente);
    return () => registrar?.("error", false);
  }, [registrar, presente]);
  if (!presente) return null;
  return (
    <p
      id={ctx?.errorId}
      role="alert"
      data-slot="field-error"
      className={cn("flex items-start gap-1 text-xs leading-4 text-destructive", className)}
      {...props}
    >
      <AlertCircle aria-hidden="true" className="mt-px size-3 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** Seção do formulário: título 14/600 + descrição opcional; 24 entre seções, 16 entre campos. */
/**
 * Seção do formulário (título 14/600 + descrição opcional).
 *
 * `recolhida` + `aoAlternar` fazem dela uma seção RECOLHÍVEL (guia: o que é
 * "mais dados" abre fechado): o título vira um botão com chevron e `aria-expanded`.
 * O corpo continua MONTADO (só `hidden`), porque fechar a seção no meio do
 * preenchimento não pode descartar o que já foi digitado.
 */
function FieldSection({
  className,
  title,
  description,
  children,
  recolhida,
  aoAlternar,
  ...props
}: Omit<React.HTMLAttributes<HTMLElement>, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  recolhida?: boolean;
  aoAlternar?: () => void;
}) {
  const corpoId = React.useId();
  const recolhivel = aoAlternar !== undefined;
  const fechada = recolhivel && recolhida === true;
  return (
    <section
      data-slot="field-section"
      data-recolhida={recolhivel ? (fechada ? "sim" : "nao") : undefined}
      className={cn("flex min-w-0 flex-col gap-4 not-first:mt-6", className)}
      {...props}
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm leading-5 font-semibold text-foreground">
          {recolhivel ? (
            <button
              type="button"
              onClick={aoAlternar}
              aria-expanded={!fechada}
              aria-controls={corpoId}
              className="flex w-full items-center gap-2 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              <span>{title}</span>
              <ChevronDown
                aria-hidden
                className={cn(
                  "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
                  fechada && "-rotate-90",
                )}
              />
            </button>
          ) : (
            title
          )}
        </h3>
        {description && <p className="text-xs leading-4 text-muted-foreground">{description}</p>}
      </div>
      {recolhivel ? (
        <div id={corpoId} hidden={fechada} className="flex min-w-0 flex-col gap-4">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/** Duas colunas com 12 de vão a partir de 480 de largura do contêiner; uma abaixo disso. */
function FieldRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="field-row" className="@container min-w-0">
      <div
        className={cn("grid grid-cols-1 gap-4 @[480px]:grid-cols-2 @[480px]:gap-3", className)}
        {...props}
      />
    </div>
  );
}

export { Field, FieldLabel, FieldControl, FieldHint, FieldError, FieldSection, FieldRow, useCampo };
