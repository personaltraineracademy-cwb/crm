import { redirect } from "next/navigation";

/**
 * Meta Ads saiu do produto em 25/11/2026 (pedido da dona: "a opção de meta ads
 * pode remover completamente"): a porta saiu do menu e a tela redireciona para
 * o Dashboard, para nenhum link salvo cair numa página quebrada.
 *
 * O que fica: a origem do lead por anúncio (UTM e o id do anúncio que chega na
 * mensagem) continua no card, no dossiê e no Dashboard — não depende desta tela.
 * Os componentes da tela antiga continuam no repositório, sem porta; apagá-los
 * é uma limpeza à parte.
 */
export default function MetaAdsRemovido() {
  redirect("/app/radar");
}
