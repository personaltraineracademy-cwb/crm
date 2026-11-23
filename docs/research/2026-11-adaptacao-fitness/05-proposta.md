# 5. Proposta de adaptação

As recomendações abaixo são firmes. Onde há uma decisão que só a dona pode tomar, está marcado **Decisão sua**. Onde uma ideia depende de algo que não testei, está marcado **A conferir**.

## 5.1 A decisão central

**Não remover nada. Trocar o ponto de partida.**

O produto já tem o mecanismo para mostrar menos (menu por empresa e por pessoa, módulos desligados por padrão, pacotes de funil por tipo de negócio, modelos de follow-up). O problema é que o padrão de fábrica é "tudo ligado, para uma loja". A proposta é fazer o padrão ser "o essencial, para fitness", e deixar todo o resto a um clique, numa área chamada **Avançado**.

Três motivos:

1. **É o que as referências fazem.** Clint e GPT Maker têm o motor completo, e o escondem atrás de modelos prontos (`02-referencias.md`).
2. **É o que a pesquisa de usabilidade recomenda.** Poucos mudam configurações; o padrão é a experiência (`03-ux.md`, 3.2).
3. **É o que a doutrina do repositório permite.** O item 12 da doutrina de extensões proíbe tirar do núcleo o que já foi distribuído. Esconder por configuração é permitido e já tem lugar na tela. E como este CRM é uma cópia adaptada do DeskcommCRM, cada mudança no núcleo vira conflito na próxima atualização do original. Quanto mais a adaptação for dado e configuração, mais barato é manter.

## 5.2 O menu novo

### Menu principal (6 itens para o vendedor, 8 para o dono, mais Configurações)

| Item novo | É a tela de hoje | Por que fica |
|---|---|---|
| **Início** | nova (ver 5.7) | Responde "o que eu faço agora?" |
| **Conversas** | Inbox | Onde o dia acontece |
| **Funil** | Funis | Abre direto o quadro quando há um funil só |
| **Contatos** | Contatos | Alunos, pacientes e interessados |
| **Agenda** | Agenda | Aula experimental, avaliação, consulta |
| **Tarefas** | Tarefas | O que ficou combinado |
| **Assistente de IA** | hub de IA, reorganizado (ver 5.5) | Um item só: o assistente, o que ele sabe, o que ele retoma |
| **Resultados** | Desempenho | Só para dono e gestor |
| *rodapé:* **Configurações** | Configurações, em dois níveis (ver 5.6) | |

O vendedor vê os seis primeiros. O dono vê os oito.

### Avançado (um clique, dentro de Configurações e na busca)

Radar (renomeado "Esfriando", e também resumido no Início) · Respostas rápidas (acessível de dentro da conversa, que é onde se usa) · Campanhas · Planos e preços (hoje "Produtos") · Etapas do funil · Automações (hoje aba dentro de Webhooks) · Casos · Roteadores · Memória · Skills · Execuções · Uso e orçamento · Meta Ads · Atividades · Evolução da IA · Histórico de ações (hoje "Audit Log") · Faturamento.

### Desligado por padrão (continua existindo; liga quem precisar)

Já nascem desligados hoje e assim ficam: Empresas, Pessoas, Importações, Comandas, Honorários, Propostas comerciais, Dados externos. Passam a ficar fora do menu enxuto: Prospecção, Chamadas, Trunk SIP, Nuvemshop, Servidor MCP externo, API Tokens, Extensões.

Exceção: **Fluxos de atendimento** deve ser **ligado** nas instalações do nicho. É o recurso que faz a IA conduzir a anamnese e gravar as respostas na ficha.

### Como isso é feito

- **Configuração, sem código:** em Configurações › Organização › Menu lateral, escolher as portas. Dá para aplicar hoje no Personal Berk.
- **Mudança pequena de núcleo:** (a) atualizar a lista do preset "Simplificada" em `lib/navigation/interface.ts`, que hoje inclui Conexões e não inclui Agentes nem Desempenho; (b) fazer organização nova nascer no preset enxuto; (c) trocar rótulos no catálogo. **A conferir:** o preset vale igual para todos os papéis; o recorte "vendedor vê seis, dono vê oito" sai do papel de cada tela (`minRole`), que já existe.

