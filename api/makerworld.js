"use strict";

const CORES = {
    branco: ["white", "branco"],
    preto: ["black", "preto"],
    vermelho: ["red", "vermelho"],
    azul: ["blue", "azul"],
    verde: ["green", "verde"],
    amarelo: ["yellow", "amarelo"],
    laranja: ["orange", "laranja"],
    rosa: ["pink", "rosa"],
    roxo: ["purple", "roxo"],
    cinza: ["gray", "grey", "cinza"],
    marrom: ["brown", "marrom"],
    bege: ["beige", "bege"]
};

function valor(obj, nomes) {
    for (const nome of nomes) {
        const v = obj?.[nome];

        if (v !== undefined && v !== null && v !== "") {
            return v;
        }
    }

    return null;
}

function numero(v) {
    if (typeof v === "number") return v;

    if (typeof v !== "string") return NaN;

    const match = v.replace(",", ".").match(/-?\d+(?:\.\d+)?/);

    return match ? Number(match[0]) : NaN;
}

function corRGB(v) {
    if (!v) return null;

    const texto = String(v).trim().toLowerCase();

    for (const [cor, aliases] of Object.entries(CORES)) {
        if (aliases.some(alias => texto === alias)) return cor;
    }

    let r, g, b;

    const hex = texto.match(/^#?([0-9a-f]{6})$/i);

    if (hex) {
        const n = parseInt(hex[1], 16);
        r = (n >> 16) & 255;
        g = (n >> 8) & 255;
        b = n & 255;
    } else {
        const rgb = texto.match(
            /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
        );

        if (!rgb) return null;

        r = Number(rgb[1]);
        g = Number(rgb[2]);
        b = Number(rgb[3]);
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (min >= 215 && max - min < 40) return "branco";
    if (max <= 75) return "preto";

    if (r > 105 && r > g * 1.4 && r > b * 1.4)
        return "vermelho";

    if (b > 90 && b > r * 1.3 && b > g * 1.15)
        return "azul";

    if (g > 85 && g > r * 1.25 && g > b * 1.1)
        return "verde";

    if (r > 140 && g > 105 && b < 125)
        return "amarelo";

    if (r > 150 && g > 55 && g < 180 && b < 110)
        return "laranja";

    if (r > 140 && b > 130 && g > 65)
        return "rosa";

    if (r > 115 && b > 100 && g < 145)
        return "roxo";

    if (min > 65 && max - min < 40)
        return "cinza";

    return null;
}

function lerFilamentos(perfil) {
    const fontes = [
        perfil.instanceFilaments,
        perfil.filaments,
        perfil.materials,
        perfil.filamentList
    ];

    const lista = fontes.find(Array.isArray) || [];
    const encontrados = [];

    for (const item of lista) {
        if (!item || typeof item !== "object") continue;

        const materialOriginal = valor(item, [
            "type",
            "material",
            "filamentType",
            "filament_type",
            "materialType"
        ]);

        const corOriginal = valor(item, [
            "color",
            "colour",
            "hex",
            "colorHex",
            "filamentColor",
            "filament_color",
            "colorValue"
        ]);

        const pesoOriginal = valor(item, [
            "grams",
            "weight_grams",
            "weightGrams",
            "weight",
            "filamentWeight",
            "filament_weight",
            "usedWeight",
            "usedGrams"
        ]);

        const material = String(
            materialOriginal || ""
        ).toUpperCase().match(
            /\b(PLA|PETG|ABS|ASA|TPU)\b/
        )?.[1] || null;

        const cor = corRGB(corOriginal);
        const peso = numero(pesoOriginal);

        if (
            material &&
            cor &&
            Number.isFinite(peso) &&
            peso > 0
        ) {
            encontrados.push({
                material,
                cor,
                peso
            });
        }
    }

    return encontrados;
}

function lerTempo(perfil) {
    const segundos = valor(perfil, [
        "printSeconds",
        "print_seconds",
        "predictionSeconds",
        "estimatedSeconds",
        "timeSeconds",
        "time_seconds"
    ]);

    if (segundos !== null) {
        const n = numero(segundos);
        return Number.isFinite(n) && n > 0
            ? n / 3600
            : null;
    }

    const horas = valor(perfil, [
        "printHours",
        "print_hours",
        "timeHours"
    ]);

    if (horas !== null) {
        const n = numero(horas);
        return Number.isFinite(n) && n > 0
            ? n
            : null;
    }

    const texto = String(valor(perfil, [
        "printTime",
        "print_time",
        "prediction",
        "estimatedTime"
    ]) || "");

    const decimal = texto.match(
        /(\d+(?:[.,]\d+)?)\s*(?:h|hours?|horas?)\b/i
    );

    if (decimal) return numero(decimal[1]);

    const relogio = texto.match(
        /^(\d{1,3}):(\d{2}):(\d{2})$/
    );

    if (relogio) {
        return Number(relogio[1]) +
            Number(relogio[2]) / 60 +
            Number(relogio[3]) / 3600;
    }

    return null;
}

function lerPlacas(perfil) {
    const placas = valor(perfil, [
        "plates",
        "plateList",
        "plate_list"
    ]);

    if (Array.isArray(placas)) return placas.length;

    const quantidade = valor(perfil, [
        "plateCount",
        "plate_count",
        "platesCount"
    ]);

    const n = numero(quantidade);

    return Number.isFinite(n) && n > 0 ? n : null;
}

function compatibilidade(perfil) {
    const campos = [
        perfil.printer,
        perfil.printerName,
        perfil.printerModels,
        perfil.compatiblePrinters,
        perfil.compatiblePrinterModels,
        perfil.printerModel
    ];

    const texto = JSON.stringify(campos).toLowerCase();

    return /a1\s*mini/.test(texto);
}

function prepararPerfil(perfil) {
    const etiquetas = lerFilamentos(perfil);

    if (!etiquetas.length) return null;

    const tempo = lerTempo(perfil);
    const pratos = lerPlacas(perfil);

    if (!Number.isFinite(tempo) || tempo <= 0) return null;

    const soma = etiquetas.reduce(
        (s, item) => s + item.peso,
        0
    );

    const pesoInformado = valor(perfil, [
        "weightGrams",
        "weight_grams",
        "totalWeight",
        "total_weight",
        "totalGrams"
    ]);

    const total = pesoInformado === null
        ? soma
        : numero(pesoInformado);

    if (
        !Number.isFinite(total) ||
        Math.abs(soma - total) > 0.11
    ) {
        return null;
    }

    const titulo = String(
        valor(perfil, ["title", "name"]) || ""
    );

    const separado = (
        /partes separadas|pe[cç]as separadas|separated parts|separate parts/i.test(
            titulo
        ) ||
        (pratos !== null && pratos > 1)
    );

    const a1mini = compatibilidade(perfil);

    return {
        id: String(
            valor(perfil, [
                "profileId",
                "profile_id",
                "id"
            ]) || ""
        ),
        titulo,
        impressora: a1mini ? "A1 mini" : "General profile",
        compativelA1Mini: a1mini,
        placasSeparadas: separado,
        pratos,
        tempo,
        total,
        etiquetas,
        prioridade:
            (separado ? 100 : 0) +
            (a1mini ? 50 : 0) +
            etiquetas.length
    };
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    if (req.method === "GET") {
        return res.status(200).json({
            status: "ok",
            service: "duolab-makerworld",
            mode: "metadata-api"
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Method not allowed."
        });
    }

    try {
        const entrada = String(req.body?.url || "").trim();

        if (!entrada || entrada.length > 1200) {
            return res.status(400).json({
                erro: "Invalid model URL."
            });
        }

        const url = new URL(entrada);

        if (
            url.protocol !== "https:" ||
            !["makerworld.com", "www.makerworld.com"].includes(
                url.hostname.toLowerCase()
            )
        ) {
            return res.status(400).json({
                erro: "Only MakerWorld URLs are supported."
            });
        }

        const modelo = url.pathname.match(
            /\/models\/(\d+)/i
        )?.[1];

        if (!modelo) {
            return res.status(400).json({
                erro: "Model ID not found in URL."
            });
        }

        const profileId = url.hash.match(
            /profileId-(\d+)/i
        )?.[1] || null;

        const endpoint =
            "https://api.bambulab.com/v1/design-service/design/" +
            modelo;

        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            18000
        );

        let resposta;

        try {
            resposta = await fetch(endpoint, {
                headers: {
                    "Accept": "application/json"
                },
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!resposta.ok) {
            throw new Error(
                "Bambu metadata API returned HTTP " +
                resposta.status
            );
        }

        const dados = await resposta.json();

        const raiz = dados?.data?.design ||
            dados?.data ||
            dados;

        const instancias = valor(raiz, [
            "instances",
            "printProfiles",
            "profiles"
        ]);

        if (!Array.isArray(instancias)) {
            throw new Error(
                "The metadata API did not return a print profile list."
            );
        }

        const perfis = instancias
            .map(prepararPerfil)
            .filter(Boolean);

        if (!perfis.length) {
            return res.status(422).json({
                erro:
                    "Model metadata loaded, but filament colors, " +
                    "weights or print times were incomplete. " +
                    "Use the slicer screenshot for this profile.",
                modelId: modelo,
                profilesFound: instancias.length
            });
        }

        perfis.sort((a, b) => {
            const aSelecionado = a.id === profileId ? 1 : 0;
            const bSelecionado = b.id === profileId ? 1 : 0;

            return (
                (bSelecionado - aSelecionado) * 1000 +
                b.prioridade - a.prioridade
            );
        });

        const escolhido = perfis[0];

        return res.status(200).json({
            origem: "Bambu metadata API",
            profileId: escolhido.id || profileId,
            impressora: escolhido.impressora,
            compativelA1Mini: escolhido.compativelA1Mini,
            perfilGeral: !escolhido.compativelA1Mini,
            placasSeparadas: escolhido.placasSeparadas,
            pratos: escolhido.pratos,
            tempo: escolhido.tempo,
            total: escolhido.total,
            etiquetas: escolhido.etiquetas
        });

    } catch (erro) {
        console.error(
            "[DUOLAB MAKERWORLD]",
            erro?.stack || erro
        );

        return res.status(422).json({
            erro: erro.message || "Metadata request failed."
        });
    }
};