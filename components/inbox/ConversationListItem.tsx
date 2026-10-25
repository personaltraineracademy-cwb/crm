"use client";

import { useLocaleDeData } from "@/hooks/i18n/useLocaleDeData";

import type { Locale } from "date-fns";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useT } from "@/hooks/i18n/useT";
import { Robot, Sparkle } from "@/lib/ui/icons";
import { ChannelLogo } from "@/components/inbox/ChannelLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipDeEtiqueta } from "@/components/tags/ChipDeEtiqueta";
import {
  comandoDaConversa,
  esperaDaConversa,
  ROTULO_DO_COMANDO,
  STATUS_ENCERRADOS,
} from "@/lib/inbox/comando-da-conversa";
import { cn } from "@/lib/utils";
import type { ConversationWithContact } from "@/hooks/inbox/useConversationsRealtime";
import { rotuloParaAEquipe } from "@/lib/contacts/rotulo-do-contato";
import { phoneForDisplay } from "@/lib/channels/phone-variants";
import { rotuloDoCanalDaConversa } from "@/lib/channels/estado";
import { tomDoCanal } from "./tons";

interface Props {
  conversation: ConversationWithContact;
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** Posição 1-based na fila (G5-03). Presente só na visão Fila. */
  queuePosition?: number;
  /**
   * Mostrar POR ONDE a conversa entrou.
   *
   * Só com mais de um número conectado. Com um só, o rótulo seria a mesma
   * palavra em toda linha da lista — ruído que ensina o olho a ignorar a área
   * onde vivem os avisos que importam (bloqueado, tags).
   */
  mostrarCanal?: boolean;
  /**
   * Mostrar QUEM está no comando de cada conversa.
   *
   * Mesma regra do canal, e pelo mesmo motivo: só quando o rótulo DISCRIMINA. Nas
   * abas "Fila" (todas sem dono), "Minhas" (todas do mesmo dono) e "IA" o badge
   * seria a mesma palavra em toda linha — ruído que ensina o olho a ignorar a
   * área onde vivem os avisos que importam. Quem decide é a lista, que é quem
   * sabe quantos donos distintos ela tem.
   */
  mostrarAtendente?: boolean;
  /**
   * Mostrar o ícone de robô na prévia da mensagem, quando quem manda é o
   * automático. Mesma regra dos dois badges acima: só quando DISCRIMINA. Na
   * aba "Automático" toda linha já é robô, e o ícone repetido em cada uma vira
   * ruído. Ausente ou `true` = mostra (comportamento anterior, seguro para o
   * teste que não passa esta prop).
   */
  mostrarAutomatico?: boolean;
  /**
   * A org tem atendimento automático de pé? Vem por PROP e não por hook: um hook
   * por linha faria 50 assinaturas de query na mesma lista para responder a MESMA
   * pergunta org-wide. `undefined` = "não sei", e a função trata isso como "não
   * afirme nada".
   */
  automaticoDaOrg?: boolean;
  /**
   * Marca esta linha no lote (#2484, F1). Presente só quando a seleção
   * múltipla está ligada — sem ela a caixa não aparece, e a lista continua
   * sendo o que era.
   */
  selecionado?: boolean;
  /**
   * Liga o modo de seleção: com esta prop a linha ganha a caixa de marcação.
   * A ação da caixa é SEPARADA do clique na linha — quem marca não abre a
   * conversa, e quem abre não marca.
   */
  onAlternarSelecao?: (id: string) => void;
  /**
   * Marca (ou desmarca) ESTA conversa como exemplo para o agente aprender
   * (#3006). Presente = a linha monta o controle; AUSENTE = a linha é
   * exatamente a que era, sem controle nenhum e sem selo — é o que mantém os
   * testes que renderizam a linha sozinha, e a lista que não oferece a ação.
   *
   * A CHAMADA À ROTA NÃO MORA AQUI, e isso é de propósito. Vem por prop, como
   * o `automaticoDaOrg`: uma resposta por lista, não por linha — e, medido, a
   * linha é renderizada sem `QueryClientProvider` em vários testes do repo, o
   * que faria um `useQueryClient()` aqui dentro derrubar todos eles com "No
   * QueryClient set". Quem faz o `POST .../usable-for-rag` é a lista.
   */
  onAlternarExemplo?: (id: string, enabled: boolean) => void;
}

