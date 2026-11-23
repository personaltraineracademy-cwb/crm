/**
 * MONTAR O MATERIAL A PARTIR DE FORMULÁRIO — o que deixa um leigo ensinar o
 * agente sem aprender o formato.
 *
 * O indexador não mudou e não precisa mudar: perguntas e respostas continuam
 * entrando como o markdown que `lib/ai/rag/ingest/faq.ts` lê
 * (`## Pergunta:` / `## Resposta:`), e "Sobre o meu negócio" entra como um
 * Documento comum. O que muda é QUEM escreve os marcadores: antes era a
 * pessoa, à mão; agora é este arquivo, a partir de campos.
 *
 * Tudo aqui é puro (sem rede, sem banco) e roda no navegador e no servidor.
 */

export interface ParPerguntaResposta {
  pergunta: string;
  resposta: string;
}

/** A pergunta cabe numa linha só: é o que o marcador `## Pergunta:` aceita. */
function emUmaLinha(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/**
 * Uma linha da resposta que começasse com `## Pergunta:` abriria um item novo
 * no leitor e cortaria a resposta ao meio. Tirar os `#` do começo da linha
 * mantém o texto e desarma o marcador.
 */
function semMarcadorNoComeco(texto: string): string {
  return texto
    .split("\n")
    .map((linha) => linha.replace(/^\s*#+\s*/, ""))
    .join("\n")
    .trim();
}

/** Só os pares em que a pessoa escreveu as duas metades. */
export function paresCompletos(pares: readonly ParPerguntaResposta[]): ParPerguntaResposta[] {
  return pares
    .map((p) => ({
      pergunta: emUmaLinha(semMarcadorNoComeco(p.pergunta)),
      resposta: semMarcadorNoComeco(p.resposta),
    }))
    .filter((p) => p.pergunta.length > 0 && p.resposta.length > 0);
}

/** Os pares no formato que `parseFaqMarkdown` lê. Vazio quando não há par completo. */
export function montarFaqMarkdown(pares: readonly ParPerguntaResposta[]): string {
  return paresCompletos(pares)
    .map((p) => `## Pergunta: ${p.pergunta}\n## Resposta: ${p.resposta}`)
    .join("\n\n");
}

/**
 * As perguntas do guia "Sobre o meu negócio". São o que um atendente novo
 * precisaria saber no primeiro dia — e o que o cliente mais pergunta no
 * WhatsApp. O texto fica em português porque vira conteúdo do material; a tela
 * traduz o rótulo na hora de mostrar.
 */
export const PERGUNTAS_SOBRE_O_NEGOCIO = [
  {
    id: "o_que_oferece",
    titulo: "O que você oferece",
    exemplo: "Consultoria online de treino para mulheres que querem emagrecer, com treino pelo aplicativo e acompanhamento semanal.",
  },
  {
    id: "planos_e_precos",
    titulo: "Planos e preços",
    exemplo: "Plano mensal: R$ 197. Plano trimestral: R$ 497. Plano semestral: R$ 897. Todos incluem avaliação inicial.",
  },
  {
    id: "como_funciona",
    titulo: "Como funciona",
    exemplo: "Depois do pagamento a pessoa responde uma avaliação, recebe o treino em até 3 dias úteis e fala comigo toda semana pelo WhatsApp.",
  },
  {
    id: "horarios_e_local",
    titulo: "Horários e local de atendimento",
    exemplo: "Atendimento online, de segunda a sexta, das 8h às 18h. Respostas em até 24 horas.",
  },
  {
    id: "pagamento",
    titulo: "Formas de pagamento",
    exemplo: "Pix, cartão de crédito em até 12 vezes ou boleto. Não há taxa de matrícula.",
  },
  {
    id: "regras",
    titulo: "Cancelamento, reembolso e outras regras",
    exemplo: "Cancelamento com reembolso integral em até 7 dias. Depois disso, o plano vale até o fim do período contratado.",
  },
] as const;

export type IdDaPerguntaSobreONegocio = (typeof PERGUNTAS_SOBRE_O_NEGOCIO)[number]["id"];

/**
 * As respostas viram um Documento. Cada assunto fica num parágrafo só — título
 * e resposta colados, sem linha em branco entre eles —, porque o fatiador
 * (`chunker.ts`) corta por parágrafo: separados, o título iria para um trecho e
 * a resposta para outro, e o agente acharia "Planos e preços" sem o preço.
 */
export function montarSobreONegocio(
  respostas: Partial<Record<IdDaPerguntaSobreONegocio, string>>,
): string {
  const blocos = PERGUNTAS_SOBRE_O_NEGOCIO.flatMap((p) => {
    const resposta = semMarcadorNoComeco(respostas[p.id] ?? "").replace(/\n{2,}/g, "\n");
    return resposta.length > 0 ? [`## ${p.titulo}\n${resposta}`] : [];
  });
  return blocos.length > 0 ? `# Sobre o negócio\n\n${blocos.join("\n\n")}` : "";
}
