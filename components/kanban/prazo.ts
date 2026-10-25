/**
 * Prazo em texto relativo, como no cartão de tarefa do Work (DS §10.23 e §13):
 * "Hoje", "Amanhã" e, fora disso, "10 de out".
 *
 * A data do negócio (`expected_close_date`) é de CALENDÁRIO puro
 * (`aaaa-mm-dd`) e nunca passa por fuso (DS §13): as partes são lidas do texto
 * e comparadas com o dia de `hoje` no relógio local, sem `new Date(texto)`, que
 * leria meia-noite UTC e mostraria o dia anterior no Brasil.
 */

export interface PrazoRelativo {
  texto: string;
  /** O prazo já passou (antes de hoje). */
  vencido: boolean;
  /** A data por extenso no formato de formulário (`dd/mm/aaaa`), para o `title`. */
  completo: string;
}

const DIA_EM_MS = 86_400_000;

export function prazoRelativo(
  data: string | null | undefined,
  hoje: Date,
  t: (texto: string) => string = (texto) => texto,
  tagDeIdioma = "pt-BR",
): PrazoRelativo | null {
  if (!data) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const alvo = Date.UTC(ano, mes - 1, dia);
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diferenca = Math.round((alvo - base) / DIA_EM_MS);
  const completo = `${m[3]}/${m[2]}/${m[1]}`;

  if (diferenca === 0) return { texto: t("Hoje"), vencido: false, completo };
  if (diferenca === 1) return { texto: t("Amanhã"), vencido: false, completo };

  const opcoes: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  if (ano !== hoje.getFullYear()) opcoes.year = "numeric";
  // pt-BR escreve "10 de out." — o ponto da abreviação sai, como no Work.
  const texto = new Intl.DateTimeFormat(tagDeIdioma, opcoes)
    .format(new Date(alvo))
    .replace(/\.(?=\s|$)/g, "")
    .trim();
  return { texto, vencido: diferenca < 0, completo };
}
