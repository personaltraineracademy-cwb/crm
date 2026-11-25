"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useT } from "@/hooks/i18n/useT";
import { useContact } from "@/hooks/contacts/useContact";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { Buildings } from "@/lib/ui/icons";

/**
 * A ABA "EMPRESA" do painel do negócio.
 *
 * A empresa não é campo do negócio: o caminho é contato → pessoa → empresas
 * (módulo de empresas, `companies` + `company_people`). Esta aba só LÊ esse
 * caminho, pela MESMA rota da ficha da pessoa (`/api/v1/people/[id]`). Ligar
 * contato a pessoa e pessoa a empresa continua nas telas de Pessoas e Empresas.
 *
 * Com o módulo de empresas desligado a rota responde 404, e a aba diz isso em
 * vez de fingir que o contato não tem empresa.
 */
interface EmpresaDaPessoa {
  id: string;
  job_title?: string | null;
  companies?: { id: string; trade_name?: string | null; legal_name?: string | null } | null;
}

export function EmpresaDoNegocio({ contactId }: { contactId: string | null }) {
  const t = useT();
  const contato = useContact(contactId ?? "");
  const pessoaId = contato.data?.data?.person_id ?? null;
  const pessoa = useQuery({
    queryKey: ["people", pessoaId],
    enabled: !!pessoaId,
    retry: false,
    queryFn: () =>
      apiClient
        .get<{
          data: { person: { full_name?: string | null }; companies: EmpresaDaPessoa[] };
        }>(`/api/v1/people/${pessoaId}`)
        .then((r) => r.data),
  });

  if (!contactId) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        {t("Este negócio não tem contato vinculado, então não há empresa para mostrar.")}
      </p>
    );
  }
  if (contato.isLoading || (pessoaId && pessoa.isLoading)) {
    return (
      <p className="py-6 text-sm text-muted-foreground" aria-busy>
        {t("Carregando…")}
      </p>
    );
  }
  if (!pessoaId) {
    return (
      <div className="flex flex-col gap-2 py-6" data-aba-empresa="sem-pessoa">
        <p className="text-sm text-muted-foreground">
          {t("Este contato ainda não está ligado a uma pessoa nem a uma empresa.")}
        </p>
        <Link
          href={`/app/contacts/${contactId}`}
          className="text-sm text-foreground underline-offset-2 hover:underline"
        >
          {t("Abrir a ficha do contato")}
        </Link>
      </div>
    );
  }
  if (pessoa.isError) {
    const desligado = pessoa.error instanceof ApiError && pessoa.error.status === 404;
    return (
      <p className="py-6 text-sm text-muted-foreground">
        {desligado
          ? t("O módulo de empresas está desligado nesta instalação.")
          : t("Não consegui carregar a empresa deste contato.")}
      </p>
    );
  }

  const empresas = pessoa.data?.companies ?? [];
  return (
    <div className="flex flex-col gap-3 py-2" data-aba-empresa>
      {empresas.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          {t("{nome} não tem empresa vinculada.").replace(
            "{nome}",
            pessoa.data?.person.full_name ?? t("Esta pessoa"),
          )}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {empresas.map((vinculo) => {
            const empresa = vinculo.companies;
            const nome = empresa?.trade_name || empresa?.legal_name || "—";
            return (
              <li
                key={vinculo.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Buildings size={18} aria-hidden />
                </span>
                <div className="min-w-0">
                  {empresa ? (
                    <Link
                      href={`/app/companies/${empresa.id}`}
                      className="block truncate text-sm font-semibold text-foreground hover:underline"
                    >
                      {nome}
                    </Link>
                  ) : (
                    <span className="text-sm">{nome}</span>
                  )}
                  {empresa?.legal_name && empresa.legal_name !== nome && (
                    <p className="truncate text-xs text-muted-foreground">{empresa.legal_name}</p>
                  )}
                  {vinculo.job_title && (
                    <p className="mt-1 text-xs text-muted-foreground">{vinculo.job_title}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
