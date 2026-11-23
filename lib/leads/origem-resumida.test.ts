import { describe, expect, it } from "vitest";

import { origemDoNegocio, resumoDaOrigem } from "./origem-resumida";

describe("resumoDaOrigem", () => {
  it("lê as UTMs do link, inclusive meio, termo e conteúdo", () => {
    const o = resumoDaOrigem(
      {
        utm_source: "instagram",
        utm_medium: "cpc",
        utm_campaign: "black-friday",
        utm_term: "personal",
        utm_content: "video-1",
      },
      "site",
    );
    expect(o).toMatchObject({
      origem: "instagram",
      meio: "cpc",
      campanha: "black-friday",
      termo: "personal",
      conteudo: "video-1",
      rastreada: true,
    });
  });

  it("sem UTM cai na coluna source e não é rastreada", () => {
    const o = resumoDaOrigem({}, "manual");
    expect(o.origem).toBe("manual");
    expect(o.rastreada).toBe(false);
    expect(o.campanha).toBeNull();
  });

  it("metadata que não é objeto não quebra", () => {
    expect(resumoDaOrigem(null, null).origem).toBe("sem_origem");
    expect(resumoDaOrigem(["x"], "whatsapp").origem).toBe("whatsapp");
  });

  it("anúncio clique-para-WhatsApp conta como rastreada", () => {
    const o = resumoDaOrigem({ ad_platform: "meta", ad_name: "Criativo 3" }, "whatsapp");
    expect(o.origem).toBe("meta");
    expect(o.anuncio).toBe("Criativo 3");
    expect(o.rastreada).toBe(true);
  });
});

describe("origemDoNegocio", () => {
  it("prefere a origem rastreada do contato", () => {
    const doContato = resumoDaOrigem({ utm_source: "google" }, "site");
    expect(origemDoNegocio(doContato, {}, "manual").origem).toBe("google");
  });

  it("usa a do negócio quando só ela é rastreada", () => {
    const doContato = resumoDaOrigem({}, "whatsapp");
    expect(origemDoNegocio(doContato, { utm_source: "tiktok" }, "webhook").origem).toBe("tiktok");
  });

  it("sem nada rastreado, fica com a porta de entrada do contato", () => {
    const doContato = resumoDaOrigem({}, "whatsapp");
    expect(origemDoNegocio(doContato, {}, "manual").origem).toBe("whatsapp");
    expect(origemDoNegocio(null, {}, "manual").origem).toBe("manual");
  });
});
