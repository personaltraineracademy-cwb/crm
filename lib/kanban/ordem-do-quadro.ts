/**
 * A ORDEM DOS CARDS DENTRO DE CADA ETAPA do quadro do funil.
 *
 * `manual` é a ordem que o time montou arrastando (`position_in_stage`) e é o
 * padrão: é a única em que soltar um card entre dois outros significa "fica
 * aqui". Nas demais o quadro só MOSTRA em outra ordem; o arrasto entre etapas
 * continua valendo, e o card solto entra no topo da etapa na ordem manual
 * (ver `KanbanBoard`), porque a posição "entre estes dois" de uma ordem por
 * data não existe na ordem que fica gravada.
 *
 * A ordem não vai para a URL nem para o banco: é um olhar do momento, como a
 * troca entre Quadro e Calendário.
 */
import type { Lead } from "@/lib/types/leads";

export const ORDENS_DO_QUADRO = ["manual", "recentes", "antigas", "valor", "atividade"] as const;
export type OrdemDoQuadro = (typeof ORDENS_DO_QUADRO)[number];

export const ROTULO_DA_ORDEM: Record<OrdemDoQuadro, string> = {
  manual: "Ordem do funil",
  recentes: "Criadas por último",
  antigas: "Criadas primeiro",
  valor: "Maior valor",
  atividade: "Atividade recente",
};

type Ordenavel = Pick<
  Lead,
  "id" | "position_in_stage" | "created_at" | "value_cents" | "last_activity_at" | "updated_at"
>;

function instante(iso: string | null | undefined): number {
  if (!iso) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/**
 * Compara dois cards na ordem pedida. O desempate é sempre a ordem manual e,
 * por fim, o id: dois cards com a mesma data não podem trocar de lugar a cada
 * recarga, senão o quadro "pisca" sem ninguém ter mexido.
 */
export function compararNaOrdem(ordem: OrdemDoQuadro) {
  return (a: Ordenavel, b: Ordenavel): number => {
    let r = 0;
    switch (ordem) {
      case "recentes":
        r = instante(b.created_at) - instante(a.created_at);
        break;
      case "antigas":
        r = instante(a.created_at) - instante(b.created_at);
        break;
      case "valor":
        r = (b.value_cents ?? -1) - (a.value_cents ?? -1);
        break;
      case "atividade":
        r =
          instante(b.last_activity_at ?? b.updated_at) -
          instante(a.last_activity_at ?? a.updated_at);
        break;
      case "manual":
        r = 0;
        break;
    }
    if (r !== 0 && Number.isFinite(r)) return r;
    if (r !== 0) return r > 0 ? 1 : -1;
    const manual = a.position_in_stage - b.position_in_stage;
    if (manual !== 0) return manual;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}

export function ehOrdemDoQuadro(valor: unknown): valor is OrdemDoQuadro {
  return typeof valor === "string" && (ORDENS_DO_QUADRO as readonly string[]).includes(valor);
}
