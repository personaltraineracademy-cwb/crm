# 1. Diagnóstico do CRM atual

Feito em 23/11/2026, no próprio produto: leitura de `lib/navigation/catalogo.ts` (a lista única de telas), de `lib/navigation/interface.ts`, `lib/onboarding/`, `lib/instalacao/modulos.ts`, da doutrina (`CLAUDE.md`, `docs/doctrine/extensoes.md`, `docs/interface-por-vinculo.md`) e visita às telas em `http://localhost:3000`, logado como administrador, em janela de 1280×800. Os números de campos e botões foram contados por script na página, não a olho.

## 1.1 O tamanho do produto, em números

| O que foi medido | Valor | Onde |
|---|---|---|
| Telas com porta na navegação | 75 | `grep -c 'href:' lib/navigation/catalogo.ts` |
| Telas por grupo | Atendimento 4 · CRM 14 · Agente de IA 15 · Canais 3 · Análise 7 · Organização 26 | mesmo arquivo |
| Itens visíveis no menu lateral (administrador) | 18 links + Configurações | contado na tela |
| Cartões no hub "Ver tudo em CRM" | 9 | `/app/crm` |
| Cartões no hub "Ver tudo em IA" | 14, em 3 seções | `/app/ai` |
| Cartões em Configurações | 24, em 4 seções, 1.756 px de altura (mais de duas telas) | `/app/settings` |
| Campos na tela "Novo agente" | 45 campos, 13 blocos, 3 abas, 2.655 px de altura | `/app/ai/agents/new` |
| Campos na edição de um agente | 48 campos, 16 blocos, 9 abas, 5.922 px de altura (mais de sete telas) | `/app/ai/agents/<id>` |
| Campos em "Etapas do funil" (um funil de 8 etapas) | 55 | `/app/settings/tenant/pipelines` |
| Campos em Configurações › Organização | 81 (inclui as caixas do "Menu lateral") | `/app/settings/tenant` |
| Abas em Conexões | 6 | `/app/connections` |

Leitura: o produto não é confuso por desleixo. Ele é grande, e cada tela tenta dizer tudo de uma vez. O próprio código reconhece o problema: há comentários no catálogo contando pixels para o menu caber em 900 px de altura, e já existe um modo "Simplificada" pronto (ver 1.5).

## 1.2 Mapa do menu e das telas

Legenda de "para quem": **V** = vendedor ou atendente · **D** = dono ou gestor · **T** = técnico (quem instala ou integra).

### Atendimento (4 telas, todas no menu)

| Tela | O que faz | Para quem | Onde o leigo se perde |
|---|---|---|---|
| Inbox | Conversas de WhatsApp, pessoa e IA lado a lado. Abas Automático, Fila, Minhas, Mais | V, D | Nome em inglês. "Automático" e "Fila" não dizem o que são para quem chega. |
| Radar | Conversas que esfriaram e podem se perder | V, D | Nome não diz a função. Vazio, a tela mostra só o título, sem dizer o que fazer. |
| Agenda | Compromissos marcados, por pessoa | V, D | No topo aparece um aviso técnico sobre "cadastrar o aplicativo do Google", com endereço de retorno de API. Tipos semeados são Atendimento, Consulta e Reunião (nada de "aula experimental" ou "avaliação"). |
| Respostas rápidas | Textos salvos para responder | V | Sem problema relevante. |

### CRM (14 telas; 3 no menu, o resto no hub)

