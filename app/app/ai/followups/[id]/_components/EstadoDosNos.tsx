"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * O estado de cada nó que o cartão mostra sem o dono abrir nada:
 * - `pendencias`: o que a validação do publish (a MESMA regra do servidor,
 *   `validateFlowForPublish`) já recusaria neste nó — "falta configurar";
 * - `rascunho`: o nó é novo ou mudou desde o último "Salvar".
 *
 * Vive em contexto, e não em `node.data`, porque `data` é o que vai para o
 * banco: estado derivado ali viraria dado persistido. O valor muda só quando o
 * resultado muda (o canvas calcula fora do caminho do arrasto), então os
 * cartões não re-renderizam a cada quadro.
 */
export type EstadoDoNo = { pendencias?: readonly string[]; rascunho?: boolean };

const VAZIO: ReadonlyMap<string, EstadoDoNo> = new Map();
const Contexto = createContext<ReadonlyMap<string, EstadoDoNo>>(VAZIO);

export function EstadoDosNosProvider({
  valor,
  children,
}: {
  valor: ReadonlyMap<string, EstadoDoNo>;
  children: ReactNode;
}) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEstadoDoNo(id: string): EstadoDoNo {
  return useContext(Contexto).get(id) ?? {};
}
