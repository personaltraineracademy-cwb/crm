"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  MiniMap,
  addEdge,
  useNodesInitialized,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type EdgeMouseHandler,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { semAresta, semArestasDoNo, semNo } from "@/lib/followup/excluir-do-grafo";
import {
  toReactFlow,
  fromReactFlow,
  graphsEqual,
  toFlowNode,
  type RFNode,
  type RFEdge,
  type RFNodeData,
} from "@/lib/followup/graph-mappers";
import { conditionLabel } from "@/lib/followup/edge-condition-options";
import { nextSequenceId } from "@/lib/followup/next-sequence-id";
import {
  branchIdForCondition,
  conditionForBranch,
  nodeBranches,
  type FlowEdge,
  type FlowGraph,
  type NodeType,
} from "@/lib/followup/graph-schema";
import { rotuloDoRamo } from "@/lib/followup/rotulo-do-ramo";
import { validateFlowForPublish } from "@/lib/followup/validate-publish";
import { useFollowupFlow, type FollowupFlowDetailRow } from "@/hooks/followup/useFollowupFlow";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { CLASSE_DO_CANVAS, ControlesDoFluxo, FundoDoFluxo } from "@/components/fluxo/tema-do-fluxo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Plus, X } from "@/lib/ui/icons";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { EdgeConfigPanel } from "./EdgeConfigPanel";
import { EtapasDoFluxoProvider, useEtapasDoFluxo } from "./EtapasDoFluxo";
import { EstadoDosNosProvider, type EstadoDoNo } from "./EstadoDosNos";
import { NodePalette } from "./NodePalette";
import { PublishBar } from "./PublishBar";
import { ArestaDoFluxo, type ArestaDoFluxoEdge } from "./ArestaDoFluxo";
import { pedidosDeRota, retangulos, saidaDaAresta, type NoGeometrico } from "./desenho/geometria";
import { estimarTamanhoDoNo } from "./desenho/medidas";
import { organizarFluxo } from "./desenho/organizar";
import { larguraDoRotulo, rotearArestas } from "./desenho/rotas";
import {
  CATEGORIA_DO_TIPO,
  NODE_VISUALS,
  configPadraoDaAcao,
  type CategoriaDoNo,
} from "./nodes/nodeVisuals";
import { TriggerNode } from "./nodes/TriggerNode";
import { WaitNode } from "./nodes/WaitNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ClassifyNode } from "./nodes/ClassifyNode";
import { MatchReplyNode } from "./nodes/MatchReplyNode";
import { RepeatNode } from "./nodes/RepeatNode";
import { ActionNode } from "./nodes/ActionNode";
import { EndNode } from "./nodes/EndNode";
import { CollectNode } from "./nodes/CollectNode";
import { InternalTaskNode } from "./nodes/InternalTaskNode";
import { MoveLeadNode } from "./nodes/MoveLeadNode";
import { EditLeadTagNode } from "./nodes/EditLeadTagNode";
import { SkillNode } from "./nodes/SkillNode";

const EMPTY_GRAPH: FlowGraph = { nodes: [], edges: [] };
const DND_MIME = "application/x-followup-node-type";

/**
 * Zoom mínimo do enquadramento inicial e do "Organizar": abaixo dele o título
 * do cartão (15px) cai para menos de 14px na tela e o resumo (13px) para menos
 * de 12px. Fluxo maior que a tela abre no topo, legível, e o resto se alcança
 * arrastando o fundo ou pelo minimapa — não encolhendo tudo até virar
 * miniatura (que era o que a captura da dona mostrava).
 */
const ZOOM_LEGIVEL = 0.93;
const MARGEM_DA_VISTA = 48;
const DURACAO_DO_ORGANIZAR_MS = 320;
const DURACAO_DO_ENQUADRAR_MS = 300;

// Defined outside the component — React Flow warns (and re-mounts nodes) if
// nodeTypes is a fresh object every render. `memo` em cada nó: no arrasto só o
// nó arrastado recebe props novas (posição); os outros não re-renderizam.
const nodeTypes: NodeTypes = {
  trigger: memo(TriggerNode),
  wait: memo(WaitNode),
  condition: memo(ConditionNode),
  ai_classify: memo(ClassifyNode),
  match_reply: memo(MatchReplyNode),
  repeat: memo(RepeatNode),
  action: memo(ActionNode),
  // `internal_task` estava na paleta, no schema, no publish e no motor — e não
  // aqui (#1540): o React Flow caía no fallback da caixa desconhecida, sem
  // rótulo e sem formulário. Completar o nó é esta linha mais o formulário do
  // painel (`forms/InternalTaskForm`).
  internal_task: memo(InternalTaskNode),
  // #2065 — as duas caixas novas da issue: sem estas linhas o React Flow cai
  // no fallback da caixa desconhecida (o mesmo defeito do #1540 medido ali em
  // cima), sem rótulo e sem formulário.
  move_lead: memo(MoveLeadNode),
  edit_lead_tag: memo(EditLeadTagNode),
  end: memo(EndNode),
  collect: memo(CollectNode),
  skill: memo(SkillNode),
};

