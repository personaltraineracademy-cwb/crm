/**
 * O LOGO do produto — o Unnify CRM — e onde moram os arquivos dele.
 *
 * É o que a tela, a aba e o app instalado mostram quando ninguém configurou
 * logo próprio (`marcaEhADoProduto`, em `lib/branding.ts`). Quem sobe logo em
 * `/admin/marca` ou declara `APP_LOGO_URL` continua vencendo: este arquivo é a
 * camada de baixo, não uma marca fixa.
 *
 * ─── Por que arquivos em `public/`, e não geometria no código ────────────────
 *
 * A arte vem pronta do pacote de marca (símbolo, horizontal, ícone de app, nas
 * versões clara e escura), com o nome já em curvas. Copiar os caminhos para o
 * código criaria uma segunda fonte, que divergiria na primeira revisão da arte.
 * Os arquivos ficam em `public/marca/unnify-crm/` e são lidos por URL na tela
 * (`components/branding/MarcaDoProduto.tsx`) e do disco nos ícones gerados
 * (`lib/branding/ativos-da-marca.ts`).
 *
 * `public/` é servido em toda instalação, mas o caminho não é um nome que o
 * navegador peça sozinho (como `/favicon.ico`): o arquivo só aparece onde um
 * componente decide que a marca em vigor é a do produto.
 *
 * ─── As regras do pacote de marca ───────────────────────────────────────────
 *
 *  - fundo claro: `simbolo.svg` e `horizontal.svg` (nó navy `#071A32`);
 *  - fundo escuro: `simbolo-escuro.svg` e `horizontal-escuro.svg` (`#EAF2FF`);
 *  - o símbolo sozinho só a partir de 24 px; abaixo disso, o ícone de app;
 *  - o ícone de app (`icone-app.svg`, nó branco em quadrado arredondado com
 *    gradiente navy) é o favicon e o ícone instalado, a partir de 16 px;
 *  - não recolorir: as cores estão nos arquivos, e o código não as repete.
 */

/** O que o logo escreve — e, por isso, o nome acessível dele. */
export const NOME_DO_LOGO = "Unnify CRM";

const PASTA = "/marca/unnify-crm";

/** Uma arte com versão clara e escura, e o `viewBox` que as duas compartilham. */
export type ArteDaMarca = {
  readonly claro: string;
  readonly escuro: string;
  readonly largura: number;
  readonly altura: number;
};

/** O nó sozinho — barra recolhida, cabeçalhos com o nome escrito ao lado. */
export const SIMBOLO: ArteDaMarca = {
  claro: `${PASTA}/simbolo.svg`,
  escuro: `${PASTA}/simbolo-escuro.svg`,
  largura: 200,
  altura: 200,
};

/** O nó com "Unnify CRM" ao lado — barra aberta e tela de entrada. */
export const LOGOTIPO: ArteDaMarca = {
  claro: `${PASTA}/horizontal.svg`,
  escuro: `${PASTA}/horizontal-escuro.svg`,
  largura: 308.97,
  altura: 56,
};

/** Lado mínimo, em px de tela, para o símbolo aparecer sem o quadrado do ícone. */
export const LADO_MINIMO_DO_SIMBOLO = 24;

/**
 * O ícone do app: o SVG (para os tamanhos que não têm PNG pronto) e os PNGs
 * que o pacote de marca exporta, servidos tais como vieram.
 */
export const ICONE_DO_APP = {
  svg: `${PASTA}/icone-app.svg`,
  png: {
    64: `${PASTA}/icone-app-64.png`,
    192: `${PASTA}/icone-app-192.png`,
    512: `${PASTA}/icone-app-512.png`,
  },
} as const;

/** Os tamanhos em que há PNG pronto do ícone do app. */
export type LadoComPng = keyof typeof ICONE_DO_APP.png;
