"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { MagnifyingGlass } from "@/lib/ui/icons";
import {
  NAV_GROUPS,
  searchable,
  type NavDestination,
  type NavGroupId,
} from "@/lib/navigation/registry";
import { cn } from "@/lib/utils";

/**
 * Paleta de navegação (⌘K).
 *
 * Sem `cmdk`: o projeto já tem Dialog e Input, e uma lista filtrada com setas e
 * Enter são poucas linhas. Uma dependência a mais para isso seria peso sem ganho.
 *
 * v1 busca só NAVEGAÇÃO — os destinos do registro. Contato, conversa e lead têm
 * outra fonte de dados e são outra feature.
 */

/** Sem acento e sem caixa: ninguém digita "orçamento" com cedilha às pressas. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const ROTULO_GRUPO = new Map(NAV_GROUPS.map((g) => [g.id, g.label]));
const ORDEM_GRUPO = new Map(NAV_GROUPS.map((g, i) => [g.id, i]));

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Paleta de comando do Unnify (DS §10.18, Work): diálogo sem padding,
        topo a ~12vh, altura máxima de 76vh e largura máxima de 576.

        Ancorar no alto voltou a ser seguro: o diálogo anima só opacidade e
        escala (`camada-dialogo`, `app/unnify/camadas.css`), então nenhum
        keyframe disputa o `translate-y-0` daqui. Sem o X do canto, como no
        Work: quem fecha é o `Esc` (tecla ou o botão "Esc" do campo, que
        também serve ao dedo) e o clique fora.
      */}
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] flex max-h-[76vh] max-w-xl translate-y-0 flex-col gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">{t("Buscar telas")}</DialogTitle>
        {/* O miolo é um componente à parte porque o Radix o DESMONTA ao fechar:
            busca e destaque nascem zerados na próxima abertura por construção,
            sem um efeito de reset para manter em sincronia. */}
        <Resultados aoEscolher={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Resultados({ aoEscolher }: { aoEscolher: () => void }) {
  const t = useT();
  const router = useRouter();
  const { user, activeOrg } = useAuth();
  const [busca, setBusca] = useState("");
  const [destacado, setDestacado] = useState(0);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");

  const visiveis = useMemo(
    () =>
      searchable(
        user.is_platform_admin && !user.support,
        activeOrg?.role ?? null,
        activeOrg?.interface_settings,
        activeOrg?.modulos_ligados ?? [],
        activeOrg?.capacidades_ligadas ?? [],
      ),
    [
      user.is_platform_admin,
      user.support,
      activeOrg?.role,
      activeOrg?.interface_settings,
      activeOrg?.modulos_ligados,
      activeOrg?.capacidades_ligadas,
    ],
  );

  // Lista dos grupos disponíveis nos destinos visíveis
  const categoriasDisponiveis = useMemo(() => {
    const gruposNoCatalogo = new Set(visiveis.map((v) => v.group));
    return NAV_GROUPS.filter((g) => gruposNoCatalogo.has(g.id));
  }, [visiveis]);

  const resultados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const filtrados = visiveis.filter((d) => {
      const casaCategoria = categoriaAtiva === "todos" || d.group === categoriaAtiva;
      if (!casaCategoria) return false;
      if (!termo) return true;
      return normalizar(`${d.label} ${d.description} ${ROTULO_GRUPO.get(d.group) ?? ""}`).includes(
        termo,
      );
    });
    // A lista é SEMPRE agrupada (grupo com título, como no Work), e as setas
    // andam por este array: ordenado pelo NAV_GROUPS, a ordem do array é a
    // ordem da tela. O catálogo não é contíguo por grupo (a Prospecção, de
    // CRM, vem antes do Inbox); sem reordenar, a seta pularia de seção. O sort
    // é estável, então dentro do grupo vale a ordem do catálogo.
    return [...filtrados].sort(
      (a, b) => (ORDEM_GRUPO.get(a.group) ?? 0) - (ORDEM_GRUPO.get(b.group) ?? 0),
    );
  }, [busca, visiveis, categoriaAtiva]);

  /** Os grupos na ordem da tela, cada item com o seu índice no array plano. */
  const grupos = useMemo(() => {
    const lista: { id: NavGroupId; itens: { destino: NavDestination; indice: number }[] }[] = [];
    resultados.forEach((destino, indice) => {
      const ultimo = lista[lista.length - 1];
      if (ultimo && ultimo.id === destino.group) ultimo.itens.push({ destino, indice });
      else lista.push({ id: destino.group, itens: [{ destino, indice }] });
    });
    return lista;
  }, [resultados]);

  // O item destacado pelas setas fica sempre à vista dentro da lista que rola.
  useEffect(() => {
    document.getElementById(`palette-${destacado}`)?.scrollIntoView?.({ block: "nearest" });
  }, [destacado]);

  function navegar(destino: NavDestination) {
    aoEscolher();
    router.push(destino.href);
  }

  /**
   * O destaque volta ao topo junto com a busca, no mesmo evento: mantê-lo
   * apontaria para outro item depois que a lista muda, e o Enter navegaria
   * para o lugar errado.
   */
  function aoDigitar(valor: string) {
    setBusca(valor);
    setDestacado(0);
  }

  function mudarCategoria(id: string) {
    setCategoriaAtiva(id);
    setDestacado(0);
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestacado((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestacado((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const alvo = resultados[destacado];
      if (alvo) navegar(alvo);
    }
  }

  const classeDaCategoria = (ativa: boolean) =>
    cn(
      "inline-flex h-7 items-center rounded-md px-2.5 font-medium whitespace-nowrap transition-[color,background-color] duration-fast ease-out pointer-coarse:min-h-11",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-inset",
      ativa
        ? "bg-interactive text-interactive-foreground"
        : "text-muted-foreground hover:bg-interactive hover:text-interactive-foreground",
    );

  return (
    <>
      {/* Campo de busca de 56, sem borda própria: lupa à esquerda, atalho à
          direita (DS §10.18). O "Esc" é um botão de verdade — fecha também
          no toque, onde não há tecla. */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <MagnifyingGlass size={16} aria-hidden className="shrink-0 text-muted-foreground" />
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls="palette-resultados"
          aria-activedescendant={resultados[destacado] ? `palette-${destacado}` : undefined}
          value={busca}
          onChange={(e) => aoDigitar(e.target.value)}
          onKeyDown={aoTeclar}
          placeholder={t(
            "Buscar por nome, objetivo ou função (ex: leads, agenda, prompt, whatsapp)...",
          )}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-hidden placeholder:text-muted-foreground md:text-sm"
        />
        {busca && (
          <button
            type="button"
            onClick={() => aoDigitar("")}
            className="hover:bg-interactive hover:text-interactive-foreground rounded-md px-2 py-1 text-xs text-muted-foreground transition-[color,background-color] duration-fast ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden pointer-coarse:min-h-11"
          >
            {t("Limpar")}
          </button>
        )}
        <DialogClose
          aria-label={t("Fechar")}
          className="bg-sidebar text-sidebar-muted shrink-0 rounded-sm border px-1.5 py-0.5 text-xs leading-4 transition-colors duration-fast ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden pointer-coarse:min-h-11 pointer-coarse:px-3"
        >
          Esc
        </DialogClose>
      </div>

      {/* Categorias: filtro rápido por grupo */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-2 py-2 text-xs">
        <button
          type="button"
          aria-pressed={categoriaAtiva === "todos"}
          onClick={() => mudarCategoria("todos")}
          className={classeDaCategoria(categoriaAtiva === "todos")}
        >
          {t("Todas")} ({visiveis.length})
        </button>
        {categoriasDisponiveis.map((cat) => {
          const qtd = visiveis.filter((v) => v.group === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={categoriaAtiva === cat.id}
              onClick={() => mudarCategoria(cat.id)}
              className={classeDaCategoria(categoriaAtiva === cat.id)}
            >
              {t(cat.label)} ({qtd})
            </button>
          );
        })}
      </div>

      {resultados.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            {t("Nada encontrado para")} “{busca}”.
          </p>
          <p className="mt-1 text-xs">
            {t("Tente buscar por outro termo ou selecione 'Todas' nas categorias.")}
          </p>
        </div>
      ) : (
        <div
          id="palette-resultados"
          role="listbox"
          aria-label={t("Telas")}
          className="min-h-0 flex-1 scroll-py-1 overflow-y-auto overscroll-contain p-1"
        >
          {grupos.map(({ id: grupoId, itens }) => {
            const rotuloGrupo = ROTULO_GRUPO.get(grupoId) ?? grupoId;
            return (
              <div
                key={grupoId}
                role="group"
                aria-labelledby={`palette-grupo-${grupoId}`}
                className="p-1"
              >
                {/* Título do grupo: `xs` muted (DS §10.18) */}
                <div
                  id={`palette-grupo-${grupoId}`}
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {t(rotuloGrupo)}
                </div>
                {itens.map(({ destino: d, indice }) => {
                  const Icon = d.icon;
                  const ativo = indice === destacado;
                  return (
                    <div
                      key={d.href}
                      id={`palette-${indice}`}
                      role="option"
                      aria-selected={ativo}
                      data-href={d.href}
                      data-selected={ativo || undefined}
                      onMouseEnter={() => setDestacado(indice)}
                      onClick={() => navegar(d)}
                      className={cn(
                        // Item: raio 6, padding 8 × 6, realce SUAVE (`interactive`)
                        "flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-[color,background-color] duration-fast ease-out pointer-coarse:min-h-11",
                        ativo && "bg-interactive text-interactive-foreground",
                      )}
                    >
                      <Icon
                        size={16}
                        aria-hidden
                        className={cn(
                          "mt-0.5 shrink-0",
                          ativo ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{t(d.label)}</span>
                        {/* Duas linhas, não uma cortada: a palavra que a pessoa
                            buscou pode estar no fim da descrição. No item
                            destacado a descrição usa a frente do realce. */}
                        <p
                          className={cn(
                            "line-clamp-2 text-xs",
                            ativo ? "text-interactive-foreground" : "text-muted-foreground",
                          )}
                        >
                          {t(d.description)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex shrink-0 items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground pointer-coarse:hidden">
        <span>{t("Use as setas ↑↓ e Enter para navegar")}</span>
        <span>{t("ESC para fechar")}</span>
      </div>
    </>
  );
}
