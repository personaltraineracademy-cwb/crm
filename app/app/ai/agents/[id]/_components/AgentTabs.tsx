"use client";
/**
 * A TELA DO AGENTE COM MENU À ESQUERDA (pedido da dona, 25/11/2026, com prints
 * de referência): à esquerda o rosto do agente, o nome, o estado, o modelo e o
 * menu (Perfil, Trabalho, Treinamentos, Canais, Integrações, Configurações),
 * mais "Teste sua IA"; à direita, a seção aberta.
 *
 * O formulário continua UM só (`AgentForm`, rascunho e publicação): as seções
 * dele ficam montadas e só escondidas, então trocar de seção — ou abrir o teste
 * e voltar — não perde o que foi digitado. Execuções, Histórico, Propostas e o
 * uso das capacidades, que eram abas no alto, viraram o grupo "Acompanhar".
 */
import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { aparenciaDoAgente } from "@/lib/ai/agents/aparencia";
import { cn } from "@/lib/utils";
import {
  Brain,
  Briefcase,
  ChartBar,
  ChatCircle,
  ClockCounterClockwise,
  FileText,
  Gear,
  ListChecks,
  PlugsConnected,
  Sparkle,
  UserCircle,
  WhatsappLogo,
} from "@/lib/ui/icons";
import { AgentForm, type ChannelSessionLite, type SecaoDoAgente } from "./AgentForm";
import type { CoberturaPorFunil } from "./FunisDoAgente";
import type { MaterialDoAcervo } from "./BasesDoAgente";
import type { FunilDaResposta } from "@/hooks/pipelines/usePipelines";
import { TestPanel } from "./TestPanel";
import { RunsTable } from "./RunsTable";
import { UsoDasCapacidades } from "./UsoDasCapacidades";
import { VersionHistory } from "./VersionHistory";
import { ProposalsPanel } from "./ProposalsPanel";
import { AvatarDoAgente } from "../../_components/AvatarDoAgente";
import { deriveAgentStatus } from "../../_components/AgentStatusBadge";
import { modeloParaLeigo } from "../../_components/AgentCard";
import type { AgentRow } from "@/hooks/ai/useAgent";
import type { AgentVersionRow } from "@/hooks/ai/useAgentVersions";
import type { CredentialRow } from "@/hooks/ai/useCredentials";

interface Props {
  /** Funis da org, para a marcação de escopo do agente (spec 17 passo 3). */
  funis?: FunilDaResposta[];
  cobertura?: CoberturaPorFunil;
  /** O acervo da organização, para a seção "o que ele consulta" (0181). */
  materiais?: MaterialDoAcervo[];
  agent: AgentRow;
  draft: AgentVersionRow | null;
  published: AgentVersionRow | null;
  /** De onde o formulário se hidrata — ver `lib/ai/agents/versoes-da-tela.ts`. */
  base?: AgentVersionRow | null;
  /** Rascunho anterior à publicada: existe, mas não abre nem publica. */
  draftObsoleto?: AgentVersionRow | null;
  versions: AgentVersionRow[];
  credentials: CredentialRow[];
  /** Provedores cuja chave veio na instalação — ver `AgentForm`. */
  provedoresDaInstalacao?: string[];
  /** Os provedores que a instalação oferece — ver `AgentForm`. */
  provedoresOferecidos?: readonly string[];
  channelSessions: ChannelSessionLite[];
  routerMembership?: { routerId: string; routerName: string; channelSessionId: string; channelStatus: string | null } | null;
  readOnly?: boolean;
  organizationTimezone?: string;
}

type Visao = SecaoDoAgente | "teste" | "capacidades" | "runs" | "history" | "proposals";

type Icone = React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

