/**
 * A origem de um lead em uma forma só, para o card do funil, o dossiê do
 * negócio e o painel ao lado da conversa mostrarem A MESMA coisa.
 *
 * `origemDoContato` (ficha do contato) já resolve origem, campanha, conjunto,
 * anúncio e posicionamento. Aqui entram os três campos de UTM que ela não lê
 * (`utm_medium`, `utm_term`, `utm_content`) e a pergunta que o card precisa
 * responder antes de gastar espaço: "isto veio de link ou anúncio rastreado,
 * ou é só o lugar onde o cadastro foi feito?".
 */
import { origemDoContato } from "@/lib/leads/origem-do-contato";

export interface OrigemResumida {
  /** `utm_source` › `ad_platform` › coluna `source`. Nunca vazio. */
  origem: string;
  meio: string | null;
  campanha: string | null;
  conjunto: string | null;
  anuncio: string | null;
  termo: string | null;
  conteudo: string | null;
  /**
   * Veio de link com UTM ou de anúncio. Falso quando só existe a coluna
   * `source` ("manual", "whatsapp"…): é o que separa origem de marketing de
   * simples porta de entrada.
   */
  rastreada: boolean;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

export function resumoDaOrigem(
  metadata: unknown,
  source: string | null | undefined,
): OrigemResumida {
  const meta =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  const base = origemDoContato(meta, texto(source) ?? "sem_origem");
  const rastreada =
    texto(meta.utm_source) !== null ||
    texto(meta.ad_platform) !== null ||
    base.campanha !== null ||
    base.anuncio !== null;

  return {
    origem: base.origem,
    meio: texto(meta.utm_medium),
    campanha: base.campanha,
    conjunto: base.conjunto,
    anuncio: base.anuncio,
    termo: texto(meta.utm_term),
    conteudo: texto(meta.utm_content),
    rastreada,
  };
}

/**
 * A origem que vale para um negócio: a do CONTATO quando ela é rastreada (é
 * nele que o primeiro toque fica carimbado), senão a do próprio negócio.
 */
export function origemDoNegocio(
  doContato: OrigemResumida | null | undefined,
  metadataDoNegocio: unknown,
  sourceDoNegocio: string | null | undefined,
): OrigemResumida {
  if (doContato?.rastreada) return doContato;
  const doNegocio = resumoDaOrigem(metadataDoNegocio, sourceDoNegocio);
  if (doNegocio.rastreada) return doNegocio;
  return doContato ?? doNegocio;
}
