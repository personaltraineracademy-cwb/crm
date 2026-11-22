# Revisão final, PARCIAL (21/11/2026)

Parada por pedido (memória crítica). Revisor só leu e mediu; nada foi editado no código.
Servidor: `pnpm dev` local, portal 1440×900 e 390×844, tema escuro quase todo. Capturas nesta pasta.

## Veredito por pedido

| # | Pedido | Veredito | Resumo |
|---|---|---|---|
| 1 | Fluido, com animação suave (cards do kanban e workflows) | PARCIAL | Código de movimento existe (`movimento.css`, `movimento-da-lista.ts`, `fluxo.css`) e os testes de kanban e follow-up passam (100 e 1005). Mas o arrasto não foi visto em quadros por mim. As medidas do agente em dev têm ruído alto (mediana de quadro igual, pior caso melhor em 2 de 3 rodadas). Não confirmei por conta própria. |
| 2 | Linhas retas / aparência amadora no Inbox | PARCIAL | Linhas verticais sumiram (sonda devolve vazio a 1440 e a 390; 3 painéis `--card`, raio 12, vão 8). Mas as abas da faixa voltaram a ser cortadas (defeito 1 abaixo) e o grupo "Canais" da barra lateral continua cortado pelo rodapé. |
| 3 | Pop-ups profissionais (lead, criar lead, contato) | PARCIAL | Novo contato ficou bom: seções, 560 px, rodapé fixo (corpo 478/478, sem rolagem inteira), Cancelar outline, foco preso, Esc fecha. Novo Lead NÃO migrou e tem sobreposição (defeito 2). Detalhe do lead NÃO migrou (defeito 3). |
| 4 | Espaçamento errado e cards feios (Follow-ups, cartão do lead) | NÃO | Cartão da lista de Follow-ups idêntico à captura da dona: 4 botões em 2 linhas desalinhadas, título truncado, "Pausar" em fonte mono. Os arquivos do cartão da lista não estão no diff (só `DeleteFollowupFlowButton` e `ModelosDialog`). Cartão do kanban continua alto e desalinhado (defeito 4). |
| 5 | Construtor de workflow profissional e fluido | ATENDIDO a 1440; PARCIAL a 390 | A 1440: cartões limpos, fios ortogonais com rótulos, paleta com família de cor, minimapa em retrato com nós pintados. Lógica de salvar, publicar e rollback preservada no diff (o `atual` substitui o `graph`; handlers e `disabled` iguais). A 390 o minimapa cobre os nós (defeito 5). Não cliquei em Salvar, Publicar nem Rollback para não mexer nos dados. |

## Defeitos (gravidade, prova)

