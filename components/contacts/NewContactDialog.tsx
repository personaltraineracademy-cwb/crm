"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useActiveOrg } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { roleAtLeast } from "@/lib/auth/types";
import { PAIS_PADRAO, perfilDoPais } from "@/lib/legal/perfil-do-pais";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldControl,
  FieldError,
  FieldHint,
  FieldLabel,
  FieldRow,
  FieldSection,
} from "@/components/ui/field";
import { normalizarTags } from "@/lib/contacts/tag-normalizada";
import { contactCreateSchemaDoPais, type ContactCreate } from "@/lib/schemas/contacts";
import type { Contact } from "@/lib/types/contacts";
import { useCreateContact } from "@/hooks/contacts/useCreateContact";
import { useContactTagVocabulary } from "@/hooks/contacts/useContactTagVocabulary";
import { useDefinirCorDaEtiqueta } from "@/hooks/tags/useDefinirCorDaEtiqueta";
import { EtiquetasDoContato } from "@/components/contacts/EtiquetasDoContato";

interface FormShape {
  name?: string;
  email?: string;
  phone_number?: string;
  cpf?: string;
  /** As etiquetas do contato novo — o seletor grava esta lista. */
  tags?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Nome já digitado por quem chamou, para não redigitar. Quem abre com um termo
   * de busca em mãos passa aqui; o resto continua abrindo vazio.
   *
   * É `defaultValue` do formulário, então só vale na montagem — quem precisa
   * trocar o termo com o diálogo já montado remonta com `key`.
   */
  nomeInicial?: string;
  /**
   * Recebe o contato recém-criado. Existe para quem abriu o diálogo NO MEIO de
   * outro fluxo (marcar um horário, por exemplo) poder seguir com ele já
   * selecionado, em vez de mandar a pessoa procurar de novo o que acabou de criar.
   */
  onCriado?: (contato: Contact) => void;
}

