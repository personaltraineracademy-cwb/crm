# Construtor de workflow: medidas de antes e depois (21/11/2026)

Fluxo: "Consulta · retomar quem sumiu na marcação" (12 nós, 15 arestas). Portal WebKit do Maestri, 1340×769, `pnpm dev` (modo de desenvolvimento, então os números têm ruído alto).
O WebKit não expõe `long-animation-frame`. Os quadros longos foram medidos com intervalos de `requestAnimationFrame` e o INP com `PerformanceObserver` do tipo `event`.

## Cenário do pedido: 3 arrastos, 2 pans, 4 zooms e "Organizar"

As rodadas que falharam (página ainda carregando) ficaram de fora.

| | INP (ms) | maior quadro (ms) | quadros > 50 ms |
|---|---|---|---|
| antes (5 rodadas) | 168 · 32 · 72 · 40 · 48 (mediana 48) | 493 · 85 · 221 · 147 · 130 (mediana 147) | 15 · 1 · 7 · 7 · 2 (mediana 7) |
| depois (3 rodadas) | 88 · 40 · 56 (mediana 56) | 101 · 58 · 241 (mediana 101) | 4 · 2 · 4 (mediana 4) |

O "Organizar" de depois anima os nós por 320 ms, então faz mais trabalho que o de antes.

## Arrasto contínuo (60 movimentos de mouse, um por quadro)

| | mediana (ms) | p95 (ms) | máximo (ms) | quadros > 33 ms |
|---|---|---|---|---|
| antes (2 rodadas válidas) | 17 · 17 | 45 · 19 | 170 · 70 | 4 · 1 |
| depois (3 rodadas) | 17 · 17 · 17 | 24 · 26 · 73 | 29 · 33 · 133 | 0 · 0 · 13 |

Leitura honesta: a mediana é igual (60 fps). O pior caso melhorou em 2 das 3 rodadas. A amostra é pequena e o servidor estava recompilando: o Turbopack esperou o disco assentar por causa do iCloud em `node_modules`. Isso não prova ganho; prova que não houve piora.

## Legibilidade no zoom inicial

- Zoom inicial: 0,93. Na versão de antes, o "ajustar à tela" encolhia o fluxo até virar miniatura.
- O título do cartão tem 15 px, que aparecem como 13,95 px na tela. Tipo e resumo têm 13 px, que aparecem como 12,1 px.

## Geometria (teste `desenho/desenho.test.ts`, com o grafo real do modelo)

- Nenhum fio passa a menos de 8 px de um cartão.
- Nenhum cartão encosta em outro.
- Nenhuma pílula de rótulo se sobrepõe a outra pílula ou a um cartão.
- A espinha fica numa coluna reta, com vãos uniformes.
- Sabotagem: com o canal do fio forçado sobre a saída, o teste reprova (36 travessias listadas).

## Fluxo real pela tela

- Busca "logica", sem acento, filtra os 4 nós de Lógica.
- Três cliques em "Aguardar" criam 3 nós dentro da vista, sem sobrepor, com o selo "Pendente". O motivo é "não é alcançável a partir do trigger".
- Salvar apaga o indicador "não salvo" em 1 s, e o banco recebe o nó.
- Ao reabrir, o nó continua lá e o indicador fica apagado.
- Excluir nó pede confirmação; depois de salvar, o rascunho volta a ter 12 nós e 15 arestas.

Capturas: `antes/` e `depois/` (escuro e claro).

## Rodada 2, a pedido do orquestrador

- Minimapa: antes era um retângulo escuro quase vazio. O quadro era deitado e o fluxo é vertical, então os nós viravam um risco cinza sobre um fundo cinza. Agora o quadro fica em retrato (132×176), cada nó tem a cor da família e a moldura da vista é da cor primária. Medido nos dois temas: 12 nós pintados (violeta, ciano…). Capturas: `depois/construtor-escuro.png` e `depois/construtor-claro.png`.
- Selo "React Flow": continua. A licença MIT permitiria tirar, mas a documentação oficial pede para só remover com a assinatura Pro (https://reactflow.dev/learn/troubleshooting/remove-attribution). Tirar com `proOptions.hideAttribution` fica para a dona decidir.
- `lib/i18n/dicionario.ts`: entraram 3 linhas (Esperas, Lógica, Ações no CRM).

## Pendência para a dona

- `lib/followup/auto-layout.ts` ficou sem uso no construtor; só o próprio teste ainda o importa. Apagar um arquivo pede a confirmação dela, por isso não apaguei.