## 5.3 Glossário único

Um nome por coisa, em português. Vale para menu, botões, telas vazias e mensagens.

| Usar | No lugar de |
|---|---|
| Conversas | Inbox |
| Funil | Pipeline, Kanban, quadro |
| Interessado (antes de fechar) e Aluno ou Cliente (depois) | Lead, card |
| Negócio (o cartão no funil) | Lead, card, deal |
| Assistente de IA | Agente, bot |
| Passar para uma pessoa | Handoff, transbordo, escalar |
| Aguardando você | Fila, Em espera, Casos (para o vendedor) |
| Retomada automática | Follow-up |
| Automações | Webhooks › Automações, regras |
| Entrada de contatos | Webhooks › Receber dados |
| Histórico de ações | Audit Log |
| Campos | Custom fields |
| Avisos | Alertas, Notificações (um nome só) |

O funil já aceita vocabulário próprio por negócio (`vocabulary` no funil), então "Aluno", "Paciente" e "Matrícula" são configuração do pacote, não código.

## 5.4 Funis e campos prontos por tipo de negócio

Entram como quatro pacotes novos em `lib/onboarding/pacotes-de-funil.ts`, ao lado dos seis que existem. No onboarding, a pessoa escolhe "o que você faz" e recebe o funil certo. Os pacotes atuais têm sete etapas, cada uma ligada a um passo do atendimento da IA; mantive esse formato. **A conferir:** se um pacote pode criar dois funis de uma vez (vender e manter). Se não puder, o segundo funil nasce por um botão "Criar funil de alunos".

### Personal trainer — consultoria online

| Funil "Novos alunos" | Funil "Alunos ativos" |
|---|---|
| 1. Novo interessado | 1. Começando (primeira semana) |
| 2. Já respondi | 2. Em acompanhamento |
| 3. Entendendo o objetivo | 3. Renovação chegando |
| 4. Avaliação feita | 4. Renovou |
| 5. Proposta enviada | 5. Não renovou |
| 6. Fechou (vira aluno) | |
| 7. Não fechou | |

Campos: objetivo (emagrecer, ganhar massa, saúde, desempenho) · onde treina (academia, casa, condomínio) · dias por semana · restrição ou lesão · plano contratado · início · **vencimento do plano** · como chegou (Instagram, indicação, anúncio).

### Nutricionista — consultoria ou consultório

| Funil "Novos pacientes" | Funil "Pacientes em acompanhamento" |
|---|---|
| 1. Novo contato | 1. Plano alimentar entregue |
| 2. Já respondi | 2. Em acompanhamento |
| 3. Entendendo o caso | 3. Retorno chegando |
| 4. Quer agendar | 4. Renovou |
| 5. Consulta marcada | 5. Não renovou |
| 6. Fechou o plano | |
| 7. Não fechou | |

Campos: objetivo · restrição alimentar · condição de saúde relevante · tipo de atendimento (online, presencial) · plano contratado · **data do retorno** · **vencimento do plano**.

Cuidado: restrição e condição de saúde são dado sensível pela LGPD. O pacote deve trazer o aviso de consentimento ligado e pedir o mínimo.

### Academia ou estúdio

| Funil "Matrículas" | Funil "Alunos" |
|---|---|
| 1. Novo interessado | 1. Primeira semana |
| 2. Já respondi | 2. Ativo |
| 3. Tirando dúvidas | 3. Em risco (sumiu ou atrasou) |
| 4. Aula experimental marcada | 4. Recuperado |
| 5. Fez a aula | 5. Cancelou |
| 6. Matriculado | |
| 7. Não matriculou | |

Campos: modalidade de interesse · horário preferido · já treinou antes · data da aula experimental · professor · plano · **vencimento do plano**.

### Infoprodutor fitness

