import { redirect } from "next/navigation";

/**
 * O hub "Análise" saiu do menu em 25/11/2026 (pedido da dona): o essencial de
 * Desempenho e Atividades foi para o Dashboard, e as telas que só o hub
 * mostrava mudaram de casa (Faturamento, Honorários e Audit Log em
 * Configurações; Evolução da IA no Agente de IA). A rota redireciona para o
 * Dashboard para nenhum link salvo cair numa página quebrada.
 */
export default function AnaliseHubPage() {
  redirect("/app/radar");
}
