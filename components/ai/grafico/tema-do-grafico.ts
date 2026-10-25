/**
 * Tema dos gráficos (Recharts) no padrão do Unnify, DS §12 — adaptado do
 * `useChartTheme` de referência para os tokens do CRM. Usado pelos gráficos de
 * uso e orçamento da IA, da evolução e do uso da plataforma (admin).
 *
 * Regras que este arquivo carrega para quem só espalha as props:
 * - séries pela paleta `chart-*`, "calma": a marca (`chart-1`, `chart-2`) em no
 *   máximo duas séries; o resto neutro (`chart-3`); `chart-4` só para o que é
 *   ruim;
 * - eixo com texto de 12px em `muted-foreground`, sem linha de eixo nem traço;
 * - grade só horizontal, em `chart-grid`;
 * - dica (tooltip): raio 12, borda `border`, fundo `popover`, sombra do §6.3,
 *   texto 12px, padding 12 × 10;
 * - valores em pt-BR, eixo compacto, datas de calendário lidas em UTC.
 *
 * São objetos de props (e não componentes que embrulham os do Recharts) porque
 * o Recharts identifica eixos, grade e dica pelo TIPO do filho direto.
 */

export const COR_DA_SERIE = {
  /** Série principal (o número que a tela existe para mostrar). */
  principal: "var(--chart-1)",
  /** Segunda série de marca. */
  secundaria: "var(--chart-2)",
  /** Comparativo neutro. */
  comparativo: "var(--chart-3)",
  /** Negativo, perda, "ruim". */
  negativo: "var(--chart-4)",
} as const;

const TEXTO_DO_EIXO = { fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 400 };

/** Espalhe em `<XAxis>` e `<YAxis>`. */
export const PROPS_DO_EIXO = {
  tick: TEXTO_DO_EIXO,
  tickLine: false,
  axisLine: false,
} as const;

/** Espalhe em `<CartesianGrid>`: só linhas horizontais, em `chart-grid`. */
export const PROPS_DA_GRADE = {
  vertical: false,
  stroke: "var(--chart-grid)",
} as const;

/** Espalhe em `<Tooltip>`. `cursor` de linha para gráfico de linha/área. */
export const PROPS_DA_DICA = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    fontSize: 12,
    padding: "10px 12px",
    maxWidth: "min(320px, calc(100vw - 32px))",
    overflowWrap: "anywhere" as const,
    lineHeight: 1.5,
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontWeight: 500, marginBottom: 2 },
  itemStyle: { color: "var(--popover-foreground)", padding: 0 },
  cursor: { stroke: "var(--border-strong)", strokeWidth: 1 },
} as const;

/** Legenda: texto neutro, a cor fica só no marcador. */
export const PROPS_DA_LEGENDA = {
  iconType: "circle" as const,
  iconSize: 8,
  wrapperStyle: { fontSize: 12, color: "var(--muted-foreground)", paddingTop: 8 },
} as const;

/** Linha de série: 2px, sem pontos; ponto ativo discreto. */
export function propsDaLinha(cor: string) {
  return {
    type: "monotone" as const,
    stroke: cor,
    strokeWidth: 2,
    dot: false,
    activeDot: { r: 3, strokeWidth: 0, fill: cor },
  };
}

/** No máximo ~8 rótulos no eixo X; o passo cresce com a quantidade (§12.3). */
export function intervaloDoEixoX(quantidade: number): number {
  if (quantidade <= 8) return 0;
  if (quantidade <= 16) return 1;
  if (quantidade <= 32) return Math.ceil(quantidade / 7) - 1;
  if (quantidade <= 90) return Math.ceil(quantidade / 6) - 1;
  return Math.ceil(quantidade / 5) - 1;
}

const NUMERO = new Intl.NumberFormat("pt-BR");
const NUMERO_COMPACTO = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "1.217" */
export function numeroPtBr(n: number, casas = 0): string {
  if (casas === 0) return NUMERO.format(n);
  return n.toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

/** "1,2 mil", "3,4 mi" — para eixo. */
export function numeroCompacto(n: number): string {
  return NUMERO_COMPACTO.format(n);
}

/** "34,1%" — vírgula, até `casas` decimais, `%` colado. */
export function percentualPtBr(n: number, casas = 1): string {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
}

/**
 * Data de calendário puro ("aaaa-mm-dd") como "dd/MM" no idioma da pessoa,
 * lida em UTC para não andar um dia para trás no fuso do Brasil.
 */
export function diaDoEixo(dia: string, idioma: string): string {
  const d = new Date(`${dia.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dia;
  return d.toLocaleDateString(idioma, { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}
