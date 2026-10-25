import { GRUPO_NO_RODAPE, NAV_DESTINATIONS, NAV_GROUPS } from "@/lib/navigation/registry";

/**
 * O título da tela na barra de cima, abaixo de 1024px (DS §5.6: "a barra
 * superior mostra o título").
 *
 * Sai do CATÁLOGO de navegação, e não de cada página: o destino cujo endereço é
 * o prefixo mais longo do caminho atual (`/app/inbox/abc` → Inbox) e, para os
 * hubs, o nome do grupo (`/app/crm` → CRM; o do rodapé leva o nome do próprio
 * hub, `/app/settings` → Configurações, que é como o menu o chama). É a mesma
 * régua da barra lateral e da barra de baixo, então o título nunca diz uma tela diferente da que está
 * acesa no menu.
 *
 * Devolve a entrada do catálogo (o `label` é a CHAVE em português, que quem
 * chama passa por `t()`, como a barra lateral faz com `item.label`); `null`
 * quando o caminho não está no catálogo (aí a barra mostra a marca).
 */
export function tituloDaRota(caminho: string): { href: string; label: string } | null {
  let melhor: { href: string; label: string } | null = null;
  const candidatos: Array<{ href: string; label: string }> = [
    ...NAV_DESTINATIONS.map((d) => ({ href: d.href, label: d.label })),
    ...NAV_GROUPS.flatMap((g) =>
      g.hub ? [{ href: g.hub.href, label: g.id === GRUPO_NO_RODAPE ? g.hub.label : g.label }] : [],
    ),
  ];
  for (const c of candidatos) {
    const casa = caminho === c.href || caminho.startsWith(`${c.href}/`);
    if (casa && (!melhor || c.href.length > melhor.href.length)) melhor = c;
  }
  return melhor;
}
