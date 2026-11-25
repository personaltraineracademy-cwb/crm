/**
 * O PAINEL MONTADO POR CONVERSA — o Dashboard em que a pessoa escreve o que quer
 * analisar e a IA monta os cartões (pedido da dona, 25/11/2026).
 *
 * ─── A regra que importa: a IA não toca nos números ─────────────────────────
 *
 * A IA só ESCOLHE, deste catálogo fechado, quais indicadores mostrar, de que
 * período e com que título. Os números saem das MESMAS consultas do Dashboard
 * (`fn_dashboard_de_leads`, `/api/v1/metrics/attendants`,
 * `/api/v1/reports/activities`), feitas pela tela com a sessão de quem olha —
 * a RLS e o filtro de organização de sempre. Assim:
 *   - o número nunca é inventado (o modelo não o escreve);
 *   - a IA nunca consulta o banco e nunca vê dado de outra empresa;
 *   - o pedido que o catálogo não cobre volta como "não dá para mostrar isso
 *     ainda", em vez de virar um gráfico de mentira.
 *
 * Aumentar o que o chat sabe mostrar é acrescentar uma entrada aqui e o
 * desenho dela em `app/app/radar/_components/PainelPorConversa.tsx`.
 */
import { z } from "zod";

export const PERIODOS_DO_PAINEL = ["hoje", "7d", "30d", "90d"] as const;
export type PeriodoDoPainel = (typeof PERIODOS_DO_PAINEL)[number];

/** De onde o número sai — decide qual consulta a tela faz. */
export type FonteDoIndicador = "leads" | "vendedores" | "atividades";

export interface IndicadorDoCatalogo {
  /** O que o indicador mostra, para a IA escolher e para a dica na tela. */
  descricao: string;
  fonte: FonteDoIndicador;
  /** Os vendedores só existem na janela fixa de 30 dias da rota deles. */
  periodoFixo?: PeriodoDoPainel;
  formato: "numero" | "barras" | "linha" | "pizza" | "tabela";
}

export const CATALOGO_DO_PAINEL = {
  leads_no_periodo: {
    descricao: "Quantos leads entraram no período, comparado ao período anterior.",
    fonte: "leads",
    formato: "numero",
  },
  taxa_de_venda: {
    descricao: "Percentual dos leads do período que viraram venda (ganhos).",
    fonte: "leads",
    formato: "numero",
  },
  valor_vendido: {
    descricao: "Soma do valor dos negócios ganhos no período.",
    fonte: "leads",
    formato: "numero",
  },
  tempo_de_resposta: {
    descricao: "Mediana do tempo até a primeira resposta aos leads do período.",
    fonte: "leads",
    formato: "numero",
  },
  leads_sem_resposta: {
    descricao: "Quantos leads do período ainda não receberam resposta.",
    fonte: "leads",
    formato: "numero",
  },
  ganhos_e_perdidos: {
    descricao: "Leads do período divididos em ganhos, perdidos e em aberto.",
    fonte: "leads",
    formato: "pizza",
  },
  leads_por_dia: {
    descricao: "Quantos leads entraram em cada dia do período.",
    fonte: "leads",
    formato: "linha",
  },
  leads_por_origem: {
    descricao: "De onde vieram os leads do período (Instagram, anúncio, WhatsApp, indicação...).",
    fonte: "leads",
    formato: "barras",
  },
  vendas_por_origem: {
    descricao: "Quantos negócios ganhos vieram de cada origem.",
    fonte: "leads",
    formato: "barras",
  },
  abertos_por_etapa: {
    descricao: "Quantos negócios em aberto há em cada etapa do funil agora.",
    fonte: "leads",
    formato: "barras",
  },
  parados_por_etapa: {
    descricao: "Negócios parados há mais de 24 horas em cada etapa do funil.",
    fonte: "leads",
    formato: "barras",
  },
  valor_por_etapa: {
    descricao: "Valor em aberto em cada etapa do funil.",
    fonte: "leads",
    formato: "barras",
  },
  lista_sem_resposta: {
    descricao: "Lista dos leads do período que ainda não foram respondidos.",
    fonte: "leads",
    formato: "tabela",
  },
  desempenho_por_vendedor: {
    descricao:
      "Tabela por vendedor: ganhos, perdidos, conversas e tempo até a 1ª resposta (últimos 30 dias).",
    fonte: "vendedores",
    periodoFixo: "30d",
    formato: "tabela",
  },
  vendas_por_vendedor: {
    descricao: "Negócios ganhos por vendedor (últimos 30 dias).",
    fonte: "vendedores",
    periodoFixo: "30d",
    formato: "barras",
  },
  quem_fez_o_trabalho: {
    descricao: "Quanto do trabalho do período foi da equipe, dos agentes de IA e do automático.",
    fonte: "atividades",
    formato: "pizza",
  },
} as const satisfies Record<string, IndicadorDoCatalogo>;

export type IndicadorDoPainel = keyof typeof CATALOGO_DO_PAINEL;
export const INDICADORES_DO_PAINEL = Object.keys(CATALOGO_DO_PAINEL) as [
  IndicadorDoPainel,
  ...IndicadorDoPainel[],
];

/** Teto de cartões num painel: mais que isso deixa de ser painel e vira relatório. */
export const MAXIMO_DE_CARTOES = 8;

