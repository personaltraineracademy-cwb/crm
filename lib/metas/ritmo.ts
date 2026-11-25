/**
 * O ritmo para bater a meta do mês — conta PURA, sem banco.
 *
 * A meta diz "quanto falta"; o ritmo responde a pergunta seguinte, que é a que
 * o vendedor faz de manhã: "quanto eu preciso fazer POR DIA daqui até o fim do
 * mês?". E compara o que já foi feito com o que deveria estar feito hoje se o
 * mês andasse em linha reta.
 */

export interface RitmoDaMeta {
  /** Dias que restam no mês, CONTANDO hoje. Nunca menor que 1. */
  diasRestantes: number;
  /** Quanto falta dividido pelos dias restantes, com uma casa. 0 com a meta batida. */
  porDia: number;
  /** O que já deveria estar feito hoje, em linha reta (arredondado). */
  esperadoAteHoje: number;
  /** `adiantado` inclui "em dia"; `atingida` quando não falta nada. */
  situacao: "atingida" | "adiantado" | "atrasado";
}

export function ritmoDaMeta(
  meta: { alvo: number; realizado: number },
  agora: Date = new Date(),
): RitmoDaMeta {
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
  const diaDoMes = agora.getDate();
  const diasRestantes = Math.max(1, diasNoMes - diaDoMes + 1);
  const alvo = Math.max(0, meta.alvo);
  const falta = Math.max(0, alvo - meta.realizado);
  const esperadoAteHoje = Math.round((alvo * diaDoMes) / diasNoMes);

  return {
    diasRestantes,
    porDia: falta === 0 ? 0 : Math.ceil((falta / diasRestantes) * 10) / 10,
    esperadoAteHoje,
    situacao: falta === 0 ? "atingida" : meta.realizado >= esperadoAteHoje ? "adiantado" : "atrasado",
  };
}
