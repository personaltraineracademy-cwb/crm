Guia- acabamento profissional do CRM

Diretor de design: Designer (claude opus). Data: 21/11/2026. Executa: Layout (claude sonnet/high). Aprova: Designer, por captura e medida contra os critérios de pronto.
Pedido da dona: tirar as linhas retas e tudo o que pareça amador; profissional, fluido e rápido; todo pop-up e formulário com padrão profissional.
Capturas: evidence/acabamento/ (telas), evidence/acabamento/popups-antes/ (pop-ups), evidence/acabamento/referencias/ (páginas lidas).
Territórios: components/kanban e app/app/ai/followups/[id]/_components são do Movimento (seção 8). tokens.css e paleta.css são do Executor: token novo vai como proposta (seção 3).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PESQUISA: O PRINCÍPIO DE CADA REFERÊNCIA (lida no portal)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Modelar o princípio, nunca copiar marca, texto ou desenho.

R1. Linear — "How we redesigned the Linear UI (part II)" — https://linear.app/now/how-we-redesigned-the-linear-ui
Barra lateral, abas, cabeçalhos e painéis foram refeitos para "reduzir ruído visual, manter alinhamento e aumentar a hierarquia". Rótulos, ícones e botões alinhados na vertical e na horizontal: "não é algo que se vê de cara, é algo que se sente depois de alguns minutos". Aparência neutra, com pouca cor de marca no cromo. Superfícies, textos e ícones saem de 3 variáveis (base, destaque, contraste).
→ Princípio: menos fios e caixas; alinhamento rigoroso; marca só no que importa.

R2. Material 3 — Elevação — https://m3.material.io/styles/elevation/applying-elevation
Elevação se mostra por diferença de tom entre superfícies, por sombra ou por cortina, com poucos níveis. Uma superfície precisa mostrar borda que contrasta com o entorno, sobreposição e distância.
→ Princípio: painéis se separam por passo de tom (e espaço), não por fio de 1 px.

R3. Material 3 — Side sheets — https://m3.material.io/components/side-sheets/guidelines
O painel lateral padrão convive com o conteúdo no desktop; o modal é preferido no celular. Largura fixa, altura da tela inteira.
→ Princípio: detalhe de registro em painel lateral de largura fixa; no celular, tela cheia.

R4. Material 3 — Dialogs — https://m3.material.io/components/dialogs/guidelines
Diálogo é para decisão crítica e deve ser usado com moderação. Anatomia: título, texto de apoio, divisor opcional, botões, cortina. No celular existe a variante de tela cheia.
→ Princípio: diálogo curto e focado; formulário grande não cabe em diálogo.

R5. Material 3 — Movimento — https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
Curtas de 50 a 200 ms para transições pequenas (controles: 200 ms, curva padrão); médias de 250 a 400 ms para o que atravessa área da tela. Entrada: emphasized decelerate cubic-bezier(0.05, 0.7, 0.1, 1). Saída: emphasized accelerate cubic-bezier(0.3, 0, 0.8, 0.15). Padrão: cubic-bezier(0.2, 0, 0, 1).
→ Princípio: entrar desacelerando, sair mais rápido acelerando.

R6. Apple HIG — Sheets — https://developer.apple.com/design/human-interface-guidelines/sheets
A sheet serve a uma tarefa delimitada, ligada ao contexto atual, que a pessoa conclui e volta à tela de origem.
→ Princípio: o pop-up mostra de onde veio (título + contexto) e devolve a pessoa ao mesmo lugar.

R7. HubSpot — Panel — https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/panel
Painel à direita; o corpo (PanelBody) rola; o rodapé (PanelFooter) é fixo. Diretriz: usar o painel "quando é preciso preencher formulário longo ou de várias etapas".
HubSpot — Modal — https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/modal
Modal "para mensagens curtas e confirmações"; variante de perigo para excluir; larguras por tamanho.
→ Princípio: curto = modal; longo = painel lateral; rodapé sempre fixo.

R8. Atlassian — Modal dialog — https://atlassian.design/components/modal-dialog/usage
Cabeçalho com título (obrigatório) e botão de fechar; corpo; rodapé com a ação principal e cancelar. Fecha pelo X, por Esc, clicando fora e por Cancelar.
→ Princípio: anatomia única e previsível em todo pop-up.

R9. Attio — Create and view records — https://attio.com/help/reference/managing-your-data/records/create-and-view-records
Cria registro de qualquer lugar pelo cmd+K, sem navegar. Pede só o identificador (e-mail na pessoa, domínio na empresa) para evitar duplicata. Os detalhes ficam num painel redimensionável, com "ver todos os valores" sob demanda.
→ Princípio: criar pede o mínimo; o resto aparece depois, por revelação progressiva.

R10. Pipedrive — Deal detail view — https://support.pipedrive.com/en/article/deal-detail-view
A lateral do negócio começa por um Resumo fixo no topo (valor, etiqueta, probabilidade, fechamento previsto, contato, organização). As seções recolhem e reordenam, e há busca de campo.
→ Princípio: no detalhe, o resumo vem primeiro; seções recolhíveis; nada de "formulário com Salvar" no meio.

R11. Intercom — Customize the Inbox — https://www.intercom.com/help/en/articles/7911926-customize-the-inbox-to-suit-you-and-how-you-work-best
Caixas e visões ficam fixadas na barra lateral esquerda; a lateral direita é uma pilha de seções que a pessoa ordena.
→ Princípio: muitas visões não viram uma fileira de abas que quebra; viram lista ou menu.

