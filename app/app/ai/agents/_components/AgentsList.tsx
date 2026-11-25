"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MagnifyingGlass, Robot, Plus } from "@/lib/ui/icons";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/i18n/useT";
import { useAgentsList } from "@/hooks/ai/useAgents";
import type { AgentRow } from "@/hooks/ai/useAgent";
import { AgentCard } from "./AgentCard";
import { deriveAgentStatus } from "./AgentStatusBadge";

interface Props {
  initialData: AgentRow[];
  canWrite: boolean;
}

type Aba = "todos" | "ativos" | "inativos" | "arquivados";

/**
 * A LISTA DE AGENTES (pedido da dona, 25/11/2026, com print de referência): um
 * cartão com as abas Todos, Ativos e Inativos, a busca ao lado e uma linha por
 * agente. "Criar agente" fica no cabeçalho da página. Ativo = no ar (versão
 * publicada); inativo = rascunho ou parado. Arquivado só aparece na aba dele,
 * que só existe quando há algum.
 */
export function AgentsList({ initialData, canWrite }: Props) {
  const t = useT();
  const { data, isLoading } = useAgentsList({ initialData });
  const [aba, setAba] = useState<Aba>("todos");
  const [query, setQuery] = useState("");

  const agents = data ?? [];
  const temArquivado = agents.some((a) => deriveAgentStatus(a) === "archived");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      const s = deriveAgentStatus(a);
      if (aba === "arquivados") {
        if (s !== "archived") return false;
      } else {
        if (s === "archived") return false;
        if (aba === "ativos" && s !== "published") return false;
        if (aba === "inativos" && s === "published") return false;
      }
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, aba, query]);

  if (!isLoading && agents.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Robot size={36} aria-hidden className="text-muted-foreground" />
        <h2 className="font-medium">{t("Nenhum agente configurado")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t(
            "Crie um agente para responder a conversas no WhatsApp com IA. Você configura prompt, tools, gatilhos e janela de contexto.",
          )}
        </p>
        {canWrite && (
          <Link href="/app/ai/agents/new">
            <Button className="mt-1">
              <Plus size={14} aria-hidden className="mr-2" /> {t("Criar agente")}
            </Button>
          </Link>
        )}
      </Card>
    );
  }

  const abas: Array<[Aba, string]> = [
    ["todos", t("Todos")],
    ["ativos", t("Ativos")],
    ["inativos", t("Inativos")],
    ...(temArquivado ? ([["arquivados", t("Arquivados")]] as Array<[Aba, string]>) : []),
  ];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div role="tablist" aria-label={t("Filtrar agentes")} className="flex flex-wrap gap-1">
          {abas.map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={
                aba === id
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            >
              {rotulo}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass
            size={14}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Buscar por nome…")}
            aria-label={t("Buscar agentes")}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading && agents.length === 0 ? (
        <ul aria-busy="true" className="divide-y divide-border">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4">
              <span className="size-12 animate-pulse rounded-full bg-muted" />
              <span className="h-4 w-40 animate-pulse rounded-md bg-muted" />
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          {t("Nenhum agente corresponde aos filtros atuais.")}
        </p>
      ) : (
        <ul className="divide-y divide-border" data-lista-de-agentes>
          {filtered.map((agent) => (
            <li key={agent.id}>
              <AgentCard agent={agent} canWrite={canWrite} />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
        {filtered.length === 0
          ? t("Nenhum agente")
          : `1–${filtered.length} ${t("de")} ${filtered.length}`}
      </div>
    </Card>
  );
}
