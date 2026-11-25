# Auditoria completa — faixa 1 (RELATÓRIO PARCIAL, PAUSADO em 21/11/2026)

Auditor: Claude sonnet. Pausado a pedido da dona por memória crítica do Mac (pressão 4 medida às ~13:5x; o servidor em `localhost:3000` também parou de responder, `curl` exit 7). **Esta faixa NÃO está concluída.** O que existe aqui vem da auditoria de layout anterior (`evidence/auditoria-layout/`), feita antes de ler o `METODO.md`, e por isso não cumpre o método inteiro.

## Placar (rotas da lista: 32 · rotas com linha: 32)

| Estado | Rotas |
|---|---|
| AUDITADA (método completo: 1440 e 390, claro e escuro, itens 1 a 10) | **0** |
| PARCIAL (só a sonda automática + captura; NÃO conta como auditada) | **9** |
| NÃO INICIADA | **23** |
| SEM DADO / ERRO / SEM ACESSO | 0 / 0 / 0 |

Feito: **0/32 auditadas** (9/32 com cobertura parcial).

Defeitos achados até agora (15; todos em rotas da faixa 1 salvo o nº 2, que é de `/app/ai/followups`, fora da lista): **P0: 0 · P1: 4 · P2: 11**.

### Por que PARCIAL e não AUDITADA
Para as 9 rotas parciais foi conferido, por sonda em JS (`getBoundingClientRect` / `getComputedStyle`): rolagem horizontal da página, elementos fora da tela, texto cortado, cor azul sobrando, contraste, alvos pequenos e controles sem nome. Larguras **1440, 768 e 360** (não 390), temas claro e escuro, com captura. **Não foi feito**: espaçamento medido contra a escala, alinhamento, hierarquia de cards, tipografia (4–5 tamanhos), controles na mesma altura, divisores, **pop-ups (item 7)**, estados vazio/carregando/erro (item 8), tabela no mobile, console por rota (item 10).

## Rotas

| Rota | Estado | Observação |
|---|---|---|
| /app/activities | NÃO INICIADA | |
| /app/agenda | PARCIAL | defeitos 9, 10 |
| /app/agenda/avisos | NÃO INICIADA | |
| /app/calls | NÃO INICIADA | |
| /app/campaigns | NÃO INICIADA | |
| /app/campaigns/[id] | NÃO INICIADA | |
| /app/campaigns/[id]/edit | NÃO INICIADA | |
| /app/campaigns/new | NÃO INICIADA | |
| /app/campaigns/settings | NÃO INICIADA | |
| /app/companies | NÃO INICIADA | |
| /app/companies/[id] | NÃO INICIADA | |
| /app/contacts | PARCIAL | defeitos 4, 6, 10, 11, 14 |
| /app/contacts/[id] | NÃO INICIADA | tentei abrir a partir da lista; o portal parou de responder |
| /app/crm | PARCIAL | sonda sem achados (1440/768/360, claro/escuro) |
| /app/imports | NÃO INICIADA | |
| /app/imports/[id] | NÃO INICIADA | |
| /app/inbox | PARCIAL | defeitos 3, 5, 6 |
| /app/inbox/[id] | NÃO INICIADA | |
| /app/kanban | PARCIAL | defeito 12 (cabeçalho da lista de Funis) |
| /app/leads/[id] | NÃO INICIADA | |
| /app/people | NÃO INICIADA | |
| /app/people/[id] | NÃO INICIADA | |
| /app/pipelines/[id] | PARCIAL | só 1440 escuro, funil "Pedidos"; defeito 1 |
| /app/products | NÃO INICIADA | |
| /app/proposals | NÃO INICIADA | |
| /app/proposals/[id] | NÃO INICIADA | |
| /app/proposals/novo | NÃO INICIADA | |
| /app/prospecting | NÃO INICIADA | |
| /app/radar | PARCIAL | sonda sem achados |
| /app/tasks | PARCIAL | defeito 11 (select sem nome, 768) |
| /app/tasks/planos | NÃO INICIADA | |
| /app/templates | PARCIAL | defeito 6 (título truncado a 360) |

## Defeitos achados

Capturas em `evidence/auditoria-layout/<tela>-<largura>-<tema>.png` (tema trocado pelo mecanismo real do app: `localStorage['deskcomm-theme']`).

