"use client";

import { useLocaleDeData } from "@/hooks/i18n/useLocaleDeData";
import { format } from "date-fns";
import { useT } from "@/hooks/i18n/useT";
import { ArrowBendUpLeft, ArrowBendUpRight, CaretDown, Check, Checks, Clock, PencilSimple, Robot, Trash, WarningOctagon } from "@/lib/ui/icons";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Message } from "@/lib/types/messaging";
import type { ReacaoNoBalao } from "@/lib/inbox/reacoes-no-fio";
import { lerRemetenteDeGrupo, rotuloDoRemetente } from "@/lib/messaging/remetente-de-grupo";
import { motivoDaFalhaDaMensagem } from "@/lib/inbox/motivo-da-falha";
import { CitationButton } from "@/components/ai/CitationButton";
import { MediaRenderer } from "@/components/inbox/media/MediaRenderer";
import { MediaUnavailable } from "@/components/inbox/media/MediaUnavailable";
import { ContactCard } from "@/components/inbox/media/ContactCard";
import { LocationCard } from "@/components/inbox/media/LocationCard";
import { localizacaoDaMensagem } from "@/lib/messaging/localizacao";
import { reenvioDaMensagem } from "@/lib/messaging/reenvio";
import { ApiError } from "@/lib/api/types";
import { resolveSharedContact } from "@/lib/messaging/contact-card";
import { lerAnuncioDaMensagem } from "@/lib/leads/atribuicao-de-anuncio";
import { marcadorDaApagada, textoDaApagadaApareceNaInbox } from "@/lib/messaging/apagada";
import { AnuncioCard } from "@/components/inbox/AnuncioCard";
import {
  extractCitations,
  isAiGeneratedMessage,
} from "@/lib/ai/citations/types";

interface Props {
  message: Message;
  searchMatch?: boolean;
  debugCitations?: boolean;
  /** Escolher esta mensagem para responder "em cima" dela. */
  onResponder?: (m: Message) => void;
  /**
   * Escolher esta mensagem para ENCAMINHAR a outra conversa (#2835). O gesto
   * abre a escolha de destino; quem executa é o hook da tela.
   */
  onEncaminhar?: (m: Message) => void;
  /** A mensagem citada por ESTA, quando houver — desenha o fio. */
  citada?: Message | null;
  /** As reações a ESTA mensagem — marca no canto do balão, nunca balão próprio. */
  reacoes?: ReacaoNoBalao[];
  /**
   * QUEM está lendo a conversa. É o que separa "Você" de "Atendente": a coluna
   * `sent_via='user'` só diz *"um humano digitou no CRM"*, nunca QUAL humano.
   *
   * Sem este id, uma organização com dois atendentes mostrava "Você" nas
   * mensagens do colega — cada um lia o atendimento do outro como se fosse o
   * seu. Por isso a ausência do id NÃO cai em "Você": quem não sabe quem está
   * lendo (a leitura do super-admin em `AdminThread`, por exemplo) rotula
   * "Atendente", que é verdadeiro para todo mundo.
   */
  viewerUserId?: string | null;
  onEditar?: (text: string) => Promise<void>;
  onApagar?: () => Promise<void>;
  onOcultar?: () => Promise<void>;
  onRestaurar?: () => Promise<void>;
  /**
   * Enviar de novo uma mensagem que falhou ou ficou parada. Só quem tem a
   * conversa na mão passa (o `ChatThread`); a leitura do super-admin não
   * passa, e a bolha não desenha o botão. Quem decide SE a mensagem pode ser
   * reenviada é `reenvioDaMensagem`, a mesma regra da rota.
   */
  onReenviar?: (confirmado: boolean) => Promise<void>;
  /** Gerente para cima reenvia mensagem de colega — a mesma régua da rota. */
  podeReenviarDeOutros?: boolean;
}

/** Quem tem um motor que reenvia sozinho quando a conexão volta (`redriveQueued`). */
const SAI_SOZINHA_QUANDO_VOLTAR = new Set(["ai", "automation", "system"]);