| Funil "Vendas" | Funil "Recuperação de pagamento" |
|---|---|
| 1. Novo interessado | 1. Pagamento não concluído |
| 2. Já respondi | 2. Já falei |
| 3. Tirando dúvidas | 3. Vai pagar |
| 4. Quer comprar | 4. Pagou |
| 5. Aguardando pagamento | 5. Desistiu |
| 6. Comprou | |
| 7. Não comprou | |

Campos: produto · evento do checkout · valor · data da compra · lançamento ou venda contínua.

Estas etapas são **hipótese**. A de academia e a de infoproduto têm apoio nas fontes; a de personal e a de nutricionista não têm fonte e devem ser validadas com o Personal Berk antes de virar pacote.

### O que vem junto com cada pacote

| Peça | Onde entra | Tipo |
|---|---|---|
| Tipos de agenda: Aula experimental, Avaliação, Consulta, Retorno | Tipos de agendamento | configuração |
| 6 a 8 respostas rápidas (preço, horário, como funciona, pagamento) | Respostas rápidas | configuração |
| Etiquetas iniciais (objetivo, origem, plano) | Tags | configuração |
| Motivos de perda (preço, sem tempo, vai pensar, fechou com outro, sumiu) | Etapas do funil | configuração |
| 3 retomadas automáticas (sumiu depois do preço; faltou à aula ou à consulta; não respondeu à proposta) | Follow-ups › Começar de um modelo | modelo novo |
| 3 automações (lembrete na véspera; boas-vindas ao fechar; aviso 7 dias antes do vencimento) | Automações | regra pronta; o motor já tem gatilho por data, por silêncio e por etapa parada |
| Instruções do assistente para o nicho | Agentes | modelo novo |
| Guia de primeiros passos | Extensões (pacote declarativo, como "Primeira semana no atendimento") | extensão |

## 5.5 Assistente de IA: de 45 campos para 5 perguntas

É a mudança de maior efeito. Hoje, criar um agente pede 45 respostas; o GPT Maker pede 5.

**Assistente de criação (cinco telas, uma pergunta cada):**

1. Como ele se chama?
2. O que ele faz? *Atender e tirar dúvidas* · *Qualificar e agendar* · *Vender e cobrar retorno* (cada opção carrega instruções e permissões prontas do nicho)
3. Conte sobre o seu negócio (texto livre, site ou Instagram; vira a base de conhecimento)
4. Quando ele chama uma pessoa? (chaves: quando o cliente pedir · quando falar de pagamento ou cancelamento · quando não souber)
5. Por qual WhatsApp ele atende? → **Testar agora**

Tudo o mais nasce com valor seguro e vai para **Ajustes avançados**, recolhido: empresa e modelo de IA, chave, ordem de preferência, limites de custo e de ações, histórico lido, horários, palavras-gatilho, limiar de sentimento, comandos pelo celular, servidor externo.

**O hub de IA passa de 14 cartões para 3 abas:**

| Aba | Junta | 
|---|---|
| **Assistente** | Agentes |
| **O que ele sabe** | Conhecimento |
| **Retomadas** | Follow-ups |

Roteadores, Credenciais, Provedores, Memória, Skills, Propostas da IA, Execuções e Uso vão para **Avançado**. Casos e Alertas viram uma lista só para o vendedor, "Aguardando você", dentro de Conversas (ver 5.7).

**Tipo de mudança:** núcleo, mas só de apresentação. O formulário atual (`AgentForm.tsx`) continua sendo a verdade; o assistente é uma porta nova que preenche o mesmo formulário. Não muda banco nem o motor do agente. Como não muda prompt de agente existente, não dispara a regra de avaliação com 20 casos; os **modelos de instrução do nicho** disparam, e precisam dessa avaliação antes de virar padrão (`.claude/rules/desenvolvimento-com-claude.md`, seção 7).

## 5.6 Configurações em dois níveis

Hoje: 24 cartões iguais. Proposta: seis no primeiro nível, o resto atrás de um botão.

**Primeiro nível — "O essencial"**