/**
 * A COR SAI DE QUEM MANDA, NÃO DO STATUS.
 *
 * O mapa anterior era por `conversations.status`, e o `bg-purple-500` de
 * `ai_handling` era a mesma mentira das abas em forma de cor: `ai_handling` é
 * escrito por UM caminho só em produção, então a bolinha do automático quase
 * nunca aparecia — enquanto o robô atendia a maior parte da lista — e, quando
 * aparecia, sobrevivia ao silêncio, porque o status não muda quando o atendente
 * cala o automático.
 *
 * As chaves são as de `Comando["quem"]`, ao lado de `ROTULO_DO_COMANDO`, pela
 * mesma razão que ele mora ali: a cor e a palavra dizem a mesma coisa e não
 * podem ser mantidas em arquivos diferentes.
 */
const COR_DO_COMANDO: Record<string, string> = {
  // Unnify (§3.3): estado é cor sólida só no PONTO. Humano é informação (o
  // azul do estado `info`), o automático é categoria (tom violeta, o mesmo do
  // "IA" das outras telas), aguardando é aviso, e os dois que não pedem nada
  // ficam neutros — cor só onde há o que fazer.
  humano: "bg-info",
  automatico: "bg-tone-violet",
  aguardando: "bg-warning",
  ninguem: "bg-muted-foreground",
  encerrada: "bg-muted-foreground/30",
};

/** Chip da linha (Unnify §10.6): 20 de altura para a linha caber em 56, raio 6, `xs`/500. */
const CHIP =
  "inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-medium leading-4";

function initials(name: string | null | undefined, fallback: string): string {
  const v = (name ?? "").trim();
  if (!v) return fallback.slice(0, 2).toUpperCase();
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback.slice(0, 2).toUpperCase();
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function relativeTime(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return format(d, "HH:mm");
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 7) return formatDistanceToNowStrict(d, { addSuffix: false, locale: locale });
  return format(d, "dd/MM");
}

/**
 * "Aguardando há 5 min" — desde quando o cliente ESPERA.
 *
 * A régua é `esperaDaConversa`, a mesma `awaiting_since` que ordena a Fila
 * (#990): `last_inbound_at` é a ÚLTIMA mensagem do cliente, então a pílula de
 * quem insistia voltava para "há 1 min" a cada mensagem dele — o tempo na linha
 * contradizia a posição do lado e a ordem da lista. O fallback segue sendo a
 * criação, para a conversa que nunca recebeu mensagem.
 */
function waitingLabel(
  conversation: ConversationWithContact,
  t: (texto: string) => string = (texto) => texto, locale: Locale,
): string {
  const since = esperaDaConversa(conversation);
  if (!since) return t("Aguardando");
  return `${t("Aguardando")} ${formatDistanceToNowStrict(new Date(since), { addSuffix: true, locale: locale })}`;
}