1. IMPORTANTE. Inbox: abas voltam a ser cortadas (reabre o #2745). Faixa de 272 px com `flex-nowrap gap-4`: `scrollWidth 362` contra `clientWidth 208`. "Todas" sai cortada pela seta; "Fechadas" (x 552) e "Arquivadas" (x 623) ficam fora da coluna, sem esmaecimento de 24 px (o guia manda esmaecer ou usar "Mais"). Captura: `inbox-1440-escuro.png`. A 390 as 6 abas cabem em uma linha, mas "Arquivadas" passa da borda (x 346, largura ~65).
2. IMPORTANTE. Novo Lead (`NewLeadDialog.tsx`, fora do diff): o rodapé fica `position: sticky` com fundo translúcido (`muted/40`) e cobre "Valor", "Fechamento previsto" e a Etapa. Sondado: o rodapé sobrepõe 5 elementos (SELECT, LABEL Valor, INPUT 0,00, LABEL Fechamento, INPUT date). Na captura, "Cancelar" cai por cima do campo de data. O diálogo inteiro rola (1005 contra 867), sem `DialogBody`, sem seções, com "Tags (separadas por vírgula)" e lista de contatos dentro do formulário, com fio entre itens. Captura: `novo-lead-1440-escuro.png`. A causa vale para todo diálogo legado sem `DialogBody` com conteúdo maior que a tela: `camadas.css` / `dialog.tsx`, rodapé sticky translúcido.
3. IMPORTANTE. Detalhe do lead (`LeadDossier.tsx`, fora do diff): painel de 448 (guia: 640), "Editar campos" e "Salvar" no meio, sem `SheetBody` nem `SheetFooter`. O pedido 3 cita "informações do lead".
4. MÉDIA. Cartão do kanban: título em x=666 e valor em x=644 (22 px de diferença; M4 do guia pede o mesmo x). Altura ~207 px para 3 linhas (M5 pede ≤112). Filtros continuam numa caixa com borda (`rgb(52,56,57)`, 1117×54; M6). Colunas cortadas na borda direita sem esmaecimento; chevron longe do ponto de cor (M7). Corrigido: rodapé do cartão não se sobrepõe mais ("Aguardand…" corta com reticências). Captura: `quadro-1440-escuro.png`.
5. MÉDIA. Construtor a 390: minimapa cobre metade da largura e o texto dos nós; o botão "Adicionar nó" fica sob a barra de baixo; o cabeçalho ocupa 4 linhas. Captura: `construtor-390-escuro.png`.
6. BAIXA. Barra lateral: "Canais" cortado pelo rodapé a 1440×900 (item A8 do guia, sem correção).
7. A CONFIRMAR. Tema claro do Inbox: a captura mostrava campos e botões quase pretos com texto ilegível ("Todos os atendentes" sumido). Pode ser quadro tirado no meio da troca de tema; a sonda seguinte deu `null` porque a página já tinha mudado. Não confirmado. Refazer.

## Testes vermelhos (20 casos em 6 arquivos, rodados)

| Arquivo | Classe | Motivo |
|---|---|---|
| `camadas-unnify.test.tsx` (6) | (a) | É catraca de classe, e o próprio cabeçalho diz que não prova geometria. Fixa 448, `p-6`/`gap-6`, `pr-10`, `shadow-xl`, 384 e `scale 0.985`, que o guia §4.3 muda de propósito (560 por `size`, `--sombra-camada`, escala 0,98, gaveta 1,5 rem). `animation: none` em movimento reduzido continua no CSS. Atualizar os valores. Obs.: o caso do movimento para na primeira asserção, então `--camada-gaveta-de` e `--duration-base` ficam sem prova depois de atualizar (hoje `1.5rem 0`, e o teste pede `2.5rem 0`). |
| `inbox-abas-da-faixa-cabem.test.tsx` (2) | (b) | Protege #2745: as seis abas não podem ficar cortadas atrás da seta. O teste olha classe (`flex-wrap`, `gap-x-1`), mas o defeito que vigia voltou, medido no portal (defeito 1). Ajustar a mudança: abas em uma linha COM esmaecimento ou "Mais" (o guia permite), e só então atualizar o teste. Hoje não há nem esmaecimento nem menu. |
| `inbox-divisorias-arrastaveis.test.tsx` (9) | (a), com ressalva | Montam o layout sem conversa, e o guia mandou esconder a ficha nesse estado (`semFicha = !selectedId`). A lógica da divisória da ficha segue atrás de `faixa?.temFicha && !painelRecolhido && !semFicha`. Falha esperada: "divisória 1 não renderizou", e a grade vem `304px minmax(0,1fr)` sem a terceira trilha. Atualizar o teste para abrir com conversa selecionada. Ressalva: não provei o arrasto da ficha com conversa aberta, porque não há conversa no banco local. |
| `deep-link-nao-espera-a-lista.test.tsx` (1) | (a) | Falha só no último passo: depois do Voltar sem `id`, espera o painel mockado mostrando "sem-conversa", e o painel agora nem monta. Os casos que protegem o #34226618108 (conversa por id sem esperar a lista, painel recebe a conversa) passam. Atualizar a asserção final para "painel ausente". |
| `telas-falam-a-moeda-e-o-pais-da-organizacao.test.tsx` (2) | (a) | O rótulo segue o país (`FieldLabel` com `perfil.documento.rotulo`, "CPF" ou "Bilhete"). O que mudou foi só a marca "(opcional)", que saiu do texto do rótulo (regra 4.6 do guia). O comportamento protegido (documento e exemplos do país) está intacto. Atualizar o teste para casar o rótulo sem "(opcional)". |
| `dialog-base-roda-e-tem-teto.test.ts` ("overrides vivos") | Ambiental, não é da mudança | Já falhava antes. O teste roda `grep -rlE … ${componentes}` sem aspas e o caminho tem espaço ("Mobile Documents"), então o `grep` não acha nada. Prova: `git grep` em HEAD acha `components/team/MemberInterfaceDialog.tsx:49` (`max-h-[90dvh]`) e o arquivo continua igual agora; o mesmo grep com aspas acha o arquivo, e sem aspas devolve vazio. Passa em caminho sem espaço (CI). Não precisa mexer na mudança. |

Nenhum caso caiu em (c) por si só. A decisão de esconder a ficha sem conversa (inbox) e a de abas numa linha ficam com a dona se ela preferir não esmaecer nem usar "Mais".

## Rodados e passados

- `pnpm vitest run app/app/ai/followups lib/followup`: 72 arquivos, 1005 casos, tudo passou.
- `pnpm vitest run components/kanban app/app/kanban tests/unit/kanban`: 14 arquivos, 100 casos, tudo passou (a ordem do kanban salva tem teste verde; não arrastei card no portal).
- Esc fecha Novo Lead e Novo contato; foco preso no Novo contato após 12 Tabs. O retorno de foco ao gatilho ficou inconclusivo (abri o diálogo com `click()` por script, sem foco no botão).

## Dados de teste no banco local

30 "Lead teste" (Carrinho 0, Aguardando pagamento 21, Pago 5, outras colunas) e o follow-up "Consulta · retomar quem sumiu na marcação" (rascunho). Só registrado; nada alterado ou apagado.

## Não conferi

Configurações; Funis e quadro no claro; detalhe do lead, Novo lead e Novo contato a 390 e no claro; Inbox com conversa aberta; arrasto de card e de fluxo em quadros; Salvar/Publicar/Rollback na tela; foco devolvido ao gatilho; a linha 19 da nota "Status- CRM da PTA" (não escrita por causa da pausa). Dev server em modo `next dev` (selo "Compiling" nas capturas), então tempos têm ruído.