| Cartão | Junta as telas de hoje |
|---|---|
| Meu negócio | Organização (nome, fuso, moeda) + Marca |
| WhatsApp | Conexões, abrindo direto em "Conectar por QR" com o caminho recomendado marcado |
| Equipe | Equipe + Distribuição de atendimento |
| Agenda | Tipos de agendamento + Aviso de agendamento |
| Funil e campos | Etapas do funil + Tags + Meta de vendas |
| Minha conta | Perfil, Segurança, Notificações, App no celular |

**Segundo nível — "Avançado"**, com subtítulos: *Anúncios* (Meta Ads, Conversões) · *Integrações* (Entrada de contatos, API Tokens, Dados externos, Servidor MCP, Trunk SIP) · *IA* (Credenciais, Provedores, freio de automações) · *Dados* (LGPD, Histórico de ações, retenção) · *Recursos opcionais e Extensões* · *Plano e cobrança*.

Em "Meu negócio", os campos "Razão social", "CNPJ", "DPO email", "Retenção de mídia" e "URL política de privacidade" descem para um bloco recolhido "Dados legais". A "Zona de perigo" vai para Avançado.

**Tipo de mudança:** núcleo de apresentação (o hub de Configurações e a seção de cada item no catálogo). Nenhuma tela é apagada; todas continuam achadas pela busca.

## 5.7 Melhorias tela a tela

| Tela | Mudança | Tipo | Esforço |
|---|---|---|---|
| **Início** (nova) | Quatro blocos: conversas aguardando você · tarefas de hoje · agenda de hoje · quem está esfriando. Enquanto a conta é nova, uma lista "Primeiros passos" (ligar o WhatsApp, criar o assistente, testar, convidar a equipe) que some ao concluir | núcleo, tela nova | médio |
| **Conversas** | Abas viram "Aguardando você", "Minhas", "Com o assistente", "Todas". Casos e avisos da IA que pedem pessoa aparecem em "Aguardando você". Na lateral da conversa: etapa do funil, etiquetas e campos principais editáveis sem sair | núcleo | médio. **A conferir** o que a lateral já mostra com conversa real |
| **Funil** | Com um funil só, o menu abre o quadro direto. Botão "Novo interessado" (texto vem do vocabulário). Cartão mostra dias parado e próxima tarefa. Motivo de perda escolhido ao arrastar para a coluna de perda | núcleo pequeno + configuração | baixo a médio. **A conferir** com cartões reais |
| **Etapas do funil** | Primeiro nível: nome e ordem das colunas. "Chance de fechamento", "Janela de esfriando" e "Avisar a equipe" vão para um botão "Mais opções" por etapa | núcleo de apresentação | baixo |
| **Contatos** | Subtítulo em português. No topo ficam "Novo contato" e a busca; Importar e Exportar vão para "Mais ações" | núcleo pequeno | baixo |
| **Agenda** | O aviso de credenciais do Google sai da tela de uso e vai para Configurações › Agenda, visível só ao administrador | núcleo pequeno | baixo |
| **Conexões** | Primeira tela: um botão "Conectar WhatsApp por QR (recomendado)". As outras cinco abas ficam em "Outros canais" | núcleo de apresentação | baixo |
| **Automações** | Sai de dentro de Webhooks e ganha porta própria, com galeria "Começar de um modelo", como os Follow-ups já têm | núcleo | médio |
| **Resultados** | Estado vazio que explica. Depois, bloco do nicho: conversão de aula experimental ou avaliação, renovações a vencer nos próximos 30 dias, taxa de renovação | núcleo, parte nova | médio a alto |
| **Radar, Desempenho** | Estado vazio com o que é, por que está vazio e um botão | núcleo pequeno | baixo |
| **Onboarding** | No passo "Seu negócio", a pergunta "o que você faz" com as quatro opções de fitness no topo. A escolha define funil, campos, agenda, assistente e menu | núcleo pequeno (dados) | baixo |

## 5.8 Funcionalidades novas, em ordem de valor

