"use strict";

const { chromium } = require("playwright-core");
const chromiumBinary = require("@sparticuz/chromium").default;

function identificarCor(css) {
    const valores = String(css || "").match(/[\d.]+/g);
    if (!valores || valores.length < 3) return null;

    const [r, g, b] = valores.slice(0, 3).map(Number);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (min >= 225 && max - min < 35) return "branco";
    if (max <= 65) return "preto";
    if (r > 110 && r > g * 1.4 && r > b * 1.4) return "vermelho";
    if (b > 90 && b > r * 1.3 && b > g * 1.15) return "azul";
    if (g > 90 && g > r * 1.25 && g > b * 1.10) return "verde";
    if (r > 145 && g > 110 && b < 120) return "amarelo";
    if (r > 140 && b > 100 && g < 145) return "roxo";
    if (r > 160 && g > 65 && g < 175 && b < 95) return "laranja";
    if (r > 145 && b > 135 && g > 65) return "rosa";
    if (min > 65 && max - min < 35) return "cinza";

    return null;
}

function numero(texto) {
    return Number(String(texto).replace(",", "."));
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.method !== "POST") {
        return res.status(405).json({ erro: "Metodo nao permitido." });
    }

    let browser = null;

    try {
        const link = String(req.body?.url || "").trim();

        if (link.length > 1000) {
            return res.status(400).json({ erro: "Link muito longo." });
        }

        const url = new URL(link);

        if (
            url.protocol !== "https:" ||
            !["makerworld.com", "www.makerworld.com"].includes(
                url.hostname.toLowerCase()
            ) ||
            !/^\/(?:pt\/)?models\/\d+(?:[-/]|$)/.test(url.pathname)
        ) {
            return res.status(400).json({
                erro: "Informe um link de modelo do MakerWorld."
            });
        }

        const profileId = url.hash.match(/profileId-(\d+)/i)?.[1];

        browser = await chromium.launch({
            args: chromiumBinary.args,
            executablePath: await chromiumBinary.executablePath(),
            headless: true
        });

        const page = await browser.newPage({
            viewport: { width: 1440, height: 1000 },
            locale: "pt-BR",
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/131.0.0.0 Safari/537.36"
        });

        await page.goto(url.href, {
            waitUntil: "domcontentloaded",
            timeout: 25000
        });

        await page.waitForTimeout(2000);

        const perfis = page.getByText(
            /Partes separadas|separate parts|separated parts/i
        );

        const quantidade = await perfis.count();

        if (!quantidade) {
            throw new Error(
                "Perfil com partes separadas nao encontrado no MakerWorld."
            );
        }

        let capturado = null;

        for (let i = 0; i < Math.min(quantidade, 8); i++) {
            const perfil = perfis.nth(i);

            try {
                if (!(await perfil.isVisible())) continue;

                await perfil.hover({ timeout: 5000 });
                await page.waitForTimeout(1000);

                const painel = await page.evaluate(() => {
                    const elementos = [
                        ...document.querySelectorAll(".filaments-block")
                    ].filter(el => {
                        const box = el.getBoundingClientRect();
                        const estilo = getComputedStyle(el);

                        return (
                            box.width > 0 &&
                            box.height > 0 &&
                            estilo.visibility !== "hidden"
                        );
                    });

                    if (!elementos.length) return null;

                    const etiquetas = elementos.map(el => ({
                        texto: el.innerText.trim(),
                        fundo:
                            getComputedStyle(el).backgroundColor ||
                            el.style.background
                    }));

                    const primeiro = elementos[0];

                    let painel = primeiro.closest(
                        '[role="tooltip"], [class*="popover"], [class*="Popper"]'
                    );

                    if (!painel) {
                        painel = primeiro.parentElement?.parentElement
                            ?.parentElement?.parentElement;
                    }

                    return {
                        texto: painel?.innerText || "",
                        etiquetas
                    };
                });

                if (
                    painel &&
                    painel.etiquetas.length &&
                    /A1\s*mini/i.test(painel.texto)
                ) {
                    capturado = painel;
                    break;
                }
            } catch {
                continue;
            }
        }

        if (!capturado) {
            throw new Error(
                "Nao foi encontrado um perfil de placas separadas " +
                "compativel com A1 mini com etiquetas acessiveis."
            );
        }

        const texto = capturado.texto.replace(/\s+/g, " ");

        const pratosMatch = texto.match(
            /(\d+)\s*(?:Pratos?|Plates?|Placas?)/i
        );

        const tempoMatch = texto.match(
            /(\d+(?:[.,]\d+)?)\s*h\b/i
        );

        const pesoMatch = texto.match(
            /(\d+(?:[.,]\d+)?)\s*g\b/i
        );

        const etiquetas = capturado.etiquetas.map(item => {
            const dados = item.texto.match(
                /\b(PLA|PETG|ABS|ASA|TPU)\b\s*[|:]?\s*(\d+(?:[.,]\d+)?)\s*g\b/i
            );

            if (!dados) return null;

            return {
                material: dados[1].toUpperCase(),
                peso: numero(dados[2]),
                cor: identificarCor(item.fundo),
                fundo: item.fundo
            };
        }).filter(Boolean);

        if (!etiquetas.length) {
            throw new Error(
                "As etiquetas apareceram, mas os pesos nao puderam ser lidos."
            );
        }

        if (etiquetas.some(e => !e.cor)) {
            throw new Error(
                "Nao foi possivel identificar todas as cores das etiquetas."
            );
        }

        const soma = etiquetas.reduce(
            (total, item) => total + item.peso,
            0
        );

        const total = pesoMatch
            ? numero(pesoMatch[1])
            : soma;

        if (Math.abs(soma - total) > 0.11) {
            throw new Error(
                "Pesos inconsistentes: etiquetas " +
                soma + " g; total " + total + " g."
            );
        }

        if (!tempoMatch) {
            throw new Error(
                "Tempo total nao identificado no perfil."
            );
        }

        return res.status(200).json({
            origem: "MakerWorld",
            profileId: profileId || null,
            impressora: "A1 mini",
            pratos: pratosMatch ? Number(pratosMatch[1]) : null,
            tempo: numero(tempoMatch[1]),
            total,
            etiquetas
        });

    } catch (erro) {
        return res.status(422).json({
            erro: erro.message || "Falha na leitura do MakerWorld."
        });
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
};

module.exports.config = {
    maxDuration: 60
};