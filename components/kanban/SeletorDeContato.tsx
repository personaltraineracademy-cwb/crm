"use client";

import { useEffect, useState } from "react";

import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { CAMPO_BASE, Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { NewContactDialog } from "@/components/contacts/NewContactDialog";
import { useContactList } from "@/hooks/contacts/useContactList";
import { phoneForDisplay } from "@/lib/channels/phone-variants";
import { rotuloDoContato } from "@/lib/contacts/rotulo-do-contato";
import { CaretDown, Plus, X } from "@/lib/ui/icons";
import type { Contact } from "@/lib/types/contacts";

/**
 * Escolher a PESSOA antes de abrir o negócio.
 *
 * Nada aqui é novo: a busca é o `GET /api/v1/contacts?search=`, que já casa
 * variações de telefone (`phoneLookupVariants`), e criar um contato é o
 * `NewContactDialog`, que já nasceu para ser aberto no meio de outro fluxo
 * (props `nomeInicial` e `onCriado`). O que faltava era o lugar de usar os dois.
 */

/** Quantos resultados cabem sem a lista virar rolagem dentro do diálogo. */
const RESULTADOS_NA_TELA = 8;

interface Props {
  escolhido: Contact | null;
  onEscolher: (contato: Contact | null) => void;
}

export function SeletorDeContato({ escolhido, onEscolher }: Props) {
  const t = useT();
  const [termo, setTermo] = useState("");
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);
  // A lista abre num Popover sobreposto (guia M2): ela nunca empurra o formulário
  // nem leva fio entre os itens.
  const [aberto, setAberto] = useState(false);

  // Sem a espera, cada tecla vira uma consulta à API.
  useEffect(() => {
    const id = setTimeout(() => setBusca(termo.trim()), 250);
    return () => clearTimeout(id);
  }, [termo]);

  const lista = useContactList(busca ? { search: busca } : { limit: RESULTADOS_NA_TELA });
  const achados = (lista.data?.pages.flatMap((p) => p.data) ?? [])
    .filter((c) => !c.is_anonymized)
    .slice(0, RESULTADOS_NA_TELA);

  function escolher(contato: Contact) {
    onEscolher(contato);
    setTermo("");
    setCriando(false);
    setAberto(false);
  }

  if (escolhido) {
    return (
      <div className="space-y-2">
        <Label>{t("Contato")}</Label>
        <div className="flex items-center justify-between rounded-lg border border-input bg-card px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm">{rotuloDoContato(escolhido, t)}</p>
            {escolhido.phone_number && (
              <p className="truncate text-xs text-muted-foreground">
                {phoneForDisplay(escolhido.phone_number)}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t("Trocar contato")}
            onClick={() => onEscolher(null)}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="contato-do-lead">{t("Contato")}</Label>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id="contato-do-lead"
            role="combobox"
            aria-expanded={aberto}
            aria-haspopup="listbox"
            className={cn(
              CAMPO_BASE,
              "flex h-9 items-center justify-between gap-2 px-3 text-left max-sm:min-h-11 pointer-coarse:min-h-11",
              "text-muted-foreground",
            )}
          >
            <span className="truncate">{t("Procure pelo nome ou telefone")}</span>
            <CaretDown size={14} aria-hidden className="shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) min-w-64 p-2"
          onOpenAutoFocus={(e) => {
            // O foco vai para a busca do popover, não para o primeiro item.
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector("input")?.focus();
          }}
        >
          <Input
            aria-label={t("Procure pelo nome ou telefone")}
            placeholder={t("Procure pelo nome ou telefone")}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          {achados.length > 0 && (
            <ul role="listbox" className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
              {achados.map((c) => (
                <li key={c.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start rounded-md px-2.5 py-2 text-left transition-colors duration-fast hover:bg-interactive"
                    onClick={() => escolher(c)}
                  >
                    <span className="text-sm">{rotuloDoContato(c, t)}</span>
                    {c.phone_number && (
                      <span className="text-xs text-muted-foreground">
                        {phoneForDisplay(c.phone_number)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {busca !== "" && achados.length === 0 && !lista.isLoading && (
            <p className="px-2.5 py-2 text-xs text-muted-foreground">
              {t("Nenhum contato com esse nome ou telefone.")}
            </p>
          )}
          <div className="mt-2 border-t border-border-subtle pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setAberto(false);
                setCriando(true);
              }}
            >
              <Plus size={14} aria-hidden /> {t("Criar contato")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {criando && (
        <NewContactDialog
          // `nomeInicial` é defaultValue, então só vale na montagem: a chave
          // remonta o diálogo quando o termo muda.
          key={termo}
          open
          onOpenChange={setCriando}
          nomeInicial={termo}
          onCriado={escolher}
        />
      )}
    </div>
  );
}