1. **Pacotes do nicho** (5.4). Sem isto, nada do resto se sustenta.
2. **Assistente de criação do agente** (5.5).
3. **Receitas de checkout** para Eduzz, Hotmart e Kiwify: uma tela "Conectar checkout" que mostra o endereço a colar na plataforma e já cria o funil "Recuperação de pagamento" com cada evento na etapa certa. Começar pela **Eduzz**, que é a plataforma que a casa já usa. **A conferir:** quanto o recebimento atual de webhooks já entende do formato de cada plataforma.
4. **Renovação automática**: regra pronta "7 dias antes do vencimento do plano", usando o gatilho por data que já existe. Atenção: ele lê campo do **negócio**, não do contato, então o vencimento fica no negócio do funil de alunos.
5. **Passagem automática de "fechou" para o funil de alunos.** **A conferir** se a ação "criar ou mover negócio" atravessa funis.
6. **Bloco de resultados do nicho** (5.7).

Fica **fora** de propósito: catraca, treino, cobrança recorrente, plano alimentar. Isso é sistema de gestão, e há fornecedores fortes nisso (`04-nicho-fitness.md`, 4.2). O CRM conversa, vende e retém.

## 5.9 Núcleo, configuração ou extensão

A pergunta da doutrina: *se nenhuma organização ativar isto, a operação comum continua inteira?*

| Mudança | Destino | Por quê |
|---|---|---|
| Escolher as portas do menu numa organização | **Configuração** | Tela já existe |
| Funis, campos, etiquetas, respostas rápidas, tipos de agenda, motivos de perda de um cliente | **Configuração** | Tudo editável pela tela |
| Ligar "Fluxos de atendimento" na instalação | **Configuração** da instalação | Módulo opcional existente |
| Guia de primeiros passos do nicho, roteiros de aula experimental e de renovação | **Extensão** declarativa | Jornada de nicho; a ausência não quebra nada. Já há três pacotes desse tipo no repositório |
| Quatro pacotes de funil fitness no onboarding | **Núcleo** (dados) | O onboarding é núcleo; é lista de dados, sem lógica nova |
| Modelos de follow-up, de automação e de instrução do assistente | **Núcleo** (dados) | Mesmas galerias que já existem |
| Preset enxuto como padrão, rótulos novos, Configurações em dois níveis | **Núcleo** (apresentação) | Mexe em catálogo e hubs; não muda permissão nem banco |
| Assistente de criação do agente, tela Início, porta própria de Automações | **Núcleo** (tela nova) | Operação comum a qualquer nicho |
| Receitas de checkout | **Ambos** | Ponto genérico no núcleo (entrada de contatos) + receita por plataforma |
| Bloco de resultados do nicho | **Ambos** ou módulo opcional | Só faz sentido para quem tem plano com vencimento |

Regras que valem para toda mudança de núcleo: tela nova tem porta no catálogo (DoD 14); mudança visível é provada pela tela, como um leigo, com evidência (DoD 12); nada distribuído é removido (doutrina de extensões, item 12); nenhuma destas propostas exige mudança de banco, exceto, talvez, os resultados do nicho.

## 5.10 Ondas

Impacto e esforço em três níveis. Esforço: baixo = até 2 dias; médio = até 1 semana; alto = mais de 1 semana. São estimativas, não medições.

### Onda 0 — Só configuração, no Personal Berk (sem código)

Serve para testar a proposta com um cliente real antes de programar.

| # | O quê | Impacto | Esforço |
|---|---|---|---|
| 0.1 | Menu enxuto na organização (Configurações › Organização › Menu lateral) | alto | baixo |
| 0.2 | Criar os dois funis de personal, com campos e motivos de perda; arquivar "Pedidos" | alto | baixo |
| 0.3 | Tipos de agenda, respostas rápidas e etiquetas do nicho | médio | baixo |
| 0.4 | Um assistente com instruções do nicho e base de conhecimento do Berk; três retomadas a partir de modelo | alto | baixo |
| 0.5 | Três automações: lembrete na véspera, boas-vindas, aviso de vencimento | alto | baixo. **A conferir** na tela |
| 0.6 | Anotar o que ele não entendeu e o que pediu | — | — |