| # | Tela / URL | Largura · tema | Defeito | Medida | Grav. | Componente provável | Captura |
|---|---|---|---|---|---|---|---|
| 1 | Cartão do funil, `/app/pipelines/9f554687-abb0-4192-85a5-a555d080f096` | 1440 · escuro | "Sem responsável" e "agora em <etapa>" se sobrepõem no rodapé de cada cartão; "agora em…" é cortado | 30 de 30 cartões: responsável x 370–466, "agora em" x 445–584, mesma linha (top 400) = **21 px de sobreposição**; "agora em" scrollWidth 178 > clientWidth 138 | P1 | `components/kanban/KanbanCard.tsx:466` | `evidence/auditoria-layout/funil-aberto-1440-dark.png` |
| 2 | Cartão de fluxo, `/app/ai/followups` (fora da faixa 1; é o exemplo da dona) | 1440 e 768 · escuro | Cartão estreito numa área larga; título cortado com espaço sobrando; 4 botões em duas linhas de larguras diferentes; fonte monoespaçada em "Pausar" e "—" | cartão 348 px numa área de 1069 (33%) a 1440 (667 px a 768); título scrollWidth 280 > clientWidth 231 (reticências); botões: Renomear 415,466 · Duplicar 542,466 · Exportar 436,506 · Excluir 553,506 (duas linhas, y 466 e 506); 3 tamanhos de fonte (24/14/12), pesos 400/500/600 | P1 | `app/app/ai/followups/_components/FlowsList.tsx` | `evidence/auditoria-layout/ia-followups-card-1440-dark.png`, `evidence/auditoria-layout/ia-followups-768-dark.png` |
| 3 | Inbox, `/app/inbox` | 1440, 768, 360 · ambos | Campo "Buscar conversas" estreito, placeholder cortado ("Busca", "Buscar por n"), espremido ao lado de "Não lidos" e "Grupos". Abas (Automático/Fila/Minhas/Todas/Fechadas/Arquivadas) quebram em duas linhas; a aba "Fila" é mais estreita que as outras e "Arquivadas" fica sozinha na 2ª linha a 360 | campo 83×32 a 1440; aba Fila 20×32 (1440) e 20×44 (768/360), as outras 35–66 px | P1 | `components/inbox/InboxFilters.tsx` | `evidence/auditoria-layout/inbox-1440-dark.png`, `evidence/auditoria-layout/inbox-360-dark.png` |
| 4 | Contatos, `/app/contacts` | 360 · claro | Linhas da lista se sobrepõem: "hoje às 13:44", "Ativo", "—" e o nome de linhas vizinhas colidem; a barra inferior cobre a lista. Cinco botões de ação do topo ocupam 3 linhas | só visual; **medida pendente** | P1 | não localizado | `evidence/auditoria-layout/contacts-360-light.png` |
| 5 | Barra inferior mobile (todas as telas) | 360 e 768 | "Desempenho" cortado como "Desem…" | scrollWidth 76 > clientWidth 55–58 | P2 | não localizado | `evidence/auditoria-layout/inbox-360-dark.png` |
| 6 | Título do cabeçalho mobile | 360 · ambos | Título truncado com espaço livre: "Conta…", "Follow-ups", "Agente de IA", "Conexões", "Webhooks", "Desempenho", "Configurações", "Respostas rápidas" | scrollWidth 73–115 > clientWidth 67–80 (todos com `title`) | P2 | não localizado | `evidence/auditoria-layout/contacts-360-light.png` |
| 7 | Desempenho, `/app/metrics` | 768 e 360 | Rótulos do funil cortados: "Carrinho abandonado", "Aguardando pagamento" | `span.w-24`: scrollWidth 140 e 155 > clientWidth 96 | P2 | não localizado | `evidence/auditoria-layout/desempenho-768-dark.png` |
| 8 | Webhooks, `/app/webhooks` | 768 · escuro | Abas inativas ("Leads recebidos", "Automações", "Atividade") com contraste baixo | 2,94:1 (14 px; mínimo 4,5). Medido uma vez; não repetiu no claro | P2 | não localizado | `evidence/auditoria-layout/webhooks-768-dark.png` |
| 9 | Agenda, `/app/agenda` | 1440 · claro | "Sábado" do cabeçalho com contraste baixo. A grade da semana (7 colunas, scrollWidth 1316) rola dentro de um contêiner de 1054 px, e a última coluna aparece cortada | 3,87:1 (12 px); `div.flex min-h-0 flex-1 overflow-auto` w 1054 / sw 1316 | P2 | não localizado | `evidence/auditoria-layout/agenda-1440-light.png` |
| 10 | Alvos de clique pequenos | vários | Abas da Agenda (Próximos/Aguardando/Passados/Cancelados) 24 px de altura; link "Cadastrar as credenciais do Google" 16 px; "Abrir Tipos de agendamento" 14 px (768); caixas de seleção de contatos 20×20 (360) | medidas ao lado | P2 | não localizado | `evidence/auditoria-layout/agenda-1440-light.png`, `evidence/auditoria-layout/contacts-360-light.png` |
| 11 | Campos sem nome acessível | `/app/contacts` (todas as larguras), `/app/tasks` (768) | `input.min-w-0` e um `select` sem rótulo, `aria-label` ou `title` | sonda `unnamed` | P2 | não localizado | — |
| 12 | Funis, `/app/kanban` | 1440 · ambos | "Importar planilha" e "Novo funil" ficam numa linha própria, alinhados à direita, com vão de ~70 px sob o título | visual; medida pendente | P2 | `app/app/kanban/_client.tsx` | `evidence/auditoria-layout/kanban-1440-dark.png` |
| 13 | Menu lateral | 1440×900 | O grupo "Canais" é cortado ao meio e Conexões, Webhooks, Análise e Desempenho ficam fora da dobra, sem indício de rolagem | nav: clientHeight 717, scrollHeight 1022, `overflow-y:auto` | P2 | não localizado | `evidence/auditoria-layout/kanban-1440-light.png` |
| 14 | Só em desenvolvimento | todas | Selo "N" do Next.js sobre o avatar do usuário (sidebar) e sobre o item "Inbox" da barra inferior; um círculo colorido fixo (40×40, em 1384,844) cobre o canto inferior direito e esconde conteúdo. Não afeta produção | `elementFromPoint` = `<circle>` SVG | P2 | origem não identificada | `evidence/auditoria-layout/agenda-1440-light.png` |
| 15 | Primeira abertura de `/app/pipelines/[id]` | — | Levou cerca de 25 s no servidor de desenvolvimento (compilação sob demanda; a página mostrou 404 chars de texto e "Carregando…" até lá). Não vale para produção; **medir no build de produção** | cronometrado por polling | P2 | — | — |

