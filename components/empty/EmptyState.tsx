"use client";

import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState as EstadoVazio } from "@/components/ui/empty-state";
import { useT } from "@/hooks/i18n/useT";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon: PhosphorIcon;
  headline: string;
  subcopy?: string;
  primary?: EmptyStateAction;
  secondary?: EmptyStateAction;
}

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant?: "default" | "outline";
}) {
  if (action.href) {
    return (
      <Button asChild variant={variant}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button type="button" onClick={action.onClick} variant={variant}>
      {action.label}
    </Button>
  );
}

/**
 * As variantes de vazio do produto desenhadas pelo `EmptyState` do DS
 * (§10.21): ícone de 32 em `muted-foreground`, frase curta e a ação. Sem o
 * círculo de 48 e sem o `py-16` de antes, que faziam do vazio uma ilustração.
 *
 * O DS pede no máximo uma ação. Quem ainda passa duas (`secondary`) continua
 * vendo as duas, a secundária em contorno à esquerda, para não sumir com uma
 * porta que já existia; a regra é não acrescentar a segunda em tela nova.
 */
export function EmptyState({
  icon: Icon,
  headline,
  subcopy,
  primary,
  secondary,
}: EmptyStateProps) {
  // A tradução mora AQUI, no ponto de render, e não em `variants.tsx`: as
  // variantes são chamadas de função com texto literal, e envolvê-las uma a uma
  // deixaria a próxima variante nova sem tradução por esquecimento. Aqui todas
  // passam pelo mesmo lugar — e `t()` devolve a chave intacta para as que ainda
  // não têm entrada, então nenhuma variante piora.
  const t = useT();
  return (
    <EstadoVazio
      icon={<Icon size={32} weight="duotone" />}
      title={t(headline)}
      description={subcopy ? t(subcopy) : undefined}
      action={
        primary || secondary ? (
          <div className="flex gap-2">
            {secondary ? <ActionButton action={secondary} variant="outline" /> : null}
            {primary ? <ActionButton action={primary} variant="default" /> : null}
          </div>
        ) : undefined
      }
    />
  );
}
