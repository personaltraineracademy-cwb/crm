import Link from "next/link";

import { EntrarComGoogle } from "@/components/auth/EntrarComGoogle";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert } from "@/components/ui/alert";
import { marcaDaSaida } from "@/lib/branding/saida";
import { createClient } from "@/lib/supabase/server";
import { idiomaDoVisitante } from "@/lib/i18n/idiomaAnonimo";
import { traduzir } from "@/lib/i18n/dicionario";
import { tituloDaTelaPublica } from "@/lib/i18n/titulo-da-tela-publica";

// A aba no idioma do visitante, como o corpo (`lib/i18n/titulo-da-tela-publica.ts`).
export const generateMetadata = () => tituloDaTelaPublica((t) => t("Entrar"));

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; error?: string }>;
}) {
  const { next, reset, error } = await searchParams;
  // Fora da árvore de `app/app/layout.tsx` — sem `IdiomaProvider` do lado do
  // servidor (o cliente já tem o seu, montado em `app/(public)/layout.tsx`).
  // Quase nunca há sessão aqui (é a própria tela de entrar), mas resolve do
  // mesmo jeito por segurança — `user` opcional.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const idioma = await idiomaDoVisitante(
    (user?.user_metadata?.locale as string | undefined) ?? null,
  );
  const t = (texto: string) => traduzir(texto, idioma);
  const marca = await marcaDaSaida(null);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{t("Entrar")}</h1>
        <p className="text-sm text-muted-foreground">{marca.nome}</p>
      </div>
      {reset === "success" && (
        <Alert>{t("Senha redefinida com sucesso. Entre com a nova senha.")}</Alert>
      )}
      {error === "link_invalido" && (
        <Alert variant="destructive">
          {t("Link inválido ou expirado. Peça um novo em Recuperar senha ou refaça o cadastro.")}
        </Alert>
      )}
      {/*
        Os dois avisos abaixo chegaram por frentes diferentes e falam de erros
        diferentes — o merge os pôs no mesmo lugar, e ficar com um só apagaria um
        diagnóstico inteiro da tela de login.
      */}
      {error === "convite_invalido" && (
        <Alert variant="destructive">
          {t(
            "Sua conta foi confirmada, mas o convite não vale mais — ele expirou ou foi emitido para outro e-mail. Peça um novo a quem te convidou. Não criamos uma empresa nova para você, porque não era isso que você estava fazendo.",
          )}
        </Alert>
      )}
      {error === "cadastro_por_convite" && (
        <Alert variant="destructive">
          {t(
            "Sua conta foi confirmada, mas esta instalação aceita cadastro apenas por convite — então não criamos uma empresa para você. Peça um convite a quem administra o sistema; o link dele já traz tudo o que falta.",
          )}
        </Alert>
      )}
      {error === "template_padrao" && (
        <Alert variant="destructive">
          {t(
            "Este link veio do modelo de e-mail padrão do Supabase, que não fecha o acesso nesta instalação — pedir outro link não resolve. Quem administra o sistema precisa configurar os modelos de e-mail: na nuvem do Supabase, com ",
          )}
          <code>marca-emails.sh</code>
          {t(
            "; num Supabase próprio, apontando GOTRUE_MAILER_TEMPLATES_* para as rotas /email-templates/ do app.",
          )}
        </Alert>
      )}
      {error === "provisionamento" && (
        <Alert variant="destructive">
          {t(
            "Sua conta foi confirmada, mas houve um erro ao preparar seu ambiente. Tente entrar novamente em instantes.",
          )}
        </Alert>
      )}
      {/*
        As duas recusas da entrada com Google, separadas de propósito: uma é
        falha da volta (o `code` não virou sessão), a outra é desistência de
        quem estava do outro lado. A mesma mensagem para as duas mandaria a
        pessoa "tentar de novo" quando ela só fechou a tela — e procurar
        defeito onde não há.
      */}
      {error === "entrada_com_google" && (
        <Alert variant="destructive">
          {t(
            "Não foi possível concluir a entrada com o Google. Tente novamente — se acontecer de novo, entre com e-mail e senha.",
          )}
        </Alert>
      )}
      {error === "entrada_com_google_cancelada" && (
        <Alert variant="destructive">
          {t("A entrada com o Google foi cancelada antes de terminar. Nada mudou na sua conta.")}
        </Alert>
      )}
      {/* A terceira recusa da entrada com Google: a conta está confirmada, mas o
          acesso dela foi retirado. Não é convite inválido (não havia convite
          nenhum) nem falha do Google — é decisão de quem administra, e a tela
          diz exatamente isso, em vez de mandar a pessoa "tentar de novo". */}
      {error === "acesso_revogado" && (
        <Alert variant="destructive">
          {t(
            "O acesso desta conta foi retirado por quem administra o sistema — então não criamos uma empresa nova para você. Se o acesso deveria continuar, peça a quem administra para restaurá-lo; se você está entrando em outra equipe, peça um convite.",
          )}
        </Alert>
      )}
      <LoginForm next={next} />
      <EntrarComGoogle next={next} />
      <div className="space-y-2 border-t border-border pt-6 text-sm">
        <p>
          <Link
            href="/login/forgot"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {t("Esqueci minha senha")}
          </Link>
        </p>
        <p className="text-muted-foreground">
          {t("Não tem conta?")}{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            {t("Criar conta")}
          </Link>
        </p>
      </div>
    </div>
  );
}