export function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
  queuePosition,
  mostrarCanal,
  mostrarAtendente,
  mostrarAutomatico = true,
  automaticoDaOrg,
  selecionado = false,
  onAlternarSelecao,
  onAlternarExemplo,
}: Props) {
  const localeDaData = useLocaleDeData();
  const t = useT();
  const c = conversation.contacts ?? null;
  const displayName = rotuloParaAEquipe(c, t);
  const phoneFallback = c?.phone_number ? phoneForDisplay(c.phone_number) : "??";
  const tags = c?.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const overflow = tags.length - visibleTags.length;
  const preview = conversation.last_message_preview?.trim() || t("Sem mensagens");
  const truncated = preview.length > 60 ? `${preview.slice(0, 60)}…` : preview;
  const naFila = queuePosition !== undefined;
  /**
   * A HORA DO CANTO RESPONDE À MESMA PERGUNTA QUE ORDENA A LISTA.
   *
   * Na Fila a lista sai por TEMPO DE ESPERA (`ORDEM_DA_ESPERA`: `awaiting_since`
   * crescente — a mensagem mais antiga sem resposta, #990), mas a hora do canto era
   * sempre a da última mensagem de QUALQUER lado. Bastava o atendente responder para o número daquela linha pular para
   * agora sem que a linha saísse do lugar: lida de cima para baixo, a coluna de
   * horas saía fora de ordem (#464 — "a lista parece aleatória") embaixo de uma
   * lista que estava certa.
   *
   * Fora da Fila a ordem é por atividade recente, e aí a última mensagem de
   * qualquer lado É a resposta certa — a régua do relógio segue a régua da lista.
   *
   * A origem é a MESMA da pílula "Aguardando há…" (`waitingLabel`), inclusive no
   * fallback: duas respostas para o mesmo "desde quando?" na mesma linha, a 40px
   * de distância, seriam a próxima divergência.
   */
  const horaDaOrdem = naFila
    ? esperaDaConversa(conversation)
    : conversation.last_message_at;
  const time = relativeTime(horaDaOrdem, localeDaData);
  const unread = conversation.unread_count_for_assignee ?? 0;


  /**
   * Quem manda, pela MESMA regra do cabeçalho.
   *
   * `status === 'ai_handling'` era um proxy ruim e foi medido: o único escritor
   * desse status em produção é o botão "Devolver ao automático", então o ícone de
   * robô aparecia só em conversa que já tinha sido escalada E devolvida — nunca
   * na que o automático atendeu do começo ao fim, que é a maioria.
   */
  const { comando } = comandoDaConversa({
    status: conversation.status,
    assigned_to_user_id: conversation.assigned_to_user_id,
    assigned_to_user_name: conversation.assigned_to_user_name ?? null,
    assignee_kind: conversation.assignee_kind ?? null,
    bot_silenced_until: conversation.bot_silenced_until ?? null,
    last_handoff_reason: conversation.last_handoff_reason ?? null,
    force_human: c?.force_human ?? null,
    is_blocked: c?.is_blocked ?? null,
    is_group: conversation.is_group ?? false,
    automaticoDaOrg,
  });
  const isAi = comando.quem === "automatico";
  const dot = COR_DO_COMANDO[comando.quem] ?? COR_DO_COMANDO.ninguem;
  // A cor sozinha não se explica: quem não decorou a tabela perguntava o que
  // cada bolinha queria dizer. A palavra é a de ROTULO_DO_COMANDO, o rótulo que
  // o produto já define para cada estado, no passar do mouse e no leitor de
  // tela — antes ela era `aria-hidden`.
  //
  // Encerrada vence `humano` só na PALAVRA. Fechar não solta o dono
  // (`fn_service_status`), e `comandoDaConversa` segue dizendo `humano` para
  // nomear quem atendeu — a cor acompanha isso e fica como estava. Mas escrever
  // "Em atendimento" numa conversa fechada afirmaria no presente um atendimento
  // que acabou.
  const rotuloDoComando = t(
    STATUS_ENCERRADOS.has(conversation.status)
      ? ROTULO_DO_COMANDO.encerrada
      : (ROTULO_DO_COMANDO[comando.quem] ?? ROTULO_DO_COMANDO.ninguem),
  );

  // QUEM MANDA ESTA CONVERSA — o número DA EMPRESA por onde ela chegou, não o
  // do cliente. Com dois canais é o que decide o tom da resposta e qual número
  // a pessoa vê respondendo.
  //
  // #2383: quando o canal tem nome ou número, o texto é o MESMO do card da tela
  // de canais (`/app/connections`), com o nome amigável na frente — antes o
  // número vencia o nome, e um canal chamado "Peças" saía na lista como o
  // número cru. Sem canal associado (grupo, conversa sem sessão, não-WA) e sem
  // nome E sem número o badge continua não existindo, como estava.
  const canal = conversation.channel_sessions ?? null;
  const rotuloCanal = rotuloDoCanalDaConversa(canal, t);

  /**
   * A CONVERSA MARCADA COMO EXEMPLO PARA O AGENTE (#3006).
   *
   * `usable_for_rag` é a coluna que a rota `usable-for-rag` liga; quem a traz
   * para cá é o `SELECT_COLS` da lista. Os dois rótulos são literais `t()`
   * separados — a cerca de espanhol cobra chave por chave, e uma escolha
   * ternária dentro do `t()` ficaria invisível para ela.
   */
  const exemploMarcado = Boolean(conversation.usable_for_rag);
  const rotuloExemplo = exemploMarcado
    ? t("Deixar de usar como exemplo")
    : t("Usar como exemplo para a IA");

  const temSelos =
    visibleTags.length > 0 ||
    exemploMarcado ||
    (mostrarAtendente && comando.quem === "humano") ||
    (mostrarCanal && rotuloCanal != null) ||
    Boolean(c?.is_blocked) ||
    Boolean(c?.is_anonymized);

  return (
    <div
      className={cn(
        // Lista do Work (Unnify §10.12): linhas separadas por 1px `border`,
        // sem caixa em volta.
        "relative flex w-full items-start border-b border-border",
        selecionado && "bg-interactive",
      )}
    >
      {/*
        A CAIXA DE SELEÇÃO (#2484, F1) — fora do botão da linha, de propósito:
        controle interativo dentro de `<button>` é HTML inválido, e o clique na
        caixa NÃO pode abrir a conversa. Marcar e abrir são gestos diferentes.
        `mt-4.5`: centro da caixa (20) no centro do avatar (8 + 20 − 10).
      */}
      {onAlternarSelecao && (
        <Checkbox
          checked={selecionado}
          onCheckedChange={() => onAlternarSelecao(conversation.id)}
          aria-label={t("Selecionar conversa")}
          title={t("Selecionar conversa")}
          data-testid={`selecao-em-lote-${conversation.id}`}
          // Borda `muted-foreground`, não a `input` do Unnify: a `input` dá 2,12:1
          // (dívida registrada no DS §3.4) e a caixa desmarcada precisa de 3:1
          // (WCAG 1.4.11, #2990). Marcada, quem pinta é o `primary` do componente.
          className="mt-4.5 ml-3 shrink-0 border-muted-foreground"
        />
      )}
      <button
        type="button"
        data-conversation-id={conversation.id}
        onClick={() => onSelect(conversation.id)}
        className={cn(
          // Linha de 56 (Unnify §5.1, "Linha de lista (Work)"): avatar de 40 +
          // 8 em cima e embaixo. Etiquetas e posição na fila fazem a linha
          // crescer, nunca encolher.
          "group relative flex min-h-14 min-w-0 flex-1 items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/40",
          // Foco em anel INTERNO (Unnify §9.2: controle dentro de lista).
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-inset",
          // `interactive` (o fundo suave da seleção, Unnify §9.1), e não um
          // degrau fixo da rampa: os degraus têm o MESMO hex nos dois temas.
          // Marcada no lote, quem pinta é o wrapper: pintar os dois somava a
          // camada. O botão fica transparente também no hover/foco, senão o
          // hover cobria só ele e a linha ficava em dois tons.
          isSelected &&
            (selecionado
              ? "hover:bg-transparent focus-visible:bg-transparent"
              : "bg-interactive hover:bg-interactive"),
        )}
        aria-current={isSelected ? "true" : undefined}
      >
      {isSelected && (
        <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />
      )}
      <div className="relative shrink-0">
        <Avatar className="size-10">
          {/* Só monta a <img> quando existe arquivo: sem isso o browser pediria
              a rota para TODO contato da lista e levaria 404 em cada um sem
              foto — que é a maioria. O AvatarFallback do Radix já cobre o caso
              de a imagem não carregar, então as iniciais nunca somem. */}
          {c?.avatar_storage_path && !c?.is_anonymized ? (
            <AvatarImage
              src={`/api/v1/contacts/${c.id}/avatar`}
              alt=""
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
            {initials(displayName, phoneFallback)}
          </AvatarFallback>
        </Avatar>
        {/* Selo de status do avatar (Unnify §10.20): 10px com anel de 2px na cor do fundo. */}
        <span
          className={cn(
            "absolute -bottom-0.5 -left-0.5 size-2.5 rounded-full ring-2 ring-background",
            dot,
          )}
          role="img"
          aria-label={rotuloDoComando}
          title={rotuloDoComando}
        />
        <ChannelLogo channel={canal} size={16} className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background ring-2 ring-background" />
      </div>

      <div className="min-w-0 flex-1">
        {naFila && (
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className={cn(CHIP, "min-w-5 justify-center bg-interactive tabular-nums text-interactive-foreground")}
              aria-label={`${t("Posição")} ${queuePosition} ${t("na fila")}`}
            >
              {queuePosition}º
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {waitingLabel(conversation, t, localeDaData)}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              title={displayName}
              className={cn(
                "truncate text-sm text-foreground",
                unread > 0 ? "font-semibold" : "font-medium",
                c?.is_anonymized && "font-normal italic text-muted-foreground",
              )}
            >
              {displayName}
            </span>
            {/*
              A ETIQUETA "GRUPO", ao lado do nome.
              `conversations.is_group` já chega no SELECT do handler (schema
              original) — sem este selo, a lista não distingue um grupo de uma
              conversa individual até abrir a conversa e ver vários remetentes
              na mesma linha do tempo (ver `MessageBubble`, que mostra QUEM
              mandou cada mensagem dentro do grupo).
            */}
            {conversation.is_group && (
              <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>
                {t("Grupo")}
              </span>
            )}
          </span>
          <span
            className="shrink-0 text-xs tabular-nums text-muted-foreground"
            // O mesmo lugar da tela mostra duas coisas diferentes conforme a aba:
            // na Fila é "desde quando o cliente ESPERA" (a mensagem mais antiga sem
            // resposta — #990), nas outras é "há quanto tempo a conversa mexeu". O
            // rótulo existe só onde a leitura muda.
            title={naFila ? t("Desde quando o cliente espera resposta") : undefined}
          >
            {time}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            title={preview}
            className={cn(
              "min-w-0 truncate text-xs",
              // Não lida ou aberta, `foreground`: é o que pede o olho, e na
              // aberta o fundo é o `interactive`.
              unread > 0 || isSelected ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {isAi && mostrarAutomatico ? (
              <Robot size={12} weight="duotone" className="mr-1 inline align-[-2px]" aria-hidden />
            ) : null}
            {truncated}
          </p>
          {unread > 0 && (
            <span className={cn(CHIP, "min-w-5 justify-center bg-primary tabular-nums text-primary-foreground")}>
              {unread}
            </span>
          )}
        </div>

        {temSelos && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {/* O SELO DO EXEMPLO vem ANTES das etiquetas de propósito: a faixa
                mostra no máximo 2 etiquetas e as que sobram viram "+N". Um
                estado que decide se a conversa entra na base de conhecimento
                do agente não pode ser o primeiro a ser cortado. Chip `info`,
                o mesmo do selo "IA" do balão. */}
            {exemploMarcado && (
              <span
                data-testid="selo-exemplo-ia"
                className={cn(CHIP, "border border-info-border bg-info-soft text-info-foreground")}
              >
                <Sparkle size={12} weight="fill" aria-hidden />
                {t("Exemplo para a IA")}
              </span>
            )}
            {visibleTags.map((t) => (
              <ChipDeEtiqueta key={t} tag={t} className="h-5 rounded-md px-1.5 text-xs leading-4" />
            ))}
            {overflow > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">+{overflow}</span>
            )}
            {mostrarAtendente && comando.quem === "humano" && (
              <span
                className={cn(CHIP, "min-w-0 max-w-36 truncate bg-secondary text-secondary-foreground")}
                title={comando.nome ?? t("Atendente")}
              >
                <span className="truncate">{comando.nome ?? t("Atendente")}</span>
              </span>
            )}
            {/* #2383: `min-w-0` + `max-w` + `truncate` — o mesmo tratamento do
                badge do cabeçalho. Uma linha de badges é `flex-wrap`, então um
                nome de canal comprido ESTOURARIA a faixa para fora da coluna da
                lista (critério de aceite: layout utilizável com nomes maiores).
                O `title` devolve o texto inteiro para quem passa o mouse. */}
            {mostrarCanal && rotuloCanal && (
              <span
                className={cn(CHIP, "min-w-0 max-w-36 truncate", tomDoCanal(conversation.channel_session_id ?? rotuloCanal))}
                title={`${t("Entrou por")} ${rotuloCanal}`}
              >
                <span className="truncate">{rotuloCanal}</span>
              </span>
            )}
            {c?.is_blocked && (
              <span className={cn(CHIP, "border border-danger-border bg-danger-soft text-danger-foreground")}>
                {t("Bloqueado")}
              </span>
            )}
            {c?.is_anonymized && (
              <span className={cn(CHIP, "border border-border text-foreground")}>
                {t("Anonimizado")}
              </span>
            )}
          </div>
        )}
      </div>
      </button>
      {/*
        O CONTROLE DE "EXEMPLO PARA A IA" (#3006) fica FORA do botão da linha,
        como a caixa de seleção logo acima e pelo mesmo motivo: controle
        interativo dentro de `<button>` é HTML inválido, e marcar não pode abrir
        a conversa. O gesto de marcar é separado do gesto de abrir.

        Fica sempre visível, e não só no hover: o defeito que esta issue
        conserta é justamente um recurso que ninguém achava. Um ícone que só
        aparece sob o cursor continuaria escondido no celular, onde não há
        hover. Botão `icon-xs` (28, raio 6); no toque, alvo de 44 sem mexer no
        desenho (`ds-alvo-44`).

        Desmarcado usa `muted-foreground`: é componente gráfico e precisa de
        3:1 contra o fundo da linha, inclusive na selecionada (`interactive`).
      */}
      {onAlternarExemplo && (
        <button
          type="button"
          data-testid={`exemplo-ia-${conversation.id}`}
          aria-pressed={exemploMarcado}
          aria-label={rotuloExemplo}
          title={rotuloExemplo}
          onClick={() => onAlternarExemplo(conversation.id, !exemploMarcado)}
          className={cn(
            "ds-alvo-44 mt-2 mr-1 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
            exemploMarcado
              ? "hover:bg-interactive text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Sparkle size={16} weight={exemploMarcado ? "fill" : "regular"} aria-hidden />
        </button>
      )}
    </div>
  );
}