| Tela | O que faz | Para quem | Onde o leigo se perde |
|---|---|---|---|
| Funis | Lista dos funis; abre o quadro | V, D | O funil que vem pronto chama-se **"Pedidos"**, com etapas de loja: Carrinho abandonado, Aguardando pagamento, Pago, Em separação, Enviado, Entregue, Pós-venda, Cancelado. Não serve a personal, nutri nem academia. |
| Quadro do funil | Colunas e cartões; botão "Novo Lead" | V | Vocabulário misturado: "Lead" no botão, "negócio" nas tarefas, "card" nas etapas, "contato" na lista. |
| Contatos | Lista de pessoas | V, D | Subtítulo "Customer 360". Cinco botões no topo (Importar CSV, Exportar, Mais ações, Novo contato, filtros). |
| Tarefas | O que ficou combinado, com prazo | V, D | Boa tela vazia. Sem problema relevante. |
| Campanhas | Disparo para uma lista | D | Só no hub. Risco de bloqueio do número se usada sem cuidado. |
| Prospecção | Busca de empresas e abordagem com IA | D | Recurso de venda para empresas. Fora do nicho. |
| Planos de tarefa | Sequências de tarefas reutilizáveis | D | Conceito avançado; nome parecido com "Tarefas". |
| Chamadas | Histórico de ligações por IA | D, T | Depende de telefonia que quase ninguém do nicho vai ligar. |
| Produtos | Catálogo com preço que a IA responde | D | Descrição fala em "loja". Útil para planos e pacotes, mas não está dito assim. |
| Etapas do funil | Colunas, vocabulário, campos, motivos de perda | D | 55 campos numa tela. Termos como "Chance de fechamento (0 a 100)", "Janela de esfriando", "custom fields". |
| Propostas | Proposta comercial em PDF | D | Desligada por padrão. |
| Empresas, Pessoas, Importações | Venda para empresas | D | Desligadas por padrão (módulo `crm_b2b`). |
| Comandas | Balcão: o que foi feito e quanto se paga | V | Desligada por padrão (módulo `financeiro`). |

### Agente de IA (15 telas; 3 no menu, o resto no hub)

| Tela | O que faz | Para quem | Onde o leigo se perde |
|---|---|---|---|
| Agentes | Cria e edita o atendente de IA | D | É a tela mais pesada do produto: 45 campos para criar. Pede "Ordem de preferência (0 a 1000)", "Custo máximo por atendimento (centavos)", "Volume de texto por atendimento", "Limiar de sentimento", chave de acesso e modelo. |
| Follow-ups | Fluxos que retomam conversa parada | D | Já tem "Começar de um modelo" (bom). O modelo que existe é de consulta. |
| Casos | Atendimentos em que a IA pediu uma pessoa | V, D | Conceito novo para o leigo; convive com "Fila" do Inbox e "Alertas". |
| Roteadores | Qual agente pega qual conversa | T | Só faz sentido com mais de um agente. |
| Credenciais, Provedores | Chave e empresa de IA | T | Assunto de quem instala, não do dono. |
| Conhecimento | Materiais que a IA consulta | D | Essencial, mas escondido no hub. |
| Memória, Skills | O que a IA aprendeu e o que pode executar | T | Avançado. |
| Alertas, Aviso no WhatsApp | Avisos da IA e envio deles ao celular | D | Três palavras parecidas no produto: Alertas, Avisos, Notificações. |
| Propostas (da IA) | Melhorias que a IA sugere a si mesma | D | Mesmo nome das propostas comerciais. |
| Execuções, Uso e orçamento | Diagnóstico e gasto | T, D | Técnico. |
| Fluxos de atendimento | Roteiro de perguntas conduzido pela IA | D | Desligado por padrão. Seria útil para anamnese (ver proposta). |

### Canais (3 telas)

| Tela | O que faz | Para quem | Onde o leigo se perde |
|---|---|---|---|
| Conexões | Liga o WhatsApp | D | Seis abas: Números por QR, API Oficial (Meta), Provedor parceiro, Telefone, Redes sociais, Chamada de voz. O dono só quer "ligar meu WhatsApp". |
| Webhooks | Recebe contatos de fora **e guarda as automações** | T | O nome é técnico e esconde a aba "Automações", que é o que o dono procuraria. |
| Nuvemshop | Integração de loja | T | Fora do menu; fora do nicho. |

### Análise (7 telas; 3 no menu)

| Tela | O que faz | Para quem | Onde o leigo se perde |
|---|---|---|---|
| Desempenho | Funil e resultado por atendente, 30 dias | D | Sem dados, mostra só o título. |
| Meta Ads | Custo por resultado das campanhas | D | Exige conectar a conta em outra tela de mesmo nome, em Configurações. |
| Atividades | O que equipe e IA fizeram | D | Parecida demais com Desempenho para quem não conhece. |
| Faturamento, Honorários | Dinheiro | D | Honorários desligado por padrão. |
| Evolução da IA, Audit Log | Revisão da IA e histórico de ações | T | Nome em inglês; uso raro. |

### Configurações (26 telas)

