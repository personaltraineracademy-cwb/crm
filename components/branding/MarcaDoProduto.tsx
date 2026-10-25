import { type ArteDaMarca, LOGOTIPO, NOME_DO_LOGO, SIMBOLO } from "@/lib/branding/desenho";
import { cn } from "@/lib/utils";

/**
 * O logo do PRODUTO (Unnify CRM) — o que a tela mostra quando ninguém
 * configurou logo próprio (`marcaEhADoProduto`, em `lib/branding.ts`).
 *
 * A arte são os arquivos de `public/marca/unnify-crm/` (ver
 * `lib/branding/desenho.ts`), desenhados por `<image>` dentro de um `<svg>`:
 *
 *  - o tema troca sem piscar: as duas versões estão no DOM e o CSS mostra uma
 *    pelo `data-theme` do `<html>`, que o script do layout grava antes da
 *    primeira pintura — nenhum JavaScript decide o tema aqui;
 *  - continua sem `<img>`: o e2e `marca-logo.spec.ts` mede "barra sem `<img>`"
 *    como "sem logo do revendedor", e um `<img>` do produto ali faria a spec
 *    medir a coisa errada;
 *  - o `viewBox` é o do arquivo, então `h-8 w-auto` dá a largura certa sem
 *    ninguém digitar a proporção.
 *
 * O nome acessível é o que o desenho escreve, "Unnify CRM" — e não o nome da
 * instalação: a legenda descreve a imagem que está ali. `decorativo` esconde
 * o logo do leitor de tela onde o nome já está escrito ao lado (ou quando o
 * logo for o conteúdo de um link que já tem nome), para não ler duas vezes.
 */

type Props = {
  /**
   * @deprecated Ignorado. O nome acessível é o que o logo escreve
   * (`NOME_DO_LOGO`). Fica no tipo para não exigir mudança em quem chama.
   */
  readonly nome?: string;
  readonly className?: string;
  /** `true` quando o texto ao lado já nomeia a marca — evita ler duas vezes. */
  readonly decorativo?: boolean;
};

function Arte({
  arte,
  className,
  decorativo,
}: {
  readonly arte: ArteDaMarca;
  readonly className: string;
  readonly decorativo: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${arte.largura} ${arte.altura}`}
      className={className}
      data-marca-do-produto=""
      {...(decorativo
        ? ({ "aria-hidden": true } as const)
        : ({ role: "img", "aria-label": NOME_DO_LOGO } as const))}
    >
      <image
        href={arte.claro}
        width={arte.largura}
        height={arte.altura}
        className="dark:hidden"
        data-tema="claro"
      />
      <image
        href={arte.escuro}
        width={arte.largura}
        height={arte.altura}
        className="hidden dark:inline"
        data-tema="escuro"
      />
    </svg>
  );
}

/**
 * O símbolo sozinho — barra recolhida e cabeçalhos com o nome ao lado.
 * A partir de 24 px (`LADO_MINIMO_DO_SIMBOLO`); abaixo disso, o ícone do app.
 */
export function SimboloDoProduto({ className, decorativo = false }: Props) {
  return <Arte arte={SIMBOLO} className={cn("shrink-0", className)} decorativo={decorativo} />;
}

/**
 * Símbolo + "Unnify CRM" — barra aberta e tela de entrada. Encolhe (mantendo a
 * proporção) antes de empurrar o botão de recolher para fora da linha.
 */
export function LogotipoDoProduto({ className, decorativo = false }: Props) {
  return (
    <Arte arte={LOGOTIPO} className={cn("max-w-full min-w-0", className)} decorativo={decorativo} />
  );
}
