"use client";

import { useEffect, useRef, useState } from "react";

import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";
import { PencilSimple } from "@/lib/ui/icons";

interface Props {
  /** O que aparece fora da edição ("R$ 1.200", o título). */
  exibicao: React.ReactNode;
  /** O texto que entra no campo ao abrir a edição ("1200,00"). */
  valorDeEdicao: string;
  /** Nome do campo para leitor de tela e dica ("Título", "Valor"). */
  rotulo: string;
  /**
   * Grava. Devolve uma mensagem quando recusa (o campo continua aberto, com o
   * erro embaixo) e nada quando deu certo.
   */
  aoSalvar: (texto: string) => Promise<string | void>;
  inputMode?: "text" | "decimal";
  placeholder?: string;
  className?: string;
  classeDoCampo?: string;
}

/**
 * Edição no lugar: o valor aparece como texto; um clique vira campo; Enter (ou
 * sair do campo) grava; Esc cancela. Um campo por vez, gravado sozinho — sem
 * abrir formulário nem procurar o botão "Salvar".
 *
 * O texto fora da edição é um BOTÃO de verdade (teclado e leitor de tela), e o
 * lápis só aparece no hover/foco para o cabeçalho não virar um painel de ícones.
 */
export function CampoNoLugar({
  exibicao,
  valorDeEdicao,
  rotulo,
  aoSalvar,
  inputMode = "text",
  placeholder,
  className,
  classeDoCampo,
}: Props) {
  const t = useT();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valorDeEdicao);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const campo = useRef<HTMLInputElement | null>(null);
  // Esc e Enter também disparam `blur`; a marca evita gravar duas vezes (ou
  // gravar o que a pessoa acabou de cancelar).
  const decidido = useRef(false);

  useEffect(() => {
    if (editando) {
      campo.current?.focus();
      campo.current?.select();
    }
  }, [editando]);

  function abrir() {
    decidido.current = false;
    setTexto(valorDeEdicao);
    setErro(null);
    setEditando(true);
  }

  function cancelar() {
    decidido.current = true;
    setErro(null);
    setEditando(false);
  }

  async function gravar() {
    if (decidido.current || salvando) return;
    if (texto.trim() === valorDeEdicao.trim()) {
      cancelar();
      return;
    }
    decidido.current = true;
    setSalvando(true);
    const recusa = await aoSalvar(texto);
    setSalvando(false);
    if (typeof recusa === "string") {
      // Recusado: o campo fica aberto com o que a pessoa digitou.
      decidido.current = false;
      setErro(recusa);
      campo.current?.focus();
      return;
    }
    setErro(null);
    setEditando(false);
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={abrir}
        title={`${t("Editar")}: ${rotulo}`}
        aria-label={`${t("Editar")}: ${rotulo}`}
        data-campo-no-lugar
        className={cn(
          "group/campo inline-flex max-w-full items-center gap-1 rounded-sm text-left",
          "hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
          className,
        )}
      >
        <span className="min-w-0 truncate">{exibicao}</span>
        <PencilSimple
          size={12}
          aria-hidden
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/campo:opacity-100 group-focus-visible/campo:opacity-100"
        />
      </button>
    );
  }

  return (
    <span className="inline-flex max-w-full flex-col gap-0.5">
      <input
        ref={campo}
        value={texto}
        disabled={salvando}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-label={rotulo}
        aria-invalid={erro ? true : undefined}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => void gravar()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void gravar();
          } else if (e.key === "Escape") {
            // O painel fecha com Esc; aqui o Esc é só do campo.
            e.preventDefault();
            e.stopPropagation();
            cancelar();
          }
        }}
        className={cn(
          "h-7 min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground",
          "focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60",
          classeDoCampo,
        )}
      />
      {erro ? <span className="text-xs font-normal text-danger-foreground">{erro}</span> : null}
    </span>
  );
}
