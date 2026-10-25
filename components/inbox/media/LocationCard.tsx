"use client";

import { useT } from "@/hooks/i18n/useT";
import { MapPin } from "@/lib/ui/icons";
import { textoDoEnderecoAproximado } from "@/lib/mapas/geocodificacao";
import { linkDoMapa, type Localizacao } from "@/lib/messaging/localizacao";

/**
 * Pino compartilhado pelo cliente. Toque abre o ponto no mapa (no celular, o
 * app de mapas) — é o que quem monta a entrega precisa, e o texto cru com as
 * coordenadas não é clicável.
 *
 * Com a chave de Mapas da organização, o pino chega com rua, cidade e região
 * aproximados: a equipe vê onde é sem abrir o mapa. Nome e endereço que o
 * próprio cliente escolheu no WhatsApp vêm antes — são exatos.
 */
export function LocationCard({ localizacao }: { localizacao: Localizacao }) {
  const t = useT();
  const aproximado = localizacao.aproximado ? textoDoEnderecoAproximado(localizacao.aproximado) : "";
  const detalhe =
    [localizacao.nome, localizacao.endereco].filter(Boolean).join(" — ") ||
    (aproximado ? `${aproximado} (${t("aprox.")})` : "");
  return (
    <a
      href={linkDoMapa(localizacao)}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:border-interactive-border hover:bg-interactive flex max-w-[260px] items-center gap-2 rounded-lg border border-border bg-card p-2 text-left text-card-foreground transition-colors"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <MapPin size={20} weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium" title={detalhe || undefined} data-testid="pino-detalhe">
          {detalhe || t("Localização compartilhada")}
        </span>
        <span className="block truncate text-xs text-primary underline underline-offset-4">
          {t("Abrir no mapa")}
        </span>
      </span>
    </a>
  );
}