const edgeTypes: EdgeTypes = { fluxo: ArestaDoFluxo };

/**
 * Aresta desenhada → objeto entregue ao @xyflow, chaveado pelo objeto da
 * aresta no estado. Enquanto a aresta e o desenho dela (rótulo, rota, seleção)
 * não mudam, o @xyflow recebe o MESMO objeto e não re-renderiza o fio — no
 * arrasto, só os fios que de fato se mexem são redesenhados. `WeakMap`: some
 * sozinho quando a aresta sai do estado.
 */
const CACHE_DE_ARESTAS = new WeakMap<RFEdge, { chave: string; aresta: ArestaDoFluxoEdge }>();
/**
 * Minimapa em RETRATO: o fluxo é vertical, e num quadro deitado a coluna de
 * nós virava um risco no meio de um retângulo vazio. Cada nó leva a cor da
 * família (a mesma do ícone do cartão) e a moldura da vista é a primária —
 * é ela que diz "você está aqui" num fluxo maior que a tela.
 */
const TAMANHO_DO_MINIMAPA = { width: 132, height: 176 } as const;
function corNoMinimapa(no: RFNode): string {
  const categoria = CATEGORIA_DO_TIPO[(no.type ?? "action") as NodeType] ?? "fim";
  return COR_DA_CATEGORIA[categoria];
}
const COR_DA_CATEGORIA: Record<CategoriaDoNo, string> = {
  gatilho: "var(--tone-violet)",
  espera: "var(--tone-cyan)",
  logica: "var(--tone-orange)",
  mensagem: "var(--tone-teal)",
  crm: "var(--tone-blue)",
  fim: "var(--tone-stone)",
};
const DEFAULT_EDGE_OPTIONS = { type: "fluxo" } as const;
const FIT_VIEW_OPTIONS = { padding: 0.12, duration: DURACAO_DO_ENQUADRAR_MS, maxZoom: 1 } as const;

