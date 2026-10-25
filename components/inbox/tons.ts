/**
 * O CHIP DO CANAL É UM TOM CATEGÓRICO (Unnify §3.3, "chip de tom").
 *
 * Com dois números ou mais, a cor separa "Vendas" de "Suporte" de relance; a
 * palavra continua lá para quem não decorou a cor. O tom sai do id do canal, e
 * não da posição na lista, para o mesmo canal ter a mesma cor em toda linha e
 * em todo dia. Fora da lista ficam os tons que já significam estado (âmbar,
 * vermelho, verde) e o azul, que é ação.
 */
const TONS_DO_CANAL = [
  "bg-tone-teal/12 text-tone-teal-foreground",
  "bg-tone-violet/12 text-tone-violet-foreground",
  "bg-tone-cyan/12 text-tone-cyan-foreground",
  "bg-tone-orange/12 text-tone-orange-foreground",
  "bg-tone-pink/12 text-tone-pink-foreground",
  "bg-tone-lime/12 text-tone-lime-foreground",
  "bg-tone-purple/12 text-tone-purple-foreground",
  "bg-tone-fuchsia/12 text-tone-fuchsia-foreground",
  "bg-tone-stone/12 text-tone-stone-foreground",
] as const;

export function tomDoCanal(chave: string | null | undefined): string {
  if (!chave) return TONS_DO_CANAL[TONS_DO_CANAL.length - 1]!;
  let h = 0;
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) >>> 0;
  return TONS_DO_CANAL[h % TONS_DO_CANAL.length]!;
}
