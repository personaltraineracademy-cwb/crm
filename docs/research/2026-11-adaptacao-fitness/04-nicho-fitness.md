# 4. O que o nicho fitness precisa de um CRM

Pesquisa de 23/11/2026. Quase todas as fontes são páginas e blogs de fornecedores de software. Os números de mercado abaixo são **alegações de fornecedor**, salvo indicação. O que é proposta minha, sem fonte, está marcado como **proposta**.

## 4.1 Os três perfis

| Perfil | Como vende | O que precisa acompanhar depois da venda |
|---|---|---|
| Infoprodutor (curso, desafio, programa) | Lançamento ou venda contínua; pagamento em checkout (Eduzz, Hotmart, Kiwify) | Quem não concluiu o pagamento; quem pode comprar o próximo produto |
| Personal ou nutricionista em consultoria online | Conversa no Instagram e no WhatsApp até fechar um plano por período | Entrega do plano, retornos e, principalmente, a **renovação** |
| Academia ou estúdio | Visita ou aula experimental até a matrícula | Frequência, pagamento, risco de cancelamento, volta de ex-aluno |

O que os três têm em comum: a venda acontece em conversa de WhatsApp, e o dinheiro está na recorrência (renovar, não cancelar, comprar de novo). Um CRM só de "lead até fechar" atende metade do problema.

## 4.2 O que os programas do nicho oferecem

- **Pacto** (academias): "CRM fitness" com jornada de comunicação do primeiro contato à fidelização, metas diárias de contato com ranking da equipe, carteira de alunos por consultor, "gestão de grupo de risco" (alerta de evasão) e régua de cobrança. Fontes: https://sistemapacto.com.br/ e https://sistemapacto.com.br/crm-fitness/
- **Next Fit** (academias e estúdios): planos, agendamento, avaliação física, cobrança recorrente, site de agendamento de aula experimental, recuperação de mensalidade vencida, relatórios de contratos a vencer e previsão de receita. A página inicial não usa as palavras CRM, funil ou leads. Fonte: https://nextfit.com.br/
- **W12 / EVO** (academias): CRM integrado com e-mail, SMS e WhatsApp, cobrança recorrente, indicadores, turmas e ocupação. Fonte: https://www.w12.com.br/
- **Kommo** (CRM de WhatsApp vendido ao nicho): lembrete antes da sessão, agente de IA que agenda aula experimental, campanhas para quem está em teste, ativo ou inativo. Fonte: https://www.kommo.com/br/segmentos/academias/
- **MFIT Personal** (personal): anamnese e avaliação física online, treinos, pagamento dos alunos, gestão de alunos. Fonte: https://www.mfitpersonal.com.br/

Leitura minha: os sistemas de academia são fortes em gestão (catraca, cobrança, treino) e fracos em conversa. O nosso CRM é o inverso. **Ele não deve tentar virar sistema de gestão de academia.** Deve ser a camada de conversa, venda e retenção, e conviver com o sistema de gestão que o cliente já tem.

## 4.3 Funis típicos

### Academia e estúdio

Etapas montadas a partir das fontes: lead → qualificado (modalidade, experiência, horário) → aula experimental agendada → aula realizada ou falta → matrícula pendente → matriculado → acompanhamento da primeira semana → renovação, risco, inativo, ex-aluno.

Fontes: estágios "interesse, agendamento, aula realizada, matrícula pendente" em https://www.socialhub.pro/blog/agendar-aula-experimental-whatsapp-chatbot-matriculas/ · pós-venda com boas-vindas, primeira semana, indicação e reativação em https://totalpass.com/br/blog/?p=14405 · teste, membro, ativo, inativo em https://www.kommo.com/br/segmentos/academias/

### Consultoria online de personal e nutricionista

