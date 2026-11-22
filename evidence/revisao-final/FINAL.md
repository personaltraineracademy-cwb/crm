# Revisão final, rodada 2 (21/11/2026)

Revisor (sonnet). Só li e medi; nenhum arquivo de código foi editado. Servidor `pnpm dev` local, um portal (1440×900 e 390×844, escuro e claro). Capturas `r2-*` nesta pasta.

**Limite do método (importante):** o webview do portal fica oculto (`document.hidden = true`), então animações e transições CSS ficam congeladas. Usei `document.getAnimations().forEach(a => a.finish())` para ver o estado final. Por isso **não vi nenhum movimento rodando**. Isso também explica a "troca de tema que deixa campos com a cor errada" que apareceu no PARCIAL (defeito 7): foi artefato. Com a página recarregada, o claro está correto (campo `rgb(255,255,255)`, texto `rgb(16,32,31)`; aba ativa `rgb(16,32,31)`).

## Veredito por pedido da dona

| # | Pedido | Veredito | Prova |
|---|---|---|---|
| 1 | Fluido, animação suave (kanban e workflows) | **PARCIAL** | Os testes de movimento passam e o código existe (`movimento.css`, `fluxo.css`, `movimento-da-lista.ts`). Não vi arrasto de card nem de fluxo, e o webview oculto impede ver animação. Não confirmo o "fluido". |
| 2 | Linhas retas / aparência amadora (Inbox) | **ATENDIDO** | Sonda de borda vertical ≥1 px com altura >250 em `main`: vazia. Três superfícies `--card`, raio 12, vão 8 (painéis em x=280, 560; 272 e 856 de largura). Abas numa linha: Automático, Fila, Minhas, Todas e "Mais" (Fechadas e Arquivadas dentro) todas em y=244. Barra lateral com `mask-image` de 24 px (nav 1046/718). O "Canais" cortado do PARCIAL ficou esmaecido. |
| 3 | Pop-ups profissionais | **ATENDIDO (com ressalvas)** | Novo contato: 560×642, seções, rodapé fixo, `Cancelar` outline, sem rolagem. Novo Lead: 560×869, seções Cliente/Negócio/Mais dados, combobox de contato, obrigatório marcado, **0 sobreposições** entre os campos, rótulos e botões do diálogo, só o corpo rola (730/705), rodapé em y=884 (<893). Detalhe do lead: 640×885 flutuante (x=816→1456 com a animação pendente; raio 16), cabeçalho fixo, corpo rolável (862/714), rodapé fixo com Salvar. A 390: Novo Lead vira folha de baixo (x=0, w=390, raio `16 16 0 0`), corpo rola, botões no rodapé. Esc fecha e o foco fica preso (30 Tabs, sempre dentro). Ressalvas nos defeitos 3, 7, 8. |
| 4 | Espaçamento errado e cards feios (Follow-ups, cartão do lead) | **ATENDIDO (com ressalvas)** | Cartão de Follow-ups agora: título, selo "Rascunho", metadados e um menu "…"; não há mais 4 botões em 2 linhas. Cartão do kanban: título e valor no mesmo x (630 e 630), 270×118. Cartões de Agentes, Automações e Fontes no mesmo padrão. Ressalvas: defeitos 4, 5 e 9. |
| 5 | Construtor de workflow profissional e fluido | **ATENDIDO a 1440; PARCIAL a 390** | 1440: 12 nós de 253 px alinhados em x=584, 15 arestas ortogonais com rótulos, paleta com ícones por família, minimapa em retrato (1269,689 132×176), altura fixa (`.fluxo-construtor`, bottom 893). 390: o minimapa some (corrigido), mas **Salvar e Publicar ficam em x=918**, fora da tela, numa barra com rolagem horizontal (defeito 1). Código de salvar/publicar/rollback conferido no diff (ver abaixo). |
| 6 | Base do cartão do construtor desalinhada da barra lateral | **ATENDIDO** | Barra lateral: top 8, bottom 893. Construtor (`.casca-ferramenta`): top 64, bottom 893. Mesma base. À esquerda começa em x=280, igual a Inbox e quadro. |

## Reconferência dos defeitos do PARCIAL