export function NewContactDialog({ open, onOpenChange, nomeInicial, onCriado }: Props) {
  const t = useT();
  const org = useActiveOrg();
  const perfil = perfilDoPais(org?.country);
  const create = useCreateContact();
  // O MESMO vocabulário de sugestões da ficha (#2732): a chave do react-query é
  // a mesma, então quem já leu na lista de contatos não paga outra requisição.
  const vocabulario = useContactTagVocabulary(org?.orgId ?? null);
  const { definirCor } = useDefinirCorDaEtiqueta();
  // A cor da etiqueta é VOCABULÁRIO e a rota exige manager + MFA: para os outros
  // papéis a paleta nem chega ao campo, como na ficha e no editor do Inbox.
  const podeDefinirCor = roleAtLeast(org?.role, "manager");
  const [serverError, setServerError] = useState<string | null>(null);
  // Erro de validação POR CAMPO (guia de acabamento §4.6): aparece sob o campo,
  // com `aria-invalid`. Sem campo identificável (a regra "email ou telefone"),
  // marca os dois identificadores e escreve a mensagem sob o email.
  const [errosDeCampo, setErrosDeCampo] = useState<Partial<Record<keyof FormShape, string>>>({});
  // A etiqueta que o texto AINDA digitado no campo viraria — o mesmo fio do
  // EditContactDialog (#2732): sem ele, quem digita e clica em "Criar contato"
  // sem Enter perde a etiqueta em silêncio.
  const [etiquetaPendente, setEtiquetaPendente] = useState<string | null>(null);

  // O diálogo segue montado entre aberturas e o campo (com o rascunho) desmonta
  // ao fechar; o pendente do pai não pode sobreviver para o próximo contato.
  // Pelo `open`, e não embrulhando o `onOpenChange`: o Cancelar e o pai fecham
  // sem passar por ele. Ajuste no render, não em `useEffect` (o
  // `react-hooks/set-state-in-effect` acusa o efeito como render em cascata).
  const [abertoAntes, setAbertoAntes] = useState(open);
  if (open !== abertoAntes) {
    setAbertoAntes(open);
    if (!open) setEtiquetaPendente(null);
  }

  const form = useForm<FormShape>({
    defaultValues: {
      name: nomeInicial ?? "",
      email: "",
      phone_number: "",
      cpf: "",
      tags: [],
    },
  });

  const tags = useWatch({ control: form.control, name: "tags" }) ?? [];

  async function onSubmit(values: FormShape) {
    setServerError(null);
    setErrosDeCampo({});
    // A MESMA normalização da API (lib/contacts/tag-normalizada): o que a ficha
    // grava é o que o filtro `?tag=` casa (issue #1224).
    const tags = normalizarTags([
      ...(values.tags ?? []),
      ...(etiquetaPendente ? [etiquetaPendente] : []),
    ]);

    const payload: Record<string, unknown> = { source: "manual" };
    if (values.name?.trim()) payload.name = values.name.trim();
    if (values.email?.trim()) payload.email = values.email.trim();
    if (values.phone_number?.trim()) payload.phone_number = values.phone_number.trim();
    if (values.cpf?.trim()) payload.cpf = values.cpf.trim();
    if (tags.length) payload.tags = tags;

    // A MESMA régua do servidor: a tela que mostra 'Bilhete' não pode
    // recusá-lo como CPF antes de chegar lá.
    const parsed = contactCreateSchemaDoPais(perfil).safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const mensagem = first?.message ?? t("Dados inválidos");
      const campo = first?.path[0];
      if (campo === "name" || campo === "email" || campo === "phone_number" || campo === "cpf") {
        setErrosDeCampo({ [campo]: mensagem });
      } else {
        setErrosDeCampo({ email: mensagem, phone_number: "" });
      }
      return;
    }

    try {
      const resposta = await create.mutateAsync(parsed.data as ContactCreate);
      toast.success(t("Contato criado"));
      form.reset();
      setErrosDeCampo({});
      setEtiquetaPendente(null);
      onOpenChange(false);
      // `.data` é o envelope do `ok()`, e dentro dele mora `{ contact, action }`.
      // Entregar `resposta.data` aqui devolveria esse envelope como se fosse o
      // contato: o `id` sairia `undefined` e a marcação ficaria sem ninguém, em
      // silêncio. Quem garante que este caminho não volta a errar é o tipo do
      // hook, ligado ao retorno da rota.
      if (resposta?.data?.contact) onCriado?.(resposta.data.contact);
    } catch {
      // error toast already handled by hook
    }
  }

  const telefoneRotulo = t("Telefone");
  const telefoneAjuda =
    perfil.codigo === PAIS_PADRAO ? t("DDD + número") : t("Formato internacional (E.164)");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Novo contato")}</DialogTitle>
          <DialogDescription>
            {t("Preencha pelo menos um identificador (email ou telefone).")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
          <DialogBody>
            <FieldSection title={t("Identificação")}>
              <Field invalid={errosDeCampo.name !== undefined}>
                <FieldLabel opcional>{t("Nome")}</FieldLabel>
                <FieldControl>
                  <Input {...form.register("name")} />
                </FieldControl>
                <FieldError>{errosDeCampo.name}</FieldError>
              </Field>
            </FieldSection>
            <FieldSection title={t("Como falar")}>
              <FieldRow>
                <Field invalid={errosDeCampo.email !== undefined}>
                  <FieldLabel>{t("Email")}</FieldLabel>
                  <FieldControl>
                    <Input type="email" {...form.register("email")} />
                  </FieldControl>
                  <FieldError>{errosDeCampo.email}</FieldError>
                </Field>
                <Field invalid={errosDeCampo.phone_number !== undefined}>
                  <FieldLabel>{telefoneRotulo}</FieldLabel>
                  <FieldControl>
                    <Input
                      placeholder={perfil.telefoneExemplo}
                      {...form.register("phone_number")}
                    />
                  </FieldControl>
                  <FieldHint>{telefoneAjuda}</FieldHint>
                  <FieldError>{errosDeCampo.phone_number}</FieldError>
                </Field>
              </FieldRow>
            </FieldSection>
            <FieldSection title={t("Mais dados")}>
              <Field invalid={errosDeCampo.cpf !== undefined}>
                {/* O documento é o do PAÍS da organização — a API já valida por ele
                    (`contactCreateSchemaDoPais`); só a tela escrevia "CPF" em duro. */}
                <FieldLabel opcional>{perfil.documento.rotulo}</FieldLabel>
                <FieldControl>
                  <Input placeholder={perfil.documento.exemplo} {...form.register("cpf")} />
                </FieldControl>
                <FieldError>{errosDeCampo.cpf}</FieldError>
              </Field>
              <Field>
                {/* Era um campo de texto livre "separadas por vírgula" — o formato
                    que a ficha deixou na #2732 e o funil na #2979. Aqui o mesmo
                    seletor da ficha: sugere o que já existe, reusa a grafia gravada
                    e colore com o tom do vocabulário. */}
                <FieldLabel htmlFor="new-tags" opcional>
                  {t("Tags")}
                </FieldLabel>
                <EtiquetasDoContato
                  ocultarVazio
                  inputId="new-tags"
                  value={tags}
                  onChange={(next) => form.setValue("tags", next, { shouldDirty: true })}
                  vocabulario={vocabulario.data}
                  disabled={create.isPending}
                  onPendente={setEtiquetaPendente}
                  onDefinirCor={
                    podeDefinirCor ? (tag, cor) => void definirCor(tag, cor) : undefined
                  }
                />
              </Field>
            </FieldSection>
            {serverError && <p className="text-danger-foreground mt-4 text-sm">{serverError}</p>}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              {t("Cancelar")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t("Criando…") : t("Criar contato")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
