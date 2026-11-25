# O que foi feito em 23/11/2026 e o que falta

Branch: `feat/simplificacao-fitness`. Este arquivo acompanha o commit do dia. Leia antes de continuar o trabalho.

Duas sessões editaram esta branch no mesmo dia, na mesma pasta: uma cuidou de Configurações, Agente de IA e base de conhecimento; a outra, do Dashboard e das ideias trazidas do pipeflow-crm. O commit junta as duas.

## 1. Defeito aberto: edição no lugar não grava pela tela

**O que é:** no dossiê do negócio, o título e o valor do cabeçalho viram campo com um clique (`components/kanban/CampoNoLugar.tsx`, `CabecalhoEditavel.tsx`).

**O que acontece:** ao digitar um valor novo e apertar Enter, o campo continua aberto com a mensagem "Não foi possível salvar. Tente de novo.", e o valor não muda no banco.

**O que foi medido (Lead teste 29, de R$ 1.290 para 1500,00):**
- 1ª tentativa: o `PATCH /api/v1/leads/{id}` saiu e foi abortado (`net::ERR_ABORTED`), junto com outras leituras do dossiê.
- 2ª tentativa: o `PATCH` respondeu `200 OK`, mas a tela mostrou a mesma mensagem de erro e a leitura seguinte do quadro ainda trazia 129000 centavos.

**O que não foi descoberto:** por que um `PATCH` com 200 termina no `catch` de `useGravarNoLugar` e por que o valor não aparece gravado. Suspeitas a conferir, nesta ordem:
1. `useEditLead` (`hooks/kanban/useUpdateLead.ts`): o `onSuccess` chama `gravaLeadNoQuadro`; se ele lança, o `mutateAsync` rejeita mesmo com 200.
2. O corpo enviado: confirmar que `{ value_cents: 150000 }` chega à rota e que ela não exige outro campo (por exemplo `updated_at`) para gravar.
3. O servidor de desenvolvimento estava recompilando arquivos recém-editados; repetir com o servidor parado e religado.

**Como reproduzir:** `./ligar-local.sh`, abrir um funil, clicar num card, clicar no valor do cabeçalho, digitar, Enter.

O componente isolado tem 4 testes passando (`CampoNoLugar.test.tsx`); o defeito está na ligação com a mutação, que não tem teste.

## 2. O que entrou neste commit

### Dashboard (antigo Radar) — `/app/radar`
- Período (Hoje, 7, 30, 90 dias); leads do período com comparação; tempo até a 1ª resposta (mediana e média); leads sem resposta; taxa de venda.
- Origem por `utm_source`, `utm_medium`, `utm_campaign` ou anúncio; leads por dia.
- Funil agora: abertos, parados há mais de 24 h e sem dono por etapa, com a etapa-gargalo marcada.
- Tempo de resposta de cada lead; a lista do Radar de risco continua no fim.
- Meta do mês com ritmo diário (`lib/metas/ritmo.ts`).
- Banco: função `fn_dashboard_de_leads` (migration 0762 + apêndice no `baseline.sql`). **Já aplicada no Supabase de teste.**
- No menu, "Radar" passou a se chamar "Dashboard" (a rota continua `/app/radar`).

### Ideias do pipeflow-crm
- Origem do lead no card do funil, no dossiê (dentro de "Contato") e no painel ao lado da conversa (`lib/leads/origem-resumida.ts`, `components/contacts/OrigemDoLead.tsx`).
- Colunas de Ganho e Perdido nascem recolhidas (`StageColumn.tsx`).
- Setas de anterior e próximo no dossiê (`KanbanBoard.tsx`, `LeadDossier.tsx`).
- Botão "Aplicar plano" no negócio: usa os Planos de tarefa que já existiam (`POST /api/v1/leads/[id]/task-plan`, `AplicarPlanoNoNegocio.tsx`). Não precisou de tabela nova.
- Edição no lugar de título e valor (com o defeito da seção 1).

