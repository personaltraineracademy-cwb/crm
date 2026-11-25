"use client";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/hooks/i18n/useT";
import { useBoard } from "@/hooks/kanban/useBoard";

function formatError(err: unknown, t: (texto: string) => string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const obj = err as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    if (typeof obj.message === "string") {
      const code = typeof obj.code === "string" ? ` [${obj.code}]` : "";
      return `${obj.message}${code}`;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return t("Erro desconhecido");
    }
  }
  return String(err);
}
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CalendarioDoFunil } from "@/components/kanban/CalendarioDoFunil";
import { FilterBar } from "@/components/kanban/FilterBar";
import { BulkActionBar } from "@/components/kanban/BulkActionBar";
import { NewLeadDialog } from "@/components/kanban/NewLeadDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { CalendarBlank, Gear, Kanban, Plus } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";
import type { OrdemDoQuadro } from "@/lib/kanban/ordem-do-quadro";
import type { LeadFilters } from "@/lib/kanban/filters";
import { applyFilters, filtersFromParams, filtersToParams } from "@/lib/kanban/filters";
import { categoriaDoMotivo } from "@/lib/leads/motivos-de-perda-do-funil";
import { ROLE_RANK, type Role } from "@/lib/auth/types";

export function PipelinePageClient({
  pipelineId,
  initialName,
  role,
  funis,
}: {
  pipelineId: string;
  initialName: string;
  role: Role;
  /**
   * Os funis vivos da organização (`id` + `name`, na ordem da lista) — a MESMA
   * partição da tela de Funis. É o que alimenta o seletor de troca rápida do
   * cabeçalho; sem ele o quadro não sabe que existem outros funis.
   */
  funis: Array<{ id: string; name: string }>;
}) {
  const t = useT();
  const { data, isLoading, error, pulses, realtimeStatus, seguranca } = useBoard(pipelineId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const setFilters = useCallback(
    (next: LeadFilters) => {
      const qs = filtersToParams(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  /**
   * A visão do funil (#2770). Quadro é o padrão — é o que todo mundo já
   * conhece, e a aba nova não pode sequestrar a tela de quem só quer mover
   * card. O estado é LOCAL e não vai na URL: diferente do filtro (que é
   * compartilhável e sobrevive a um refresh), a vista é um olhar momentâneo —
   * e o quadro de volta no mesmo lugar onde ficou é o que se espera ao voltar.
   */
  const [visao, setVisao] = useState<"quadro" | "calendario">("quadro");
  /** A ordem dos cards em cada etapa — ver `lib/kanban/ordem-do-quadro.ts`. */
  const [ordem, setOrdem] = useState<OrdemDoQuadro>("manual");
  /** A etapa de onde o "Novo negócio" foi aberto (o "+" no pé da coluna). */
  const [etapaDoNovo, setEtapaDoNovo] = useState<string | null>(null);
  const abrirNovo = useCallback((stageId: string | null) => {
    setEtapaDoNovo(stageId);
    setNewOpen(true);
  }, []);
  // A engrenagem leva às etapas do funil, que só gestor edita.
  const podeConfigurar = ROLE_RANK[role] >= ROLE_RANK.manager;

  /**
   * Motivo e categoria da perda (#1537): a categoria NÃO vem no lead — ela é
   * `settings.lost_reasons` do funil, que o payload do quadro já traz. O
   * resolvedor é o MESMO que o relatório usa (`categoriaDoMotivo`), para o
   * filtro e o relatório nunca dizerem coisas diferentes.
   */
  const categoriaDo = useMemo(() => {
    const settings = data?.pipeline.settings;
    return (motivo: string) => categoriaDoMotivo(motivo, settings);
  }, [data?.pipeline.settings]);
  const filteredLeads = data ? applyFilters(data.leads, filters, { categoriaDo }) : [];
  // NÃO é a conta do FilterBar: o seletor de filtro lista as três caixas
  // (`marcadoresDoCard`: negócio, contato e conversa), e esta lista, a da tag em
  // lote, só `lead.tags` — é lá que a ação em lote grava (#852). O `useMemo` é o
  // mesmo cuidado de lá: solta no corpo, a conta roda em toda renderização
  // e devolve um array NOVO a cada vez. E esta página re-renderiza a cada tecla
  // da busca (o debounce do FilterBar mexe na query string) e a cada mudança de
  // seleção de card.
  const tagsDoQuadro = useMemo(
    () => [...new Set((data?.leads ?? []).flatMap((l) => l.tags))].sort(),
    [data?.leads],
  );
  const nomeAtual = data?.pipeline.name ?? initialName;
  // Um funil só = nada para trocar: o seletor seria ruído permanente.
  const podeTrocar = funis.length > 1;

  return (
    <div
      // O QUADRO CABE NA TELA. A página rolava com a janela: o quadro media o
      // que media a coluna mais comprida, e a barra de rolagem horizontal ficava
      // no pé dele — com uma etapa cheia, era preciso descer até o fim para
      // conseguir andar para o lado, e no caminho o nome da etapa sumia do alto.
      // Com a altura da área visível (100dvh menos a barra do topo, h-14, e o
      // padding do <main>), quem rola é o quadro: a barra horizontal fica sempre
      // no pé da tela e o cabeçalho de cada etapa fica preso em cima. O piso de
      // 28rem é para tela baixa demais, onde a página volta a rolar.
      //
      // ⚠️ A PARCELA DE BAIXO VEM DO CONTRATO, e era um `3rem` literal.
      //
      // Aquele literal era a segunda metade do `p-6` do `<main>` escrita à mão,
      // e ela não sabia de nenhuma peça fixa no rodapé. Com a barra de abas do
      // celular (`components/shell/BarraInferior.tsx`, 56px mais a área segura),
      // o quadro media 48px a mais do que tinha e o fim dele — justamente onde
      // mora a barra de rolagem horizontal, a razão desta linha existir —
      // passava a correr POR BAIXO das abas.
      //
      // `max(var(--space-6), var(--rodape-ocupado, 0px))` é a mesma fórmula do
      // `components/inbox/InboxLayout.tsx`, e é o que o gate
      // `tests/unit/altura-fixa-le-a-reserva-do-rodape.test.ts` cobra: altura
      // fixa não desconta número próprio, lê a reserva.
      className="casca-ferramenta flex min-h-[28rem] flex-col gap-4"
      // OBSERVÁVEL de propósito, e é a razão de existir desta linha: "a
      // assinatura morreu" e "nada aconteceu" produzem o MESMO silêncio na
      // tela, e sem este valor nem o produto nem o teste conseguem separar as
      // duas famílias de causa. Com ele, quem investiga olha DURANTE a rodada
      // que falha: `subscribed` manda procurar a montante (entrega, filtro, ou
      // o evento nunca saiu); `channel_error`/`timed_out`/`closed` já é a
      // resposta.
      //
      // Ainda NÃO religa — religar é desenho e merece bloco próprio. Isto aqui
      // é só parar de descartar o que já era calculado.
      data-realtime-status={realtimeStatus.toLowerCase()}
      // A rede de segurança fica OBSERVÁVEL pelo mesmo motivo do status do
      // canal: "a entrega morreu" e "nada aconteceu" têm a mesma aparência, que
      // é silêncio. Aqui o número de divergências é a diferença entre os dois —
      // e é o sinal que faltava para uma verificação poder APROVAR, e não só
      // reprovar.
      data-refetch-divergencias={seguranca.divergencias}
      data-refetch-em={seguranca.ultimaVerificacao ?? ""}
    >
      {/* A BARRA DO FUNIL, numa linha só (desenho de referência): visão, funil,
          filtros e, à direita, configurações e "Criar". Quebra em várias linhas
          no celular em vez de empurrar o "Criar" para fora da tela. */}
      <header className="flex flex-wrap items-center gap-2" data-cabecalho-do-funil>
        {/*
          A visão do funil (#2770): quadro é o padrão. Dois botões de ícone com
          `aria-pressed`, e o nome por extenso no rótulo acessível e na dica.
        */}
        <div
          role="group"
          aria-label={t("Visualização")}
          className="inline-flex h-9 items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
        >
          {(
            [
              { valor: "quadro", rotulo: t("Quadro"), Icone: Kanban },
              { valor: "calendario", rotulo: t("Calendário"), Icone: CalendarBlank },
            ] as const
          ).map(({ valor, rotulo, Icone }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={visao === valor}
              aria-label={rotulo}
              title={rotulo}
              onClick={() => setVisao(valor)}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                visao === valor
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icone size={16} aria-hidden />
            </button>
          ))}
        </div>

        {/*
          O FUNIL. Com um funil só, `h1` visível (nada para trocar); com vários, o
          gatilho do `Select` veste o nome e o `h1` real vai para `sr-only` —
          botão dentro de `h1` é HTML inválido. Trocar zera a query string:
          filtro de um funil aplicado no outro é resultado fantasma.
        */}
        <h1
          className={
            podeTrocar
              ? "sr-only"
              : "inline-flex h-9 max-w-64 min-w-0 items-center truncate rounded-full border border-border bg-card px-3.5 text-sm font-semibold"
          }
        >
          {nomeAtual}
        </h1>
        {podeTrocar && (
          <Select
            value={funis.some((f) => f.id === pipelineId) ? pipelineId : undefined}
            onValueChange={(id) => {
              if (id !== pipelineId) router.push(`/app/pipelines/${id}`);
            }}
          >
            <SelectTrigger
              aria-label={`${t("Trocar de funil")}: ${nomeAtual}`}
              data-testid="trocar-funil"
              className="h-9 w-auto max-w-64 min-w-0 gap-1.5 rounded-full border-border bg-card px-3.5 text-sm font-semibold shadow-none [&>span]:truncate"
            >
              <SelectValue placeholder={nomeAtual} />
            </SelectTrigger>
            <SelectContent>
              {funis.map((f) => (
                <SelectItem
                  key={f.id}
                  value={f.id}
                  data-testid={`trocar-funil-opcao-${f.id}`}
                >
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <FilterBar
          filters={filters}
          onChange={setFilters}
          leads={data?.leads ?? []}
          settings={data?.pipeline.settings}
          ordem={visao === "quadro" ? ordem : undefined}
          onOrdemChange={setOrdem}
        />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {podeConfigurar && (
            <Link
              href="/app/settings/tenant/pipelines"
              aria-label={t("Configurar funis e etapas")}
              title={t("Configurar funis e etapas")}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Gear size={16} aria-hidden />
            </Link>
          )}
          <Button
            onClick={() => abrirNovo(null)}
            disabled={!data}
            className="h-9 shrink-0 rounded-full px-4"
          >
            <Plus size={16} className="mr-1.5" /> {t("Criar")}
          </Button>
        </div>
      </header>
      {data && (
        <p className="-mt-2 px-1 text-xs text-muted-foreground tabular-nums" data-total-do-funil>
          {filteredLeads.length === 1
            ? t("1 negociação")
            : t("{n} negociações").replace("{n}", String(filteredLeads.length))}
          {filteredLeads.length !== data.leads.length && (
            <> · {t("de {n} no funil").replace("{n}", String(data.leads.length))}</>
          )}
        </p>
      )}
      {data && (
        <NewLeadDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          pipelineId={pipelineId}
          stages={data.stages}
          // #1751: o quadro é a lista que o diálogo confere ANTES de criar —
          // é ela que faz o aviso de negócio duplicado existir sem rede.
          leads={data.leads}
          // #3038: os campos que a etapa exige são preenchidos no PRÓPRIO
          // formulário — a lista sai do `settings` que o quadro já tem em mãos.
          settings={data.pipeline.settings}
          etapaInicial={etapaDoNovo}
        />
      )}
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {t("Não consegui carregar este funil:")} {formatError(error, t)}
        </div>
      ) : isLoading || !data ? (
        <div className="flex flex-1 animate-pulse items-center justify-center text-muted-foreground">
          {t("Carregando…")}
        </div>
      ) : visao === "calendario" ? (
        // A MESMA lista filtrada do quadro: as duas abas olham o mesmo funil,
        // e discordar sobre quem está nele seria pior do que não ter filtro.
        <CalendarioDoFunil
          pipelineId={pipelineId}
          pipeline={data.pipeline}
          stages={data.stages}
          leads={filteredLeads}
        />
      ) : (
        <KanbanBoard
          pipelineId={pipelineId}
          stages={data.stages}
          leads={filteredLeads}
          pulses={pulses}
          pipeline={data.pipeline}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          leadInicial={searchParams.get("lead")}
          podeRenomearEtapa={ROLE_RANK[role] >= ROLE_RANK.manager}
          ordem={ordem}
          onAdicionarNaEtapa={abrirNovo}
        />
      )}
      <BulkActionBar
        selectedIds={selectedIds}
        stages={data?.stages ?? []}
        pipelineId={pipelineId}
        vocabulary={data?.pipeline.vocabulary ?? null}
        tagsExistentes={tagsDoQuadro}
        onClear={() => setSelectedIds([])}
      />
    </div>
  );
}
