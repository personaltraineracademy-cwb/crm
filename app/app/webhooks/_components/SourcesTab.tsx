"use client";

import { useLocaleDeData } from "@/hooks/i18n/useLocaleDeData";

import type { Locale } from "date-fns";
import * as React from "react";
import { formatDistanceToNowStrict } from "date-fns";

import { CartaoDeRegistro, GradeDeRegistros } from "@/components/cartao-de-registro";
import { ChipDeEstado } from "@/components/ai/chip-de-estado";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlugsConnected, Plus } from "@/lib/ui/icons";
import { SeloDeAutoria } from "@/components/operacao/SeloDeAutoria";
import { useWebhookSources, type WebhookSourceRow } from "@/hooks/webhooks/useWebhookSources";
import { CreateSourceDialog } from "./CreateSourceDialog";
import { SourceDetail } from "./SourceDetail";
import { useT } from "@/hooks/i18n/useT";

function lastReceivedLabel(iso: string | null, t: (texto: string) => string, locale: Locale): string {
  if (!iso) return t("nunca recebeu");
  return `${t("último recebimento")} ${formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: locale })}`;
}

export function SourcesTab() {
  const localeDaData = useLocaleDeData();
  const t = useT();
  const { data, isLoading } = useWebhookSources();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<WebhookSourceRow | null>(null);

  const sources = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="grid gap-3 pt-4 sm:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex justify-center pt-10">
        <Card className="max-w-md">
          <CardHeader className="items-center text-center">
            <PlugsConnected className="mb-2 h-10 w-10 text-accent" />
            <CardTitle>{t("Conecte sua landing page em 2 minutos")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <ol className="space-y-2 text-left text-sm text-muted-foreground">
              <li>{t("1. Crie uma fonte e diga em qual funil o contato entra.")}</li>
              <li>{t("2. Copie o endereço ou o formulário pronto.")}</li>
              <li>{t("3. Cole no seu site — cada envio vira um lead aqui dentro.")}</li>
            </ol>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> {t("Criar primeira fonte")}
            </Button>
          </CardContent>
        </Card>
        <CreateSourceDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={setSelected}
        />
        {selected ? (
          <SourceDetail source={selected} open={!!selected} onOpenChange={() => setSelected(null)} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex sm:justify-end">
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus /> {t("Nova fonte")}
        </Button>
      </div>
      <GradeDeRegistros>
        {sources.map((s) => (
          <li key={s.id}>
            <CartaoDeRegistro
              aoAbrir={() => setSelected(s)}
              titulo={s.name}
              selo={
                <ChipDeEstado tom={s.is_active ? "sucesso" : "neutro"}>
                  {s.is_active ? t("Ativa") : t("Pausada")}
                </ChipDeEstado>
              }
              meta={[
                lastReceivedLabel(s.last_received_at, t, localeDaData),
                // Desligada, ela para de receber contatos e ninguém do outro lado
                // é avisado — então quem a desligou entra na leitura do card.
                <SeloDeAutoria key="autoria" kind={s.last_change_actor_kind} em={s.last_change_at} />,
              ]}
            />
          </li>
        ))}
      </GradeDeRegistros>

      <CreateSourceDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={setSelected} />
      {selected ? (
        <SourceDetail source={selected} open={!!selected} onOpenChange={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
