# 6. Plano de implementação: Configurações, Agente de IA e Base de conhecimento

Data: 23/11/2026. Este plano responde ao pedido da dona: Configurações mais visuais e diretas, agente de IA completo e simples ao mesmo tempo, e RAG avançado com o Supabase, simples para um leigo. **Nenhum código foi alterado ainda.** O plano espera a aprovação dela.

Regras que valem para as três frentes: nada do que existe é removido, só muda de lugar; mudança de banco só por migration nova mais apêndice no `baseline.sql`, e só é aplicada no Supabase de teste depois do "sim" dela; instrução de agente que já existe não muda; nada de commit, push ou PR sem pedido.

## 6.1 O que o CRM já tem de RAG (levantado no código e na tela)

"RAG" é o assistente consultar o material do negócio antes de responder. O CRM já faz isso, e bem construído:

| Peça | Como está hoje | Onde |
|---|---|---|
| Tela | "O que o agente sabe", com botão "Adicionar material" | `/app/ai/knowledge/sources` |
| Tipos de material | 4: Perguntas e respostas (coladas), Documento (PDF, Markdown, CSV, texto ou colado), Conversas anteriores (automático), Catálogo de produtos (automático) | `lib/ai/rag/tipos-de-fonte.ts` |
| Leitura de arquivo | PDF, Markdown e CSV | `lib/ai/rag/extractors/` |
| Fatiamento | Por parágrafo, até 1.500 caracteres, com 200 de sobreposição | `lib/ai/rag/chunker.ts` |
| Vetores | pgvector, 1.536 dimensões, por organização; OpenAI ou Google, com a chave da própria empresa | `lib/ai/embed.ts`, `lib/ai/embeddings/chave.ts` |
| Versões | Cada material tem versão ativa; dá para repreparar um ou todos | `lib/ai/rag/version.ts`, rotas `reindex` |
| Busca | Só por semelhança de vetor, os 5 trechos mais parecidos, corte em 0,40 | função `fn_buscar_trechos_das_fontes`, `lib/ai/knowledge/busca.ts` |
| Por assistente | Cada assistente escolhe quais materiais pode ler | bloco "O que ele consulta antes de responder" do agente |
| Teste | Existe rota que busca e devolve o melhor trecho, mesmo reprovado | `/api/v1/ai/knowledge/busca` |
| Segurança | Isolamento por organização; escrita só para gestor | `baseline.sql` |

Um detalhe que economiza trabalho: o banco **já tem** um índice de busca por palavra em português nos trechos (`ai_chunks`, índice GIN com `to_tsvector('portuguese')`), mas a função de busca não o usa.

### O que falta para ser simples

1. **Perguntas e respostas pedem formato de programador.** A pessoa precisa escrever `## Pergunta:` e `## Resposta:` à mão.
2. **Não dá para salvar um link.** Não há leitura de site nem de página.
3. **Os exemplos são de loja** ("Qual o prazo de entrega?", "política de troca").
4. **O aviso da chave fala em "embedding"** e cita nomes de modelo. O leigo trava ali.
5. **Não há um começo guiado.** Falta um "Sobre o meu negócio" com perguntas prontas (o que vende, preços, horários, como funciona).
6. **Testar o que o assistente acharia** não está à mão na tela do material. **A conferir** se a tela de detalhe do material já oferece.
7. **Material novo depende de alguém lembrar de marcá-lo em cada assistente.** **A conferir** o comportamento atual.

### O que falta para ser avançado

1. **Busca híbrida.** Hoje só o vetor decide. Nome de plano, sigla, preço e termo exato ("Plano Trimestral", "R$ 297") se acham melhor por palavra. Juntar as duas buscas é a melhoria de qualidade mais conhecida, e o índice por palavra já existe.
2. **Trecho com contexto.** O trecho é guardado sem dizer de qual material e seção veio. Colocar o nome do material e o título da seção no começo do trecho melhora o acerto.
3. **Aprender com o que faltou.** A busca já sabe quando "não achou nada bom" (guarda a melhor semelhança). Falta mostrar isso ao dono como lista: "perguntas que o assistente não soube", com botão "Ensinar a resposta". **A conferir** o que a tela Evolução da IA já mostra.