### Configurações, Agente de IA e base de conhecimento (outra sessão)
Resumo pelo relato daquela sessão; o detalhe está em `06-plano-tres-frentes.md`:
- Configurações com os cartões essenciais na frente (`NavHub.tsx`, `app/app/settings/page.tsx`).
- Formulário do agente com "Ajustes avançados" (`AjustesAvancados.tsx`).
- Base de conhecimento por formulário de perguntas e respostas, guia "Sobre o meu negócio" e caixa "Perguntar como o assistente" (`SobreONegocioDialog.tsx`, `lib/ai/rag/montar-material.ts`).
- Cada agente com uma "cara" (emoji e cor) no card e cadastro de documento dentro da tela do agente (`AparenciaDoAgente.tsx`, `AvatarDoAgente.tsx`, `BasesDoAgente.tsx`).

## 3. O que não foi verificado

- **Typecheck:** não rodou (estoura a memória do Mac de 8 GB). Deixar para o CI.
- **Suíte inteira** (`pnpm test:unit`), **banco** (`pnpm test:db`) e **ponta a ponta** (`pnpm test:e2e`): não rodaram. Só os testes dos arquivos alterados, que passaram.
- **Ponta a ponta com risco:** cinco specs usam etapa de ganho ou perda e podem esperar essas colunas abertas; outras procuram o item "Radar" no menu.
- **Falha que já existia:** `tests/unit/inbox-texto-longo-nao-empurra-a-coluna.test.ts` (régua 3) falha sobre `components/inbox/InboxLayout.tsx`, que este commit não toca.
- **Dados reais:** o banco de teste só tem 30 leads de cadastro manual, sem conversa e sem UTM. Tempo de resposta, origem por UTM e a linha de origem no card não foram vistos com dado real. O painel de origem no Inbox não foi aberto na tela.
- **Meta do mês:** só o estado "sem meta" foi visto na tela.
- **Aplicar plano:** os quatro casos foram chamados direto na rota e as tarefas apareceram no negócio; o clique no menu em si não foi feito.
- **Busca da base de conhecimento (RAG):** sem chave de embedding no banco de teste, o material fica guardado e a busca não foi provada (relato da outra sessão).
- **Telas da outra sessão:** não foram conferidas por quem escreveu este arquivo.

## 4. O que falta fazer

### Do pipeflow-crm (cópia de estudo em `iCloud Drive/Downloads/pipeflow-crm-estudo`)
1. Consertar a edição no lugar (seção 1) e estender para os outros campos do negócio. Hoje "Dados do negócio" ainda é um formulário com botão Salvar; nove testes e uma spec dependem dessa forma, então a troca pede cuidado.
2. Inbox: caixa de escrita com modos Mensagem, Nota e Tarefa; painéis com largura ajustável.
3. Agenda: clicar na atividade abre o painel do negócio; "+" em cada dia.
4. Funil: filtros ativos como etiquetas removíveis.
5. Painel do negócio em abas (Atividades, Mensagens, Contato, Empresa, Negócio, Notas, Histórico).
6. Dashboard: tabela de ritmo por vendedor.

Não portar como se estivesse pronto no pipeflow: widgets configuráveis do dashboard (só existem no servidor), conexão Z-API (simulada) e playbook automático por etapa (sem tela).

### Do plano das três frentes
- Card do agente mostrar o número conectado e quantos materiais ele lê.
- Chave de embedding no banco de teste, para provar a busca.
- O restante dos passos de `06-plano-tres-frentes.md`.

### Decisões que esperam a dona
- O trecho ditado "A não ser ele complementar. Vamos remover do CMM do usuário" não foi entendido; nada foi removido.
- "E padrão", no pedido do Dashboard, também não foi entendido.
- `env.local.md` tem a senha do banco e a chave secreta em texto aberto e **não** é ignorado pelo git. Ficou de fora deste commit de propósito. O repositório é público: o arquivo deve ir para o Lixo ou para o `.gitignore`, e a senha deve ser trocada se ele já tiver sido enviado alguma vez.
- Criar um projeto Supabase em São Paulo (o atual fica no Canadá e cada consulta leva de 1,2 a 1,9 s).

## 5. Sobras no banco de teste

- Plano de tarefas "Roteiro de teste (3 dias)" (em Tarefas › Planos).
- Duas tarefas no "Lead teste 29", criadas por esse plano.

## 6. Antes de abrir PR

Nada foi enviado ao GitHub. Antes do PR: rodar `pnpm gov:verify` e `pnpm test:db` numa máquina com memória, conferir a numeração da migration (`pnpm checar:colisao-de-migration`), atualizar a branch com a `main` e criar o fragmento em `.changes/`.
