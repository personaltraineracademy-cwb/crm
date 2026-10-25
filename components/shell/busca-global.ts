/**
 * Abrir a busca-comando (⌘K / Ctrl K) de qualquer peça da casca.
 *
 * Quem monta a paleta e guarda o "aberta?" é o `SearchTrigger`, no topo — uma
 * paleta só, um atalho só. O campo de busca da gaveta do celular (DS §5.6,
 * "Busca (no celular)") mora em outra subárvore (a gaveta é um portal, e a
 * barra de baixo também a abre), então ele não recebe o estado por prop: pede
 * por este evento, e o `SearchTrigger` atende.
 */
export const EVENTO_ABRIR_BUSCA = "casca:abrir-busca";

export function abrirBuscaGlobal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTO_ABRIR_BUSCA));
}

/**
 * O atalho escrito como a pessoa o digita: `⌘K` no Mac, `Ctrl K` no resto.
 * Só no navegador — no servidor (e na primeira pintura) é `Ctrl K`, e quem
 * mostra troca depois de montar, sem divergir na hidratação.
 */
export function atalhoDaBusca(): string {
  if (typeof navigator === "undefined") return "Ctrl K";
  const plataforma =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    "";
  return /mac|iphone|ipad/i.test(plataforma) ? "⌘K" : "Ctrl K";
}
