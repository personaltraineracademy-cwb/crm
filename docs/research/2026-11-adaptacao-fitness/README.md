# Adaptação do CRM ao nicho fitness — pesquisa e proposta

Data: 23/11/2026. Fase 1: só pesquisa, diagnóstico e proposta. Nenhum código do CRM foi alterado, nada foi commitado.

Para quem: infoprodutores, personal trainers e nutricionistas em consultoria, academias e estúdios (Programa Ignite Ads; primeiro cliente, Personal Berk).

## O que tem nesta pasta

| Arquivo | Conteúdo |
|---|---|
| [01-diagnostico.md](01-diagnostico.md) | Mapa das 75 telas, para quem serve cada uma e onde o leigo se perde, medido no produto rodando |
| [02-referencias.md](02-referencias.md) | Como a Clint e o GPT Maker organizam funil, conversas, agentes e primeira configuração |
| [03-ux.md](03-ux.md) | Princípios de usabilidade (Nielsen Norman Group e outros) e as oito regras de projeto |
| [04-nicho-fitness.md](04-nicho-fitness.md) | O que cada perfil do nicho precisa: funis, campos, automações, métricas |
| [05-proposta.md](05-proposta.md) | Menu novo, pacotes por tipo de negócio, configurações, tela a tela, ondas e decisões |
| [06-plano-tres-frentes.md](06-plano-tres-frentes.md) | Plano de implementação pedido depois: Configurações, Agente de IA e Base de conhecimento (RAG), com o que o CRM já tem e o que muda em cada tela |

## Resumo em seis frases

1. O CRM não é confuso por defeito; ele é grande (75 telas, 24 cartões de configuração, 45 campos para criar um agente) e mostra tudo de uma vez.
2. O ponto de partida é de loja: o funil que vem pronto chama-se "Pedidos", com etapas de carrinho e entrega.
3. As duas referências têm o mesmo motor complexo e o escondem atrás de modelos prontos e de poucas perguntas.
4. O nosso produto **já tem** o mecanismo de simplificar: menu por empresa e por pessoa, módulos desligados, pacotes de funil, modelos de follow-up, e automações com gatilho por data, silêncio e etapa parada.
5. Portanto a recomendação é **não remover nada e trocar o padrão**: nasce enxuto e de fitness; o resto fica a um clique, em "Avançado".
6. A primeira etapa não custa código: configurar o Personal Berk à mão e aprender com uma semana de uso real.

## As dez recomendações

1. **Menu principal curto**: Início, Conversas, Funil, Contatos, Agenda e Tarefas para o vendedor (seis itens); o dono vê também Assistente de IA e Resultados (oito). Hoje são 18.
2. **Uma área "Avançado"** para tudo o que é raro ou técnico. Nada é apagado.
3. **Quatro pacotes prontos** no onboarding: personal, nutricionista, academia ou estúdio, infoprodutor. Cada um traz dois funis (vender e manter), campos, tipos de agenda, respostas rápidas, retomadas e automações.
4. **Criar o assistente de IA em cinco perguntas**, com o restante em "Ajustes avançados".
5. **Configurações em dois níveis**: seis cartões essenciais; o resto atrás de um botão.
6. **Um glossário único em português**: Conversas, Funil, Interessado, Aluno, Assistente, Automações. Fim de Inbox, Webhooks, Audit Log, Lead e card na frente do usuário.
7. **Toda tela vazia ensina** o que é, por que está vazia e oferece um botão.
8. **Uma tela Início** que responde "o que eu faço agora?" e traz os primeiros passos da conta nova.
9. **Conectar checkout** (Eduzz primeiro) criando sozinho o funil de recuperação de pagamento.
10. **Renovação como cidadã de primeira classe**: campo de vencimento, aviso automático e números de renovação em Resultados.

## Ordem de execução

| Onda | O quê | Código? | Resultado esperado |
|---|---|---|---|
| **0** | Configurar o Personal Berk à mão: menu enxuto, funis de personal, agenda, assistente, três automações | não | Uma semana de uso real e uma lista do que ele não entendeu |
| **1** | Pacotes fitness no onboarding, menu enxuto como padrão, glossário, Configurações em dois níveis, telas vazias | pouco, quase só dados e rótulos | Conta nova chega ao primeiro atendimento sem abrir Avançado |
| **2** | Assistente em cinco perguntas, modelos do nicho, tela Início, "Aguardando você", Automações com porta própria | médio | Leigo cria e testa um assistente em menos de dez minutos |
| **3** | Checkout, passagem automática para o funil de alunos, resultados do nicho, revisão em celular | médio a alto | O CRM cobre venda e renovação, não só a venda |

A lista item a item, com impacto, esforço e o que é núcleo, configuração ou extensão, está em [05-proposta.md](05-proposta.md), seções 5.9 e 5.10.

## Decisões que esperam por você

1. Aprovar a Onda 0 no Personal Berk.
2. Aprovar os nomes "Avançado" e "Assistente de IA".
3. Confirmar a Eduzz como primeiro checkout.
4. Menu enxuto para toda organização nova da instalação (recomendado) ou só para as do nicho.
5. Indicar quem valida os funis de nutricionista e de academia.

## O que não foi verificado

**No produto**

- As telas foram vistas com o banco de teste vazio. Conversas e o quadro do funil não foram vistos com dados reais.
- A visita foi só como administrador. A visão do vendedor não foi conferida na tela.
- Nada foi medido em celular.
- O onboarding foi lido no código, não percorrido.
- `docs/testing/user-journey-map.md` e `docs/index.md` não foram lidos por inteiro.
- Não foi testado: se um pacote de funil cria dois funis de uma vez; se a ação "criar ou mover negócio" atravessa funis; quanto o recebimento de webhooks entende do formato de Eduzz, Hotmart e Kiwify; se as três automações da Onda 0 se montam pela tela como descrito.
- Os esforços das ondas são estimativas.

**Nas referências**

- O menu de dentro da Clint e do GPT Maker exige login e não foi visto; a estrutura vem do site e da ajuda.
- A ferramenta de leitura entrega resumo das páginas; rótulos e números devem ser reconferidos antes de uso público.
- Não abriram: página de planos da Clint, Tecnofit, Dietbox, diretrizes da Apple sobre onboarding e a página de estado vazio do Shopify Polaris.
- Preço da Clint vem do blog da própria empresa.
- Os funis de personal e de nutricionista não têm fonte de mercado: são hipótese a validar com o Personal Berk.
- Números de conversão e de cancelamento do nicho são alegações de fornecedores.

## Fontes

Cada arquivo traz, ao lado de cada fato, o endereço da página lida. A pesquisa bruta completa ficou na nota compartilhada das sessões, fora do repositório.
