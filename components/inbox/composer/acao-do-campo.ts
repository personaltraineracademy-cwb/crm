/**
 * A AÇÃO DENTRO DO GRUPO DO CAMPO (anexo, emoji, sugestão) — o botão `xs` do
 * `InputGroup` do Work (Unnify §10.2): 28 de lado, raio 6, fantasma. `mb-1`
 * alinha o centro do ícone ao da primeira linha do texto (o campo tem 36 e o
 * grupo, 2px de respiro). No toque o alvo sobe a 44 sem mexer no desenho
 * (`ds-alvo-44`). `lg:size-7` vence o `lg:size-9` do `size="icon"` atual.
 *
 * Num lugar só porque três componentes usam a mesma classe, e o teste de que a
 * dica (Tooltip) não acrescenta caixa compara a classe inteira com esta.
 */
export const ACAO_DO_CAMPO = "ds-alvo-44 mb-1 size-7 shrink-0 rounded-md lg:size-7";