/**
 * A FORMA DO BALÃO — escolha visual GRANDE que o Unnify não responde (o DS
 * não cobre conversa). Fica numa constante para trocar sem caçar classe.
 *
 *   "quina" (RECOMENDADA, a que está no ar): raio 12 (`rounded-xl`, o do
 *     cartão) com o canto de baixo do lado de quem fala em 4. Sem cauda
 *     desenhada: o balão é conteúdo, não flutua, e a superfície é lisa (DS §1).
 *   "cauda" (ALTERNATIVA registrada): a mesma quina mais uma cauda de 8px
 *     desenhada para fora, na cor do balão (como o WhatsApp). No balão do
 *     cliente a cauda não leva a borda de 1px.
 */
export type FormaDoBalao = "quina" | "cauda";
export const FORMA_DO_BALAO: FormaDoBalao = "quina";

/**
 * QUEM FALA DECIDE A SUPERFÍCIE (adaptação do Unnify, sem cor nova):
 *   cliente  → `card` com borda 1px (no claro o `muted` some no fundo da página);
 *   equipe   → `interactive`, o azul suave da seleção, com texto `foreground`;
 *   automático (IA, automação, sistema) → `muted`, e a IA ganha o selo "IA"
 *     em chip `info`.
 * A nota interna é outro componente (`NoteCard`, trio de aviso).
 */
type Autor = "cliente" | "equipe" | "automatico";
const SUPERFICIE_DO_AUTOR: Record<Autor, string> = {
  cliente: "border-border bg-card text-card-foreground",
  equipe: "border-transparent bg-interactive text-foreground",
  automatico: "border-transparent bg-muted text-foreground",
};
const AUTOMATICOS = new Set(["ai", "automation", "system"]);

function AckIndicator({ status, paradaSemConexao, saiSozinha, t }: {
  status: string; paradaSemConexao: boolean; saiSozinha: boolean; t: (texto: string) => string;
}) {
  // Só a linha que o envio PAROU por falta de conexão (`queued_reason`). Todo
  // envio nasce `queued` por um instante; mostrar o relógio nele diria
  // "aguardando" a cada mensagem que sai normalmente.
  if (paradaSemConexao) {
    // "Aguardando" só promete o que acontece: a mensagem de pessoa não é
    // reenviada por ninguém quando o número volta, e fica com o botão.
    return saiSozinha ? (
      <span className="text-warning-foreground inline-flex items-center gap-1 font-medium">
        <Clock size={12} weight="bold" aria-hidden /> {t("Aguardando conexão")}
      </span>
    ) : (
      <span className="text-danger-foreground inline-flex items-center gap-1 font-medium">
        <WarningOctagon size={12} weight="bold" aria-hidden /> {t("Não enviada — sem conexão")}
      </span>
    );
  }
  if (status === "read") {
    return <Checks size={12} weight="bold" className="text-primary" aria-label={t("Lida")} />;
  }
  if (status === "delivered") {
    return <Checks size={12} weight="bold" aria-label={t("Entregue")} />;
  }
  if (status === "sent") {
    return <Check size={12} weight="bold" aria-label={t("Enviada")} />;
  }
  return null;
}