### O que a varredura NÃO achou (1440, 768 e 360, claro e escuro, 17 telas)
- **Azul sobrando: nenhum.** Varri `color`, `background`, `border`, `outline`, `fill` e `stroke` computados (matiz 195–265°, saturação > 0,35): vazio em todas as telas.
- **Rolagem horizontal da página: nenhuma** (as diferenças negativas são a barra de rolagem vertical de 13 px).
- Contraste: só os casos 8 e 9. Um primeiro lote mostrou 1,70:1 no menu lateral, mas veio de eu forçar o tema por atributo; refeito pelo mecanismo real, não se repetiu. Descartado.

## Ficou sem conferir (desta e da auditoria anterior)
- Quase toda a faixa 1: 23 rotas não iniciadas e os itens 1–8 e 10 do método nas 9 parciais.
- Largura **390** (usei 360) para todas as rotas.
- Login e onboarding (a sessão está aberta e não deslogo).
- Pop-ups: nenhum diálogo, menu ou painel foi aberto (`Novo funil`, `Iniciar conversa`, menus do cabeçalho).
- Foco visível (`Tab` e leitura do outline): não concluído; o portal parou de responder.
- Abrir um contato (`/app/contacts/[id]`): não concluído.
- Salto de layout no carregamento e esqueletos: não medidos.
- Erros no console: só vi linhas "[Fast Refresh]" nas páginas lidas; não confere como "sem erro" (o buffer é zerado a cada leitura e a captura não rodou em todas as rotas).
- Cobertura no portal "CRM local" (compartilhado): não criei portal próprio, então não há portal meu para fechar.
