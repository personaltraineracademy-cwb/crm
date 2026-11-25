"use client";

import Link from "next/link";
import { useState } from "react";

import { ChatThread } from "@/components/inbox/ChatThread";
import { Composer } from "@/components/inbox/Composer";
import { useT } from "@/hooks/i18n/useT";
import { useConversation } from "@/hooks/inbox/useConversation";
import { estadoDaJanela } from "@/lib/channels/janela";
import { motivoDaJanelaFechada, motivoDoContato } from "@/lib/inbox/motivo-do-envio-bloqueado";
import type { Lead } from "@/lib/types/leads";
import { ArrowSquareOut } from "@/lib/ui/icons";

import { ConversaNoDossie } from "../ConversaNoDossie";

/**
 * A ABA "MENSAGENS" do painel do negócio: a conversa do contato, lida e
 * respondida sem sair do funil (desenho de referência).
 *
 * São os MESMOS componentes do Inbox (`ChatThread` e `Composer`), com as MESMAS
 * travas de envio calculadas pelas MESMAS funções: janela de 24h do canal
 * oficial e contato bloqueado ou anonimizado. Uma trava que valesse no Inbox e
 * não aqui abriria uma porta lateral para mandar o que o Inbox recusa.
 *
 * O que fica só no Inbox: assumir e transferir a conversa, notas internas,
 * respostas rápidas com atalho. O link "Abrir no Inbox" leva até lá.
 */
export function MensagensDoNegocio({ lead, aberto }: { lead: Lead; aberto: boolean }) {
  const t = useT();
  const conversaId = lead.conversa?.id ?? null;
  const { data: conversa, isLoading, isError } = useConversation(conversaId, aberto);
  // O relógio da janela é lido uma vez por abertura do painel, como no Inbox.
  const [agora] = useState(() => new Date());

  if (!conversaId) {
    // Sem conversa: o bloco de sempre, que oferece começar uma pelo WhatsApp.
    return (
      <div className="py-6" data-aba-mensagens="sem-conversa">
        <ConversaNoDossie
          conversa={lead.conversa}
          contactId={lead.contact_id}
          phone={lead.contact_phone}
        />
        {!lead.contact_id && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("Vincule um contato a este negócio para conversar com ele por aqui.")}
          </p>
        )}
      </div>
    );
  }

  const janela = estadoDaJanela(
    conversa?.channel_sessions?.provider ?? null,
    conversa?.last_inbound_at ?? null,
    agora,
  );
  const motivoDaJanela = motivoDaJanelaFechada(janela, conversa?.channel_sessions?.provider, t);
  const bloqueio = motivoDoContato(conversa?.contacts, t);

  return (
    <div className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-xl border border-border" data-aba-mensagens>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <p className="truncate text-sm font-medium text-foreground">
          {conversa?.contacts?.name ?? lead.title}
        </p>
        <Link
          href={`/app/inbox?id=${conversaId}`}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {t("Abrir no Inbox")}
          <ArrowSquareOut size={12} aria-hidden />
        </Link>
      </div>
      {isError ? (
        <p className="p-4 text-sm text-destructive">{t("Não consegui carregar a conversa.")}</p>
      ) : isLoading || !conversa ? (
        <p className="p-4 text-sm text-muted-foreground" aria-busy>
          {t("Carregando…")}
        </p>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatThread
              conversationId={conversaId}
              provider={conversa.channel_sessions?.provider ?? null}
              dono={{
                userId: conversa.assigned_to_user_id ?? null,
                nome: conversa.assigned_to_user_name ?? null,
              }}
              contatoId={conversa.contact_id}
            />
          </div>
          <Composer
            conversationId={conversaId}
            blockedReason={bloqueio}
            janelaFechada={motivoDaJanela}
            disabled={conversa.status === "closed"}
            contactName={conversa.contacts?.name ?? null}
            contactDisplayName={conversa.contacts?.display_name}
            currentContactId={conversa.contact_id}
          />
        </>
      )}
    </div>
  );
}
