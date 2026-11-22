# Auditoria completa de layout: método único (três faixas)

Pedido da dona (21/11/2026): "Ainda tem espaçamento errado e cards feios e mal formatados. Você não está fazendo a auditoria completa e minuciosa de todas as telas e elementos do sistema." Captura de exemplo: `evidence/pedidos-da-dona/followups-card.png`. Nela: os botões do card quebram em duas linhas, o título fica cortado, há fonte monoespaçada misturada sem motivo e um vão grande entre as abas e o card, e o card fica estreito numa área larga.

## Cobertura: é medida, não declarada
Cada faixa tem a sua lista de rotas em `rotas-faixa-N.txt`, gerada de todos os `page.tsx` de `app/app`. Rotas com `[id]` ou `[slug]`: abra a partir da tela-mãe, clicando num item real. Se não houver item, crie um de TESTE pela interface ("Teste auditoria 01") ou marque SEM DADO. Ao fim, toda rota da lista tem uma linha no seu relatório com um destes estados: AUDITADA, SEM DADO (com o motivo), ERRO (a tela não abre, com a mensagem) ou SEM ACESSO.

## Por rota: o que conferir (todos os itens, sempre)
Larguras de 1440 e 390 px; temas claro e escuro. Capturas `evidence/auditoria-completa/faixa-N/<rota-com-hifens>-<largura>-<tema>.png`.

Elementos, um por um:
1. **Espaçamento:** medido com `getComputedStyle` e `getBoundingClientRect`, e não a olho. Padding de página, distância título → subtítulo → conteúdo, espaço entre cards e entre campos. Aponte valor fora da escala usada no resto do app e vãos sem motivo.
2. **Alinhamento:** bordas esquerdas e direitas das seções, linha de base entre ícone e texto, colunas de grade. Diferença de 1 a 6 px que parece erro é defeito.
3. **Cards:** largura coerente com a área; título sem corte quando há espaço; hierarquia entre título, metadado e ação; ações que não quebram em várias linhas (use menu "…" quando há mais de duas); estado de hover.
4. **Tipografia:** no máximo 4 a 5 tamanhos por tela; fonte monoespaçada só para código e IDs; pesos 400, 500 e 600.
5. **Controles:** campos, selects e botões com a mesma altura na mesma linha; texto de placeholder sem corte; abas numa linha só (com rolagem horizontal discreta se não couber); foco visível.
6. **Divisores e bordas:** fio solto que termina no meio, borda dupla, excesso de caixas dentro de caixas.
7. **Pop-ups da tela** (diálogo, painel lateral, popover, menu): abra cada um e confira os itens 1 a 6 dentro dele.
8. **Estados:** vazio, carregando (esqueleto do tamanho certo, sem salto ao trocar) e erro.
9. **Responsivo (390 px):** sem rolagem horizontal da página, nada sobreposto, tabela com solução (rolagem interna ou cartões).
10. **Console:** erros e avisos de React ao abrir a tela.

## Formato do relatório da faixa (`evidence/auditoria-completa/faixa-N.md`)
Uma seção por rota:
`### /app/rota — AUDITADA | SEM DADO | ERRO | SEM ACESSO`
Depois uma tabela: elemento | defeito | medida | gravidade (P0 quebra o uso, P1 parece amador, P2 acabamento) | componente provável (arquivo, achado por `grep`) | captura.
No topo do arquivo vai o placar: rotas da lista, rotas com linha, contagem por estado e contagem por gravidade. Rotas da lista e rotas com linha têm de bater.

## Regras
- Você só audita. Não edite código.
- Use o seu próprio portal: `maestri portal create http://localhost:3000/app "Portal <seu nome>"`, e feche no fim. Se pedir login, use `.env.owner.local` sem copiar a senha em nota, log ou relatório.
- Não apague nada, não envie mensagem e não dispare campanha.
- Atualize a sua linha na nota "Status- CRM da PTA" a cada 10 rotas, com "N/total".
- Memória: se `sysctl -n kern.memorystatus_vm_pressure_level` der 4, pare e avise.
- Resposta final: o placar e os 10 piores defeitos da faixa.
