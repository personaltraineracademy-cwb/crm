"use client";

import { memo, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { NodeType } from "@/lib/followup/graph-schema";
import { useT } from "@/hooks/i18n/useT";
import { NOS_DA_SUPERFICIE } from "@/lib/followup/validate-publish";
import type { FollowupFlowSurface } from "@/lib/followup/api-schemas";
import { MagnifyingGlass } from "@/lib/ui/icons";
import {
  CATEGORIAS_DO_NO,
  CATEGORIA_DO_TIPO,
  NODE_VISUALS,
  type CategoriaDoNo,
} from "./nodes/nodeVisuals";

interface Props {
  onAdd: (type: NodeType) => void;
  /**
   * Superfície do fluxo: a paleta oferece SÓ as caixas que o motor dela executa
   * (`NOS_DA_SUPERFICIE`, a mesma lista do publish). Na prova do #1130 a paleta
   * do roteiro oferecia seis caixas que o motor recusava em silêncio.
   */
  surface?: FollowupFlowSurface;
  /** "mobile" = mesmo conteúdo dentro do Sheet que `FlowCanvas` abre abaixo de
   * `lg` — a barra fixa não cabia perto do canvas num celular. */
  variant?: "desktop" | "mobile";
}

/** Normaliza para a busca: sem acento e sem caixa ("logica" acha "Lógica"). */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Paleta de nós: agrupada por família (Gatilho, Esperas, Lógica, Mensagens,
 * Ações no CRM, Fim), com busca e com arrastar para o canvas — ou clique, que
 * põe o nó no centro da vista. A cor do bloco de ícone é a mesma do cartão no
 * canvas, então a família se reconhece nos dois lugares.
 *
 * Só os tipos são botões (`palette-add-<tipo>`): títulos de grupo e campo de
 * busca não, para a ordem dos botões seguir sendo a de `NOS_DA_SUPERFICIE`.
 */
function NodePaletteBase({ onAdd, variant = "desktop", surface = "followup" }: Props) {
  const t = useT();
  const isMobile = variant === "mobile";
  const [busca, setBusca] = useState("");

  const grupos = useMemo(() => {
    const termo = normalizar(busca.trim());
    const porCategoria = new Map<CategoriaDoNo, NodeType[]>();
    for (const tipo of NOS_DA_SUPERFICIE[surface]) {
      const visual = NODE_VISUALS[tipo];
      const categoria = CATEGORIA_DO_TIPO[tipo];
      if (
        termo &&
        !normalizar(`${t(visual.paletteLabel)} ${t(CATEGORIAS_DO_NO[categoria].rotulo)}`).includes(
          termo,
        )
      ) {
        continue;
      }
      porCategoria.set(categoria, [...(porCategoria.get(categoria) ?? []), tipo]);
    }
    return (Object.keys(CATEGORIAS_DO_NO) as CategoriaDoNo[])
      .filter((c) => porCategoria.has(c))
      .map((c) => ({ categoria: c, tipos: porCategoria.get(c)! }));
  }, [busca, surface, t]);

  return (
    <aside
      className={cn(
        "fluxo-paleta flex min-h-0 flex-col",
        isMobile ? "h-full w-full" : "hidden w-64 shrink-0 border-r border-border bg-card lg:flex",
      )}
      data-testid="node-palette"
    >
      <div className="border-b border-border p-3">
        <h2 className="mb-2 px-1 text-sm font-semibold text-foreground">{t("Adicionar nó")}</h2>
        <div className="relative">
          <MagnifyingGlass
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={t("Buscar")}
            aria-label={t("Buscar")}
            className="h-9 pl-8"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {grupos.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("Nenhum resultado")}
          </p>
        )}
        {grupos.map(({ categoria, tipos }) => (
          <section key={categoria} className="mb-2" data-categoria={categoria}>
            <h3 className="fluxo-paleta__grupo">{t(CATEGORIAS_DO_NO[categoria].rotulo)}</h3>
            {tipos.map((tipo) => {
              const visual = NODE_VISUALS[tipo];
              const Icon = visual.icon;
              return (
                <Button
                  key={visual.type}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="fluxo-paleta__item h-auto min-h-10 w-full justify-start gap-2.5 px-2 py-1.5 text-left font-normal"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-followup-node-type", visual.type);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onAdd(visual.type)}
                  data-testid={`palette-add-${visual.type}`}
                  data-categoria={categoria}
                >
                  <span className="fluxo-paleta__icone" data-categoria={categoria}>
                    <Icon size={16} aria-hidden />
                  </span>
                  <span className="text-sm whitespace-normal">{t(visual.paletteLabel)}</span>
                </Button>
              );
            })}
          </section>
        ))}
      </div>
    </aside>
  );
}

export const NodePalette = memo(NodePaletteBase);
