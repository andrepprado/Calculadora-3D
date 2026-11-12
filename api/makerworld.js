"use strict";

function corDoRGB(css) {
    const match = String(css || "").match(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
    );

    if (!match) return null;

    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (min >= 220 && max - min <= 35) return "branco";
    if (max <= 70) return "preto";

    if (r > 105 && r > g * 1.4 && r > b * 1.4)
        return "vermelho";

    if (b > 90 && b > r * 1.3 && b > g * 1.15)
        return "azul";

    if (g > 85 && g > r * 1.25 && g > b * 1.1)
        return "verde";

    if (r > 140 && g > 105 && b < 125)
        return "amarelo";

    if (r > 135 && b > 100 && g < 145)
        return "roxo";

    if (r > 155 && g > 60 && g < 175 && b < 110)
        return "laranja";

    if (r > 140 && b > 125 && g > 65)
        return "rosa";

    if (min > 65 && max - min < 40)
        return "cinza";

    return null;
}

function numero(valor) {
    return Number(String(valor).replace(",", "."));
}

function lerPainel(texto, etiquetas) {
    const conteudo = String(texto || "")
        .replace(/\s+/g, " ")
        .trim();

    const placas = conteudo.match(
        /(\d+)\s*(?:pratos?|plates?|placas?)\b/i
    );

    const tempo = conteudo.match(
        /(\d+(?:[.,]\d+)?)\s*h\b/i
    );

    const total = conteudo.match(
        /(\d+(?:[.,]\d+)?)\s*g\b/i
    );

    const filamentos = etiquetas.map(item => {
        const dados = String(item.texto || "").match(
            /\b(PLA|PETG|ABS|ASA|TPU)\b\s*[|:]?\s*(\d+(?:[.,]\d+)?)\s*g\b/i
        );

        if (!dados) return null;

        return {
            material: dados[1].toUpperCase(),
            peso: numero(dados[2]),
            cor: corDoRGB(item.fundo)
        };
    }).filter(Boolean);

    if (!filamentos.length) {
        throw new Error(
            "The print profile did not expose readable filament labels."
        );
    }

    if (filamentos.some(f => !f.cor)) {
        throw new Error(
            "One or more filament colors could not be identified."
        );
    }

    const soma = filamentos.reduce(
        (acc, item) => acc + item.peso,
        0
    );

    const pesoTotal = total ? numero(total[1]) : soma;

    if (Math.abs(soma - pesoTotal) > 0.11) {
        throw new Error(
            "Filament weights do not match the profile total: " +
            soma + " g versus " + pesoTotal + " g."
        );
    }

    if (!tempo) {
        throw new Error(
            "Print time was not available in the selected profile."
        );
    }

    return {
        pratos: placas ? Number(placas[1]) : null,
        tempo: numero(tempo[1]),
        total: pesoTotal,
        etiquetas: filamentos
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
            runtime: process.version
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Method not allowed."
        });
    }

    let browser = null;
    let etapa = "validation";

    try {
        const link = String(req.body?.url || "").trim();

        if (!link || link.length > 1200) {
            return res.status(400).json({
                erro: "Invalid MakerWorld URL."
            });
        }

        const url = new URL(link);

        if (
            url.protocol !== "https:" ||
            !["makerworld.com", "www.makerworld.com"].includes(
                url.hostname.toLowerCase()
            ) ||
            !/^\/(?:[a-z]{2}\/)?models\/\d+(?:[-/]|$)/i.test(
                url.pathname
            )
        ) {
            return res.status(400).json({
                erro: "Only MakerWorld model URLs are accepted."
            });
        }

        const profileId = url.hash.match(
            /profileId-(\d+)/i
        )?.[1] || null;

        etapa = "loading browser dependencies";

        // Lazy loading keeps dependency errors inside try/catch.
        const playwright = require("playwright-core");
        const pacote = await import("@sparticuz/chromium");
        const chromium = pacote.default || pacote;

        etapa = "launching Chromium";

        browser = await playwright.chromium.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
            timeout: 20000
        });

        etapa = "opening MakerWorld";

        const page = await browser.newPage({
            viewport: {
                width: 1440,
                height: 1000
            },
            locale: "pt-BR"
        });

        page.setDefaultTimeout(8000);

        await page.goto(
            url.origin + url.pathname + url.search + url.hash,
            {
                waitUntil: "domcontentloaded",
                timeout: 20000
            }
        );

        etapa = "locating separate-plate profiles";

        await page.waitForTimeout(1200);

        const candidatos = page.locator(
            "text=/Partes separadas|separate parts|separated parts/i"
        );

        const quantidade = await candidatos.count();

        if (!quantidade) {
            throw new Error(
                "No separate-plate print profile was found."
            );
        }

        etapa = "hovering print profiles";

        let selecionado = null;

        for (let i = 0; i < Math.min(quantidade, 12); i++) {
            const candidato = candidatos.nth(i);

            try {
                if (!(await candidato.isVisible())) continue;

                await candidato.scrollIntoViewIfNeeded();
                await candidato.hover();

                await page.waitForTimeout(650);

                const painel = await page.evaluate(() => {
                    const visivel = el => {
                        const rect = el.getBoundingClientRect();
                        const style = getComputedStyle(el);

                        return rect.width > 0 &&
                            rect.height > 0 &&
                            style.visibility !== "hidden" &&
                            style.display !== "none";
                    };

                    const tooltips = [
                        ...document.querySelectorAll(
                            '[role="tooltip"], [id*="mouse-over-popover"]'
                        )
                    ].filter(visivel);

                    for (const tooltip of tooltips) {
                        const etiquetas = [
                            ...tooltip.querySelectorAll(
                                ".filaments-block"
                            )
                        ].filter(visivel);

                        if (!etiquetas.length) continue;

                        return {
                            texto: tooltip.innerText,
                            etiquetas: etiquetas.map(el => ({
                                texto: el.innerText.trim(),
                                fundo: getComputedStyle(el)
                                    .backgroundColor
                            }))
                        };
                    }

                    return null;
                });

                if (!painel) continue;

                // Never use a profile that does not support A1 mini.
                if (!/A1\s*mini/i.test(painel.texto)) {
                    continue;
                }

                try {
                    selecionado = lerPainel(
                        painel.texto,
                        painel.etiquetas
                    );
                    break;
                } catch {
                    continue;
                }
            } catch {
                continue;
            }
        }

        if (!selecionado) {
            throw new Error(
                "No readable separate-plate profile compatible " +
                "with the A1 mini was found. MakerWorld may also " +
                "be blocking automated browser access."
            );
        }

        return res.status(200).json({
            origem: "MakerWorld",
            profileId,
            impressora: "A1 mini",
            ...selecionado
        });

    } catch (erro) {
        console.error(
            "[DUOLAB MAKERWORLD]",
            etapa,
            erro?.stack || erro
        );

        return res.status(422).json({
            erro: erro?.message || "MakerWorld request failed.",
            etapa
        });

    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (erro) {
                console.warn(
                    "[DUOLAB MAKERWORLD] Browser cleanup:",
                    erro?.message
                );
            }
        }
    }
};

module.exports.config = {
    maxDuration: 60
};