export const cartaoSchema = z.object({
  indicador: z.enum(INDICADORES_DO_PAINEL),
  periodo: z.enum(PERIODOS_DO_PAINEL),
  titulo: z.string().trim().min(1).max(80),
});
export type CartaoDoPainel = z.infer<typeof cartaoSchema>;

/**
 * Cartões que cabem DENTRO de uma resposta do chat (modo "resposta"). O
 * painel completo (modo "painel") vai até `MAXIMO_DE_CARTOES`.
 */
export const MAXIMO_NA_RESPOSTA = 3;

/**
 * Os dois modos do chat (pedido da dona, 25/11/2026: "quero que funcione como
 * um chat normal... se eu pedir um dashboard completo, ele faz"):
 *  - "resposta": pergunta comum; a resposta vem no chat com até 3 cartões;
 *  - "painel": a pessoa pediu um painel; ele aparece embaixo do chat e fica.
 */
export const MODOS_DA_RESPOSTA = ["resposta", "painel"] as const;
export type ModoDaResposta = (typeof MODOS_DA_RESPOSTA)[number];

/** O que a IA devolve pela ferramenta `responder`. */
export const planoSchema = z.object({
  modo: z.enum(MODOS_DA_RESPOSTA),
  /** Uma ou duas frases para a pessoa: o que está mostrando, ou por que não. */
  resposta: z.string().trim().min(1).max(600),
  titulo: z.string().trim().min(1).max(80),
  cartoes: z.array(cartaoSchema).max(MAXIMO_DE_CARTOES),
});
export type PlanoDoPainel = z.infer<typeof planoSchema>;

/**
 * Limpa o que veio do modelo: tira cartão repetido (mesmo indicador e período)
 * e força o período dos indicadores de janela fixa, para o título nunca
 * prometer "7 dias" sobre um número que é de 30.
 */
export function normalizarPlano(plano: PlanoDoPainel): PlanoDoPainel {
  const vistos = new Set<string>();
  const cartoes: CartaoDoPainel[] = [];
  for (const c of plano.cartoes) {
    const fixo = (CATALOGO_DO_PAINEL[c.indicador] as IndicadorDoCatalogo).periodoFixo;
    const cartao = fixo ? { ...c, periodo: fixo } : c;
    const chave = `${cartao.indicador}:${cartao.periodo}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    cartoes.push(cartao);
  }
  return { ...plano, cartoes: plano.modo === "resposta" ? cartoes.slice(0, MAXIMO_NA_RESPOSTA) : cartoes };
}

/** O catálogo como texto, para o modelo escolher. Ordem estável: o prompt cacheia. */
export function catalogoParaOModelo(): string {
  return INDICADORES_DO_PAINEL.map((id) => {
    const ind = CATALOGO_DO_PAINEL[id] as IndicadorDoCatalogo;
    const fixo = ind.periodoFixo ? ` (sempre ${ind.periodoFixo})` : "";
    return `- ${id} [${ind.formato}]${fixo}: ${ind.descricao}`;
  }).join("\n");
}

export const SISTEMA_DO_PAINEL = [
  "Você é o assistente de análise de um CRM de vendas pelo WhatsApp e conversa com o dono do negócio como num chat.",
  "Você responde SEMPRE chamando a ferramenta responder.",
  "Os dois modos:",
  `- modo "resposta" (o normal): para qualquer pergunta. Escolha de 0 a ${MAXIMO_NA_RESPOSTA} indicadores que respondem a pergunta; eles aparecem dentro da sua mensagem, com os números do banco. Conversa sem dado (oi, obrigado, o que você sabe fazer) leva 0 indicadores.`,
  `- modo "painel": só quando a pessoa pedir um painel, dashboard, relatório ou visão completa, ou pedir ajuste no painel que já está montado. Até ${MAXIMO_DE_CARTOES} cartões, começando pelos números principais e terminando pelas listas e tabelas. Quando houver painel e a pessoa pedir ajuste ('tira', 'troca', 'acrescenta'), devolva o painel anterior com o ajuste, e não um painel novo do zero.`,
  "Regras:",
  "1. Use só indicadores da lista abaixo. Você não vê nem escreve números: a tela busca cada número no banco e mostra logo abaixo do seu texto. Escreva a resposta apresentando o que vem embaixo (por exemplo: 'Aqui estão os leads dos últimos 30 dias e de onde vieram.'), nunca com um número inventado.",
  "2. Se a pessoa pedir algo que a lista não cobre, diga isso em uma frase simples e mostre o que for mais próximo e útil. Nunca finja que mostra o que não mostra.",
  "3. Período: 'hoje', '7d', '30d' ou '90d'. Sem período dito, use '30d'. 'Esse mês' ou 'este mês' é '30d', 'essa semana' é '7d', 'trimestre' é '90d': use em silêncio, sem comentar a troca. Não existe período maior que 90 dias.",
  "4. Títulos curtos, em português do Brasil, na linguagem de quem vende, sem jargão. A resposta tem no máximo duas frases. O título geral só aparece no modo painel; no modo resposta, escreva um título curto do assunto.",
  "",
  "Indicadores disponíveis:",
  catalogoParaOModelo(),
].join("\n");
