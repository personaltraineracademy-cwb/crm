import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Lê do disco um arquivo do logo do produto (`public/marca/...`), para os
 * ícones gerados no servidor (`app/icon.tsx`, `app/app-icon/[size]`).
 *
 * O satori do `ImageResponse` não lê arquivo por caminho, e pedir o arquivo
 * por HTTP ao próprio servidor seria uma requisição de saída em cada ícone.
 * O `Dockerfile` copia `public/` para a imagem ao lado do `server.js`, que
 * roda com o diretório de trabalho na raiz do app — o mesmo `process.cwd()`
 * do `next dev` e do Vitest.
 *
 * Só aceita caminho dentro de `public/marca/`: quem chama passa as constantes
 * de `desenho.ts`, mas a guarda impede que um caminho montado por engano saia
 * da pasta. O conteúdo fica em memória depois da primeira leitura: os arquivos
 * só mudam com uma imagem nova.
 */
const RAIZ = path.join(process.cwd(), "public");
const PASTA_DA_MARCA = path.join(RAIZ, "marca") + path.sep;
const lidos = new Map<string, Promise<Buffer>>();

export function lerAtivoDaMarca(caminhoPublico: string): Promise<Buffer> {
  const absoluto = path.join(RAIZ, path.normalize(caminhoPublico));
  if (!absoluto.startsWith(PASTA_DA_MARCA)) {
    return Promise.reject(new Error(`caminho fora de public/marca: ${caminhoPublico}`));
  }
  let lido = lidos.get(absoluto);
  if (!lido) {
    lido = readFile(absoluto);
    // Falha não fica em cache: a próxima chamada tenta de novo.
    lido.catch(() => lidos.delete(absoluto));
    lidos.set(absoluto, lido);
  }
  return lido;
}

/** O mesmo arquivo como `data:` URI, para o `<img>` do satori. */
export async function ativoDaMarcaComoDataUri(caminhoPublico: string): Promise<string> {
  const bytes = await lerAtivoDaMarca(caminhoPublico);
  const tipo = caminhoPublico.endsWith(".svg") ? "image/svg+xml" : "image/png";
  return `data:${tipo};base64,${bytes.toString("base64")}`;
}

/** `Buffer` → `ArrayBuffer` do tamanho exato (o `buffer` de um `Buffer` pode ser o pool inteiro). */
export function comoArrayBuffer(bytes: Buffer): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