export function MessageBubble({
  message,
  searchMatch = false,
  debugCitations,
  onResponder,
  onEncaminhar,
  citada,
  reacoes,
  viewerUserId,
  onEditar,
  onApagar,
  onOcultar,
  onRestaurar,
  onReenviar,
  podeReenviarDeOutros = false,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(message.body ?? "");
  const [apagando, setApagando] = useState(false);
  const [ocultando, setOcultando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoReenvio, setConfirmandoReenvio] = useState(false);
  const salvandoEdicao = useRef(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const abrindoEdicao = useRef(false);
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!editando) return;
    // O editor aumenta a altura da última bolha; sem rolar o fio, os botões
    // ficam escondidos atrás da área de resposta até a pessoa usar o mouse.
    editorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [editando]);
  const localeDaData = useLocaleDeData();
  const t = useT();
  const isOutbound = message.direction === "outbound";
  const time = format(new Date(message.sent_at), "HH:mm", { locale: localeDaData });
  const isFailed = message.status === "failed";
  const hasMedia = Boolean(message.media_url || message.media_storage_path);
  // A retenção marcou `metadata.media_status = 'expired'` (migration 0557) e a
  // poda anulou os DOIS campos — a partir daí `hasMedia` é false e esta mensagem
  // de mídia perde o render. O aviso é o do issue #1534.
  const mediaExpirada = (message.metadata as Record<string, unknown> | null)?.media_status === "expired";
  // O texto do aviso carrega os DIAS que a organização configurou — a 0557
  // guarda `media_retention_days` (já com o piso de 30) junto do marcador,
  // porque a bolha não tem acesso à configuração da organização e "por política"
  // sem o número é uma promessa sem medida. Sem o campo (mensagem marcada por
  // uma versão anterior), o aviso genérico.
  const diasDaRetencao = (() => {
    const meta = message.metadata as Record<string, unknown> | null;
    return typeof meta?.media_retention_days === "number" ? meta.media_retention_days : null;
  })();
  const avisoDeExpiracao =
    diasDaRetencao !== null
      ? t("Mídia apagada pela política de retenção ({n} dias)").replace("{n}", String(diasDaRetencao))
      : t("Mídia apagada pela política de retenção.");
  const isContact = message.type === "contact";
  // Pino com coordenadas: o cartão substitui o corpo, que é só o mesmo link em texto.
  const localizacao = localizacaoDaMensagem(message);
  // Figurinha sem caption: sem moldura de bolha (padrão WhatsApp).
  const isBareSticker = hasMedia && message.type === "sticker" && !message.body;
  // Apagada pelo autor ("apagar para todos"). A linha continua no histórico —
  // sumir com ela deixaria a resposta seguinte respondendo ao nada —, mas o
  // texto do CLIENTE não aparece: mostrá-lo seria expor justamente o que ele
  // pediu para tirar do ar. A régua mora em `lib/messaging/apagada.ts`.
  const apagada = Boolean(message.revoked_at);
  const textoApagadoVisivel = apagada && textoDaApagadaApareceNaInbox(message.direction);
  const ocultaNoCrm = Boolean(message.metadata?.crm_hidden_at);
  const editada = Boolean(message.edited_at) && !apagada;
  const enviadaPeloAtendente = isOutbound && ["user", "crm"].includes(message.sent_via)
    && Boolean(message.external_id) && !apagada
    && ["sent", "delivered", "read"].includes(message.status);
  const podeEditar = enviadaPeloAtendente && message.type === "text" && Boolean(message.body)
    && agora - new Date(message.sent_at).getTime() <= 15 * 60 * 1000;
  const podeApagar = enviadaPeloAtendente && Boolean(onApagar);
  const podeOcultar = !isOutbound && !apagada && Boolean(ocultaNoCrm ? onRestaurar : onOcultar);
  // Encaminhar vale para qualquer mensagem com conteúdo — recebida ou enviada.
  // Só não se encaminha o que foi apagado: o conteúdo saiu do ar de propósito.
  const podeEncaminhar = Boolean(onEncaminhar) && !apagada;
  const temMenu = Boolean(onResponder || podeEncaminhar || (podeEditar && onEditar) || podeApagar || podeOcultar);
  const reenvio = onReenviar
    ? reenvioDaMensagem(message, { userId: viewerUserId, podeReenviarDeOutros, agora })
    : "nenhum";
  const paradaSemConexao = message.status === "queued" && Boolean(message.metadata?.queued_reason)
    && !message.metadata?._optimistic;
  // O MOTIVO à vista, e não só no Tooltip: o dedo não abre Tooltip. O texto
  // cru do canal fica fora daqui — ele pode trazer endereço interno do serviço.
  const motivoDaFalha = motivoDaFalhaDaMensagem(message, t);
  const aiGenerated = isAiGeneratedMessage(message.metadata);
  const citations = extractCitations(message.metadata);
  const showCitationButton =
    isOutbound && aiGenerated && (debugCitations ?? false);
  // De quem saiu esta linha. `external_device` é a resposta pelo CELULAR — o
  // operador atendeu pelo WhatsApp do telefone, fora do CRM, e o ingest carimba
  // aqui. Antes isto voltava null para tudo que não fosse IA, e a bolha ficava
  // sem nome: o dono lia a conversa como se tudo tivesse sido digitado no CRM.
  // Os rótulos passam por t() no render (ver dicionario.ts para o espanhol).
  //
  // `'automation'` é a categoria de quem não é pessoa nem IA: regra de
  // automação, texto fixo do follow-up e lembrete de agenda (#652, decidida pelo
  // mantenedor em 16/09). Enquanto ninguém gravava o valor, um ramo aqui seria
  // controle decorativo — a tela oferecendo uma distinção que o motor não fazia.
  // O carimbo vive em `origemDaMensagem` (`app/api/v1/messages/_handler.ts`) e o
  // par é vigiado nas duas direções por tests/unit/rotulo-de-origem-tem-emissor.
  const senderLabel = (() => {
    if (!isOutbound) return null;
    // #1613: a autoria "em nome de" sobe a MESA. Quem apertou foi o token, mas
    // quem decidiu foi uma pessoa no outro sistema — sem este ramo a conversa
    // leria "Sistema" e perderia quem mandou. Os nomes vêm GRAVADOS na própria
    // linha (`metadata.sent_on_behalf`, escrito pelo handler), porque o balão
    // não faz join: o que não está na linha não aparece em lugar nenhum.
    const emNomeDe = message.sent_on_behalf_of_user_id
      ? (message.metadata?.sent_on_behalf as
          | { user_name?: string | null; token_name?: string | null }
          | undefined)
      : undefined;
    if (emNomeDe) {
      const nome = emNomeDe.user_name?.trim() || t("Atendente");
      // "Fulano · via {token}": só a palavra "via" passa por `t()`; os nomes
      // são dado do operador e saem como cadastrados — traduzir nome próprio é
      // o mesmo erro de #1046.
      return emNomeDe.token_name ? `${nome} · ${t("via")} ${emNomeDe.token_name}` : nome;
    }
    if (message.sent_via === "ai") return "IA";
    // A REGRA falou, e não a IA: texto fixo de automação, follow-up ou lembrete
    // de agenda (#652). O ramo passou a existir porque o valor passou a ser
    // gravado — antes dele, um rótulo aqui seria promessa sem dado atrás.
    if (message.sent_via === "automation") return "Automação";
    // A integração falou, a IA não. Sem este ramo a bolha omite a autoria e o
    // dono lê a conversa como se tudo tivesse saído do CRM — que é o defeito do
    // #866 visto de dentro da tela.
    if (message.sent_via === "system") return "Sistema";
    if (message.sent_via === "external_device") return "Celular";
    if (message.sent_via === "user" || message.sent_via === "crm") {
      // "Você" exige as DUAS pontas: saber quem lê e saber quem enviou. Falta
      // qualquer uma, o rótulo cai para "Atendente" — que continua dizendo o
      // que `sent_via` de fato garante (um humano, pelo CRM) sem afirmar uma
      // identidade que o dado não sustenta.
      return viewerUserId != null && message.sent_by_user_id === viewerUserId
        ? "Você"
        : "Atendente";
    }
    return null;
  })();
  // QUEM MANDOU, num grupo. Só faz sentido em mensagem RECEBIDA: uma mensagem
  // que ESTE CRM enviou não tem remetente a descobrir, é sempre o atendente (ou
  // a IA) — e `senderLabel`, acima, já diz quem foi. A leitura do dado bruto é
  // `lerRemetenteDeGrupo` (Task 2): este componente não conhece o formato de
  // `metadata.group_sender`, só o resultado já validado.
  const remetente = !isOutbound ? lerRemetenteDeGrupo(message.metadata) : null;
  const autor: Autor = !isOutbound
    ? "cliente"
    : AUTOMATICOS.has(message.sent_via)
      ? "automatico"
      : "equipe";
  const comCauda = FORMA_DO_BALAO === "cauda" && !isBareSticker;
  // UMA chamada a `t()` sobre o rótulo calculado (dívida congelada da cerca de
  // espanhol): o selo da IA e o texto simples usam a mesma tradução.
  const textoDoAutor = senderLabel ? t(senderLabel) : null;
  // O anúncio que gerou ESTA mensagem (a ingestão grava em `metadata.anuncio`
  // a mensagem nascida de um clique). Só na recebida: é o cliente que chega
  // pelo anúncio, como o WhatsApp mostra no celular.
  const anuncio = !isOutbound ? lerAnuncioDaMensagem(message.metadata?.anuncio) : null;

  async function reenviar(confirmado: boolean) {
    if (!onReenviar || ocupado) return;
    setOcupado(true);
    try { await onReenviar(confirmado); setConfirmandoReenvio(false); }
    catch (err) {
      // A rota viu "pode ter chegado" onde a bolha viu "nada saiu": pergunta antes.
      // Os outros erros o hook mostra; a bolha continua com o botão.
      if (err instanceof ApiError && err.code === "confirmacao_necessaria") setConfirmandoReenvio(true);
    }
    finally { setOcupado(false); }
  }

  async function salvarEdicao() {
    const novoTexto = texto.trim();
    if (!onEditar || !novoTexto || salvandoEdicao.current) return;
    // Enter e clique podem chegar antes de React atualizar `ocupado`; o ref
    // impede duas chamadas ao WhatsApp para a mesma edição.
    salvandoEdicao.current = true;
    setOcupado(true);
    try { await onEditar(novoTexto); setEditando(false); }
    catch { /* O hook mostra o erro; manter o texto para nova tentativa. */ }
    finally { salvandoEdicao.current = false; setOcupado(false); }
  }

  return (
    <div
      data-search-match={searchMatch || undefined}
      className={cn(
        "group flex w-full min-w-0 items-center gap-1 px-4 py-1",
        isOutbound ? "justify-end" : "justify-start",
      )}
    >
      <div
        // Identidade, não aparência. O e2e de citação contava bolhas por
        // `[class*='rounded-2xl']`, e qualquer componente novo com a mesma
        // classe utilitária entrava na conta — foi assim que o painel flutuante
        // fez a spec achar que havia mensagem onde não havia (issue #1318).
        data-testid="message-bubble"
        data-autor={autor}
        className={cn(
          "relative max-w-[75%] min-w-0 text-sm",
          isBareSticker
            ? "px-0 py-0"
            : cn(
                // Raio 12 com a quina de 4 do lado de quem fala; sem sombra
                // (balão é conteúdo, não flutua). Ver `FORMA_DO_BALAO`.
                "rounded-xl border px-3 py-2",
                temMenu && "pr-9",
                isOutbound ? "rounded-br-sm" : "rounded-bl-sm",
                SUPERFICIE_DO_AUTOR[autor],
              ),
          isFailed && "border-destructive",
          // Apagada sai das cores da DIREÇÃO e vai para o CINZA: a diferença
          // entre o que foi apagado e o que está vivo tem de ser vista de
          // relance, e o fundo é justamente o que diz de quem é a mensagem —
          // trocá-lo é o ponto.
          apagada && "border-border bg-muted/40 text-muted-foreground",
          // A marca da busca é ANEL, não cor de fundo: o fundo já diz de quem é
          // a mensagem, e trocá-lo apagaria essa leitura justo na bolha achada.
          searchMatch && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          // Espaço para a marca de reação, que fica metade para fora do balão.
          Boolean(reacoes?.length) && "mb-3",
        )}
      >
        {comCauda && (
          <span
            aria-hidden
            className={cn(
              "absolute bottom-0 size-2 bg-inherit",
              isOutbound
                ? "-right-2 [clip-path:polygon(0_0,0_100%,100%_100%)]"
                : "-left-2 [clip-path:polygon(100%_0,0_100%,100%_100%)]",
            )}
          />
        )}
        {temMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={t("Opções da mensagem")} disabled={ocupado}
                className={cn(
                  // Fantasma de 24 dentro do balão (o `icon-xs` encolhido um degrau).
                  "absolute top-1 right-1 z-10 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-[opacity,background-color,color] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1",
                  // No toque, a área que pega o dedo passa a ~48px sem mudar o desenho:
                  // a setinha é o único caminho para "Responder a esta mensagem".
                  "pointer-coarse:before:absolute pointer-coarse:before:-inset-3.5 pointer-coarse:before:content-['']",
                  "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
                  autor === "automatico" ? "hover:bg-card" : "hover:bg-muted",
                )}>
                <CaretDown size={16} weight="bold" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOutbound ? "end" : "start"} sideOffset={4}
              onCloseAutoFocus={(event) => {
                if (!abrindoEdicao.current) return;
                // O Radix devolve o foco à setinha ao fechar o menu. Isso rola o
                // fio de volta e esconde o Salvar logo depois de abrir o editor.
                event.preventDefault();
                abrindoEdicao.current = false;
                editorRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
                editorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "nearest" });
              }}>
              {onResponder && (
                <DropdownMenuItem onSelect={() => onResponder(message)}>
                  <ArrowBendUpLeft size={16} aria-hidden />{t("Responder a esta mensagem")}
                </DropdownMenuItem>
              )}
              {podeEncaminhar && (
                <DropdownMenuItem onSelect={() => onEncaminhar?.(message)}>
                  <ArrowBendUpRight size={16} aria-hidden />{t("Encaminhar")}
                </DropdownMenuItem>
              )}
              {podeEditar && onEditar && (
                <DropdownMenuItem onSelect={() => {
                  abrindoEdicao.current = true;
                  setTexto(message.body ?? "");
                  setEditando(true);
                }}>
                  <PencilSimple size={16} aria-hidden />{t("Editar mensagem")}
                </DropdownMenuItem>
              )}
              {podeApagar && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setApagando(true)} className="text-danger-foreground focus:bg-destructive/10 focus:text-danger-foreground">
                    <Trash size={16} aria-hidden />{t("Apagar para todos")}
                  </DropdownMenuItem>
                </>
              )}
              {podeOcultar && (ocultaNoCrm ? onRestaurar : onOcultar) && (
                <DropdownMenuItem onSelect={() => {
                  if (ocultaNoCrm && onRestaurar) void onRestaurar().catch(() => undefined);
                  else setOcultando(true);
                }}>
                  {ocultaNoCrm ? <PencilSimple size={16} aria-hidden /> : <Trash size={16} aria-hidden />}
                  {t(ocultaNoCrm ? "Restaurar no CRM" : "Ocultar no CRM")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/*
          A CITAÇÃO, dentro da bolha e acima do texto — o fio.

          Mostra de quem era e um trecho. `line-clamp-2` porque serve para
          reconhecer, não para reler: a original está logo acima no histórico.
        */}
        {citada && (
          <div
            className={cn(
              // Bloco aninhado (DS §1: `muted/40`, raio 8) com a barra de 2px
              // `primary` da citação de texto rico (DS §10.23).
              "relative mb-1.5 rounded-lg py-1 pr-2 pl-3 text-xs",
              autor === "automatico" ? "bg-card" : "bg-muted/40",
            )}
          >
            <span className="absolute inset-y-1 left-1 w-0.5 rounded-full bg-primary" aria-hidden />
            <div className="font-medium text-foreground">
              {citada.direction === "outbound" ? t("Você") : t("Cliente")}
            </div>
            {/*
              A CITADA PODE TER SIDO APAGADA — e aí o texto dela não volta aqui.

              A bolha principal já trata isto (`apagada`, acima): "mostrá-lo
              seria expor justamente o que o cliente pediu para tirar do ar". A
              citação é o mesmo texto, num segundo lugar da tela — sem esta
              linha, o "apagar para todos" do cliente sumia da bolha original e
              continuava legível dentro de cada resposta que a citou. O fio
              permanece (a citação some, não a resposta); o conteúdo, não.
            */}
            <div
              className={cn(
                "line-clamp-2 wrap-anywhere text-muted-foreground",
                Boolean(citada.revoked_at || citada.metadata?.crm_hidden_at) && "italic",
              )}
            >
              {citada.revoked_at
                ? t("Esta mensagem foi apagada")
                : citada.metadata?.crm_hidden_at
                ? t("Mensagem ocultada no CRM")
                : citada.type === "contact"
                ? resolveSharedContact(citada)?.name || t("Contato")
                : citada.body?.trim() || t("(sem texto)")}
            </div>
          </div>
        )}
        {remetente && (
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">
            {rotuloDoRemetente(remetente)}
          </p>
        )}
        {senderLabel && (
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            {senderLabel === "IA" ? (
              // O selo da IA: chip `info` (DS §10.6), o mesmo do "Exemplo
              // para a IA" da lista de conversas.
              <span className="border-info-border bg-info-soft text-info-foreground inline-flex h-5 items-center gap-1 rounded-md border px-1.5">
                <Robot size={12} weight="duotone" aria-hidden />
                {textoDoAutor}
              </span>
            ) : (
              textoDoAutor
            )}
          </div>
        )}

        {editando ? (
          <div ref={editorRef} className="space-y-2">
            <textarea
              aria-label={t("Editar mensagem")}
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  // No toque, a tecla de retorno quebra linha e quem salva é o
                  // botão — a mesma lei do composer (F2). Ctrl/Cmd+Enter salva.
                  const forca = event.ctrlKey || event.metaKey;
                  if (!forca && window.matchMedia?.("(pointer: coarse)").matches) return;
                  event.preventDefault();
                  void salvarEdicao();
                }
              }}
              maxLength={4096}
              className="hover:border-interactive-border min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 focus-visible:outline-hidden md:text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => setEditando(false)}>{t("Cancelar")}</Button>
              <Button size="sm" disabled={ocupado || !texto.trim()} onClick={() => void salvarEdicao()}>{t("Salvar")}</Button>
            </div>
          </div>
        ) : apagada ? (
          <div className="space-y-1">
            <p className="leading-snug italic">{t(marcadorDaApagada(message.direction))}</p>
            {/* O WhatsApp revoga o envio; o CRM conserva o corpo para auditoria
                interna. Não revelamos texto de uma mensagem apagada pelo cliente
                (`textoDaApagadaApareceNaInbox`). */}
            {textoApagadoVisivel && message.body && (
              <div className="border-t border-border pt-1">
                <p className="text-xs">{t("Visível só aqui no CRM")}</p>
                <p className="whitespace-pre-wrap wrap-anywhere leading-snug">{message.body}</p>
              </div>
            )}
          </div>
        ) : ocultaNoCrm ? (
          <p className="leading-snug wrap-anywhere whitespace-pre-wrap text-muted-foreground italic">
            {t("Mensagem ocultada no CRM")}
          </p>
        ) : (
          <>
            {anuncio && <AnuncioCard anuncio={anuncio} compacto className="mb-1.5" />}

            {hasMedia && (
              <div className={cn(message.body && "mb-1")}>
                <MediaRenderer message={message} agora={agora} />
              </div>
            )}

            {!hasMedia && mediaExpirada && (
              <div className={cn(message.body && "mb-1")}>
                <MediaUnavailable kind={avisoDeExpiracao} />
              </div>
            )}

            {isContact && !hasMedia && !mediaExpirada && (
              <div className={cn(message.body && isContact && "mb-1")}>
                <ContactCard message={message} />
              </div>
            )}

            {localizacao && <LocationCard localizacao={localizacao} />}

            {message.body && !isContact && !localizacao && (
              <p className="whitespace-pre-wrap wrap-anywhere leading-snug">{message.body}</p>
            )}
          </>
        )}

        <div
          // Metadado (DS §4.4): `xs`, `muted-foreground`, tabular. Nenhuma
          // superfície de balão é sólida, então o carimbo é o mesmo em todas.
          className="mt-1 flex flex-wrap items-center justify-end gap-1 text-xs text-muted-foreground tabular-nums"
        >
          {editada && (
            // Ao lado da hora, não no corpo: o texto mostrado JÁ é o novo, e o
            // que falta é avisar que ele mudou. Sem isso, um combinado de preço
            // ou endereço é lido como se sempre tivesse dito aquilo — e a
            // divergência só aparece quando alguém cobra o que não foi.
            <span title={t("O autor editou esta mensagem")}>{t("editada")}</span>
          )}
          <span>{time}</span>
          {showCitationButton && (
            <CitationButton citations={citations} messageId={message.id} />
          )}
          {isOutbound && !isFailed && <AckIndicator status={message.status} paradaSemConexao={paradaSemConexao}
            saiSozinha={SAI_SOZINHA_QUANDO_VOLTAR.has(message.sent_via)} t={t} />}
          {isFailed && (
            // Provider local: o painel do inbox não tem TooltipProvider ancestral e
            // este Tooltip só monta em mensagem failed — sem o provider, abrir uma
            // conversa com falha de envio derrubava o painel inteiro (error boundary).
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-danger-foreground inline-flex items-center gap-1 font-medium">
                    <WarningOctagon size={12} weight="fill" aria-hidden /> {t("Falhou")}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{motivoDaFalha}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {(isFailed || reenvio !== "nenhum") && (
          <div className="mt-1.5 space-y-1.5 border-t border-border pt-1.5">
            {isFailed && (
              <p
                data-testid="motivo-da-falha"
                className="text-danger-foreground text-xs leading-snug"
              >
                {motivoDaFalha}
              </p>
            )}
            {reenvio !== "nenhum" && (
              <Button size="sm" variant="outline" disabled={ocupado}
                onClick={() => (reenvio === "confirmar" ? setConfirmandoReenvio(true) : void reenviar(false))}>
                {t("Tentar de novo")}
              </Button>
            )}
          </div>
        )}
        {reacoes?.length ? (
          <span
            role="img"
            data-testid="message-reactions"
            aria-label={reacoes
              .map((r) => t(r.direction === "inbound" ? "Cliente reagiu com {emoji}" : "Atendente reagiu com {emoji}").replace("{emoji}", r.emoji))
              .join(", ")}
            className={cn(
              // A reação flutua sobre a borda do balão: `popover` com `shadow-xs`.
              "absolute -bottom-3 flex items-center gap-1 rounded-full border border-border bg-popover px-1.5 py-0.5 text-xs leading-4 text-popover-foreground shadow-xs",
              isOutbound ? "right-2" : "left-2",
            )}
          >
            {[...new Set(reacoes.map((r) => r.emoji))].join("")}
            {reacoes.length > 1 && (
              <span className="text-muted-foreground tabular-nums">{reacoes.length}</span>
            )}
          </span>
        ) : null}
      </div>
      <AlertDialog open={apagando} onOpenChange={setApagando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Apagar mensagem para todos?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("O WhatsApp tentará remover esta mensagem também para o cliente.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ocupado}>{t("Cancelar")}</AlertDialogCancel>
            <Button variant="destructive-solid" disabled={ocupado} onClick={async () => {
              if (!onApagar) return;
              setOcupado(true);
              try { await onApagar(); setApagando(false); }
              catch { /* Mantém a confirmação aberta se o canal recusar. */ }
              finally { setOcupado(false); }
            }}>{t("Apagar para todos")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmandoReenvio} onOpenChange={setConfirmandoReenvio}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Enviar esta mensagem de novo?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("Pode ser que esta mensagem já tenha chegado. Confira no WhatsApp do cliente antes de enviar de novo.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ocupado}>{t("Cancelar")}</AlertDialogCancel>
            <Button disabled={ocupado} onClick={() => void reenviar(true)}>{t("Enviar de novo")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={ocultando} onOpenChange={setOcultando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Ocultar esta mensagem no CRM?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("A mensagem continua na conversa do cliente e no registro da empresa. Um gestor pode restaurá-la aqui.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ocupado}>{t("Cancelar")}</AlertDialogCancel>
            <Button variant="destructive" disabled={ocupado} onClick={async () => {
              if (!onOcultar) return;
              setOcupado(true);
              try { await onOcultar(); setOcultando(false); }
              catch { /* O hook já informa a falha; preservar a confirmação. */ }
              finally { setOcupado(false); }
            }}>{t("Ocultar no CRM")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
