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

        etapa = "loading print profiles";

        // The "All" tab must remain available even when
        // no A1 mini-specific profile exists.
        for (const nome of [/^Todos$/i, /^All$/i]) {
            try {
                const aba = page.getByText(nome, { exact: true }).first();

                if (await aba.isVisible({ timeout: 1500 })) {
                    await aba.click({ timeout: 2000 });
                    break;
                }
            } catch {}
        }

        await page.waitForTimeout(1800);

        etapa = "finding available profile cards";

        const tituloSeparado =
            /Partes separadas|Pe[cç]as separadas|separate parts|separated parts/i;

        let candidatos = page.getByText(tituloSeparado);

        // MakerWorld can render the selected profile with
        // a dynamic class. Its stable selection class is "active".
        let quantidade = await candidatos.count();

        if (!quantidade) {
            candidatos = page.locator(".active");
            quantidade = await candidatos.count();
        }

        // Wait for client-side rendering before giving up.
        if (!quantidade) {
            for (let tentativa = 0; tentativa < 8; tentativa++) {
                await page.waitForTimeout(1000);

                candidatos = page.getByText(tituloSeparado);
                quantidade = await candidatos.count();

                if (quantidade) break;

                candidatos = page.locator(".active");
                quantidade = await candidatos.count();

                if (quantidade) break;
            }
        }

        if (!quantidade) {
            const textoPagina = (
                await page.locator("body").innerText().catch(() => "")
            ).slice(0, 600);

            throw new Error(
                "MakerWorld did not expose print profile cards. " +
                "Page content: " + textoPagina
            );
        }

        etapa = "hovering profile cards";

        const perfis = [];

        for (let i = 0; i < Math.min(quantidade, 24); i++) {
            const candidato = candidatos.nth(i);

            try {
                if (!(await candidato.isVisible())) continue;

                await candidato.scrollIntoViewIfNeeded({
                    timeout: 3000
                });

                await candidato.hover({ timeout: 4000 });

                await page.waitForTimeout(750);

                const painel = await page.evaluate(() => {
                    const visivel = el => {
                        if (!el) return false;

                        const rect = el.getBoundingClientRect();
                        const style = getComputedStyle(el);

                        return (
                            rect.width > 0 &&
                            rect.height > 0 &&
                            style.display !== "none" &&
                            style.visibility !== "hidden"
                        );
                    };

                    const etiquetas = [
                        ...document.querySelectorAll(
                            ".filaments-block"
                        )
                    ].filter(visivel);

                    if (!etiquetas.length) {
                        return null;
                    }

                    const primeiro = etiquetas[0];

                    const painel =
                        primeiro.closest('[role="tooltip"]') ||
                        primeiro.closest(
                            '[id*="mouse-over-popover"]'
                        ) ||
                        primeiro.closest('[class*="MuiPopper"]') ||
                        primeiro.closest('[class*="Popper"]') ||
                        primeiro.closest(".filaments_detail")
                            ?.parentElement?.parentElement ||
                        primeiro.parentElement?.parentElement
                            ?.parentElement?.parentElement;

                    if (!painel || !visivel(painel)) {
                        return null;
                    }

                    return {
                        texto: painel.innerText || "",
                        etiquetas: etiquetas.map(el => ({
                            texto: el.innerText.trim(),
                            fundo: getComputedStyle(el)
                                .backgroundColor
                        }))
                    };
                });

                if (!painel || !painel.etiquetas.length) {
                    continue;
                }

                try {
                    const dados = lerPainel(
                        painel.texto,
                        painel.etiquetas
                    );

                    const compativelA1Mini =
                        /A1\s*mini/i.test(painel.texto);

                    const placasSeparadas =
                        tituloSeparado.test(painel.texto) ||
                        (dados.pratos !== null && dados.pratos > 1);

                    const score =
                        (placasSeparadas ? 100 : 0) +
                        (compativelA1Mini ? 50 : 0) +
                        (dados.pratos > 1 ? 20 : 0) +
                        dados.etiquetas.length;

                    perfis.push({
                        ...dados,
                        compativelA1Mini,
                        placasSeparadas,
                        score
                    });

                } catch (erro) {
                    console.warn(
                        "[DUOLAB MAKERWORLD] Profile skipped:",
                        erro.message
                    );
                }

            } catch (erro) {
                console.warn(
                    "[DUOLAB MAKERWORLD] Hover failed:",
                    erro.message
                );
            }
        }

        if (!perfis.length) {
            throw new Error(
                "No readable print profile was found after hovering. " +
                "MakerWorld may be restricting automated access."
            );
        }

        // Prefer separate plates and A1 mini compatibility.
        // If unavailable, accept a general separate-plate profile.
        perfis.sort((a, b) => b.score - a.score);

        const selecionado = perfis[0];

        return res.status(200).json({
            origem: "MakerWorld",
            profileId,
            impressora: selecionado.compativelA1Mini
                ? "A1 mini"
                : "General profile",
            compativelA1Mini:
                selecionado.compativelA1Mini,
            perfilGeral:
                !selecionado.compativelA1Mini,
            placasSeparadas:
                selecionado.placasSeparadas,
            pratos: selecionado.pratos,
            tempo: selecionado.tempo,
            total: selecionado.total,
            etiquetas: selecionado.etiquetas
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