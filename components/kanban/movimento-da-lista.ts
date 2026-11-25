"use client";
import { createContext, useContext, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Movimento da LISTA de cards de uma coluna, fora do arrasto: o card que entra
 * (negócio criado, movido pelo menu, chegado por outro usuário), o que sai
 * (excluído, movido para outra etapa) e os vizinhos que abrem ou fecham o
 * espaço deslizando, em vez de pular.
 *
 * Durante o arrasto quem move os cards é o `@hello-pangea/dnd`, e este módulo
 * fica PARADO: a biblioteca desloca os vizinhos com `transform` e, ao soltar, o
 * React reordena o DOM no mesmo lugar em que os cards já estão na tela. Animar
 * esse commit faria o card voltar à posição de antes e escorregar de novo. Por
 * isso o quadro pausa este módulo do `onDragStart` até um instante depois do
 * `onDragEnd` (`PausaDoMovimento`).
 *
 * As regras de movimento são as do `app/unnify/movimento.css`: só `translate`
 * (propriedade individual, que SOMA ao `transform` da biblioteca) e opacidade,
 * 200 ms (180 na saída) com a curva `--ease-out`, deslize de 8px. Com movimento
 * reduzido nada anda: a lista nasce no estado final, como em `camadas.css`.
 *
 * Posição medida por `offsetTop`, e não por `getBoundingClientRect`: o offset
 * ignora `transform`, então o deslocamento que a biblioteca (ou uma animação
 * nossa em curso) aplica não contamina a medida.
 */

const DURACAO_MS = 200;
const DURACAO_SAIDA_MS = 180;
const DESLIZE_PX = 8;
const CURVA = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // `--ease-out` do Unnify (tokens.css)
/**
 * Acima disto não é um card entrando ou saindo, é a lista trocando (filtro,
 * busca, outro funil, coluna expandida): animar trinta cards de uma vez é ruído,
 * não informação.
 */
const LIMITE_DE_MUDANCAS = 6;
/** Quanto o módulo segue pausado depois de soltar (o commit da soltura cabe). */
export const PAUSA_DEPOIS_DE_SOLTAR_MS = 400;

/** `performance.now()` até quando a lista não anima. `Infinity` = arrastando. */
export type PausaDoMovimento = { ate: number };

export const PausaDoMovimentoContext = createContext<RefObject<PausaDoMovimento> | null>(null);

function movimentoReduzido(): boolean {
  return (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Medida = { top: number; left: number; width: number; height: number };
type Retrato = { medidas: Map<string, Medida>; elementos: Map<string, HTMLElement> };

function retratar(lista: HTMLElement): Retrato {
  const medidas = new Map<string, Medida>();
  const elementos = new Map<string, HTMLElement>();
  for (const el of lista.querySelectorAll<HTMLElement>(":scope > [data-rfd-draggable-id]")) {
    const id = el.getAttribute("data-rfd-draggable-id");
    if (!id) continue;
    elementos.set(id, el);
    medidas.set(id, {
      top: el.offsetTop,
      left: el.offsetLeft,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  }
  return { medidas, elementos };
}

/**
 * Uma cópia inerte do card que saiu, posta no lugar onde ele estava, para
 * sumir por opacidade. O React já o tirou do DOM; a cópia não é dele nem da
 * biblioteca de arrasto (os atributos `data-rfd-*` e os `id` saem), não recebe
 * foco nem clique e se remove sozinha ao fim da animação.
 */
function fantasmaDe(original: HTMLElement, m: Medida): HTMLElement {
  const copia = original.cloneNode(true) as HTMLElement;
  for (const el of [copia, ...copia.querySelectorAll<HTMLElement>("*")]) {
    for (const nome of [...el.getAttributeNames()]) {
      if (nome.startsWith("data-rfd-") || nome === "id" || nome === "tabindex") {
        el.removeAttribute(nome);
      }
    }
  }
  copia.setAttribute("aria-hidden", "true");
  copia.setAttribute("data-card-saindo", "");
  copia.inert = true;
  Object.assign(copia.style, {
    position: "absolute",
    top: `${m.top}px`,
    left: `${m.left}px`,
    width: `${m.width}px`,
    height: `${m.height}px`,
    margin: "0",
    transform: "none",
    transition: "none",
    pointerEvents: "none",
  });
  return copia;
}

/**
 * Liga o movimento à lista de uma coluna. `chave` muda quando a lista muda
 * (os ids em ordem); `ativo` é falso com a coluna recolhida.
 */
export function useMovimentoDaLista(
  listaRef: RefObject<HTMLElement | null>,
  chave: string,
  ativo: boolean,
): void {
  const pausa = useContext(PausaDoMovimentoContext);
  const anterior = useRef<Retrato | null>(null);

  useLayoutEffect(() => {
    const lista = listaRef.current;
    if (!lista || !ativo) {
      anterior.current = null;
      return;
    }
    const agora = retratar(lista);
    const antes = anterior.current;
    anterior.current = agora;
    if (!antes) return;
    if (pausa?.current && performance.now() < pausa.current.ate) return;
    if (movimentoReduzido() || typeof lista.animate !== "function") return;

    const entraram = [...agora.medidas.keys()].filter((id) => !antes.medidas.has(id));
    const sairam = [...antes.medidas.keys()].filter((id) => !agora.medidas.has(id));
    if (entraram.length + sairam.length > LIMITE_DE_MUDANCAS) return;

    // Os que ficaram e mudaram de altura deslizam do lugar antigo ao novo.
    for (const [id, el] of agora.elementos) {
      const velho = antes.medidas.get(id);
      const novo = agora.medidas.get(id);
      if (!velho || !novo) continue;
      const dy = velho.top - novo.top;
      if (dy === 0) continue;
      el.animate([{ translate: `0 ${dy}px` }, { translate: "0 0" }], {
        duration: DURACAO_MS,
        easing: CURVA,
      });
    }
    // Quem entrou aparece de 8px abaixo, por opacidade.
    for (const id of entraram) {
      agora.elementos.get(id)?.animate(
        [
          { opacity: 0, translate: `0 ${DESLIZE_PX}px` },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: DURACAO_MS, easing: CURVA, fill: "backwards" },
      );
    }
    // Quem saiu some subindo 8px, numa cópia inerte no lugar dele.
    for (const id of sairam) {
      const original = antes.elementos.get(id);
      const m = antes.medidas.get(id);
      if (!original || !m) continue;
      const fantasma = fantasmaDe(original, m);
      lista.appendChild(fantasma);
      const anim = fantasma.animate(
        [
          { opacity: 1, translate: "0 0" },
          { opacity: 0, translate: `0 -${DESLIZE_PX}px` },
        ],
        { duration: DURACAO_SAIDA_MS, easing: CURVA, fill: "forwards" },
      );
      const remover = () => fantasma.remove();
      anim.onfinish = remover;
      anim.oncancel = remover;
    }
  }, [listaRef, chave, ativo, pausa]);
}
