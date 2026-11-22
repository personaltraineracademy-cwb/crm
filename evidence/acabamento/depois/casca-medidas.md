# Casca do app: números antes e depois (pedido de espaçamento)

Medido no portal (next dev), pelo `getBoundingClientRect` e `getComputedStyle`. Colunas: padding do `main` (cima/direita/baixo/esquerda); **barra→conteúdo** = distância do cartão da barra lateral até o conteúdo; **cabeçalho→conteúdo** = do fundo do cabeçalho (y=56) até o topo; **direita** = do conteúdo à borda; **base** = base do conteúdo menos a base do cartão da barra lateral (0 = alinhadas; só vale nas páginas de ferramenta).


## 1440 px

| tela | tema | padding antes | padding depois | barra→conteúdo | cabeçalho→conteúdo | direita | base |
|---|---|---|---|---|---|---|---|
| inbox | dark | 24px 29.774px 24px 29.774px | 8px 24px 8px 16px | 37.77 → 24 | 24 → 8 | 29.77 → 24 | -16 → 0 |
| inbox | light | 24px 29.774px 24px 29.774px | 8px 24px 8px 16px | 37.77 → 24 | 24 → 8 | 29.77 → 24 | -16 → 0 |
| funis | dark | 24px 29.746px 24px 29.746px | 8px 24px 8px 16px | 37.73 → 24 | 24 → 8 | 29.73 → 24 | -16 → 0 |
| funis | light | 24px 29.746px 24px 29.746px | 8px 24px 8px 16px | 37.73 → 24 | 24 → 8 | 29.73 → 24 | -16 → 0 |
| contatos | dark | 24px 29.746px 24px 29.746px | 24px 24px 24px 16px | 37.73 → 24 | 24 → 24 | 29.73 → 24 | n/a → n/a |
| contatos | light | 24px 29.746px 24px 29.746px | 24px 24px 24px 16px | 37.73 → 24 | 24 → 24 | 29.73 → 24 | n/a → n/a |
| config | dark | 24px 29.746px 24px 29.746px | 24px 24px 24px 16px | 37.73 → 24 | 24 → 24 | 29.73 → 24 | n/a → n/a |
| config | light | 24px 29.746px 24px 29.746px | 24px 24px 24px 16px | 37.73 → 24 | 24 → 24 | 29.73 → 24 | n/a → n/a |
| construtor | dark | 24px 29.746px 24px 29.746px | 8px 24px 8px 16px | 37.73 → 24 | 24 → 8 | 29.73 → 24 | -16 → 0 |
| construtor | light | 24px 29.746px 24px 29.746px | 8px 24px 8px 16px | 37.73 → 24 | 24 → 8 | 29.73 → 24 | -16 → 0 |
| automacao | dark | 24px 29.746px 24px 29.746px | 8px 24px 8px 16px | 37.73 → 24 | 24 → 8 | 29.73 → 24 | -16 → 0 |
| automacao | light | 24px 29.746px 24px 29.746px | 8px 24px 8px 16px | 37.73 → 24 | 24 → 8 | 29.73 → 24 | -16 → 0 |

## 1340 px

| tela | tema | padding antes | padding depois | barra→conteúdo | cabeçalho→conteúdo | direita | base |
|---|---|---|---|---|---|---|---|
| inbox | dark | n/m (página ainda carregando na 1ª medição) | 8px 24px 8px 16px | n/m → 24 | n/m → 8 | n/m → 24 | n/m → 0 |
| inbox | light | n/m (página ainda carregando na 1ª medição) | 8px 24px 8px 16px | n/m → 24 | n/m → 8 | n/m → 24 | n/m → 0 |
| funis | dark | 24px 28.374001px 24px 28.374001px | 8px 24px 8px 16px | 36.36 → 24 | 24 → 8 | 28.36 → 24 | -16 → 0 |
| funis | light | 24px 28.374001px 24px 28.374001px | 8px 24px 8px 16px | 36.36 → 24 | 24 → 8 | 28.36 → 24 | -16 → 0 |
| contatos | dark | 24px 28.374001px 24px 28.374001px | 24px 24px 24px 16px | 36.36 → 24 | 24 → 24 | 28.36 → 24 | n/a → n/a |
| contatos | light | 24px 28.374001px 24px 28.374001px | 24px 24px 24px 16px | 36.36 → 24 | 24 → 24 | 28.36 → 24 | n/a → n/a |
| config | dark | 24px 28.374001px 24px 28.374001px | 24px 24px 24px 16px | 36.36 → 24 | 24 → 24 | 28.36 → 24 | n/a → n/a |
| config | light | 24px 28.374001px 24px 28.374001px | 24px 24px 24px 16px | 36.36 → 24 | 24 → 24 | 28.36 → 24 | n/a → n/a |
| construtor | dark | 24px 28.374001px 24px 28.374001px | 8px 24px 8px 16px | 36.36 → 24 | 24 → 8 | 28.36 → 24 | -16 → 0 |
| construtor | light | 24px 28.374001px 24px 28.374001px | 8px 24px 8px 16px | 36.36 → 24 | 24 → 8 | 28.36 → 24 | -16 → 0 |
| automacao | dark | 24px 28.374001px 24px 28.374001px | 8px 24px 8px 16px | 36.36 → 24 | 24 → 8 | 28.36 → 24 | 78.92 → 0 |
| automacao | light | 24px 28.374001px 24px 28.374001px | 8px 24px 8px 16px | 36.36 → 24 | 24 → 8 | 28.36 → 24 | 78.92 → 0 |

## 390 px

| tela | tema | padding antes | padding depois | barra→conteúdo | cabeçalho→conteúdo | direita | base |
|---|---|---|---|---|---|---|---|
| inbox | dark | n/m (página ainda carregando na 1ª medição) | 16px 16px 69px 16px | n/m → 16 | n/m → 16 | n/m → 16 | n/a → n/a |
| inbox | light | n/m (página ainda carregando na 1ª medição) | 16px 16px 69px 16px | n/m → 16 | n/m → 16 | n/m → 16 | n/a → n/a |
| funis | dark | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| funis | light | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| contatos | dark | 16px 16px 69px 16px | 16px 16px 24px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| contatos | light | 16px 16px 69px 16px | 16px 16px 24px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| config | dark | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| config | light | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| construtor | dark | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| construtor | light | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| automacao | dark | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |
| automacao | light | 16px 16px 69px 16px | 16px 16px 69px 16px | 16 → 16 | 16 → 16 | 16 → 16 | n/a → n/a |

Notas: no Inbox só o 1440 foi remedido com a página carregada (gap 37,77; base −16); a 1340 e a 390 o "antes" não foi medido (n/m). A 390 a barra lateral não existe (barra de abas embaixo, rodapé 69 = reserva do contrato). Em Contatos e Configurações a página rola, então a coluna "base" não se aplica.