1. Abas do Inbox cortadas: **corrigido** (uma linha + "Mais", sem corte; a 390 as quatro primeiras cabem em y=284, 28→251).
2. Novo Lead com sobreposição: **corrigido** (0 sobreposições, rodapé fixo, só o corpo rola; combobox no lugar da lista embutida; Tags já é seletor de etiquetas).
3. Detalhe do lead: **parcial.** Largura 640, cabeçalho e rodapé fixos, "Editar campos" virou ícone de lápis, "Salvar" saiu do meio. Falta o item M3 "resumo como lista de propriedades com edição no clique": "Dados do negócio" segue como formulário aberto (Título, Descrição, Valor, Fechamento, Tags).
4. Cartão do kanban: **corrigido em x** (630/630) e o rodapé não se sobrepõe. **Altura 118 px** contra o alvo ≤112 (M5): 6 px a mais. Filtros soltos, sem caixa com borda. Colunas com esmaecimento na borda direita.
5. Construtor a 390: **minimapa corrigido; Salvar/Publicar escondidos (novo, ver defeito 1).**
6. "Canais" cortado: **corrigido** (esmaecimento de 24 px).
7. Tema claro ilegível: **não era defeito** (ver "Limite do método"). Claro conferido recarregado em Inbox, quadro e Configurações: legível.

## Defeitos que restam (gravidade, medida)

1. **MÉDIA** Construtor a 390: Salvar e Publicar em x=918 (viewport 390), dentro de um `div` com rolagem horizontal (`scrollWidth 966`, `clientWidth 326`). Quem edita no celular não encontra como salvar ou publicar. `r2-construtor-390-escuro.png`.
2. **MÉDIA** Webhooks a 390: as quatro abas quebram em duas linhas (Receber dados e Leads recebidos em y=222; Automações e Atividade em y=268). É o mesmo defeito que o guia corrigiu no Inbox (A2). `r2-webhooks-390-escuro.png`.
3. **BAIXA** Detalhe do lead: "Tarefas" mede 12 px e os rótulos dos campos 14 px (hierarquia invertida que o guia 4.4 proíbe); o controle de recolher seção é um "−" em vez de chevron.
4. **BAIXA** Texto técnico para leigo: cartões de Agentes mostram "Tipo: mcp_agent · Prioridade: 0" e "claude-sonnet-5"; Follow-ups mostra "Handoff: Pausar"; o construtor mostra "Pausar durante handoff", "Gatilho: Silêncio (1440 min)" e o botão "Rollback".
5. **BAIXA** Cabeçalhos: em Follow-ups, "Importar fluxo / Começar de um modelo / Novo fluxo" ficam numa linha própria abaixo das abas (guia 2.6); em Contatos há cinco ações na linha do título (o guia manda a 4ª em diante para o menu "…").
6. **BAIXA** A 390, "Criar novo" (Agentes) tem a largura do conteúdo e fica à esquerda, enquanto "Nova fonte" (Webhooks) ocupa a largura toda. Mesmo papel, dois tratamentos.
7. **BAIXA** Novo Lead: "Mais dados" (Descrição, Tags) abre expandido; o guia manda recolhido. Efeito: o corpo rola 25 px a 1440×901 só por causa das Tags.
8. **BAIXA** Foco: ao fechar o detalhe do lead com Esc, o foco vai para `BODY`, não volta ao cartão (o cartão é `div role=group tabindex=0`, não um gatilho do Radix). Acessibilidade para quem usa teclado.
9. **BAIXA** Novo contato mostra Nome, Email, Telefone, CPF e Tags sem nenhuma marca de "Opcional". A regra "um critério por formulário" foi cumprida ao tirar a marca, mas quem preenche não sabe o que é obrigatório; só a frase "preencha pelo menos um identificador" informa.
10. **BAIXA** "vazio" na coluna sem leads (texto solto de 12 px, sem o estado vazio com ícone do guia 2.8).

Sobreposições de selo "N" (Next) e da ilha (TanStack) com o rodapé e o botão Salvar nas capturas são de desenvolvimento (`app/providers.tsx`), não aparecem para o cliente.

## Regressões de comportamento

