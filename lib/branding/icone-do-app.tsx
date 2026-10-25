import { ImageResponse } from "next/og";

import { marcaEhADoProduto } from "@/lib/branding";
import { logger } from "@/lib/logger";

import { ativoDaMarcaComoDataUri, comoArrayBuffer, lerAtivoDaMarca } from "./ativos-da-marca";
import { ICONE_DO_APP, type LadoComPng } from "./desenho";
import { letraDoIcone } from "./icone";
import {
  baseDoStorage,
  caminhoBateComPrefixo,
  PREFIXO_DA_INSTALACAO,
  TAMANHO_MAXIMO_DO_LOGO,
  urlPublicaDoLogo,
} from "./logo";
import { farejarTipo } from "./logo-arquivo";
import { type MarcaDeSaida, NEUTROS_DE_SAIDA } from "./saida";

/** Só o arquivo da instalação: nunca uma URL livre nem o logo de uma organização. */
export async function lerArquivoDoIcone(
  caminho: string | null | undefined,
): Promise<string | null> {
  const base = baseDoStorage();
  if (!caminho || !base || !caminhoBateComPrefixo(caminho, PREFIXO_DA_INSTALACAO)) return null;
  try {
    const resposta = await fetch(urlPublicaDoLogo(caminho, base), {
      redirect: "error",
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!resposta.ok || !resposta.body) return null;
    const leitor = resposta.body.getReader();
    const partes: Uint8Array[] = [];
    let tamanho = 0;
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > TAMANHO_MAXIMO_DO_LOGO) {
        await leitor.cancel();
        return null;
      }
      partes.push(value);
    }
    const bytes = Buffer.concat(partes);
    const tipo = farejarTipo(bytes);
    return tipo ? `data:${tipo};base64,${bytes.toString("base64")}` : null;
  } catch {
    logger.warn("marca: arquivo do ícone indisponível; usando o desenho da instalação");
    return null;
  }
}

/**
 * Quanto o ícone do produto é AMPLIADO quando o desenho tem de ocupar o lado
 * inteiro (iPhone e `maskable`). O `icone-app.svg` é um quadrado de cantos
 * arredondados (raio 58 em 256) com o fundo transparente nos cantos: o iPhone
 * pinta esse transparente de preto, e o Android recorta o `maskable` em formas
 * que alcançam a borda. A 118% o canto do recorte cai dentro do gradiente
 * (precisa de 115,3%), e o nó, que vai até 32,7% do lado a partir do centro,
 * fica em 38,6% — dentro do círculo de 40% que o `maskable` garante.
 */
const AMPLIACAO_SEM_CANTO = 1.18;

/** O ícone de app do produto num lado: o PNG pronto, ou o SVG ampliado sem canto. */
async function iconeDoProduto(lado: 180 | 192 | 512, conteudo: number): Promise<ArrayBuffer> {
  if (conteudo >= 1 && lado in ICONE_DO_APP.png) {
    return comoArrayBuffer(await lerAtivoDaMarca(ICONE_DO_APP.png[lado as LadoComPng]));
  }
  const svg = await ativoDaMarcaComoDataUri(ICONE_DO_APP.svg);
  const ampliado = Math.round(lado * AMPLIACAO_SEM_CANTO);
  const margem = Math.round((lado - ampliado) / 2);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
      {/* O src é data: lido de `public/marca/` na imagem do app, nunca de rede. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svg}
        alt=""
        width={ampliado}
        height={ampliado}
        style={{ position: "absolute", left: margem, top: margem }}
      />
    </div>,
    { width: lado, height: lado },
  ).arrayBuffer();
}

/**
 * Um PNG por tamanho do app. Sem arquivo válido: o ícone do produto quando não há
 * logo configurado, senão cor + inicial.
 *
 * `conteudo` é a fração do lado que o DESENHO ocupa; o fundo opaco ocupa sempre
 * o lado inteiro. Abaixo de 1 é para quem recorta o ícone: o iPhone arredonda
 * os cantos, e o Android (ícone `maskable`) recorta num círculo de 80% do lado.
 */
export async function gerarIconeDoApp(
  lado: 180 | 192 | 512,
  marca: MarcaDeSaida,
  arquivo: string | null,
  conteudo = 1,
): Promise<ArrayBuffer> {
  const caixa = Math.round(lado * conteudo);
  const desenhar = (imagem: string | null) =>
    new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: imagem ? NEUTROS_DE_SAIDA.fundo : marca.accent,
          color: marca.accentFg,
          fontSize: Math.round(caixa * 0.62),
        }}
      >
        {imagem ? (
          // O src é data: gerado de bytes limitados do Storage da instalação.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagem} alt="" width={caixa} height={caixa} style={{ objectFit: "contain" }} />
        ) : (
          (letraDoIcone(marca.nome) ?? "")
        )}
      </div>,
      { width: lado, height: lado },
    ).arrayBuffer();
  // Sem arquivo de ícone subido e sem logo configurado: o ícone do Unnify CRM.
  // Se os arquivos dele faltarem, segue para a inicial, como antes.
  if (!arquivo && marcaEhADoProduto({ name: marca.nome, logoUrl: marca.logoUrl })) {
    try {
      return await iconeDoProduto(lado, conteudo);
    } catch {
      logger.warn("marca: ícone do produto indisponível; usando a inicial");
    }
  }
  try {
    return await desenhar(arquivo);
  } catch (erro) {
    if (!arquivo) throw erro;
    logger.warn("marca: não foi possível desenhar o arquivo do ícone; usando a inicial");
    return desenhar(null);
  }
}
