/**
 * O nome de gente de cada origem de lead, no Dashboard e no painel por
 * conversa — uma regra só para as duas telas não chamarem a mesma origem de
 * nomes diferentes. Literal por literal, para o guardião de idioma enxergar.
 */
export function rotuloDaOrigem(origem: string, t: (texto: string) => string): string {
  switch (origem.toLowerCase()) {
    case "sem_origem":
      return t("Sem origem informada");
    case "manual":
      return t("Cadastro manual");
    case "whatsapp":
      return t("WhatsApp direto");
    case "whatsapp_agenda":
      return t("Agenda do celular");
    case "site":
      return t("Site");
    case "webhook":
      return t("Integração");
    case "import":
      return t("Importação");
    default:
      return origem;
  }
}