Pronto quando: o Berk atende uma semana pelo sistema e as anotações de 0.6 existem.

### Onda 1 — O ponto de partida certo (núcleo pequeno, quase tudo dados)

| # | O quê | Impacto | Esforço |
|---|---|---|---|
| 1.1 | Quatro pacotes fitness no onboarding (corrigidos pelo que a Onda 0 ensinou) | alto | baixo |
| 1.2 | Organização nova nasce com menu enxuto; lista do preset atualizada | alto | baixo |
| 1.3 | Glossário aplicado aos rótulos do menu e das telas principais | alto | baixo a médio |
| 1.4 | Configurações em dois níveis | alto | médio |
| 1.5 | Estados vazios de Radar e Desempenho; aviso do Google fora da Agenda; Conexões com caminho recomendado | médio | baixo |
| 1.6 | "Etapas do funil" com opções avançadas recolhidas | médio | baixo |

Pronto quando: uma conta nova, criada do zero e escolhendo "Personal trainer", chega ao primeiro atendimento sem abrir Avançado, com prova pela tela.

### Onda 2 — O assistente e a rotina

| # | O quê | Impacto | Esforço |
|---|---|---|---|
| 2.1 | Assistente de criação do agente em cinco perguntas, com ajustes avançados recolhidos | alto | médio |
| 2.2 | Hub de IA em três abas | médio | baixo |
| 2.3 | Modelos de instrução do nicho, com avaliação de cerca de 20 casos antes de virar padrão | alto | médio |
| 2.4 | Modelos de retomada e de automação do nicho nas galerias | alto | baixo |
| 2.5 | Tela Início com "Primeiros passos" | alto | médio |
| 2.6 | Conversas com "Aguardando você" | médio | médio |
| 2.7 | Automações com porta própria | médio | médio |

Pronto quando: um leigo cria e testa um assistente em menos de dez minutos, medido.

### Onda 3 — O que é só do nicho

| # | O quê | Impacto | Esforço |
|---|---|---|---|
| 3.1 | Receita de checkout da Eduzz; depois Hotmart e Kiwify | alto (infoprodutor) | médio a alto |
| 3.2 | Passagem automática de "fechou" para o funil de alunos | médio | baixo a médio |
| 3.3 | Bloco de resultados do nicho | médio | médio a alto |
| 3.4 | Guias do nicho como extensão declarativa | baixo a médio | baixo |
| 3.5 | Revisão em celular das telas do menu enxuto | alto (personal atende pelo celular) | a medir |

## 5.11 Decisões que são suas

1. **Aprovar a Onda 0** no Personal Berk. É a única que não custa código e ensina o resto.
2. **Nome da área "Avançado"** e do item "Assistente de IA" (em vez de "Agente").
3. **Primeiro checkout:** recomendo Eduzz. Confirme se os clientes do Ignite Ads usam outra.
4. **Menu enxuto como padrão para toda organização nova** desta instalação, ou só para as do nicho. Recomendo para todas: é a instalação do grupo.
5. **Quem valida os funis de nutricionista e de academia**, já que o primeiro cliente é personal.

## 5.12 Riscos

- **Conflito com o original.** Toda mudança de núcleo aumenta o custo de trazer atualizações do DeskcommCRM. Por isso as Ondas 0 e 1 são quase só dados e configuração.
- **Testes que vigiam o menu.** Há testes que contam itens e medem a dobra do menu (`tests/e2e/navegacao.spec.ts`, `tests/unit/navegacao-completude.test.ts`, `tests/unit/interface-por-empresa.test.ts`). Mudança de catálogo precisa passar por eles; não se edita o teste para passar.
- **Tradução.** O produto tem espanhol e inglês; rótulo novo precisa das três línguas ou os testes de hub reprovam.
- **Dado de saúde.** Campos de nutrição e de lesão são sensíveis. O pacote deve pedir o mínimo e manter o consentimento.
- **Esconder demais.** Se "Avançado" virar um depósito sem ordem, o problema só muda de lugar. Por isso ele tem subtítulos e a busca continua achando tudo.
