/**
 * O desenho do contador do menu (DS §10.6 e §10.20), o mesmo para a fila e para
 * os casos.
 *
 * Aberto: o chip `default` do Unnify — suave, `primary` a 10% com borda a 20%,
 * texto `xs`/500 tabular, raio 6, altura 24. Não é mais o vermelho cheio: o
 * número diz "tem gente esperando", que é o trabalho normal de quem atende, e
 * vermelho nesta casa é erro (`destructive`).
 *
 * Compacto (barra recolhida e barra do celular): o PONTO de 8px, `primary` cheio
 * com anel de 2px na cor de quem está atrás — o selo de status do avatar
 * (§10.20). O anel é o que o separa do bloco do ícone, que é `primary` cheio
 * quando a tela está ativa; quem desenha o ponto passa a cor do anel.
 */
export function classesDoContador(compacto: boolean): string {
  return compacto
    ? "absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-sidebar"
    : "ml-auto inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 px-1.5 text-xs leading-none font-medium text-primary tabular-nums";
}