| Seção | Telas | Observação |
|---|---|---|
| Sua empresa (16) | Tipos de agendamento, Aviso de agendamento, Modelos de proposta, Financeiro, Meta de vendas, Equipe, Distribuição de atendimento, Automações, Tags, Recursos opcionais, Organização, Conversões, Meta Ads, Marca, Plano e cobrança, Extensões | Mistura o que se ajusta no primeiro dia (Equipe, Marca) com o que quase ninguém toca (Conversões, Extensões). "Automações" aqui é só um freio da IA, não a tela de automações. |
| Sua conta (4) | Perfil, Segurança, Notificações, App no celular | Adequado. |
| Dados e acesso (4+) | LGPD, API Tokens, Trunk SIP, Servidor MCP externo, Dados externos | Tudo técnico. Aparece no mesmo plano visual de "Equipe". |

## 1.3 Os sete problemas que mais pesam

1. **O ponto de partida é de loja, não de fitness.** O funil semeado é "Pedidos" e os tipos de agenda são genéricos. O dono abre o sistema e não se reconhece. O onboarding tem pacotes prontos por tipo de negócio (`lib/onboarding/pacotes-de-funil.ts`), mas a lista é clínica, imobiliária, serviços, curso, loja e "outro". Não há personal, nutricionista nem academia.
2. **Criar um agente pede 45 respostas.** É a tela que mais afasta um leigo, e é a promessa central do produto. A referência de mercado (GPT Maker) pede cinco (ver `02-referencias.md`).
3. **A mesma coisa tem vários nomes, e nomes iguais são coisas diferentes.** Lead, negócio, card e contato. Alertas, Avisos e Notificações. "Propostas" aparece três vezes (comercial, configuração, sugestões da IA). "Meta Ads" duas vezes. "Automações" em três lugares: aba dentro de Webhooks, Follow-ups em IA e um item em Configurações que é outra coisa.
4. **Configurações não separa o essencial do raro.** 24 cartões com o mesmo peso. O dono precisa de quatro ou cinco no primeiro mês.
5. **Jargão técnico e inglês na frente do usuário.** Inbox, Webhooks, Audit Log, Skills, Customer 360, custom fields, DPO, Trunk SIP, API Tokens, MCP.
6. **Telas vazias que não ensinam.** Radar e Desempenho, sem dados, mostram só o título. Tarefas e Conexões já fazem certo e servem de modelo.
7. **Aviso técnico em tela de uso diário.** A Agenda abre com instrução de cadastro de credenciais do Google e endereço de API.

## 1.4 O que já está bom e deve ser preservado

- Descrições em linguagem de dono em quase todo o catálogo ("Quem atende por você", "O que ficou combinado, com prazo").
- Busca geral (⌘K) que acha qualquer tela.
- Hubs agrupados por jornada ("Montar o agente", "Ensinar o agente", "Acompanhar o agente").
- Onboarding em sete passos com nomes de peça, não de sistema ("O telefone dele", "Treinar", "Ver ele atender").
- Módulos pesados já nascem desligados: venda para empresas, comandas, honorários, propostas, banco externo, fluxos de atendimento.
- Follow-ups com "Começar de um modelo".

## 1.5 O achado mais importante: o mecanismo de simplificar já existe

O produto já tem, pronto e testado, três níveis de escolha do que aparece no menu (`docs/interface-por-vinculo.md`, `lib/navigation/interface.ts`):

- **Por empresa:** Configurações › Organização › Menu lateral. Grava em `organizations.interface_settings`.
- **Por pessoa:** em Equipe e no convite, cada membro recebe interface Completa, Simplificada ou personalizada.
- **Preset "Simplificada":** mostra só Inbox, Agenda, Funis, Contatos, Tarefas e Conexões.

Isso muda só a apresentação; as permissões continuam valendo. Consequência para a proposta: a maior parte da simplificação do menu **não exige mexer no núcleo**. Exige escolher bem o padrão e fazer esse padrão ser o ponto de partida.

## 1.6 O que não foi visto

- Telas com dados reais: o banco de teste está vazio (sem conversas, sem cartões no quadro). O Inbox e o quadro foram vistos vazios ou carregando.
- A visão de um vendedor (papel `agent`) e de um leitor: a visita foi só como administrador.
- Celular: nada foi medido em tela estreita. `docs/current-state.md` registra transbordo de layout a 390 px, em retrato antigo (julho de 2026); não foi reconferido.
- O onboarding rodando: os passos foram lidos no código, não percorridos.
- Telas de administração da instalação (`/admin`).
- `docs/testing/user-journey-map.md` (3.912 linhas) e `docs/index.md` não foram lidos por inteiro; o diagnóstico se apoia no catálogo e nas telas.
