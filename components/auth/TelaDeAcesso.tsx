import type { ReactNode } from "react";
import { Bot, MessagesSquare, SquareKanban } from "lucide-react";

import { LogotipoDoProduto } from "@/components/branding/MarcaDoProduto";
import type { MarcaDeSaida } from "@/lib/branding/saida";
import { traduzir } from "@/lib/i18n/dicionario";
import type { Idioma } from "@/lib/i18n/idiomas";

import "./tela-de-acesso.css";

/**
 * A moldura das telas de acesso (Unnify DS §11.9): login, cadastro,
 * recuperação, MFA, convite e "configure sua organização".
 *
 * ── Duas colunas iguais a partir de 1024 ─────────────────────────────────────
 *
 * Esquerda: o painel de marca (`sidebar`, borda direita de 1px) com a marca,
 * um título `3xl`, um texto `base` e três benefícios com bloco de ícone de 36.
 * Direita: o formulário, com largura máxima de 448 (`max-w-md`). Abaixo de
 * 1024 fica só o formulário, com a marca no topo.
 *
 * ── Por que a marca é UM elemento só, e não um por coluna ────────────────────
 *
 * `tests/e2e/marca-logo.spec.ts` procura o logo da fachada por
 * `data-testid="logo-da-fachada"`. Duas cópias (uma no painel, outra no topo
 * do celular, escondidas por CSS) fariam o localizador achar dois elementos.
 * Por isso a marca é um item próprio da grade: no celular ele fica acima do
 * formulário; a partir de `lg` ele vira a primeira linha da coluna esquerda,
 * com o mesmo fundo e a mesma borda do painel logo abaixo dele.
 *
 * ── A marca não muda ─────────────────────────────────────────────────────────
 *
 * Logo configurado: a arte da instalação, como está, na altura do quadrado
 * (40). Sem logo: o logo do produto (`LogotipoDoProduto`, o horizontal com a
 * versão do tema escuro), também em 40. A regra é `marcaEhADoProduto`
 * (`lib/branding.ts`), que olha só o logo: um nome próprio não troca o logo do
 * produto pelo nome escrito. O nome vem sempre de `marcaDaSaida(null)`, nunca
 * de texto fixo.
 */

type Props = {
  readonly marca: Pick<MarcaDeSaida, "nome" | "logoUrl" | "logoDarkUrl">;
  readonly idioma: Idioma;
  readonly children: ReactNode;
};

function MarcaDaFachada({ marca }: { marca: Props["marca"] }) {
  if (marca.logoUrl || marca.logoDarkUrl) {
    return (
      <div
        className={
          marca.logoDarkUrl ? "rounded-lg" : "rounded-lg dark:bg-white dark:px-3 dark:py-2"
        }
      >
        {/*
          <img> em vez de next/image pelo mesmo motivo da barra lateral: a URL
          é de quem hospeda e o `next/image` exige allowlist de domínios
          fechada em BUILD — a imagem pré-buildada do self-host recusaria o
          domínio do operador. A arte não é recortada nem ampliada: altura de
          até 40 (a do quadrado da marca no DS) e largura de até 192.

          O `alt` é o nome DESTA resolução (`marca.nome`): é a legenda da imagem
          que está ali. O `data-testid` é lido por `tests/e2e/marca-logo.spec.ts`.

          O `dark:bg-white` sem token é deliberado: é o "papel" atrás de um logo
          feito para fundo claro quando não há versão escura — a arte do
          revendedor não acompanha o tema, então o fundo dela também não.
        */}
        {marca.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-testid="logo-da-fachada"
            src={marca.logoUrl}
            alt={marca.nome}
            className={
              marca.logoDarkUrl
                ? "h-auto max-h-10 w-auto max-w-[12rem] object-contain dark:hidden"
                : "h-auto max-h-10 w-auto max-w-[12rem] object-contain"
            }
          />
        ) : (
          <span className="text-base font-semibold dark:hidden">{marca.nome}</span>
        )}
        {marca.logoDarkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-testid="logo-escuro-da-fachada"
            src={marca.logoDarkUrl}
            alt={marca.nome}
            className="hidden h-auto max-h-10 w-auto max-w-[12rem] object-contain dark:block"
          />
        ) : null}
      </div>
    );
  }

  // Sem logo configurado, o logo do produto, sempre: `marcaEhADoProduto`
  // (`lib/branding.ts`) olha só o logo. O quadrado com a inicial, que a etapa 7
  // desenhou para quem só trocou o nome, ficou sem caso com essa regra.
  return <LogotipoDoProduto className="h-10 w-auto" />;
}

export function TelaDeAcesso({ marca, idioma, children }: Props) {
  const t = (texto: string) => traduzir(texto, idioma);
  // Os textos passam por `t()` aqui, literais, e não numa tabela no topo do
  // módulo: a catraca do espanhol (`tests/unit/i18n-espanhol-cobre-a-tela`)
  // lê a chave direto do AST.
  const beneficios = [
    {
      icone: MessagesSquare,
      titulo: t("Conversas em um só lugar"),
      descricao: t(
        "As mensagens dos canais conectados chegam na mesma caixa de entrada da equipe.",
      ),
    },
    {
      icone: SquareKanban,
      titulo: t("Funil de vendas organizado"),
      descricao: t("Cada oportunidade tem etapa, responsável e próxima ação."),
    },
    {
      icone: Bot,
      titulo: t("IA que trabalha com a equipe"),
      descricao: t(
        "Agentes de IA respondem, resumem e passam a conversa para uma pessoa quando precisa.",
      ),
    },
  ];

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
      <div className="lg:bg-sidebar flex justify-center px-6 pt-10 sm:px-12 lg:col-start-1 lg:row-start-1 lg:justify-start lg:border-r lg:border-border lg:px-10 lg:pt-10 xl:px-14 xl:pt-14">
        <MarcaDaFachada marca={marca} />
      </div>

      <aside className="bg-sidebar hidden flex-col justify-between gap-10 border-r border-border px-10 pt-16 pb-10 lg:col-start-1 lg:row-start-2 lg:flex xl:px-14 xl:pb-14">
        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {t("Atendimento, vendas e equipe no mesmo lugar")}
            </h2>
            <p className="text-base text-muted-foreground">
              {t(
                "Entre para acompanhar as conversas, as oportunidades e as tarefas da sua empresa.",
              )}
            </p>
          </div>
          <ul className="space-y-5">
            {beneficios.map(({ icone: Icone, titulo, descricao }) => (
              <li key={titulo} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icone className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold">{titulo}</p>
                  <p className="text-sm text-muted-foreground">{descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("Acesso protegido por senha e, quando ativada, verificação em duas etapas.")}
        </p>
      </aside>

      <main className="flex justify-center px-6 py-10 sm:px-12 sm:py-12 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:items-center">
        <div className="tela-de-acesso-formulario w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