## 6.2 Frente A — Configurações mais visuais e diretas

| Fatia | Tela | O que muda | Banco |
|---|---|---|---|
| A1 | Configurações (`/app/settings`) | Seis cartões grandes no topo, cada um com ícone, uma frase e o estado atual: **Meu negócio**, **WhatsApp** ("conectado" ou "falta conectar"), **Equipe** (quantas pessoas), **Agenda**, **Funil e campos**, **Minha conta**. Abaixo, um bloco recolhido **Avançado**, com subtítulos (Anúncios, Integrações, IA, Dados, Recursos opcionais, Plano). Os 24 destinos continuam existindo e na busca | não |
| A2 | Organização (`/app/settings/tenant`) | No topo ficam nome, fuso, idioma e moeda. Razão social, CNPJ, e-mail do encarregado, retenção de mídia e endereço da política descem para um bloco recolhido "Dados legais". "Zona de perigo" vai para o fim, recolhida | não |
| A3 | Etapas do funil | Cada etapa mostra só nome, ordem e papel (fecha ou perde). "Chance de fechamento", "Janela de esfriando" e "Avisar a equipe" ficam atrás de "Mais opções" da etapa | não |
| A4 | Conexões | Primeira tela com um botão principal "Conectar WhatsApp por QR (recomendado)". As outras cinco abas ficam em "Outros canais" | não |

Arquivos principais: `app/app/settings/page.tsx`, `lib/navigation/catalogo.ts` (seção de cada destino), a tela de cada item. Testes que vigiam: `tests/unit/nav-hub*`, `tests/unit/navegacao-completude.test.ts`, `tests/e2e/navegacao.spec.ts`. Rótulo novo precisa das três línguas.

## 6.3 Frente B — Agente de IA completo e simples

| Fatia | Tela | O que muda | Banco |
|---|---|---|---|
| B1 | Editar agente (`AgentForm.tsx`, 1.474 linhas, 13 blocos) | Ficam abertos os blocos que o dono decide: **Quem é**, **As instruções dele**, **O que ele sabe**, **Quando chamar uma pessoa**, **Por qual WhatsApp atende**. Os demais (inteligência e chave, freios de segurança, ordem de preferência, histórico lido, espera, horários, propostas, follow-up, comandos pelo celular) vão para um bloco recolhido **Ajustes avançados**, com os mesmos campos e os mesmos valores | não |
| B2 | Novo agente (`/app/ai/agents/new`) | Criação em cinco passos, uma pergunta por tela: nome · o que ele faz (atender, qualificar e agendar, vender) · sobre o seu negócio · quando chamar uma pessoa · por qual WhatsApp. Termina em "Testar agora". Grava exatamente o que o formulário atual grava. Um link "Prefiro o formulário completo" continua disponível | não |
| B3 | Hub de IA (`/app/ai`) | Três cartões grandes: **Assistente**, **O que ele sabe**, **Retomadas**. O resto num bloco recolhido "Avançado" | não |

Dois cuidados:

- **Instrução de agente não muda sem avaliação.** O passo "sobre o seu negócio" **não** reescreve a instrução: o texto vira um material na base de conhecimento ("Sobre o negócio"), já marcado para o assistente novo. Assim as frentes B e C se ligam, e a regra do repositório é respeitada.
- **Modelos de instrução por nicho** (personal, nutricionista, academia) ficam para depois, porque pedem cerca de 20 casos de avaliação antes de virar padrão.

## 6.4 Frente C — Base de conhecimento (RAG) avançada e simples