O que as fontes dão: etapas genéricas de serviço por WhatsApp (novo contato, qualificado, proposta enviada, negociação, contratado, pós-venda), com exemplos do nicho como "Sessão agendada" e "Plano alimentar enviado" (https://www.socialhub.pro/blog/whatsapp-para-autonomo/); captação por nicho e persona, com pacotes por período (https://blog.mfitpersonal.com.br/como-montar-uma-consultoria-fitness-online-passo-a-passo).

**Não achei fonte que descreva o funil completo** com anamnese, acompanhamento e renovação. A sequência que proponho em `05-proposta.md` é hipótese a validar com o Personal Berk, não fato de mercado.

### Infoproduto

- Modelo da Clint para lançamento e perpétuo: Base, Prospecção, Conexão, Aguardando compra, Fechado (fontes em `02-referencias.md`).
- Funis por evento do checkout, agrupados por produto: Cartão Recusado, Compras Aprovadas, Compras Expiradas. Fonte: https://ajuda.clint.digital/pt-BR/articles/8112938-entenda-o-que-sao-agrupadores-de-origens
- Motivos de venda não concluída segundo a Hotmart: limite ou saldo insuficiente, carrinho abandonado, boleto vencido, cartão recusado, dúvida não respondida. A Hotmart afirma que menos de 30% de quem chega ao pagamento conclui (alegação). Fonte: https://hotmart.com/pt-br/blog/recuperacao-de-vendas

## 4.4 Campos de cadastro típicos

| Perfil | Campos | Fonte |
|---|---|---|
| Lead de academia | nome, WhatsApp, modalidade de interesse, experiência, horário preferido; data, hora e professor da aula experimental; nota depois da aula | https://www.socialhub.pro/blog/agendar-aula-experimental-whatsapp-chatbot-matriculas/ |
| Aluno | plano, vencimento do contrato, situação de pagamento, avaliação física, responsável | https://sistemapacto.com.br/ e https://nextfit.com.br/ |
| Consultoria online | objetivo (emagrecimento, hipertrofia), grupo (mulheres, idosos, gestantes), motivações e dificuldades | https://blog.mfitpersonal.com.br/como-montar-uma-consultoria-fitness-online-passo-a-passo |
| Infoproduto | produto, evento do checkout, tag, dono | https://ajuda.clint.digital/pt-BR/articles/6359355-hotmart-como-integrar-seu-checkout |

## 4.5 Automações típicas

| Momento | Automação | Fonte |
|---|---|---|
| Aula experimental | confirmação na hora, lembrete na véspera, mensagem no dia, pesquisa e oferta cerca de 2 horas depois, retorno em 3 dias | https://www.socialhub.pro/blog/agendar-aula-experimental-whatsapp-chatbot-matriculas/ |
| Aluno novo | boas-vindas, acompanhamento da primeira semana, pedido de indicação | https://totalpass.com/br/blog/?p=14405 |
| Frequência caindo | alerta quando cai abaixo de 2 visitas por semana | https://resources.rework.com/pt/libraries/gym-fitness-growth/gym-churn-reduction |
| Pagamento falhou | aviso no dia, segundo aviso no dia 3, ligação no dia 5, restrição no dia 7, campanha de volta no dia 14 | mesma página |
| Ex-aluno | campanha de reativação | https://totalpass.com/br/blog/?p=14405 |
| Autônomo | resposta fora do horário, respostas rápidas (preço, agenda, pagamento), retorno 48 horas depois da proposta, lembrete de consulta | https://www.socialhub.pro/blog/whatsapp-para-autonomo/ |
| Infoproduto | resgate de lead parado, mensagem depois da compra, nova abordagem de quem não comprou; sequência por evento de pagamento | https://www.useclint.com/automacoes e https://hotmart.com/pt-br/blog/recuperacao-de-vendas |

Sem fonte lida: automação de aniversário, recuperação específica de Pix e oferta de produto seguinte. São comuns no mercado, mas não as vi em página aberta.

## 4.6 Métricas

Definições (https://totalpass.com/br/blog/para-academias/kpi-para-academias/):

- Receita recorrente mensal = alunos em plano recorrente × mensalidade.
- Ticket médio = faturamento do mês ÷ alunos ativos.
- Custo por aluno novo = gasto de vendas e marketing ÷ alunos novos.
- Valor do aluno no tempo = ticket médio × meses de permanência. Regra citada: pelo menos três vezes o custo por aluno novo.
- Cancelamento = cancelamentos do mês ÷ ativos no início do mês.
- Conversão = matrículas ÷ leads.

Alegações de fornecedor, para referência e não para promessa:

- Quem faz aula experimental e se matricula: 50% a 70% com automação, 20% a 30% sem. Lembrete na véspera reduz falta em até 30%. Fonte: https://www.socialhub.pro/blog/agendar-aula-experimental-whatsapp-chatbot-matriculas/
- Cancelamento mensal de 3,3% a 4,5% em estúdio pequeno e 4% a 6% em academia tradicional (o artigo não nomeia a fonte). Fonte: https://resources.rework.com/pt/libraries/gym-fitness-growth/gym-key-metrics
- Falha de pagamento responde por 15% a 20% dos cancelamentos. Fonte: https://resources.rework.com/pt/libraries/gym-fitness-growth/gym-churn-reduction

## 4.7 O que do CRM atual serve e o que não serve

| Serve como está | Serve se for reapresentado | Não serve ao nicho |
|---|---|---|
| Conversas com IA e pessoa lado a lado | Agenda (trocar os tipos para aula experimental, avaliação, consulta, retorno) | Funil "Pedidos" com etapas de loja |
| Funis em quadro, com vocabulário configurável | Produtos (apresentar como "Planos e preços") | Prospecção de empresas |
| Contatos, tags e campos personalizados | Follow-ups (faltam modelos do nicho) | Empresas, Pessoas, Importações (venda para empresas) |
| Tarefas | Radar (trocar o nome: é a lista de quem está esfriando) | Comandas, Honorários |
| Respostas rápidas | Fluxos de atendimento (é a anamnese conduzida pela IA) | Chamadas e Trunk SIP |
| Agente de IA com base de conhecimento | Campanhas (reativação de ex-aluno, com cuidado de bloqueio) | Nuvemshop |
| Meta Ads e Conversões (o programa Ignite Ads vive disso) | Webhooks (porta de entrada do checkout) | Servidor MCP externo, Dados externos, API Tokens (para o dono; ficam para o técnico) |

## 4.8 As quatro lacunas: o motor existe, falta a receita pronta

Conferido no código (`lib/automation/`): as automações já têm gatilho por **data de um campo do negócio** (`lead.date_field_due`), por **dias sem mensagem** e por **dias na mesma etapa** (`gatilhos-de-tempo.ts`), e as ações enviar WhatsApp, enviar mensagem da IA, criar ou mover negócio, criar tarefa, pôr tag, trocar responsável, avisar a equipe, iniciar fluxo de mensagens e aplicar plano de tarefas (`lib/automation/actions/`). Ou seja, quase tudo que o nicho precisa já pode ser montado. O que falta é vir montado.

1. **Renovação por data.** O gatilho existe, mas só lê campo de data do **negócio**, não do contato (`campo-do-gatilho-de-data.ts`). Serve, desde que "Vencimento do plano" seja campo do negócio no funil de alunos. Falta a regra pronta "7 dias antes do vencimento".
2. **Entrada de checkout pronta.** Existe recebimento de dados por webhook, genérico (Webhooks › Receber dados). Falta a receita por plataforma (Eduzz, Hotmart, Kiwify) que leve cada evento para a etapa certa. Não testei até onde o recebimento atual lê o formato dessas plataformas.
3. **Dois funis ligados: vender e manter.** A ação "criar ou mover negócio" existe. Não testei na tela se ela move de um funil para outro quando o negócio é ganho.
4. **Números do nicho.** O Desempenho mede funil e atendente. Faltam conversão de aula experimental, renovações a vencer e taxa de renovação. Esta é a única lacuna que pede tela nova.

## 4.9 O que não abriu ou não foi verificado

- Não consegui abrir https://www.tecnofit.com.br/ (erro de conexão, duas tentativas).
- Não consegui abrir https://dietbox.me/pt-BR (veio só o título).
- WebDiet, Trainerize e Wellhub para parceiros não foram pesquisados.
- Funil completo de consultoria online: sem fonte.
- Faixas atribuídas à IHRSA e fórmula de inadimplência: não conferidas na fonte primária.
