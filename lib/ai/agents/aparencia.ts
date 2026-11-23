/**
 * A CARA DO AGENTE — o emoji e a cor que o identificam na lista e na tela dele.
 *
 * Mora em `ai_agents.config.aparencia`, o mesmo jsonb dos outros ajustes por
 * agente (comandos pelo celular, limiar de clima): um valor por agente, sem
 * coluna nova e sem migration. É só apresentação — o motor do agente não lê
 * esta chave, e nada do atendimento muda com ela.
 *
 * As duas listas são FECHADAS de propósito. Emoji livre abriria a porta para
 * texto qualquer no jsonb e para caractere que o sistema do cliente não
 * desenha; cor livre quebraria o contraste em um dos dois temas. Com lista
 * fechada, toda combinação que a tela oferece foi olhada no claro e no escuro.
 */
import { z } from "zod";

export const EMOJIS_DO_AGENTE = [
  "🤖",
  "💬",
  "💪",
  "🏋️",
  "🏃",
  "🧘",
  "🥗",
  "🍎",
  "📅",
  "🎯",
  "⭐",
  "🔥",
  "🏆",
  "❤️",
  "🩺",
  "🎓",
  "🛒",
  "📣",
] as const;

/** O matiz de cada cor (HSL). Saturação e luz são fixas — ver `tintaDaCor`. */
export const CORES_DO_AGENTE = {
  azul: 212,
  ciano: 188,
  verde: 150,
  lima: 95,
  amarelo: 45,
  laranja: 24,
  vermelho: 2,
  rosa: 330,
  roxo: 268,
} as const;

export type EmojiDoAgente = (typeof EMOJIS_DO_AGENTE)[number];
export type CorDoAgente = keyof typeof CORES_DO_AGENTE;

const NOMES_DAS_CORES = Object.keys(CORES_DO_AGENTE) as [CorDoAgente, ...CorDoAgente[]];

export const aparenciaDoAgenteSchema = z
  .object({
    emoji: z.enum(EMOJIS_DO_AGENTE),
    cor: z.enum(NOMES_DAS_CORES),
  })
  .strict();
export type AparenciaDoAgente = z.infer<typeof aparenciaDoAgenteSchema>;

/**
 * Fundo translúcido e contorno no mesmo matiz: legível sobre o cartão claro e
 * sobre o escuro, porque quem carrega o contraste é o emoji, não a cor.
 */
export function tintaDaCor(cor: CorDoAgente): { fundo: string; contorno: string } {
  const matiz = CORES_DO_AGENTE[cor];
  return {
    fundo: `hsl(${matiz} 75% 55% / 0.2)`,
    contorno: `hsl(${matiz} 75% 55% / 0.55)`,
  };
}

/**
 * A cara que a tela mostra. Agente que nunca escolheu ganha o robô e uma cor
 * tirada do NOME — sempre a mesma para o mesmo nome, para a lista não mudar de
 * cor a cada visita e três agentes novos não nascerem iguais.
 */
export function aparenciaDoAgente(config: unknown, nome: string): AparenciaDoAgente {
  const bruto =
    config && typeof config === "object" ? (config as Record<string, unknown>).aparencia : undefined;
  const lida = aparenciaDoAgenteSchema.safeParse(bruto);
  if (lida.success) return lida.data;

  let soma = 0;
  for (const letra of nome) soma = (soma * 31 + (letra.codePointAt(0) ?? 0)) % 9973;
  return { emoji: "🤖", cor: NOMES_DAS_CORES[soma % NOMES_DAS_CORES.length] };
}
