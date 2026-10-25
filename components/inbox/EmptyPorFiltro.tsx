"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/hooks/i18n/useT";
import { Funnel } from "@/lib/ui/icons";

interface Props {
  /** Os filtros auxiliares ligados, já em português — ex.: ["Não lidos", "Etiqueta"]. */
  filtros: string[];
  /** Desliga os auxiliares. Ausente quem renderiza não oferece o botão. */
  onLimpar?: () => void;
}

/**
 * O vazio que NÃO mente.
 *
 * `EmptyInbox` diz "quando chegarem mensagens, elas aparecem aqui" — verdade
 * quando a caixa está vazia, mentira quando um filtro escondeu tudo. Medido na
 * tela de uma instalação real: com DUAS conversas existindo e "Não lidos"
 * ligado, a tela afirmava caixa vazia.
 *
 * ⚠️ Este componente é renderizado DENTRO do `return` principal da lista, nunca
 * como `return` precoce. O defeito original tinha duas metades, e a segunda era
 * pior: o vazio retornava antes do bloco do "Carregar mais", então o operador
 * ficava sem como alcançar a página seguinte. Beco sem saída.
 */
export function EmptyPorFiltro({ filtros, onLimpar }: Props) {
  const t = useT();
  return (
    // Vazio compacto do Unnify (§10.21): ícone de 32, a frase, no máximo 1 ação.
    <EmptyState
      className="p-6"
      icon={<Funnel size={32} weight="regular" aria-hidden />}
      title={t("Nenhuma conversa com esses filtros")}
      description={
        filtros.length > 0 ? `${t("Ativos:")} ${filtros.map((f) => t(f)).join(" · ")}` : undefined
      }
      action={
        onLimpar ? (
          <Button size="sm" variant="outline" onClick={onLimpar}>
            {t("Limpar filtros")}
          </Button>
        ) : undefined
      }
    />
  );
}