Não aproveitado: Front (https://front.com/email-management) só tinha página de marketing, sem regra de layout. A página de produto do Pipedrive "add a deal" deu 404.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. REGRAS DE SISTEMA (valem para toda tela)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2.1 Superfícies e separação (R1, R2)
- Três níveis, um passo de tom cada: N0 fundo = --background; N1 painel de trabalho = --card; N2 camada (diálogo, painel lateral, menu) = --popover. Escuro hoje: #0e1213 → #1a1e1f → #202526.
- Painéis lado a lado se separam por SUPERFÍCIE + ESPAÇO: cada painel é N1, raio 12 (--radius-xl), com 8 px de vão entre eles sobre o N0. É a mesma linguagem da barra lateral, que já flutua com raio 16.
- Fio só dentro de uma mesma superfície e só quando indispensável (cabeçalho × corpo, linhas de tabela densa). Sempre de ponta a ponta da superfície, encostando nas duas bordas, com --border-subtle. Fio que começa ou termina solto é proibido.
- Nunca "caixa dentro de caixa": borda + fundo + borda de novo. Filtros e barras de ferramentas ficam soltos sobre a superfície, sem moldura própria.

2.2 Espaçamento: escala de 4 (4, 8, 12, 16, 24, 32, 48). Nada fora dela.
- Página: 24 de margem no desktop, 16 no celular. Vão entre painéis: 8. Entre seções: 24. Entre campos: 16. Rótulo → campo: 6. Campo → ajuda ou erro: 6. Itens relacionados (chips, botões lado a lado): 8.

2.3 Raios (já em app/unnify/raios.css, sem mudança): chip e etiqueta 6 (md) · controle 8 (lg) · cartão e painel 12 (xl) · camada (diálogo, painel lateral, barra lateral) 16 (2xl).

2.4 Alturas de controle: campo, botão e seleção 36 (h-9; 44 no celular e em ponteiro grosso, já existe). Controle de barra de ferramentas e filtro 32 (h-8). Aba 36. Cabeçalho do app 56. Linha de lista: 56 a 64 (conversa), 44 (tabela).

2.5 Abas
- Uma linha só, sempre. Se não couber: rolagem horizontal com esmaecimento de 24 px na borda, ou as últimas abas num menu "Mais". Nunca quebrar em duas linhas e nunca espalhar com justify-between.
- Um só indicador da aba ativa: sublinhado de 2 px na cor de destaque, largura do rótulo, texto em --foreground. Sem bloco de fundo junto.
- Contagem como número discreto (text-xs, --muted-foreground) ao lado do rótulo.

2.6 Cabeçalho de página
- Título e subtítulo à esquerda; ações à direita NA MESMA LINHA, centralizadas no bloco do título. Uma ação principal só; as secundárias em outline; da 4ª em diante, menu "⋯".
- No celular, as ações descem para baixo do título, alinhadas à esquerda.

2.7 Listas
- Hover muda só o fundo (--surface-hover), na linha inteira, 120 ms. Seleção: fundo --interactive + texto --foreground. Divisor entre linhas é opcional e, se houver, vai de ponta a ponta.
- Texto que não cabe corta com reticências; texto nunca sobrepõe texto.

2.8 Estados vazios
- Um por vista. Painel secundário sem nada selecionado não mostra mensagem: fica recolhido.
- Anatomia: ícone 20 dentro de círculo de 40 com fundo --muted; título 16/600; texto 14 em --muted-foreground, até 40 caracteres por linha; uma ação, se existir. Centro óptico a 40% da altura, não a 50%.

2.9 Foco e hover: anel de foco 2 px --ring com recuo de 2 (já existe). Hover nunca move layout nem muda tamanho.

2.10 Movimento (R5): 150 a 250 ms; só opacity e transform (translate, scale). Entrada desacelera; saída é mais curta e acelera. Com prefers-reduced-motion: só opacidade.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. TOKENS: O QUE JÁ SERVE E O QUE FALTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Servem: --background/--card/--popover (níveis), --border-subtle, --surface-hover, --interactive, --radius-*, --shadow-xl (claro), --duration-fast 120 (globals), --duration-base 180 e --duration-slow 220 (tokens.css).

Atenção: --ease-out tem dois valores. globals.css diz cubic-bezier(0.2, 0, 0, 1) e tokens.css o sobrescreve com cubic-bezier(0.2, 0.8, 0.2, 1). Não mexer nele; usar os novos abaixo.

Propostas (nome e valor; tokens.css é do Executor, quem decide é o orquestrador):
- --ease-entrada: cubic-bezier(0.05, 0.7, 0.1, 1)
- --ease-saida: cubic-bezier(0.3, 0, 0.8, 0.15)
- --duracao-entrada: 200ms · --duracao-saida: 150ms
- --vao-painel: 8px
- --largura-dialogo-sm: 400px · -md: 560px · -lg: 720px · -xl: 960px
- --largura-painel-md: 480px · -lg: 640px
- --sombra-camada (só escuro): 0 0 0 1px rgb(255 255 255 / 0.07), 0 24px 64px rgb(0 0 0 / 0.6). Hoje a sombra do diálogo no escuro mede rgba(0,0,0,0): a camada só se separa pelo tom.
- --color-overlay claro: rgba(9, 13, 14, 0.40) no lugar de rgba(0, 25, 25, 0.48). O tom esverdeado deixa a tela de trás "suja" (ver popups-antes/nova-tarefa-claro.png). O escuro (rgba(0,0,0,0.68)) fica.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. POP-UPS, PAINÉIS E FORMULÁRIOS (prioridade alta da dona)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4.1 O que a auditoria mediu (capturas em popups-antes/)
- Rodapé some: o DialogContent inteiro rola (overflow-y-auto no próprio conteúdo, components/ui/dialog.tsx). No "Novo Lead": altura de rolagem 1041 contra 867 visíveis; rodapé em y=973 numa tela de 901. O botão "Criar lead" fica fora da tela (criar-lead-claro-rodape-fora.png). O detalhe do lead também rola inteiro (1007 contra 901).
- No "Novo Lead", a busca de contato abre a lista DENTRO do formulário, empurra tudo para baixo e tem fio entre cada item.
- 9 larguras diferentes em uso (sm, md, lg, xl, 2xl, 3xl, 4xl, 85vw, 280px), sem regra por tipo. Exemplos: Novo contato 448, Nova conversa 512.
- Não há primitivo de campo (components/ui não tem form nem field). Cada formulário monta rótulo, ajuda e erro à mão: "(opcional)" vai no rótulo em um, a ajuda fica entre rótulo e campo em outro ("Tags" do Novo contato), e nenhum marca o obrigatório.
- Botão Cancelar muda de estilo: ghost no Novo contato e no Novo Lead, outline na Nova conversa.
- Nenhum formulário agrupa campos em seções. O Novo Lead tem 8 blocos no mesmo peso visual.
- Detalhe do lead (painel de 448): o título de seção ("Dados do negócio", 13 px) é menor que o rótulo do campo ("Título", 16 px): hierarquia invertida. "Editar campos" fica solto numa linha. O "Salvar" aparece no meio do painel.
- Confirmação inconsistente: AlertDialog na maioria, mas em linha nos Funis ("Arquivar «Pedidos»?"), com "Excluir de vez" em texto simples ao lado do botão principal: ação destrutiva sem cor de perigo.
- Atalho Cmd/Ctrl+Enter: só 2 dos 121 arquivos. O foco no primeiro campo funciona (medido em Novo contato, Novo Lead e Nova tarefa).
- Data nativa: no claro, os dígitos de "21/11/2026" saem na cor de destaque e parecem link (nova-tarefa-claro.png).
- Celular (390): o formulário continua cartão centralizado, 345 × 739, quase a tela toda, com borda e cantos sobrando.

4.2 Qual camada usar (R4, R7, R8)
- Confirmação → AlertDialog sm (400).
- Criar ou editar curto, até ~6 campos e sem seção → Dialog md (560).
- Criar com 2 colunas, pré-visualização ou importação → Dialog lg (720). Editor (skill, template) → xl (960), raro.
- Formulário longo (mais de 8 campos ou várias seções) → painel lateral md (480).
- Detalhe de registro (lead, contato, conversa, compromisso) → painel lateral lg (640).
- Seletor, filtro e menu → Popover ou DropdownMenu, nunca lista embutida no formulário.

4.3 Esqueleto do DIÁLOGO (mudar em components/ui/dialog.tsx; propaga para todos)
- Estrutura: cabeçalho fixo / corpo que rola / rodapé fixo. O DialogContent vira coluna flex com overflow hidden e max-h calc(100dvh − 48px). Novo DialogBody com overflow-y-auto e overscroll-contain. Só o corpo rola.
- Tamanho por prop size = sm | md | lg | xl (400/560/720/960), padrão md. O className de max-w por tela sai.
- Cabeçalho: padding 24 24 16. Título 18/28 semibold. Descrição 14/20 muted, até 2 linhas. X de 32 a 16 px do topo e da direita. Quando o corpo rolou, aparece um fio de ponta a ponta sob o cabeçalho (só nessa hora).
- Corpo: padding horizontal 24, vertical 4 a 24. Campos com o primitivo Field (4.6).
- Rodapé: padding 16 24; fio de ponta a ponta em cima (--border-subtle); fundo --muted a 40%; botões à direita com 8 de vão: [Cancelar outline] [Ação principal]. Ação destrutiva usa variante destructive. Texto à esquerda opcional (ex.: "Cmd+Enter para salvar", em text-xs muted).
- Raio 16. Claro: --shadow-xl. Escuro: --sombra-camada (seção 3).
- Movimento (camadas.css): entrada 200 ms, opacidade 0→1 e escala 0,98→1 com --ease-entrada; saída 150 ms com --ease-saida; cortina 200/150 ms.
- Teclado: Esc fecha (já é do Radix); Cmd/Ctrl+Enter envia o formulário (no primitivo, via prop onSubmitShortcut ou pelo form mais próximo); foco no primeiro campo (manter); foco volta ao gatilho (já é do Radix).
- Salvando: botão principal com spinner + "Salvando…", campos desabilitados, fechar bloqueado até responder. Erro do servidor: alerta no topo do corpo, rolado até ficar visível.
- Celular (< 640): diálogo de formulário vira folha que sobe de baixo, largura total, raio 16 só em cima, max-h 92dvh, rodapé fixo com área segura. A confirmação continua centralizada (largura da tela − 32).

4.4 Esqueleto do PAINEL LATERAL (components/ui/sheet.tsx)
- Flutuante como a barra lateral: 8 px de recuo do topo, da direita e de baixo; raio 16; N2; mesma sombra do diálogo.
- size = sm 400 | md 480 | lg 640; no celular, tela cheia.
- Cabeçalho fixo: título 18/600 + linha de contexto (ex.: etapa · valor · responsável) + ações (⋯ e X). Corpo rola (SheetBody). Rodapé fixo (SheetFooter) só quando é formulário.
- Seções: título 14/600 em --foreground (nunca menor que o rótulo do campo) + chevron para recolher; 24 entre seções; fio de ponta a ponta opcional entre elas.
- Detalhe de registro (R9, R10): o RESUMO vem primeiro, como lista de propriedades (rótulo à esquerda, 120 px, muted; valor à direita, edição no clique, salva sozinho). O formulário com botão "Salvar" no meio sai.
- Entrada 250 ms: desliza 24 px + opacidade, --ease-entrada; saída 200 ms, --ease-saida.

4.5 CONFIRMAÇÃO (components/ui/alert-dialog.tsx)
- 400 de largura. Título em pergunta com o objeto ("Excluir o contato Maria?"). Descrição com a consequência. Botões: Cancelar (outline) + ação.
- Irreversível usa a variante destructive, com o foco inicial em Cancelar. A confirmação em linha dos Funis passa a usar este padrão, ou ao menos ganha "Excluir de vez" em destructive.

4.6 Primitivo de CAMPO (novo: components/ui/field.tsx)
- Field (coluna, 6 de vão) · FieldLabel (14/20, medium; marca "Opcional" em text-xs muted à direita do rótulo, nunca dentro do texto dele) · o controle · FieldHint (12/16 muted, abaixo do controle) · FieldError (12/16 destructive com ícone; substitui o hint; liga aria-describedby e aria-invalid).
- FieldSection (título 14/600 + descrição opcional; 24 entre seções; 16 entre campos).
- FieldRow (2 colunas com 12 de vão a partir de 480 de largura; 1 coluna abaixo).
- Regra de obrigatório: quando a maioria é obrigatória, marcar só "Opcional"; quando a maioria é opcional, marcar "Obrigatório". Um só critério por formulário.
- input, select e textarea mantêm as alturas. Corrigir a cor dos segmentos de data (::-webkit-datetime-edit-* em --foreground; placeholder em --muted-foreground).

4.7 Pop-ups que pedem ajuste próprio, além do primitivo
P0, fora do Movimento:
- components/contacts/NewContactDialog.tsx e EditContactDialog.tsx: seções "Identificação" (Nome) e "Como falar" (Email + Telefone em FieldRow); CPF e Tags em "Mais dados"; ajuda do telefone vira FieldHint; "Nenhuma etiqueta" sai do meio.
- components/inbox/PainelIniciarConversa.tsx: Cancelar no padrão; "A IA não assume" vira FieldHint da mensagem.
- app/app/tasks/_components/FormularioDeTarefa.tsx: Prazo + Horário e Prioridade + Situação em FieldRow, com seção "Quando"; o campo de horário desabilitado ganha FieldHint explicando por quê.
P1, formulários grandes que devem virar painel lateral md: app/app/templates/_components/TemplateFormDialog.tsx (509 linhas), app/app/integracao-dados/_components/FormularioDeConexao.tsx (497), app/app/ai/credentials/_components/AddCredentialDialog.tsx (361), components/ai/NovoMaterialDialog.tsx, components/ai/BudgetCard.tsx (diálogo de orçamento).
P1, larguras fora da regra: VersionHistory, MergeDialog, EditTenantDialog e EditorDeSkill (3xl) → lg ou xl; ImageMedia e FileUploadCustomField (4xl) são visualizadores e podem ficar.
P1, painéis laterais com estrutura própria: app/app/agenda/_client.tsx, components/agenda/DetalheDoCompromisso.tsx, app/app/webhooks/_components/RuleEditor.tsx, SourceDetail.tsx, CapturaDetail.tsx, components/connections/AntiBanSheet.tsx e GruposSheet.tsx → SheetBody/SheetFooter + seções do 4.4.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. AUDITORIA DAS TELAS (medida; capturas em evidence/acabamento/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A1. Inbox, fios soltos (a queixa da dona): os fios verticais medem x=294 e x=1114, de y=80 a y=877. Começam 24 px abaixo do fio do cabeçalho (y=56) e acabam 23 px antes do fim da tela. O fio sob os filtros tem 271 de largura e para na coluna. Fontes: components/inbox/InboxLayout.tsx:906 (border-r), o aside do painel do contato (border-l, components/inbox/CRMSidePanel.tsx), components/inbox/InboxFilters.tsx:407 (border-b).
A2. Inbox, abas quebradas: 6 abas em 2 linhas, 4+2 a 1440 e 5+1 a 390 ("Arquivadas" sozinha em y=296). Causa: flex-wrap justify-between (InboxFilters.tsx:694).
A3. Inbox, aba ativa com dois indicadores no escuro (bloco cinza + sublinhado): as abas usam a variante padrão "segmented" de components/ui/tabs.tsx:125, cujo dark:data-[state=active]:bg-neutral-600 vence o bg-transparent passado pela tela.
A4. Inbox, "Busca" cortado: o campo divide a linha com "Não lidos" e "Grupos" numa coluna de 286 (InboxFilters.tsx:409-428).
A5. Inbox, três estados vazios ao mesmo tempo (lista, centro e painel do contato) e o "Recolher" solto no canto do painel vazio.
A6. Casca, linguagem dupla: a barra lateral é cartão flutuante (raio 16, N1); o conteúdo é chapado no N0, separado por fios. É isso que dá o ar de "amador".
A7. Casca, botão de recolher a barra (canto superior esquerdo) é um quadrado cheio na cor de destaque, isolado. Deve ser ghost como os outros ícones do cabeçalho.
A8. Casca, a 1440×900 o grupo "Canais" é cortado pelo rodapé da barra lateral, sem esmaecimento: o item "Conexões" aparece pela metade.
A9. Funis (lista): ações ("Importar planilha", "Novo funil") numa linha própria abaixo do título (título em y≈120, botões em y=152 a 1440), desperdiçando uma linha. Confirmação de arquivar em linha, com "Excluir de vez" sem estilo de perigo.
A10. Celular (390): a coluna da lista mantém border-r (fio vertical de 696 px colado à direita da tela). Na navegação de baixo, o rótulo "Desemp…" é cortado.
A11. Não é defeito do produto: a bolinha com ilha e palmeira no canto inferior direito é o botão do TanStack Query Devtools. O selo "N / Compiling / Issues" é do Next. Os dois só existem em desenvolvimento (app/providers.tsx:17). Não aparecem para o cliente. Para não confundir nas capturas, pode ir para o canto inferior esquerdo (buttonPosition="bottom-left"); é opcional.
A12. Bug para o Auditor (não é de acabamento): /app/contacts mostrou "Erro ao carregar contatos" a 1440 (popups-antes/criar-contato-escuro.png, faixa atrás do diálogo).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. LISTA DE CORREÇÕES PRIORIZADA (para o Layout)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cada item: tela · arquivo provável · problema · regra · pronto quando (medido no Playwright ou no portal, a 1440 e a 390, claro e escuro).

P0
1. Todos os diálogos · components/ui/dialog.tsx · rodapé rola junto e some · 4.3 · Pronto: em qualquer diálogo com conteúdo maior que a tela, o rodapé fica dentro da janela (bottom do footer ≤ innerHeight − 24) e só o DialogBody tem scrollHeight > clientHeight. Testar no Novo Lead com a lista de contatos aberta.
2. Todos os diálogos · dialog.tsx · larguras soltas · 4.2/4.3 (prop size) · Pronto: grep "max-w-" em DialogContent fora de components/ui devolve só os visualizadores (ImageMedia, FileUploadCustomField); Novo contato e Nova conversa medem 560.
3. Formulários · novo components/ui/field.tsx + label/input/select/textarea · rótulo, ajuda e erro feitos à mão · 4.6 · Pronto: Novo contato, Nova conversa e Nova tarefa usam Field; nenhum "(opcional)" dentro do texto do rótulo; o erro de validação aparece sob o campo com aria-invalid=true (provar submetendo vazio).
4. Painéis laterais · components/ui/sheet.tsx · rola inteiro, sem size, sem flutuar · 4.4 · Pronto: painel com recuo de 8 e raio 16; cabeçalho fixo e só o SheetBody rola; prop size aceita sm/md/lg.
5. Inbox · InboxLayout.tsx, CRMSidePanel.tsx, InboxFilters.tsx · fios verticais soltos · 2.1 · Pronto: nenhum elemento em main com border-left/right ≥ 1 px e altura > 250 (a mesma sonda da auditoria devolve vazio); as 3 colunas são superfícies --card com raio 12 e 8 de vão sobre --background; a 390, nenhum fio vertical.
6. Inbox · InboxFilters.tsx:694 + tabs.tsx · abas em 2 linhas e bloco cinza na ativa · 2.5 · Pronto: todos os [role=tab] com o mesmo y a 1440 e a 390; a aba ativa tem background-color transparente nos dois temas e um só sublinhado de 2 px.
7. Confirmações · components/ui/alert-dialog.tsx + a confirmação em linha dos Funis (app/app/kanban/_client.tsx) · destrutivo sem cor de perigo · 4.5 · Pronto: "Excluir de vez" usa a variante destructive; AlertDialog com 400 de largura; foco inicial em Cancelar nas irreversíveis.
8. Novo contato / Editar contato / Nova conversa / Nova tarefa · arquivos do 4.7 · sem seções, Cancelar inconsistente · 4.6/4.7 · Pronto: seções visíveis; Cancelar outline nos 4; email e telefone lado a lado a partir de 480.

P1
9. Inbox · InboxFilters.tsx:409-428 · "Busca" cortado · 2.4 · Pronto: o campo de busca ocupa a linha inteira; "Não lidos" e "Grupos" vão para a linha das abas ou para um menu de filtro; o placeholder inteiro cabe (scrollWidth ≤ clientWidth).
10. Inbox · InboxLayout.tsx · três estados vazios · 2.8 · Pronto: sem conversa selecionada, o painel do contato fica recolhido; há um só estado vazio no centro; o "Recolher" só aparece com conversa aberta.
11. Casca · layout do app (components/shell) · conteúdo chapado × barra flutuante · 2.1 · Pronto: o conteúdo principal fica numa superfície com raio 16, ou as telas de painel (Inbox) usam painéis N1; nenhum fio de cabeçalho cruza a tela de borda a borda fora de uma superfície.
12. Casca · botão "Recolher sidebar" · quadrado cheio de destaque · 2.9 · Pronto: variante ghost, igual aos ícones de tema e idioma.
13. Casca · barra lateral · grupo cortado pelo rodapé · 2.1 · Pronto: esmaecimento de 24 px no fim da área que rola, ou rolagem que não corta item pela metade a 1440×900.
14. Cabeçalho de página · components/ui/page-header.tsx e a lista de Funis (app/app/kanban/_client.tsx) · ações numa linha separada · 2.6 · Pronto: a 1440, o centro vertical dos botões fica a ±4 px do centro do bloco do título.
15. Animação das camadas · app/unnify/camadas.css · entrada e saída com a mesma curva · 2.10 · Pronto: diálogo entra em 200 ms com --ease-entrada e sai em 150 ms com --ease-saida; com prefers-reduced-motion, só opacidade.
16. Diálogos no escuro · tokens (proposta ao Executor) · sombra zerada · seção 3 · Pronto: box-shadow do [data-slot=dialog-content] no escuro diferente de rgba(0,0,0,0).
17. Cortina no claro · tokens (proposta ao Executor) · cortina esverdeada · seção 3 · Pronto: --color-overlay claro neutro; captura antes/depois da Nova tarefa.
18. Formulários grandes → painel lateral · arquivos do 4.7 (P1) · formulário longo em diálogo · 4.2 · Pronto: abrem como Sheet md com rodapé fixo.

P2
19. Data nativa · input.tsx · dígitos na cor de destaque · 4.6 · Pronto: os segmentos de data saem em --foreground.
20. Celular · navegação de baixo · "Desemp…" cortado · Pronto: rótulos inteiros (rótulo curto "Métricas" ou ícone + rótulo de 11 px).
21. Cmd/Ctrl+Enter em todo formulário · dialog.tsx/sheet.tsx · 4.3 · Pronto: Cmd+Enter envia o Novo contato (provar no Playwright).
22. Diálogo de formulário no celular vira folha de baixo · dialog.tsx · 4.3 · Pronto: a 390, o Novo contato encosta nas bordas laterais e em baixo, com raio só em cima.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. COMO EU APROVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Captura depois, no mesmo enquadramento das de antes, em evidence/acabamento/depois/ (mesmo nome de arquivo).
- A saída real das sondas do "pronto quando" (getBoundingClientRect e getComputedStyle), não a olho.
- Quem implementa não altera os testes de cerca (ex.: tests/unit/unnify-raios.test.ts, superficies.test.tsx). Se um teste trava uma medida que este guia muda, o Layout para e me avisa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. PARA O MOVIMENTO (components/kanban e editor de workflow)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M1 (P0). Cartão do lead: no rodapé, "Sem responsável" e "agora em Carrinho ab…" se sobrepõem (texto sobre texto) em Carrinho, Aguardando e Em separação (quadro-1440-escuro.png). Pronto: os dois retângulos de texto não se cruzam; o segundo corta com reticências.
M2 (P0). Novo Lead (components/kanban/NewLeadDialog.tsx): a busca de contato vira combobox em Popover (lista sobreposta, sem empurrar o formulário e sem fio entre itens); seções "Contato", "Negócio" (Título, Etapa, Valor + Fechamento em FieldRow) e "Mais" (Descrição e Tags recolhidas); Tags vira seletor de etiquetas, não texto separado por vírgula. Pronto: com a lista aberta, o rodapé continua visível (item 1) e o Título não muda de y.
M3 (P0). Detalhe do lead (components/kanban/LeadDossier.tsx): painel lg (640) flutuante; Resumo primeiro como lista de propriedades com edição no clique (R10); seções com título 14/600; "Editar campos" vira item do menu "⋯" do cabeçalho; sai o "Salvar" do meio. Pronto: título de seção ≥ rótulo de campo em font-size; o cabeçalho não rola.
M4 (P1). Cartão: o título começa cerca de 22 px à direita do valor (espaço do checkbox) e as bordas esquerdas não se alinham. Pronto: título, valor e rodapé no mesmo x; o checkbox só aparece no hover e na seleção, sobreposto.
M5 (P1). Cartão: faixas vazias entre título, valor e rodapé (148 de altura para 3 linhas). Pronto: 12 entre blocos; altura sem conteúdo extra ≤ 112.
M6 (P1). Barra de filtros dentro de uma caixa com borda (caixa dentro de caixa). Pronto: filtros soltos sobre o fundo, sem borda própria.
M7 (P1). Colunas cortadas na borda direita sem esmaecimento; cabeçalho da coluna com o chevron longe do ponto de cor. Pronto: esmaecimento de 24 px na borda que rola; chevron, ponto e nome com 8 de vão.
M8 (P1). Os outros pop-ups do quadro (EditLeadDialog, LoseLeadDialog, MoveToOtherPipelineDialog, RetomarComoNovoNegocioDialog, CamposObrigatoriosDialog, ImportarLeads) herdam o primitivo; depois, conferir as larguras pela regra 4.2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. O QUE NÃO FOI CONFERIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- A nota "Auditoria- layout e bugs do CRM" não está ligada a este terminal (maestri: not found). Usei só as capturas em evidence/auditoria-layout/.
- Telas além de Inbox, Contatos, Funis (lista e quadro) e Tarefas, e os pop-ups além dos 7 capturados (criar contato, criar lead, detalhe do lead, nova tarefa, nova conversa, confirmação em linha dos Funis e criar contato a 390). O servidor de desenvolvimento levava de 20 a 40 s por página e a memória estava em alerta (pressão 2).
- Inbox com conversa aberta (não há conversa no banco local).
- A 390, só Inbox e Novo contato.
- O tipo de cada pop-up no inventário foi classificado por script (título e nome do arquivo); 12 ficaram como "formulário/ação" genérico.
- Medidas em servidor de desenvolvimento (next dev). O movimento não foi medido em quadros.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. INVENTÁRIO DE POP-UPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Comando: grep -rlE "<(Dialog|AlertDialog|Sheet|Drawer|Popover)\b|DialogContent|SheetContent" app components | grep -v test
Formato: arquivo · tela · camada · tipo · títulos.
- `app/app/calls/_client.tsx` · calls · Dialog · criar · “Nova ligação | Chamada com”
- `app/app/settings/tenant/_danger-zone.tsx` · settings · AlertDialog · confirmação · “Apagar todos os dados de atendimento?”
- `app/app/settings/security/_client.tsx` · settings · AlertDialog · criar, confirmação · “(null); | Gerar novos códigos de recuperação? | Sair de todos os dispositivos?”
- `app/app/settings/api-tokens/_components/ApiTokensClient.tsx` · settings · Dialog · criar · “([]); | Criar novo token | Token criado”
- `app/app/tasks/_components/FormularioDeTarefa.tsx` · tasks · Dialog · formulário/ação · “void;”
- `app/app/lgpd/requests/[id]/PreviewPanel.tsx` · lgpd · Dialog · consulta
- `app/app/lgpd/requests/[id]/ApproveButton.tsx` · lgpd · AlertDialog · confirmação
- `app/app/contacts/[id]/_client.tsx` · contacts · AlertDialog · confirmação · “Desbloquear este contato? | Marcar este contato como pessoal? | Marcar este contato como sempre humano?”
- `app/app/team/_components/TeamInvitesClient.tsx` · team · Dialog · confirmação · “Revogar convite”
- `app/app/team/_components/TeamMembersClient.tsx` · team · Dialog · confirmação · “(null); | Revogar acesso”
- `app/app/ai/routers/_client.tsx` · ai · Dialog · criar · “string = (texto) => texto, | Novo roteador”
- `app/app/ai/routers/[id]/_client.tsx` · ai · AlertDialog · confirmação · “| null | undefined): string | Excluir”
- `app/app/ai/memory/_client.tsx` · ai · Dialog · formulário/ação · “Versão”
- `app/app/ai/followups/_components/RenameFollowupFlowDialog.tsx` · ai · Dialog · editar · “void; | Renomear fluxo”
- `app/app/team/_components/AttendantsClient.tsx` · team · Dialog · editar · “Horário de”
- `app/app/ai/followups/enrollments/[id]/_components/DossieDoFollowup.tsx` · ai · AlertDialog+Dialog · confirmação · “` entende, no fuso de quem olha. */ | Adiar o próximo passo | Cancelar este follow-up?”
- `app/app/ai/followups/_components/ImportFlowDialog.tsx` · ai · Dialog · criar · “void; | Importar fluxo”
- `app/app/ai/followups/_components/ModelosDialog.tsx` · ai · Dialog · consulta · “void; | Modelos prontos”
- `app/app/ai/followups/_components/NewFlowDialog.tsx` · ai · Dialog · criar · “void;”
- `app/app/ai/followups/[id]/_components/PublishBar.tsx` · ai · AlertDialog · confirmação · “void;”
- `app/app/ai/followups/_components/QueueTab.tsx` · ai · AlertDialog · confirmação
- `app/app/ai/followups/_components/DeleteFollowupFlowButton.tsx` · ai · AlertDialog · confirmação · “Excluir “{nome}”?”
- `app/app/ai/followups/[id]/_components/FlowCanvas.tsx` · ai · Sheet · criar, confirmação · “toReactFlow(initialData.draft_graph ?? EMPTY_GRAPH), | Adicionar nó”
- `app/app/ai/followups/[id]/_components/TriggerConfigControl.tsx` · ai · Popover · menu/seletor
- `app/app/ai/agents/_components/RenameAgentDialog.tsx` · ai · Dialog · editar · “void; | Renomear agente”
- `app/app/ai/agents/_components/AgentRowMenu.tsx` · ai · AlertDialog · confirmação · “Promise | Arquivar”
- `app/app/ai/providers/_components/CartaoDoJev.tsx` · ai · AlertDialog · confirmação · “;”
- `app/app/ai/agents/[id]/_components/VersionHistory.tsx` · ai · AlertDialog+Dialog · confirmação · “Reverter para v”
- `app/app/ai/agents/[id]/_components/RunDetailDrawer.tsx` · ai · Sheet · detalhe · “void;”
- `app/app/ai/skills/_components/EditorDeSkill.tsx` · ai · Dialog · editar · “void; | Editar skill”
- `app/app/ai/agents/[id]/_components/PublishConfirmDialog.tsx` · ai · AlertDialog · confirmação · “void; | Publicar v”
- `app/app/ai/credentials/_components/CredentialCard.tsx` · ai · AlertDialog · confirmação · “Remover credencial”
- `app/app/ai/credentials/_components/AddCredentialDialog.tsx` · ai · Dialog · criar · “; | Adicionar credencial”
- `app/app/ai/credentials/_components/RotateCredentialDialog.tsx` · ai · Dialog · editar · “; | Editar credencial”
- `app/app/kanban/_client.tsx` · kanban · AlertDialog · confirmação · “` da gaveta de arquivados — o que o botão da gaveta controla. | Excluir de vez”
- `app/app/people/_client.tsx` · people · Dialog · criar · “([]); | Nova pessoa”
- `app/app/integracao-dados/_components/ListaDeConexoes.tsx` · integracao-dados · AlertDialog · confirmação · “Desativada | Remover esta conexão?”
- `app/app/templates/_components/TemplateFormDialog.tsx` · templates · Dialog · formulário/ação · “void;”
- `app/app/agenda/_client.tsx` · agenda · Sheet · confirmação · “= [ | Cancelar agendamento”
- `app/app/kanban/_components/ImportarLeads.tsx` · kanban · Dialog · criar · “(null); | Importar leads de uma planilha”
- `app/app/integracao-dados/_components/FormularioDeConexao.tsx` · integracao-dados · Dialog · formulário/ação · “void;”
- `app/app/templates/_components/TemplatesClient.tsx` · templates · AlertDialog · confirmação · “apiClient.delete(`/api/v1/message-templates/$ | Excluir esta resposta rápida?”
- `app/app/webhooks/_components/RulesTab.tsx` · webhooks · AlertDialog · confirmação · “string): string | Excluir esta automação?”
- `app/app/webhooks/_components/CreateSourceDialog.tsx` · webhooks · Dialog · criar · “void; | Nova fonte de captação”
- `app/app/webhooks/_components/SourceDetail.tsx` · webhooks · AlertDialog+Sheet · editar, detalhe, confirmação · “void; | Trocar o segredo desta fonte? | Remover a assinatura desta fonte?”
- `app/app/companies/[id]/_client.tsx` · companies · Dialog · editar, confirmação · “; | Editar empresa | Excluir empresa”
- `app/app/companies/_client.tsx` · companies · Dialog · criar · “([]); | Nova empresa”
- `app/app/webhooks/automacoes/[id]/_components/CanvasDaAutomacao.tsx` · webhooks · AlertDialog+Sheet · criar, confirmação · “( | Adicionar caixa”
- `app/app/webhooks/_components/RuleEditor.tsx` · webhooks · Sheet · editar · “void;”
- `app/app/webhooks/_components/CapturaDetail.tsx` · webhooks · Sheet · detalhe · “void;”
- `app/app/prospecting/_auditoria-site.tsx` · prospecting · Dialog · formulário/ação · “= new Set(["sem-site", "agregador"]); | Auditoria do site”
- `app/admin/(protected)/meta/_form.tsx` · Admin › meta · AlertDialog · criar, confirmação · “(null); | Gerar um novo token de verificação?”
- `components/inbox/InboxLayout.tsx` · inbox · Sheet · detalhe · “`, enquanto a busca única ainda responde; | Ficha do contato”
- `components/inbox/ShortcutsHelpDialog.tsx` · inbox · Dialog · consulta · “void; | Atalhos de teclado”
- `components/inbox/EncaminharDialog.tsx` · inbox · Dialog · criar · “void; | Encaminhar mensagem”
- `components/inbox/PainelIniciarConversa.tsx` · inbox · Dialog · criar · “` ele é montado só quando o diálogo abre, e | Nova conversa”
- `components/inbox/BarraDeAcoesEmLote.tsx` · inbox · Dialog · formulário/ação · “void;”
- `components/inbox/ConversationHeader.tsx` · inbox · AlertDialog · confirmação · “void; | Fechar esta conversa? | Arquivar esta conversa?”
- `components/inbox/MessageBubble.tsx` · inbox · AlertDialog · criar, confirmação · “void; | Apagar mensagem para todos? | Enviar esta mensagem de novo?”
- `components/inbox/ReassignDialog.tsx` · inbox · Dialog · formulário/ação · “void; | Transferir conversa”
- `components/inbox/VideoCallButton.tsx` · inbox · Dialog · consulta · “servidorDeVideo(), []); | Videochamada”
- `components/inbox/InboxKeyboardShortcuts.tsx` · inbox · AlertDialog · confirmação · “void; | Fechar conversa?”
- `components/inbox/composer/AttachMenu.tsx` · inbox · Popover · menu/seletor
- `components/inbox/media/ImageMedia.tsx` · inbox · Dialog · consulta · “("loading");”
- `components/inbox/composer/EmojiButton.tsx` · inbox · Popover · menu/seletor
- `components/inbox/composer/AttachmentPreviewDialog.tsx` · inbox · Dialog · criar · “void; | Enviar anexo”
- `components/inbox/composer/ContactPickerDialog.tsx` · inbox · Dialog · criar · “void; | Enviar contato”
- `components/shell/MobileSidebar.tsx` · casca (todas) · Sheet · navegação · “`, onde o gate o vê, e o que varia | Navegação principal”
- `components/shell/CommandPalette.tsx` · casca (todas) · Dialog · consulta · “[g.id, g.label])); | Buscar telas”
- `components/contacts/BarraDeContatosEmLote.tsx` · contatos · Dialog · editar · “void; | Mudar responsável | Preencher campo personalizado”
- `components/contacts/ImportContactsDialog.tsx` · contatos · Dialog · criar · “void; | Importar contatos de planilha”
- `components/contacts/AnonymizeDialog.tsx` · contatos · Dialog · confirmação · “void; | Anonimizar contato (LGPD)”
- `components/contacts/SyncPhoneContactsDialog.tsx` · contatos · Dialog · criar · “void; | Sincronizar agenda do celular”
- `components/admin/ImpersonateButton.tsx` · admin plataforma · AlertDialog · confirmação · “Iniciar acompanhamento?”
- `components/contacts/ContactsTable.tsx` · contatos · AlertDialog · confirmação · “void; | Excluir contato?”
- `components/contacts/NewContactDialog.tsx` · contatos · Dialog · criar · “void; | Novo contato”
- `components/contacts/EditContactDialog.tsx` · contatos · Dialog · editar · “; | Editar contato”
- `components/contacts/MergeDialog.tsx` · contatos · AlertDialog+Dialog · confirmação · “void; | Juntar estes cadastros? | Contatos duplicados”
- `components/admin/tenants/EditTenantDialog.tsx` · admin plataforma · Dialog · editar · “void; | Editar dados do tenant”
- `components/admin/tenants/SuspendDialog.tsx` · admin plataforma · AlertDialog · confirmação · “void; | Suspender tenant”
- `components/admin/AdminShell.tsx` · admin plataforma · Sheet · navegação · “Menu de navegação”
- `components/admin/tenants/TenantMembers.tsx` · admin plataforma · Dialog · editar · “(null); | Alterar e-mail de acesso”
- `components/admin/tenants/ReactivateDialog.tsx` · admin plataforma · AlertDialog · confirmação · “void; | Reativar tenant”
- `components/admin/tenants/DeleteTenantDialog.tsx` · admin plataforma · AlertDialog · confirmação · “void; | Excluir tenant definitivamente”
- `components/admin/audit/AuditFiltersAdmin.tsx` · admin plataforma · Popover · menu/seletor
- `components/admin/incidents/ResolveIncidentDialog.tsx` · admin plataforma · AlertDialog · confirmação · “= 10; | Resolver incidente”
- `components/extensions/ExtensionCatalog.tsx` · extensões · AlertDialog · confirmação
- `components/connections/GruposSheet.tsx` · conexões · Sheet · detalhe · “void, | Grupos”
- `components/extensions/InstalledExtensionCard.tsx` · extensões · AlertDialog · confirmação · “Voltar {titulo} para a versão {versao}? | Remover {titulo} de todas as organizações?”
- `components/tags/DialogoDeNovaEtiqueta.tsx` · etiquetas · Dialog · criar · “void; | Adicionar tag”
- `components/tags/SeletorDeCorDaEtiqueta.tsx` · etiquetas · Popover · menu/seletor
- `components/connections/AntiBanSheet.tsx` · conexões · Sheet · detalhe · “void; | Proteção de envio | Proteção de envio —”
- `components/connections/ChannelAiAccess.tsx` · conexões · AlertDialog+Sheet · confirmação · “apiClient.get | Liberar a IA para o público?”
- `components/connections/ConnectionsClient.tsx` · conexões · Dialog · confirmação · “string, | Excluir”
- `components/connections/RedesSociaisClient.tsx` · conexões · AlertDialog · confirmação · “| null; | Excluir o canal órfão? | Desvincular o perfil?”
- `components/connections/TelefoniaClient.tsx` · conexões · Dialog · criar · “Novo número”
- `components/connections/RenomearConexao.tsx` · conexões · Dialog · editar · “void | Promise | Nome interno da conexão”
- `components/connections/AgendaDePausa.tsx` · conexões · Dialog · editar · “(TODOS); | Janela de manutenção”
- `components/connections/TemplatesParceiroClient.tsx` · conexões · AlertDialog · confirmação · “Apagar o modelo”
- `components/ai/TrechosDoMaterialDialog.tsx` · IA · Dialog · consulta · “| null; | O que o agente aprendeu de”
- `components/ai/EditarFaqDialog.tsx` · IA · Dialog · editar · “void; | Editar”
- `components/team/MemberInterfaceDialog.tsx` · equipe · Dialog · editar · “void; | Interface de”
- `components/ai/CitationsPanel.tsx` · IA · Sheet · detalhe · “void; | Citações da resposta IA”
- `components/ai/BudgetCard.tsx` · IA · Dialog · editar · “string = (texto) => texto, | Orçamento de IA”
- `components/ai/NovoMaterialDialog.tsx` · IA · Dialog · criar · “void; | Ensinar algo novo ao agente”
- `components/kanban/CamposObrigatoriosDialog.tsx` · funis (quadro/lead) · Dialog · editar · “void; | Campos obrigatórios”
- `components/ai/ChaveDeConhecimento.tsx` · IA · AlertDialog · confirmação
- `components/kanban/FileUploadCustomField.tsx` · funis (quadro/lead) · Dialog · consulta · “void;”
- `components/kanban/LoseLeadDialog.tsx` · funis (quadro/lead) · Dialog · formulário/ação · “void; | Marcar como perdido”
- `components/kanban/ScoreSlot.tsx` · funis (quadro/lead) · Popover · menu/seletor
- `components/kanban/LeadDossier.tsx` · funis (quadro/lead) · Sheet · detalhe · “void;”
- `components/kanban/RetomarComoNovoNegocioDialog.tsx` · funis (quadro/lead) · Dialog · criar · “void; | Retomar como novo negócio”
- `components/kanban/BulkActionBar.tsx` · funis (quadro/lead) · Dialog · formulário/ação · “void;”
- `components/kanban/MoveToOtherPipelineDialog.tsx` · funis (quadro/lead) · Dialog · formulário/ação · “void; | Levar para outro funil”
- `components/kanban/NewLeadDialog.tsx` · funis (quadro/lead) · Dialog · criar · “void; | Novo Lead”
- `components/kanban/KanbanCardActions.tsx` · funis (quadro/lead) · AlertDialog · confirmação · “void;”
- `components/agenda/ClientePelaAgenda.tsx` · agenda · AlertDialog · confirmação · “Ligar clientes pela agenda?”
- `components/kanban/EditLeadDialog.tsx` · funis (quadro/lead) · Dialog · editar · “void; | Editar lead”
- `components/agenda/ReservarServicoNaConversa.tsx` · agenda · Sheet · formulário/ação
- `components/agenda/DetalheDoCompromisso.tsx` · agenda · Sheet · detalhe · “;”
- `components/channels/SeletorDeCanalParaConversa.tsx` · inbox (canal) · Dialog · formulário/ação · “Escolha o canal para iniciar a conversa”