- **Salvar, publicar e rollback do fluxo:** não cliquei (mexeria em dados). Li o diff de `PublishBar.tsx` e `FlowCanvas.tsx`: `obterGrafo()` lê o grafo na hora do clique, `dirty` e `onSaved` seguem ligados (`FlowCanvas.tsx:772-780`), `disabled={!dirty || busy}`, `disabled={busy}` e `disabled={busy || !canRollback}` preservados, `data-testid` iguais, destrutivas só com ícone e com confirmação. Sem regressão no código. **Não provado na tela.**
- Ao abrir um fluxo com nós sobrepostos, o construtor reorganiza e atualiza o `savedGraph` (`FlowCanvas.tsx:660`): a reorganização inicial não suja o fluxo e só é gravada se a pessoa salvar. É intencional, mas quem abre e fecha sem salvar vê o fluxo antigo na próxima vez.
- Ordem do kanban salva: 100 casos de kanban passaram no PARCIAL; não arrastei card.
- Diálogos: Esc fecha (Novo contato `data-state=closed`; detalhe do lead desmontou) e o foco fica preso. Nada sobreposto nos 3 diálogos medidos. Nenhum diálogo sem rolagem com conteúdo maior que a tela.
- Rodada atual dos testes (comando: `pnpm vitest run` nos 6 arquivos): **5 arquivos passam, 1 falha; 66 casos passam, 1 falha**.

## Testes vermelhos do PARCIAL: situação agora

| Arquivo | Classe | Resultado e conferência do diff |
|---|---|---|
| `camadas-unnify.test.tsx` | (a) | Passa. O diff troca valores (`max-w-md`→`max-w-[var(--largura-dialogo-md)]`, `pr-10`→`pr-14`, `-mx-6`→`px-6 py-4`, `bg-muted/30`→`/40`, `gap-3`→`gap-2`, scale 0,985→0,98, gaveta 2,5→1,5 rem, `--duration-fast`→`--duracao-entrada`). Tirou `shadow-xl` das três listas, mas **acrescentou** duas asserções que provam `--sombra-camada` no CSS (`camada-dialogo` e `camada-gaveta`). Nenhuma proteção perdida; `animation: none` em movimento reduzido continua. |
| `inbox-abas-da-faixa-cabem.test.tsx` | (b) | **Passa sem edição** (arquivo fora do `git diff`). Consistente com a medida no portal. |
| `inbox-divisorias-arrastaveis.test.tsx` | (a) | Passa. O diff abre o layout com conversa (`initialSelectedId="conv-1"`) e troca `right` 296→300 (+4, meio do vão de 8). Mesmo número de asserções. |
| `deep-link-nao-espera-a-lista.test.tsx` | (a) | Passa. Só a última asserção mudou ("sem-conversa" → painel ausente); os casos que protegem o #34226618108 ficaram iguais. |
| `telas-falam-a-moeda-e-o-pais-da-organizacao.test.tsx` | (a) | Passa. Só o texto do rótulo ("Bilhete"/"CPF" sem "(opcional)"); documento e exemplos do país continuam testados. Ver defeito 9. |
| `dialog-base-roda-e-tem-teto.test.ts` ("overrides vivos") | ambiental | **Segue falhando; não é da mudança.** O teste roda `grep -rlE ... ${componentes}` sem aspas (linha 108) e o caminho `Mobile Documents` tem espaço, então o `grep` não acha nada. `git grep -lE "max-h-\[" HEAD -- components` acha vários arquivos (ex.: `EditTenantDialog.tsx`, `PainelDeMarcacao.tsx`, `EditarFaqDialog.tsx`), ou seja, o fato que o teste quer existe desde antes. Passa em caminho sem espaço (CI). |

Nenhum caso caiu em (c).

## Dados de teste no banco local (só registrei)

30 "Lead teste" (e os contatos "Lead teste NN"), follow-up "Consulta · retomar quem sumiu na marcação" (rascunho), agentes "Teste cards 01 a 03", fontes e automações "Teste cards". Nada alterado ou apagado.

## Não conferi

Animação rodando (webview oculto) e arrasto de card e de nó; clicar em Salvar, Publicar e Rollback; claro a 390; Novo contato e detalhe do lead a 390 e no claro; Esc no Novo Lead nesta rodada (no Novo contato sim); retorno do foco ao botão que abriu o diálogo; Inbox com conversa aberta (não há conversa no banco local); Configurações a 390 e no escuro. Troquei o tema do portal para claro durante a revisão; o portal foi fechado no fim.
