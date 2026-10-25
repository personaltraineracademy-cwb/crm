import type { ModuloOpcional } from "@/lib/instalacao/modulos";
import type { CapacidadeDaOrganizacao } from "@/lib/organizacao/capacidades";
import type { InterfaceSettings } from "@/lib/navigation/interface";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { Role } from "@/lib/auth/types";
import { permissaoDaCapacidade } from "@/lib/extensions/capacidades";
import { portasLegiveis } from "@/lib/extensions/portas-legiveis";
import { localize, type ExtensionManifest } from "@/lib/extensions/manifest";
import type { ExtensionGuideView } from "@/lib/extensions/view";
import { traduzir } from "@/lib/i18n/dicionario";
import { IDIOMA_PADRAO, type Idioma } from "@/lib/i18n/idiomas";
import { hubSections, type NavGroupId } from "@/lib/navigation/registry";
import { BookOpen, Lightbulb, ListChecks, Warning } from "@/lib/ui/icons";

interface NavHubProps {
  interfaceSettings?: InterfaceSettings;
  /**
   * Módulos opcionais ligados na instalação. OBRIGATÓRIO: quando era opcional,
   * ausente queria dizer "não filtra", e o hub de IA mostrava a porta de um
   * módulo desligado — o clique dava 404 (revisão do #1573, B1).
   */
  modulosLigados: readonly ModuloOpcional[];
  /** Capacidades que a organização ligou. Ausente = o hub não filtra por capacidade. */
  capacidadesLigadas?: readonly CapacidadeDaOrganizacao[];
  group: NavGroupId;
  isPlatformAdmin: boolean;
  role: Role | null;
  title: string;
  subtitle: string;
  extensionGuides?: ExtensionGuideView[];
  extensionsUnavailable?: boolean;
  /**
   * Idioma da interface. `traduzir` é pura — roda em Server Component sem
   * provider. O default mantém os demais hubs (ex.: /app/ai) como estão até
   * que a página deles passe o locale; o que não tem entrada no dicionário
   * degrada para pt-BR, que é o comportamento de antes.
   */
  locale?: Idioma;
}

const EXTENSION_ICONS: Record<ExtensionManifest["display"]["icon"], typeof ListChecks> = {
  ListChecks,
  BookOpen,
  Lightbulb,
};

/**
 * Vitrine de um grupo do registro de navegação.
 *
 * O sidebar carrega o uso diário; o hub carrega o inventário — todas as telas
 * do grupo, cada uma com a frase que explica para que serve. Era isso que
 * faltava: telas como Conhecimento e Credenciais existiam só como aba dentro de
 * `/app/ai`, invisíveis para quem ainda não estava lá.
 *
 * As seções vêm do campo `section` do registro e são a JORNADA de quem usa o
 * grupo (montar → ensinar → acompanhar), não uma taxonomia técnica. Reordenar a
 * jornada é reordenar o array do registro.
 */
/**
 * `aria-labelledby` separa múltiplos ids por ESPAÇO — então um id com espaço
 * ("hub-ia-Ensinar o agente") vira três referências quebradas e a seção fica sem
 * rótulo acessível. O slug é o que mantém a região anunciável.
 */
function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function NavHub({
  group,
  isPlatformAdmin,
  role,
  title,
  subtitle,
  interfaceSettings,
  modulosLigados,
  capacidadesLigadas,
  locale = IDIOMA_PADRAO,
  extensionGuides = [],
  extensionsUnavailable = false,
}: NavHubProps) {
  const secoes = hubSections(group, isPlatformAdmin, role, interfaceSettings, modulosLigados, capacidadesLigadas);

  return (
    // O painel da tela inicial do Work (DS §10.9, §10.10 e §11.10): cabeçalho
    // de página (título 24/600, descrição 14 muted), seções com título em frase
    // normal e uma grade que ganha colunas com a janela. Sem padding próprio: a
    // margem lateral é o gutter do `<main>` da casca, o mesmo de toda tela.
    <div className="flex h-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{traduzir(title, locale)}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{traduzir(subtitle, locale)}</p>
        )}
      </header>

      {secoes.map(({ section, items }) => (
        <section
          key={section}
          aria-labelledby={`hub-${group}-${slug(section)}`}
          className="space-y-3"
        >
          <h2 id={`hub-${group}-${slug(section)}`} className="text-sm font-semibold">
            {traduzir(section, locale)}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21rem),1fr))] gap-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="block rounded-xl">
                  <Card className="hover:border-interactive-border flex h-full gap-3 p-4 shadow-none transition-colors duration-fast sm:p-5">
                    {/* O bloco de ícone de painel (DS §8): 32, raio 8,
                        `primary` a 10% com o ícone em `primary`. */}
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={18} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{traduzir(item.label, locale)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {traduzir(item.description, locale)}
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {group === "crm" && (extensionGuides.length > 0 || extensionsUnavailable) ? (
        <section aria-labelledby="hub-crm-orientacoes-instaladas" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="hub-crm-orientacoes-instaladas" className="text-sm font-semibold">
                {traduzir("Orientações instaladas", locale)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {traduzir(
                  "Guias adicionados depois da instalação, sem acesso aos dados do CRM.",
                  locale,
                )}
              </p>
            </div>
            <Link
              href="/app/extensions"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {traduzir("Gerenciar extensões", locale)}
            </Link>
          </div>

          {extensionsUnavailable ? (
            <Card className="flex gap-3 border-warning/40 bg-warning-bg p-4">
              <Warning
                size={20}
                aria-hidden
                className="mt-0.5 shrink-0 text-warning-fg"
              />
              <div>
                <h3 className="text-sm font-semibold">
                  {traduzir("Não foi possível conferir as orientações instaladas", locale)}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {traduzir(
                    "Abra Extensões para tentar novamente e ver o estado registrado no servidor.",
                    locale,
                  )}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21rem),1fr))] gap-4">
              {extensionGuides.flatMap((guide) =>
                // `?? []`: módulo de DADOS não contribui card; ele aparece na ficha do contato,
                // não no hub. Sem a guarda, o hub quebraria ao encontrar um instalado.
                (guide.manifest.contributions.crm_cards ?? []).map((contribution) => {
                  const Icon = EXTENSION_ICONS[contribution.icon];
                  const compact = guide.configuration.density === "compact";
                  return (
                    <Link
                      key={`${guide.installation_id}:${contribution.id}`}
                      href={`/app/extensions/${encodeURIComponent(guide.installation_id)}?card=${encodeURIComponent(contribution.id)}`}
                      data-testid={`extension-contribution-${guide.installation_id}-${contribution.id}`}
                      className="block rounded-xl"
                    >
                      <Card
                        className={`hover:border-interactive-border flex h-full gap-3 shadow-none transition-colors duration-fast ${compact ? "p-4" : "p-4 sm:p-5"}`}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Icon size={18} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-muted-foreground">
                            {localize(guide.manifest.display.title, locale).text}
                          </p>
                          <h3 className="mt-0.5 text-base font-semibold">
                            {localize(contribution.title, locale).text}
                          </h3>
                          {guide.configuration.show_description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {localize(contribution.description, locale).text}
                            </p>
                          ) : null}
                          {localize(contribution.title, locale).fallback ||
                          (guide.configuration.show_description &&
                            localize(contribution.description, locale).fallback) ? (
                            <p className="mt-1 text-xs text-warning-fg">
                              {traduzir("Texto disponível em português.", locale)}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {portasLegiveis(
                              [permissaoDaCapacidade(contribution.action.capability)],
                              (texto) => traduzir(texto, locale),
                            )}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  );
                }),
              )}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
