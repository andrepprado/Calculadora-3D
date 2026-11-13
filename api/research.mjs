const ALLOWED = new Set([
  "printables.com",
  "www.printables.com",
  "makerworld.com",
  "www.makerworld.com",
  "thingiverse.com",
  "www.thingiverse.com",
  "thangs.com",
  "www.thangs.com",
  "cults3d.com",
  "www.cults3d.com",
  "grabcad.com",
  "www.grabcad.com"
]);

function clean(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metadata(html, key) {
  const metas = html.match(/<meta\b[^>]*>/gi) || [];

  for (const tag of metas) {
    const attrs = {};

    for (const m of tag.matchAll(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
    )) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3];
    }

    if (
      attrs.property?.toLowerCase() === key ||
      attrs.name?.toLowerCase() === key
    ) {
      return clean(attrs.content);
    }
  }

  return "";
}

function parseSize(text) {
  const value = clean(text).replace(/(\d),(\d)/g, "$1.$2");

  const match = value.match(
    /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mm|cm)\b/i
  );

  if (!match) return null;

  const factor = match[4].toLowerCase() === "cm" ? 10 : 1;

  return {
    width: Number(match[1]) * factor,
    height: Number(match[2]) * factor,
    depth: Number(match[3]) * factor,
    unit: "mm",
    confidence: "medium",
    evidence: match[0]
  };
}

function referenceURL(value) {
  const input = String(value || "").trim();

  if (!/^https?:\/\//i.test(input)) return null;

  let url = new URL(input);

  if (
    url.hostname === "google.com" ||
    url.hostname === "www.google.com"
  ) {
    return {
      searchTerm: url.searchParams.get("q") || "",
      url: null
    };
  }

  if (!ALLOWED.has(url.hostname.toLowerCase())) {
    return {
      url: null,
      unsupported: true
    };
  }

  url.search = "";
  url.hash = "";

  return {
    url: url.toString()
  };
}

async function readPublicPage(address) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const url = new URL(address);

    if (!ALLOWED.has(url.hostname.toLowerCase())) {
      throw new Error("Unsupported external source.");
    }

    const response = await fetch(address, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error("Source HTTP " + response.status);
    }

    const type = response.headers.get("content-type") || "";

    if (!type.includes("text/html")) {
      throw new Error("Source did not return HTML.");
    }

    const declared = Number(response.headers.get("content-length") || 0);

    if (declared > 1000000) {
      throw new Error("Source page exceeds size limit.");
    }

    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;

    while (true) {
      const {value, done} = await reader.read();
      if (done) break;

      total += value.length;

      if (total > 1000000) {
        await reader.cancel();
        break;
      }

      chunks.push(Buffer.from(value));
    }

    return Buffer.concat(chunks).toString("utf8");
  } finally {
    clearTimeout(timeout);
  }
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    const reference = String(body.reference || "").slice(0, 1200);
    const query = String(body.query || "").slice(0, 200);

    if (!reference && !query) {
      return json({error:"Informe uma referência."}, 400);
    }

    let target;

    try {
      target = referenceURL(reference);
    } catch {
      return json({error:"Link inválido."}, 400);
    }

    if (target?.unsupported) {
      return json({
        reference,
        primary:null,
        dimensions:null,
        searchResults:[],
        sources:[],
        warnings:[
          "O endereço não pertence a uma plataforma de modelos 3D suportada."
        ]
      });
    }

    const searchTerm = target?.searchTerm || query;
    const address = target?.url;

    if (!address) {
      return json({
        reference,
        primary:null,
        dimensions:null,
        searchResults:[],
        sources:[],
        warnings:[
          "Nenhuma ficha técnica de produto foi verificada.",
          "Use o link direto da peça no Printables ou MakerWorld, não uma pesquisa do Google.",
          "Termo informado: " + searchTerm
        ]
      });
    }

    try {
      const html = await readPublicPage(address);

      const title =
        metadata(html, "og:title") ||
        clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);

      const description =
        metadata(html, "og:description") ||
        metadata(html, "description");

      const sourceText = clean(
        html.replace(/<script[\s\S]*?<\/script>/gi, " ")
      ).slice(0, 12000);

      const dimensions = parseSize(
        [description,sourceText].join(" ")
      );

      return json({
        reference,
        primary:{
          url:address,
          title:title.slice(0,240),
          description:description.slice(0,1200),
          material:"",
          dimensions
        },
        dimensions,
        searchResults:[],
        sources:[address],
        warnings:dimensions ? [
          "As dimensões foram extraídas do texto da página e precisam ser conferidas."
        ] : [
          "A página não forneceu dimensões físicas verificáveis."
        ]
      });

    } catch (error) {
      return json({
        reference,
        primary:null,
        dimensions:null,
        searchResults:[],
        sources:[address],
        warnings:[
          "Não foi possível ler automaticamente a página original.",
          error.message,
          "Nenhuma dimensão foi inventada."
        ]
      });
    }

  } catch (error) {
    return json({
      error:"Research API error: " + error.message
    }, 500);
  }
}