function prefereMenosMovimento(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** Desaceleração suave (ease-out cúbico) para o pan, o zoom e o "Organizar". */
const suavizar = (t: number) => 1 - Math.pow(1 - t, 3);

interface Props {
  flowId: string;
  initialData: FollowupFlowDetailRow;
}

function FlowCanvasInner({ flowId, initialData }: Props) {
  const t = useT();
  const { nomes } = useEtapasDoFluxo();
  const { data: flow } = useFollowupFlow(flowId, { initialData });
  // `initial` seeds React Flow state ONCE on mount — it must NOT react to
  // `flow` changing on every refetch (that would clobber in-progress edits).
  const initial = useMemo(
    () => toReactFlow(initialData.draft_graph ?? EMPTY_GRAPH),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>(initial.edges);
  const [savedGraph, setSavedGraph] = useState<FlowGraph>(initialData.draft_graph ?? EMPTY_GRAPH);
  // As configurações do GRAFO (palavras-gatilho, teto de tentativas, prazo do
  // roteiro) não vivem em nó nenhum: sem este estado, salvar o rascunho as
  // apagava — `fromReactFlow` só conhece nós e arestas.
  const [settings, setSettings] = useState<FlowGraph["settings"]>(
    initialData.draft_graph?.settings,
  );
  const surface = initialData.surface ?? "followup";
  // Continue after the largest persisted suffix. Starting again at 1 makes a
  // newly-created node/edge reuse an existing React Flow key and visually
  // replace a connection in older drafts.
  const nextId = useRef(nextSequenceId(initial.nodes.map((node) => node.id)));
  const nextEdgeId = useRef(nextSequenceId(initial.edges.map((edge) => edge.id)));
  const {
    screenToFlowPosition,
    getNodesBounds,
    getNode,
    getNodes,
    getEdges,
    getInternalNode,
    setViewport,
    zoomTo,
  } = useReactFlow<RFNode, RFEdge>();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // O grafo que a barra (sujo/salvar) e a validação leem anda ADIADO: no
  // arrasto, o nó muda de posição a cada quadro, e recalcular grafo, igualdade
  // e validação nesse ritmo era o que engasgava (linha de base: até 493 ms
  // num quadro). O React refaz estes cálculos quando sobra tempo.
  const nodesAdiados = useDeferredValue(nodes);
  const edgesAdiadas = useDeferredValue(edges);
  const liveGraph = useMemo(() => {
    const base = fromReactFlow(nodesAdiados, edgesAdiadas);
    return settings ? { ...base, settings } : base;
  }, [nodesAdiados, edgesAdiadas, settings]);
  const dirty = useMemo(() => !graphsEqual(liveGraph, savedGraph), [liveGraph, savedGraph]);

  // Salvar e publicar leem o grafo NA HORA do clique (não o adiado), para um
  // clique logo depois de digitar nunca gravar o estado de um quadro antes.
  const atual = useRef({ nodes, edges, settings });
  useLayoutEffect(() => {
    atual.current = { nodes, edges, settings };
  }, [nodes, edges, settings]);
  const obterGrafo = useCallback((): FlowGraph => {
    const { nodes: ns, edges: es, settings: st } = atual.current;
    const base = fromReactFlow(ns, es);
    return st ? { ...base, settings: st } : base;
  }, []);

  // Estado de cada cartão: o que o publish recusaria (mesma regra do servidor)
  // e o que mudou desde o último "Salvar". Identidade estável enquanto o
  // resultado não muda — os cartões só re-renderizam quando o selo muda.
  const chaveDoEstado = useMemo(() => {
    const resultado = validateFlowForPublish(liveGraph, { surface });
    const porNo: Record<string, EstadoDoNo> = {};
    if (!resultado.ok) {
      for (const e of resultado.errors) {
        if (!e.node_id) continue;
        const atualDoNo = (porNo[e.node_id] ??= {});
        atualDoNo.pendencias = [...(atualDoNo.pendencias ?? []), e.message];
      }
    }
    const salvos = new Map(
      savedGraph.nodes.map((n) => [n.id, JSON.stringify([n.type, n.label, n.config])]),
    );
    for (const n of liveGraph.nodes) {
      if (salvos.get(n.id) !== JSON.stringify([n.type, n.label, n.config]))
        (porNo[n.id] ??= {}).rascunho = true;
    }
    return JSON.stringify(porNo);
  }, [liveGraph, savedGraph, surface]);
  const estadoDosNos = useMemo(
    () => new Map(Object.entries(JSON.parse(chaveDoEstado) as Record<string, EstadoDoNo>)),
    [chaveDoEstado],
  );

  const markNodeErrors = useCallback(
    (errorsByNode: Record<string, string[]>) => {
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, errors: errorsByNode[n.id] } })),
      );
    },
    [setNodes],
  );
  const clearNodeErrors = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => (n.data.errors ? { ...n, data: { ...n.data, errors: undefined } } : n)),
    );
  }, [setNodes]);

  // Node and edge selection are mutually exclusive — opening one panel closes the other's.
  const onNodeClick = useCallback<NodeMouseHandler<RFNode>>((_, node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);
  const onEdgeClick = useCallback<EdgeMouseHandler<ArestaDoFluxoEdge>>((_, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const updateNodeData = useCallback(
    (id: string, patch: Partial<RFNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      );
    },
    [setNodes],
  );
  const updateEdgeCondition = useCallback(
    (id: string, condition: FlowEdge["condition"]) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === id ? { ...e, data: { priority: e.data?.priority ?? 0, condition } } : e,
        ),
      );
    },
    [setEdges],
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;
  const selectedEdgeSource = selectedEdge
    ? (nodes.find((n) => n.id === selectedEdge.source) ?? null)
    : null;
  const selectedEdgeTarget = selectedEdge
    ? (nodes.find((n) => n.id === selectedEdge.target) ?? null)
    : null;

  const nosPorId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Wire label: derived at render time from `data.condition`, never persisted on the edge
  // itself — `condition` alone stays the source of truth the mapper round-trips.
  // Num nó que ramifica o texto vem do RAMO (o rótulo que o usuário leu na
  // bolinha de onde arrastou), não da condição crua: `conditionLabel` sozinho
  // mostraria o id do ramo, que não é palavra nenhuma para quem não programa.
  const rotuloDe = useCallback(
    (source: RFNode | undefined, condition: FlowEdge["condition"]): string => {
      const flowSource = source ? toFlowNode(source) : undefined;
      const branch = flowSource
        ? nodeBranches(flowSource).find((b) => b.id === branchIdForCondition(flowSource, condition))
        : undefined;
      return branch ? t(rotuloDoRamo(branch, nomes)) : t(conditionLabel(condition));
    },
    [t, nomes],
  );

  // Rotas: cada fio ganha um canal vertical livre de nós (`desenho/rotas.ts`).
  // Roda a cada quadro do arrasto (o fio acompanha o nó), mas é O(arestas×nós)
  // e as arestas cujo desenho não mudou mantêm o MESMO objeto — o `memo` da
  // aresta e o @xyflow pulam a re-renderização delas (`CACHE_DE_ARESTAS`).
  const edgesForRender = useMemo(() => {
    const geometria = new Map<string, NoGeometrico>();
    for (const n of nodes) {
      const interno = getInternalNode(n.id);
      const ramosY = new Map<string, number>();
      for (const h of interno?.internals.handleBounds?.source ?? []) {
        if (h.id) ramosY.set(h.id, h.y + h.height / 2);
      }
      const estimado = estimarTamanhoDoNo(toFlowNode(n));
      geometria.set(n.id, {
        id: n.id,
        node: toFlowNode(n),
        x: n.position.x,
        y: n.position.y,
        w: n.measured?.width ?? estimado.w,
        h: n.measured?.height ?? estimado.h,
        ramosY,
      });
    }
    const arestas = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      condition: e.data?.condition ?? ({ type: "always" } as const),
    }));
    const rotulos = new Map(
      arestas.map((a) => [a.id, rotuloDe(nosPorId.get(a.source), a.condition)]),
    );
    const pedidos = pedidosDeRota(geometria, arestas, (a) => rotulos.get(a.id) ?? "");
    const ladoPorId = new Map(pedidos.map((p) => [p.id, p.lado]));
    const rotas = rotearArestas(retangulos(geometria.values()), pedidos);

    const saida = edges.map((e): ArestaDoFluxoEdge => {
      const rota = rotas.get(e.id);
      const lado = ladoPorId.get(e.id);
      const label = rotulos.get(e.id) ?? "";
      const selected = e.id === selectedEdgeId;
      const sempre =
        (e.data?.condition ?? { type: "always" }).type === "always" && lado === "baixo";
      const chave = `${label}|${lado}|${rota?.canal},${rota?.y1},${rota?.y2}|${selected}`;
      const anterior = CACHE_DE_ARESTAS.get(e);
      if (anterior && anterior.chave === chave) return anterior.aresta;
      const aresta: ArestaDoFluxoEdge = {
        ...e,
        type: "fluxo",
        label,
        selected,
        className: sempre ? "fluxo-aresta fluxo-aresta--sempre" : "fluxo-aresta",
        data: {
          priority: e.data?.priority ?? 0,
          condition: e.data?.condition ?? { type: "always" },
          lado,
          rota,
        },
      };
      CACHE_DE_ARESTAS.set(e, { chave, aresta });
      return aresta;
    });
    return saida;
  }, [edges, nodes, nosPorId, selectedEdgeId, rotuloDe, getInternalNode]);

  // Quais saídas do nó selecionado já têm aresta. Quem sabe isso é o canvas —
  // o formulário não vê o grafo, e sem esse dado ele trocaria o modo do nó
  // deixando ligações órfãs sem conseguir dizer quantas.
  const ramosLigadosDoSelecionado = useMemo(() => {
    if (!selectedNode) return [];
    const source = toFlowNode(selectedNode);
    return edges
      .filter((e) => e.source === selectedNode.id)
      .map((e) => branchIdForCondition(source, e.data?.condition ?? { type: "always" }))
      .filter((id): id is string => id !== null);
  }, [selectedNode, edges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      // A bolinha de onde o usuário arrastou É a saída escolhida: o React Flow
      // devolve o id do ramo em `sourceHandle`. Antes a aresta nascia sempre
      // `always` e o usuário tinha que ir ao painel dizer de novo, de qual regra
      // ela saía — o que, com uma bolinha só, era impossível de expressar.
      const source = getNode(connection.source);
      const fromBranch =
        source && connection.sourceHandle
          ? conditionForBranch(toFlowNode(source), connection.sourceHandle)
          : null;
      const newEdge: RFEdge = {
        id: `edge-${nextEdgeId.current++}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        data: { priority: 0, condition: fromBranch ?? { type: "always" } },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, getNode],
  );

  // O nó de ação nasce com o padrão do gatilho do fluxo. O callback depende só
  // do `kind` (string), não do objeto `trigger_config`, que é novo a cada refetch.
  const triggerKindRaw = flow?.trigger_config?.kind;
  const triggerKind = typeof triggerKindRaw === "string" ? triggerKindRaw : undefined;

  const addNodeAt = useCallback(
    (type: NodeType, position: { x: number; y: number }) => {
      const visual = NODE_VISUALS[type];
      const id = `${type}-${nextId.current++}`;
      const config = type === "action" ? configPadraoDaAcao(triggerKind) : visual.defaultConfig();
      const newNode: RFNode = {
        id,
        type,
        position,
        data: { label: t(visual.defaultLabel), config },
        // Só o nó RECÉM-CRIADO entra com animação (`fluxo.css`); os que já
        // existiam aparecem no lugar ao abrir. `className` é do @xyflow e não
        // vai para o banco (`toFlowNode` não o lê).
        className: "fluxo-no-novo",
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, t, triggerKind],
  );

  /**
   * Clique na paleta: o nó nasce no centro da VISTA (onde o dono está olhando),
   * descendo até achar um lugar livre — nunca em cima de outro cartão nem fora
   * da tela, que era o que a grade fixa de 220px fazia com o card de 272px.
   */
  const onPaletteAdd = useCallback(
    (type: NodeType) => {
      const caixa = canvasRef.current?.getBoundingClientRect();
      const centro = caixa
        ? screenToFlowPosition({ x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 3 })
        : { x: 80, y: 80 };
      const tamanho = estimarTamanhoDoNo({
        type,
        config: NODE_VISUALS[type].defaultConfig(),
      } as never);
      const ocupados = getNodes().map((n) => ({
        x: n.position.x,
        y: n.position.y,
        w: n.measured?.width ?? tamanho.w,
        h: n.measured?.height ?? tamanho.h,
      }));
      const base = {
        x: Math.round(centro.x - tamanho.w / 2),
        y: Math.round(centro.y - tamanho.h / 2),
      };
      const livre = (p: { x: number; y: number }) =>
        !ocupados.some(
          (o) =>
            p.x < o.x + o.w + 24 &&
            o.x < p.x + tamanho.w + 24 &&
            p.y < o.y + o.h + 24 &&
            o.y < p.y + tamanho.h + 24,
        );
      // A parte do fluxo que está na tela, em coordenadas do fluxo.
      const vista = caixa
        ? {
            a: screenToFlowPosition({ x: caixa.left, y: caixa.top }),
            b: screenToFlowPosition({ x: caixa.right, y: caixa.bottom }),
          }
        : null;
      const visivel = (p: { x: number; y: number }) =>
        !vista ||
        (p.x >= vista.a.x &&
          p.y >= vista.a.y &&
          p.x + tamanho.w <= vista.b.x &&
          p.y + tamanho.h <= vista.b.y);
      // Procura em anel ao redor do centro: na mesma linha (para os lados, em
      // meias colunas) antes de descer — perto de onde o dono está olhando.
      // Vaga inteira na tela primeiro; sem nenhuma, a primeira vaga livre.
      const candidatos: { x: number; y: number }[] = [];
      for (let linha = 0; linha < 12; linha++) {
        for (const coluna of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2]) {
          candidatos.push({
            x: Math.round(base.x + coluna * (tamanho.w + 40)),
            y: Math.round(base.y + linha * (tamanho.h + 32)),
          });
        }
      }
      const pos = candidatos.find((c) => livre(c) && visivel(c)) ?? candidatos.find(livre) ?? base;
      addNodeAt(type, pos);
    },
    [addNodeAt, getNodes, screenToFlowPosition],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => semNo(nds, id));
      setEdges((eds) => semArestasDoNo(eds, id));
      setSelectedNodeId((cur) => (cur === id ? null : cur));
    },
    [setNodes, setEdges],
  );

  const deleteEdge = useCallback(
    (id: string) => {
      setEdges((eds) => semAresta(eds, id));
      setSelectedEdgeId((cur) => (cur === id ? null : cur));
    },
    [setEdges],
  );

  const onDeleteSelection = useCallback(() => {
    if (selectedNodeId) deleteNode(selectedNodeId);
    else if (selectedEdgeId) deleteEdge(selectedEdgeId);
  }, [selectedNodeId, selectedEdgeId, deleteNode, deleteEdge]);

  /**
   * Enquadrar legível: cabe na tela quando cabe; quando não cabe, abre no TOPO
   * do fluxo (o gatilho), alinhado à esquerda, no zoom mínimo de leitura. Pan
   * e zoom animados, com desaceleração; sem animação para quem pediu menos
   * movimento.
   */
  const enquadrar = useCallback(
    (animar: boolean) => {
      const ns = getNodes();
      const caixa = canvasRef.current;
      if (ns.length === 0 || !caixa) return;
      const b = getNodesBounds(ns);
      const vw = caixa.clientWidth;
      const vh = caixa.clientHeight;
      const m = MARGEM_DA_VISTA;
      const cabe = Math.min(
        (vw - m * 2) / Math.max(b.width, 1),
        (vh - m * 2) / Math.max(b.height, 1),
        1,
      );
      const zoom = Math.max(cabe, ZOOM_LEGIVEL);
      const x = b.width * zoom > vw - m * 2 ? m - b.x * zoom : vw / 2 - (b.x + b.width / 2) * zoom;
      const y =
        b.height * zoom > vh - m * 2 ? m - b.y * zoom : vh / 2 - (b.y + b.height / 2) * zoom;
      const duracao = animar && !prefereMenosMovimento() ? DURACAO_DO_ENQUADRAR_MS : 0;
      void setViewport({ x, y, zoom }, { duration: duracao, ease: suavizar });
    },
    [getNodes, getNodesBounds, setViewport],
  );

  /** Posições da árvore vertical (`desenho/organizar.ts`) para os nós e arestas atuais. */
  const calcularOrganizacao = useCallback((): Map<string, { x: number; y: number }> => {
    const ns = getNodes();
    const es = getEdges();
    const porId = new Map(ns.map((n) => [n.id, n]));
    return organizarFluxo(
      ns.map((n) => {
        const estimado = estimarTamanhoDoNo(toFlowNode(n));
        return {
          id: n.id,
          type: n.type ?? "action",
          w: n.measured?.width ?? estimado.w,
          h: n.measured?.height ?? estimado.h,
        };
      }),
      es.map((e) => {
        const condition = e.data?.condition ?? ({ type: "always" } as const);
        const source = porId.get(e.source);
        const lado = source
          ? saidaDaAresta(toFlowNode(source), { sourceHandle: e.sourceHandle, condition }).lado
          : "baixo";
        return {
          source: e.source,
          target: e.target,
          lado,
          larguraDoRotulo: larguraDoRotulo(rotuloDe(source, condition)),
        };
      }),
    );
  }, [getNodes, getEdges, rotuloDe]);

  // Primeiro enquadramento: quando o DOM mediu os cartões (antes disso o
  // tamanho é estimado e o enquadramento erraria). Fluxo vazio não enquadra —
  // enquadrar um nó só é ampliá-lo ao zoom máximo (medido no trace do e2e
  // followup-cartoes: scale 1 → 2 logo após o primeiro clique).
  //
  // CARTÕES SOBREPOSTOS AO ABRIR: os modelos (`lib/followup/modelos/escada.ts`)
  // e os fluxos antigos foram posicionados para o cartão de 224px, numa fila a
  // cada 260px; com o cartão de 272px eles se encostam, e não há por onde o fio
  // passar. Nesse caso o construtor abre já organizado — só apresentação: o
  // rascunho salvo passa a ter as mesmas posições (o indicador de "não salvo"
  // não acende), e reabrir dá o mesmo desenho, porque o layout é determinístico.
  const medidos = useNodesInitialized();
  const jaEnquadrou = useRef(false);
  useEffect(() => {
    if (!medidos || jaEnquadrou.current || initial.nodes.length === 0) return;
    jaEnquadrou.current = true;
    const ns = getNodes();
    const caixas = ns.map((n) => ({
      x: n.position.x,
      y: n.position.y,
      w: n.measured?.width ?? 0,
      h: n.measured?.height ?? 0,
    }));
    const sobrepostos = caixas.some((a, i) =>
      caixas.some(
        (b, j) => j > i && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h,
      ),
    );
    if (!sobrepostos) {
      enquadrar(false);
      return;
    }
    const destino = calcularOrganizacao();
    const reposicionar = <T extends { id: string; position: { x: number; y: number } }>(
      n: T,
    ): T => {
      const p = destino.get(n.id);
      return p ? { ...n, position: p } : n;
    };
    // Fora do corpo do efeito (no próximo tique): o efeito só decide.
    window.setTimeout(() => {
      setNodes((nds) => nds.map(reposicionar));
      setSavedGraph((g) => ({ ...g, nodes: g.nodes.map(reposicionar) }));
      window.setTimeout(() => enquadrar(false), 50);
    }, 0);
  }, [medidos, enquadrar, initial.nodes.length, getNodes, calcularOrganizacao, setNodes]);

  const animacao = useRef<number | null>(null);
  const seguranca = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (animacao.current !== null) cancelAnimationFrame(animacao.current);
      if (seguranca.current !== null) window.clearTimeout(seguranca.current);
    },
    [],
  );

  /**
   * "Organizar": árvore vertical com os nós DESLIZANDO até o lugar novo
   * (320 ms, desaceleração) — os fios acompanham porque a posição muda de
   * verdade a cada quadro, não por transição de CSS. Um temporizador garante o
   * fim: em aba em segundo plano o navegador não entrega quadros, e o
   * "Organizar" não pode ficar pela metade.
   */
  const onAutoFit = useCallback(() => {
    const ns = getNodes();
    if (ns.length === 0) return;
    const destino = calcularOrganizacao();
    const origem = new Map(ns.map((n) => [n.id, n.position]));
    if (animacao.current !== null) cancelAnimationFrame(animacao.current);
    if (seguranca.current !== null) window.clearTimeout(seguranca.current);

    const aplicar = (fator: number) =>
      setNodes((nds) =>
        nds.map((n) => {
          const de = origem.get(n.id);
          const para = destino.get(n.id);
          if (!de || !para) return n;
          return {
            ...n,
            position:
              fator >= 1
                ? para
                : { x: de.x + (para.x - de.x) * fator, y: de.y + (para.y - de.y) * fator },
          };
        }),
      );
    const terminar = (animarVista: boolean) => {
      if (animacao.current !== null) cancelAnimationFrame(animacao.current);
      if (seguranca.current !== null) window.clearTimeout(seguranca.current);
      animacao.current = null;
      seguranca.current = null;
      aplicar(1);
      window.setTimeout(() => enquadrar(animarVista), 30);
    };

    if (prefereMenosMovimento()) {
      terminar(false);
      return;
    }
    const inicio = performance.now();
    const passo = (agora: number) => {
      const progresso = Math.min(1, (agora - inicio) / DURACAO_DO_ORGANIZAR_MS);
      if (progresso >= 1) {
        terminar(true);
        return;
      }
      aplicar(suavizar(progresso));
      animacao.current = requestAnimationFrame(passo);
    };
    animacao.current = requestAnimationFrame(passo);
    seguranca.current = window.setTimeout(() => terminar(true), DURACAO_DO_ORGANIZAR_MS + 120);
  }, [getNodes, setNodes, enquadrar, calcularOrganizacao]);

  // Atalhos do n8n: 1 = ajustar à tela, 0 = zoom 100%. Nunca dentro de campo.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        alvo.closest("input, textarea, select, [contenteditable='true']")
      )
        return;
      if (e.key === "1") enquadrar(true);
      else if (e.key === "0")
        void zoomTo(1, { duration: prefereMenosMovimento() ? 0 : DURACAO_DO_ENQUADRAR_MS });
    },
    [enquadrar, zoomTo],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(DND_MIME) as NodeType | "";
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNodeAt(type, position);
    },
    [screenToFlowPosition, addNodeAt],
  );

  const selection = selectedNode ? "node" : selectedEdge ? "edge" : null;

  return (
    <EstadoDosNosProvider valor={estadoDosNos}>
      <div className="flex h-full min-h-0 w-full flex-col">
        {flow && (
          <PublishBar
            flowId={flowId}
            flow={flow}
            graph={liveGraph}
            obterGrafo={obterGrafo}
            dirty={dirty}
            selection={selection}
            onDeleteSelection={onDeleteSelection}
            onSaved={setSavedGraph}
            onPublishErrors={markNodeErrors}
            onPublishSuccess={clearNodeErrors}
            onAutoFit={onAutoFit}
            canAutoFit={nodes.length > 0}
          />
        )}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <NodePalette onAdd={onPaletteAdd} surface={surface} />
          {/* Abaixo de `lg` a paleta fixa não cabe do lado do canvas —
              vira um drawer, disparado por este botão flutuante. */}
          <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
            <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 p-0 lg:hidden">
              <SheetTitle className="sr-only">{t("Adicionar nó")}</SheetTitle>
              <NodePalette
                variant="mobile"
                surface={surface}
                onAdd={(type) => {
                  onPaletteAdd(type);
                  setPaletteOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>

          <div
            ref={canvasRef}
            className="relative h-full flex-1"
            data-testid="flow-canvas"
            onDragOver={onDragOver}
            onDrop={onDrop}
            onKeyDown={onKeyDown}
          >
            <ReactFlow
              nodes={nodes}
              edges={edgesForRender}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              className={`${CLASSE_DO_CANVAS} fluxo-canvas`}
              proOptions={{ hideAttribution: true }}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
              connectionLineType={ConnectionLineType.SmoothStep}
              minZoom={0.2}
              maxZoom={1.75}
            >
              <FundoDoFluxo />
              <ControlesDoFluxo showInteractive={false} fitViewOptions={FIT_VIEW_OPTIONS} />
              <MiniMap
                pannable
                zoomable
                className="fluxo-minimapa"
                style={TAMANHO_DO_MINIMAPA}
                nodeColor={corNoMinimapa}
                nodeStrokeWidth={0}
                nodeBorderRadius={10}
                maskStrokeColor="var(--primary)"
                maskStrokeWidth={2}
                ariaLabel={t("Visão geral")}
              />
            </ReactFlow>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute right-4 bottom-4 z-10 shadow-md lg:hidden"
              onClick={() => setPaletteOpen(true)}
            >
              <Plus size={14} aria-hidden /> {t("Adicionar nó")}
            </Button>
          </div>

          {/*
            Docked panel em telas grandes (`lg:`) — NÃO é overlay ali: o canvas
            continua clicável, então trocar de nó/aresta selecionado funciona com
            o painel aberto. Abaixo de `lg` os 384px (`w-96`) sozinhos já passavam
            da largura de QUALQUER celular, e como o pai é `overflow-hidden`, o
            painel não ganhava scroll — ficava certo, cortado, inacessível. Vira
            bottom sheet (`fixed`, ancorado embaixo, com teto de altura e X pra
            fechar) só nesse intervalo de tela.
          */}
          {selectedNode && (
            <aside
              className="fluxo-painel fixed inset-x-0 bottom-[var(--rodape-ocupado,0px)] z-40 flex max-h-[75vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-lg lg:static lg:z-auto lg:h-full lg:max-h-none lg:w-96 lg:shrink-0 lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none"
              data-testid="node-config-sheet"
            >
              {/* Barra própria pro X, não sobreposta ao conteúdo — um botão
                  flutuante por cima do cabeçalho do painel colidiria com rótulo
                  comprido (texto sobre texto). */}
              <div className="flex shrink-0 justify-end p-2 lg:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNodeId(null)}
                  aria-label={t("Fechar")}
                >
                  <X size={16} aria-hidden />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pt-0 lg:pt-4">
                <NodeConfigPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  onChange={(patch) => updateNodeData(selectedNode.id, patch)}
                  onDelete={() => deleteNode(selectedNode.id)}
                  ramosLigados={ramosLigadosDoSelecionado}
                  surface={surface}
                  flowId={flowId}
                  settings={settings}
                  onSettingsChange={setSettings}
                />
              </div>
            </aside>
          )}

          {selectedEdge && (
            <aside
              className="fluxo-painel fixed inset-x-0 bottom-[var(--rodape-ocupado,0px)] z-40 flex max-h-[75vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-lg lg:static lg:z-auto lg:h-full lg:max-h-none lg:w-96 lg:shrink-0 lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none"
              data-testid="edge-config-sheet"
            >
              <div className="flex shrink-0 justify-end p-2 lg:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEdgeId(null)}
                  aria-label={t("Fechar")}
                >
                  <X size={16} aria-hidden />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pt-0 lg:pt-4">
                <EdgeConfigPanel
                  key={selectedEdge.id}
                  sourceNode={selectedEdgeSource ? toFlowNode(selectedEdgeSource) : undefined}
                  targetNode={selectedEdgeTarget ? toFlowNode(selectedEdgeTarget) : undefined}
                  condition={selectedEdge.data?.condition ?? { type: "always" }}
                  onChange={(condition) => updateEdgeCondition(selectedEdge.id, condition)}
                  onDelete={() => deleteEdge(selectedEdge.id)}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </EstadoDosNosProvider>
  );
}

export function FlowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <EtapasDoFluxoProvider>
        <FlowCanvasInner {...props} />
      </EtapasDoFluxoProvider>
    </ReactFlowProvider>
  );
}