export function AgentTabs(props: Props) {
  const t = useT();
  const [visao, setVisao] = React.useState<Visao>("perfil");
  const hasVersion = !!(props.draft || props.published);
  const ehFormulario = visao !== "teste" && visao !== "capacidades" && visao !== "runs" && visao !== "history" && visao !== "proposals";

  const status = deriveAgentStatus(props.agent);
  const noAr = status === "published" && !props.agent.paused_at;
  const versaoDaTela = props.draft ?? props.published ?? props.base ?? null;
  const modelo = versaoDaTela?.model ?? props.agent.model ?? "";

  const secoes: Array<[SecaoDoAgente, string, Icone]> = [
    ["perfil", t("Perfil"), UserCircle],
    ["trabalho", t("Trabalho"), Briefcase],
    ["treinamentos", t("Treinamentos"), Brain],
    ["canais", t("Canais"), WhatsappLogo],
    ["integracoes", t("Integrações"), PlugsConnected],
    ["configuracoes", t("Configurações"), Gear],
  ];
  const acompanhar: Array<[Visao, string, Icone]> = [
    ["runs", t("Execuções"), ListChecks],
    ["history", t("Histórico"), ClockCounterClockwise],
    ["proposals", t("Propostas"), FileText],
    ["capacidades", t("Uso das capacidades"), ChartBar],
  ];

  const rotuloDaVisao =
    visao === "teste"
      ? t("Teste sua IA")
      : ([...secoes, ...acompanhar].find(([id]) => id === visao)?.[1] ?? "");

  function itemDoMenu([id, rotulo, Ic]: [Visao, string, Icone]) {
    const ativo = visao === id;
    return (
      <li key={id}>
        <button
          type="button"
          onClick={() => setVisao(id)}
          aria-current={ativo ? "page" : undefined}
          data-menu-do-agente={id}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
            ativo
              ? "bg-primary/10 font-medium text-primary"
              : "text-foreground/80 hover:bg-muted hover:text-foreground",
          )}
        >
          <Ic size={18} aria-hidden />
          {rotulo}
        </button>
      </li>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* ─── A coluna do agente ─── */}
      <aside className="flex flex-col items-center gap-5 border-b border-dashed border-border p-6 lg:border-r lg:border-b-0">
        <div className="relative">
          <AvatarDoAgente aparencia={aparenciaDoAgente(props.agent.config, props.agent.name)} tamanho="lg" className="size-24 rounded-full text-5xl" />
          <span
            className={cn(
              "absolute -top-1 -left-1 size-4 rounded-full border-2 border-card",
              noAr ? "bg-success" : "bg-muted-foreground/50",
            )}
            title={noAr ? t("Atendendo") : t("Fora do ar")}
            aria-hidden
          />
        </div>
        <div className="text-center">
          <h2 className="font-semibold">{props.agent.name}</h2>
          {props.agent.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{props.agent.description}</p>
          ) : null}
          <p className={cn("mt-1 text-xs font-medium", noAr ? "text-success-foreground" : "text-muted-foreground")}>
            {noAr ? t("Atendendo") : t("Fora do ar")}
          </p>
        </div>
        {modelo ? (
          <button
            type="button"
            onClick={() => setVisao("perfil")}
            title={t("Trocar o modelo")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10"
          >
            <Sparkle size={14} aria-hidden />
            {modeloParaLeigo(modelo)}
          </button>
        ) : null}

        <nav aria-label={t("Seções do agente")} className="w-full">
          <ul className="flex flex-col gap-1">{secoes.map(itemDoMenu)}</ul>
          <p className="mt-5 mb-1 px-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t("Acompanhar")}
          </p>
          <ul className="flex flex-col gap-1">{acompanhar.map(itemDoMenu)}</ul>
        </nav>

        <button
          type="button"
          onClick={() => setVisao("teste")}
          disabled={!hasVersion}
          title={hasVersion ? undefined : t("Salve um rascunho para testar")}
          data-menu-do-agente="teste"
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-sm transition-colors disabled:opacity-50",
            visao === "teste" ? "bg-primary/85 text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          <ChatCircle size={16} aria-hidden />
          {t("Teste sua IA")}
        </button>
      </aside>

      {/* ─── A seção aberta ─── */}
      <section className="min-w-0 p-5 sm:p-8" aria-label={rotuloDaVisao}>
        {/* O formulário fica montado sempre: esconder não perde o que foi digitado. */}
        <div className={ehFormulario ? undefined : "hidden"}>
          <AgentForm
            mode="edit"
            secao={ehFormulario ? visao : "perfil"}
            agent={props.agent}
            draft={props.draft}
            published={props.published}
            base={props.base}
            draftObsoleto={props.draftObsoleto}
            credentials={props.credentials}
            provedoresDaInstalacao={props.provedoresDaInstalacao}
            provedoresOferecidos={props.provedoresOferecidos}
            channelSessions={props.channelSessions}
            funis={props.funis}
            cobertura={props.cobertura}
            materiais={props.materiais}
            routerMembership={props.routerMembership}
            readOnly={props.readOnly}
            organizationTimezone={props.organizationTimezone}
          />
        </div>

        {visao === "teste" ? (
          <TestPanel agent={props.agent} draft={props.draft} published={props.published} readOnly={props.readOnly} />
        ) : null}
        {visao === "capacidades" ? <UsoDasCapacidades agentId={props.agent.id} active /> : null}
        {visao === "runs" ? <RunsTable agentId={props.agent.id} active /> : null}
        {visao === "proposals" ? (
          <ProposalsPanel agentId={props.agent.id} active readOnly={props.readOnly} />
        ) : null}
        {visao === "history" ? (
          <VersionHistory agentId={props.agent.id} versions={props.versions} readOnly={props.readOnly} />
        ) : null}
      </section>
    </div>
  );
}