| Fatia | O que muda | Banco |
|---|---|---|
| C1 | **Adicionar material em quatro botões:** Escrever (texto livre) · Perguntas e respostas (dois campos por item, com "adicionar outra"; o sistema monta o formato atual por baixo) · Arquivo · Link. Exemplos trocados para o nicho. Aviso da chave em linguagem simples ("falta ligar a leitura de materiais"), com um botão | não |
| C2 | **"Sobre o meu negócio":** formulário guiado de seis perguntas (o que você oferece, planos e preços, horários e local, como funciona, formas de pagamento, dúvidas mais comuns). Salva como material do tipo Documento | não |
| C3 | **Salvar por link:** o servidor baixa a página, tira o texto e guarda como Documento, pelo mesmo caminho de arquivo. Usa a guarda de endereço que já existe para chamadas externas (`lib/automation/outbound-url.ts`). Só páginas simples; site que exige login ou monta o texto no navegador fica de fora, com aviso | não |
| C4 | **"Perguntar como o assistente":** caixa de teste na tela, usando a rota de busca que já existe. Mostra o trecho achado e de qual material veio, ou "não achei nada sobre isso" com botão "Ensinar agora" | não |
| C5 | **Busca híbrida:** nova função no banco que soma a busca por vetor com a busca por palavra (índice que já existe) e ordena pela posição nas duas listas. A função atual fica; a nova entra ao lado e passa a ser a usada | **sim**: migration nova + apêndice no baseline |
| C6 | **Trecho com contexto:** o nome do material e o título da seção entram no começo do trecho antes de virar vetor. Vale para material novo; o antigo melhora ao ser repreparado | não (mas repreparar gasta crédito da chave) |
| C7 | **"O que ele não soube":** lista das perguntas em que a busca não achou resposta boa, com "Ensinar a resposta" | **a conferir**: depende do que já é gravado |

Como provar que C5 e C6 melhoram: antes de mexer, montar umas 20 perguntas reais do nicho com a resposta esperada, medir quantas a busca atual acerta, e medir de novo depois. Sem melhora medida, não entra.

## 6.5 Ordem proposta

| Passo | Fatias | Por quê |
|---|---|---|
| 1 | A1, B3 | Rápidas, visíveis, sem risco; os dois hubs ficam "visuais e diretos" de imediato |
| 2 | B1 | Tira o peso da tela mais difícil sem criar nada novo |
| 3 | C1, C2, C4 | A base de conhecimento passa a ser usável por um leigo |
| 4 | B2 | A criação guiada usa o que o passo 3 construiu |
| 5 | A2, A3, A4 | Acabamento das telas de configuração |
| 6 | C3 | Link |
| 7 | C5, C6 | Qualidade da busca; única parte com mudança de banco |
| 8 | C7 | Fecha o ciclo de aprender |

Cada passo termina com o app funcionando e pode parar ali.

## 6.6 Como cada passo é conferido

- `pnpm lint` nos arquivos mexidos e os testes focados de cada área (`pnpm vitest run <arquivo>`).
- A tela rodando em `http://localhost:3000`, com capturas de antes e depois em `evidence/`.
- **Limite do Mac:** a checagem completa de tipos e o build não rodam nesta máquina. Fica dito em cada entrega; a checagem completa acontece no CI quando houver PR.
- Revisão final por um agente sem o histórico de quem implementou, como a regra do repositório pede.

## 6.7 O que preciso de você

1. **Aprovar o plano** (ou dizer o que trocar de ordem).
2. **Uma chave de leitura de materiais.** O banco de teste não tem chave de embedding cadastrada, então hoje nenhum material é preparado e o RAG não pode ser provado de ponta a ponta. Serve a chave do Google (Gemini) ou da OpenAI. Quem cola a chave na tela é você; eu não digito chave real.
3. **Confirmação antes do passo 7**, que cria uma função nova no Supabase de teste.

## 6.8 O que este plano não cobre e o que não foi conferido

- Menu lateral enxuto, glossário, pacotes de funil fitness, tela Início e checkout continuam na proposta geral ([05-proposta.md](05-proposta.md)); não fazem parte destas três frentes.
- Não conferi: a tela de detalhe de um material; se material novo já entra marcado nos assistentes; o que a tela Evolução da IA mostra sobre perguntas sem resposta; se o indexador roda no ambiente local (`pnpm worker`).
- O formulário do agente não foi lido linha a linha; a divisão entre blocos abertos e avançados pode pedir ajuste quando eu abrir o código.
- Leitura de Word (`.docx`) não existe hoje e não está no plano; entra se você pedir.
