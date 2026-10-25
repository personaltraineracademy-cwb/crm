"use client";
import { useT } from "@/hooks/i18n/useT";
import { DownloadSimple, FileText } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

import { formatBytes, mediaFileLabel, mediaSrc } from "./media-utils";

interface Props {
  messageId: string;
  mime: string | null;
  sizeBytes: number | null;
  storagePath: string | null;
  isOutbound: boolean;
  /** Nome ORIGINAL do documento quando o payload o trouxer (#2613). Ausente/vazio → rótulo de extensão. */
  fileName?: string | null;
  /** Fonte alternativa para mídia de NOTA interna (#1863, F3) — ver ImageMedia. */
  src?: string;
}

/** Card de documento: nome original (ou PDF/MP4/…), tamanho e download. */
export function DocumentCard({
  messageId,
  mime,
  sizeBytes,
  storagePath,
  // `isOutbound` segue no contrato; a cor não depende mais do lado (nenhum
  // balão é sólido).
  fileName,
  src,
}: Props) {
  const t = useT();
  const label = mediaFileLabel(mime, storagePath, fileName);
  return (
    <a
      href={src ?? mediaSrc(messageId)}
      target="_blank"
      rel="noreferrer"
      aria-label={`${t("Baixar")} ${label} (${formatBytes(sizeBytes)})`}
      className={cn(
        "hover:border-interactive-border hover:bg-interactive flex w-60 items-center gap-3 rounded-lg border border-border bg-card p-2 text-card-foreground transition-colors",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
        )}
      >
        <FileText size={20} weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" title={label}>
          {label}
        </span>
        <span className="block text-xs text-muted-foreground tabular-nums">
          {formatBytes(sizeBytes)}
        </span>
      </span>
      <DownloadSimple size={16} className="shrink-0 text-muted-foreground" aria-hidden />
    </a>
  );
}
