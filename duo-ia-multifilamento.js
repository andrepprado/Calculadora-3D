"use strict";

/*
 * DUOLAB IA MULTIFILAMENTO V4
 *
 * Entrada:
 *   - imagem do fatiador
 *   - link do modelo
 *
 * Saida:
 *   - pratos
 *   - tempo total
 *   - peso total
 *   - peso por cor
 *   - associacao com filamentos cadastrados
 *   - preenchimento da calculadora
 *
 * O calculo financeiro permanece no script.js.
 */

(() => {
    const $ = id => document.getElementById(id);

    const CORES = {
        branco: ["branco", "white"],
        vermelho: ["vermelho", "red"],
        preto: ["preto", "black"],
        azul: ["azul", "blue"],
        verde: ["verde", "green"],
        amarelo: ["amarelo", "yellow"],
        rosa: ["rosa", "pink"],
        roxo: ["roxo", "purple"],
        laranja: ["laranja", "orange"],
        marrom: ["marrom", "brown"],
        cinza: ["cinza", "gray", "grey"],
        bege: ["bege", "beige"],
        dourado: ["dourado", "gold"]
    };

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function numero(valor) {
        let texto = String(valor || "").trim();

        if (texto.includes(",") && texto.includes(".")) {
            if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
                texto = texto.replace(/\./g, "").replace(",", ".");
            } else {
                texto = texto.replace(/,/g, "");
            }
        } else {
            texto = texto.replace(",", ".");
        }

        return Number(texto);
    }

    function informar(mensagem, erro = false) {
        const area = $("duoIAStatus");

        if (!area) return;

        area.textContent = mensagem;
        area.className = erro
            ? "duo-ia-erro"
            : "duo-ia-sucesso";
    }

    function extrairTempo(texto) {
        const t = normalizar(texto);

        // Prioridade para horas decimais.
        // Exemplo: 2.8 h = 2 horas e 48 minutos.
        const decimal = t.match(
            /\b(\d{1,3}[.,]\d{1,2})\s*(?:h|horas?)\b/
        );

        if (decimal) {
            const valor = numero(decimal[1]);

            if (valor > 0 && valor < 1000) {
                return valor;
            }
        }

        // Exemplo: 2h 48min.
        const horasMinutos = t.match(
            /\b(\d{1,3})\s*h(?:oras?)?\s*(\d{1,2})\s*(?:m|min)\b/
        );

        if (horasMinutos) {
            return Number(horasMinutos[1]) +
                Number(horasMinutos[2]) / 60;
        }

        // Exemplo: 02:48 h.
        const relogio = t.match(
            /\b(\d{1,3}):(\d{2})\s*(?:h|horas?)\b/
        );

        if (relogio && Number(relogio[2]) < 60) {
            return Number(relogio[1]) +
                Number(relogio[2]) / 60;
        }

        const horas = t.match(
            /\b(\d{1,3})\s*(?:h|horas?)\b/
        );

        return horas ? Number(horas[1]) : null;
    }

    function extrairPratos(texto) {
        const t = normalizar(texto);

        const match = t.match(
            /\b(\d{1,3})\s*(?:pratos?|plates?|placas?)\b/
        );

        return match ? Number(match[1]) : null;
    }

    function extrairPesoTotal(texto) {
        const t = normalizar(texto);

        const match = t.match(
            /\b(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramas?)\b/
        );

        return match ? numero(match[1]) : null;
    }

    function detectarCor(texto) {
        const t = normalizar(texto);

        for (const [cor, aliases] of Object.entries(CORES)) {
            if (aliases.some(alias =>
                new RegExp(
                    "(^|[^a-z])" + alias + "([^a-z]|$)"
                ).test(t)
            )) {
                return cor;
            }
        }

        return null;
    }

    function hexRGB(hex) {
        const valor = String(hex || "").replace("#", "");

        if (!/^[0-9a-f]{6}$/i.test(valor)) return null;

        return [
            parseInt(valor.slice(0, 2), 16),
            parseInt(valor.slice(2, 4), 16),
            parseInt(valor.slice(4, 6), 16)
        ];
    }

    function distancia(a, b) {
        return Math.sqrt(
            (a[0] - b[0]) ** 2 +
            (a[1] - b[1]) ** 2 +
            (a[2] - b[2]) ** 2
        );
    }

    function corPorRGB(rgb) {
        if (!rgb) return null;

        const [r, g, b] = rgb;

        if (r > 210 && g > 210 && b > 210) {
            return "branco";
        }

        if (r < 65 && g < 65 && b < 65) {
            return "preto";
        }

        if (r > g * 1.45 && r > b * 1.45 && r > 100) {
            return "vermelho";
        }

        if (b > r * 1.35 && b > g * 1.15) {
            return "azul";
        }

        if (g > r * 1.25 && g > b * 1.10) {
            return "verde";
        }

        return null;
    }

    function obterFilamentos() {
        if (typeof filamentos !== "undefined" &&
            Array.isArray(filamentos)) {
            return filamentos;
        }

        try {
            const dados = JSON.parse(
                localStorage.getItem("duolab_filamentos_v2")
            );

            return Array.isArray(dados) ? dados : [];
        } catch {
            return [];
        }
    }

    function selecionarFilamento(cor, material) {
        const lista = obterFilamentos();

        const candidatos = lista
            .map((filamento, indice) => {
                const nome = normalizar(filamento.nome);
                const aliases = CORES[cor] || [cor];

                const corresponde = aliases.some(alias =>
                    new RegExp(
                        "(^|[^a-z])" + alias + "([^a-z]|$)"
                    ).test(nome)
                );

                const materialCompativel = !material ||
                    nome.includes(normalizar(material));

                return {
                    indice,
                    filamento,
                    corresponde,
                    materialCompativel
                };
            })
            .filter(item =>
                item.corresponde && item.materialCompativel
            );

        if (!candidatos.length) return null;

        // Escolhe a primeira correspondencia do cadastro,
        // sem inventar marca ou material.
        return candidatos[0];
    }

    function formatarTempo(horas) {
        const minutos = Math.round(horas * 60);

        const h = Math.floor(minutos / 60);
        const m = minutos % 60;

        return String(h).padStart(2, "0") +
            ":" +
            String(m).padStart(2, "0");
    }

    function prepararCanvas(imagem, modo = "normal") {
        const canvas = document.createElement("canvas");
        const escala = Math.max(
            2,
            Math.min(4, 1800 / imagem.width)
        );

        canvas.width = Math.round(imagem.width * escala);
        canvas.height = Math.round(imagem.height * escala);

        const ctx = canvas.getContext(
            "2d",
            { willReadFrequently: true }
        );

        ctx.drawImage(
            imagem,
            0,
            0,
            canvas.width,
            canvas.height
        );

        if (modo !== "normal") {
            const pixels = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );

            for (let i = 0; i < pixels.data.length; i += 4) {
                const r = pixels.data[i];
                const g = pixels.data[i + 1];
                const b = pixels.data[i + 2];

                let v = 0.299 * r +
                    0.587 * g +
                    0.114 * b;

                if (modo === "contraste") {
                    v = v > 115 ? 255 : 0;
                } else {
                    v = 255 - v;
                    v = v > 115 ? 255 : 0;
                }

                pixels.data[i] = v;
                pixels.data[i + 1] = v;
                pixels.data[i + 2] = v;
            }

            ctx.putImageData(pixels, 0, 0);
        }

        return canvas;
    }

    async function carregarImagem(arquivo) {
        const url = URL.createObjectURL(arquivo);

        try {
            const imagem = new Image();
            imagem.src = url;
            await imagem.decode();
            return imagem;
        } finally {
            // O bitmap decodificado permanece disponivel.
            URL.revokeObjectURL(url);
        }
    }

    async function executarOCR(arquivo) {
        if (!window.Tesseract) {
            throw new Error(
                "O mecanismo de leitura OCR nao foi carregado."
            );
        }

        const imagem = await carregarImagem(arquivo);

        informar("LENDO DADOS DO FATIADOR...");

        const worker = await Tesseract.createWorker(
            "por+eng",
            1,
            {
                workerPath: "vendor/ocr/worker.min.js",
                corePath: "vendor/ocr",
                langPath: "vendor/ocr",
                gzip: false
            }
        );

        try {
            const resultados = [];

            for (const modo of [
                "normal",
                "contraste",
                "invertido"
            ]) {
                informar(
                    "IDENTIFICANDO PLACAS, TEMPO E FILAMENTOS..."
                );

                const canvas = prepararCanvas(imagem, modo);
                const resultado = await worker.recognize(canvas);

                resultados.push(resultado.data.text || "");
            }

            return {
                imagem,
                textos: resultados
            };
        } finally {
            await worker.terminate();
        }
    }

    function localizarFaixasColoridas(imagem) {
        const canvas = document.createElement("canvas");
        canvas.width = imagem.naturalWidth;
        canvas.height = imagem.naturalHeight;

        const ctx = canvas.getContext(
            "2d",
            { willReadFrequently: true }
        );

        ctx.drawImage(imagem, 0, 0);

        const w = canvas.width;
        const h = canvas.height;

        const dados = ctx.getImageData(
            0,
            0,
            w,
            h
        ).data;

        const linhas = [];

        // Examina o trecho inferior da imagem,
        // onde o Bambu Studio costuma mostrar os filamentos.
        for (
            let y = Math.floor(h * 0.35);
            y < h;
            y += Math.max(1, Math.floor(h / 120))
        ) {
            const segmentos = [];
            let inicio = -1;
            let anterior = null;

            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;

                const rgb = [
                    dados[i],
                    dados[i + 1],
                    dados[i + 2]
                ];

                const cor = corPorRGB(rgb);

                if (cor && cor === anterior) {
                    continue;
                }

                if (anterior && inicio >= 0) {
                    if (x - inicio >= 12) {
                        segmentos.push({
                            x: inicio,
                            largura: x - inicio,
                            cor: anterior
                        });
                    }
                }

                inicio = cor ? x : -1;
                anterior = cor;
            }

            if (segmentos.length >= 2) {
                linhas.push({
                    y,
                    segmentos
                });
            }
        }

        return linhas;
    }

    function extrairFilamentos(textos, imagem) {
        const encontrados = new Map();

        // Prioridade para textos que informam explicitamente
        // material + cor + peso.
        const padrao = /\b(PLA|PETG|ABS|ASA|TPU)\s*([a-zà-ÿ]*)?\s*(\d+(?:[.,]\d+)?)\s*g\b/gi;

        for (const texto of textos) {
            for (const match of texto.matchAll(padrao)) {
                const material = match[1].toUpperCase();
                const peso = numero(match[3]);
                const cor = detectarCor(match[2]);

                if (
                    cor &&
                    peso > 0 &&
                    peso < 100000
                ) {
                    encontrados.set(cor, {
                        cor,
                        material,
                        peso
                    });
                }
            }
        }

        // OCR pode reconhecer apenas "PLA 15 g".
        // Neste caso, associa pela ordem das etiquetas
        // somente se as tres quantidades forem legiveis
        // e houver evidencia visual das cores.
        if (encontrados.size === 0) {
            const candidatos = [];

            for (const texto of textos) {
                const encontradosTexto = [
                    ...texto.matchAll(padrao)
                ];

                if (encontradosTexto.length > candidatos.length) {
                    candidatos.length = 0;

                    encontradosTexto.forEach(match => {
                        candidatos.push({
                            material: match[1].toUpperCase(),
                            peso: numero(match[3])
                        });
                    });
                }
            }

            const faixas = localizarFaixasColoridas(imagem);

            // Ordem esperada apenas quando o OCR encontra
            // tres etiquetas e os pesos conferem com o total.
            if (candidatos.length === 3 && faixas.length) {
                const pesos = candidatos.map(c => c.peso);

                if (pesos.every(p => p > 0)) {
                    const cores = [
                        "branco",
                        "vermelho",
                        "preto"
                    ];

                    const evidencias = faixas.some(linha => {
                        const detectadas = linha.segmentos
                            .map(s => s.cor);

                        return cores.every(c =>
                            detectadas.includes(c)
                        );
                    });

                    if (evidencias) {
                        candidatos.forEach((item, indice) => {
                            encontrados.set(cores[indice], {
                                ...item,
                                cor: cores[indice]
                            });
                        });
                    }
                }
            }
        }

        return [...encontrados.values()];
    }

    function consolidar(textos, imagem) {
        const texto = textos.join("\n");

        const tempos = textos
            .map(extrairTempo)
            .filter(v => v !== null && v > 0);

        const pratos = textos
            .map(extrairPratos)
            .find(v => v !== null) ?? null;

        const pesosTotais = textos
            .map(extrairPesoTotal)
            .filter(v => v !== null && v > 0);

        const filamentos = extrairFilamentos(
            textos,
            imagem
        );

        const tempo = tempos.length
            ? Math.min(...tempos)
            : null;

        const total = pesosTotais.length
            ? Math.min(...pesosTotais)
            : null;

        const soma = filamentos.reduce(
            (acc, item) => acc + item.peso,
            0
        );

        const pesoConfere = total !== null &&
            Math.abs(soma - total) < 0.11;

        return {
            pratos,
            tempo,
            total,
            soma,
            pesoConfere,
            filamentos,
            texto
        };
    }

    function preencherCalculadora(dados) {
        if (!dados.pesoConfere) {
            throw new Error(
                "Os pesos por cor nao conferem com o total."
            );
        }

        if (!dados.tempo || !dados.filamentos.length) {
            throw new Error(
                "Tempo ou filamentos nao identificados."
            );
        }

        const associados = dados.filamentos.map(item => ({
            ...item,
            cadastro: selecionarFilamento(
                item.cor,
                item.material
            )
        }));

        const ausentes = associados.filter(
            item => !item.cadastro
        );

        if (ausentes.length) {
            throw new Error(
                "Filamento nao encontrado no cadastro: " +
                ausentes.map(item =>
                    item.material + " " + item.cor
                ).join(", ")
            );
        }

        const toggle = $("modoMultipartes");
        const area = $("bandejasArea");

        if (!toggle || !area) {
            throw new Error(
                "Calculadora multipartes indisponivel."
            );
        }

        toggle.checked = true;
        toggle.dispatchEvent(new Event(
            "change",
            { bubbles: true }
        ));

        const adicionar = $("duoAdicionarBandeja");

        while (
            area.querySelectorAll(".duo-bandeja").length <
            associados.length
        ) {
            if (!adicionar) {
                throw new Error(
                    "Nao foi possivel adicionar bandejas."
                );
            }

            adicionar.click();
        }

        const linhas = [
            ...area.querySelectorAll(".duo-bandeja")
        ];

        // Cada cor representa um componente de custo.
        // O tempo total entra uma unica vez para nao
        // triplicar energia e outros custos.
        associados.forEach((item, indice) => {
            const linha = linhas[indice];

            const select = linha.querySelector("select");
            const peso = linha.querySelector(".bandeja-peso");
            const tempo = linha.querySelector(".bandeja-tempo");

            select.value = String(
                item.cadastro.indice
            );

            peso.value = String(item.peso);

            tempo.value = indice === 0
                ? formatarTempo(dados.tempo)
                : "00:00";

            select.dispatchEvent(new Event(
                "change",
                { bubbles: true }
            ));
        });

        // Zera as bandejas que nao participam do modelo.
        linhas.slice(associados.length).forEach(linha => {
            const peso = linha.querySelector(".bandeja-peso");
            const tempo = linha.querySelector(".bandeja-tempo");

            if (peso) peso.value = "0";
            if (tempo) tempo.value = "00:00";
        });

        // Tres pratos nao significam tres produtos.
        // Mantem quantidade 1, ate que o modelo informe
        // explicitamente a quantidade de unidades.
        const quantidade = $("quantidade");

        if (quantidade) {
            quantidade.value = "1";
        }

        const quantidadeMulti = $(
            "duoRodapeMultipartes"
        )?.querySelector('input[type="number"]');

        if (quantidadeMulti) {
            quantidadeMulti.value = "1";
        }

        if (typeof calcular === "function") {
            calcular();
        }

        return associados;
    }

    function mostrarResultado(dados, associados, url) {
        const area = $("duoIAResultado");

        if (!area) return;

        area.hidden = false;
        area.replaceChildren();

        const titulo = document.createElement("h3");
        titulo.textContent = "ANALISE MULTIFILAMENTO";

        area.appendChild(titulo);

        const resumo = document.createElement("p");

        resumo.textContent =
            "PRATOS: " + (dados.pratos ?? "NAO IDENTIFICADO") +
            " | TEMPO: " + dados.tempo.toLocaleString("pt-BR") + " H" +
            " | MATERIAL: " + dados.total.toLocaleString("pt-BR") + " G";

        area.appendChild(resumo);

        const tabela = document.createElement("table");
        tabela.className = "duo-ia-tabela";

        const cabecalho = document.createElement("tr");

        ["FILAMENTO", "PESO", "CUSTO/KG"].forEach(texto => {
            const th = document.createElement("th");
            th.textContent = texto;
            cabecalho.appendChild(th);
        });

        tabela.appendChild(cabecalho);

        associados.forEach(item => {
            const tr = document.createElement("tr");

            const valores = [
                item.cadastro.filamento.nome,
                item.peso.toLocaleString("pt-BR") + " g",
                Number(
                    item.cadastro.filamento.custo
                ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                })
            ];

            valores.forEach(valor => {
                const td = document.createElement("td");
                td.textContent = valor;
                tr.appendChild(td);
            });

            tabela.appendChild(tr);
        });

        area.appendChild(tabela);

        const resultado = document.createElement("p");

        resultado.textContent =
            "CALCULADORA MULTIPARTES PREENCHIDA. " +
            "O ORCAMENTO FOI RECALCULADO COM OS " +
            "CUSTOS CADASTRADOS.";

        area.appendChild(resultado);

        if (url) {
            const link = document.createElement("a");

            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "ABRIR MODELO 3D";

            area.appendChild(link);
        }
    }

    async function analisar() {
        const arquivo = $("duoIAImagem")?.files?.[0];
        const link = $("duoIALink")?.value.trim() || "";
        const botao = $("duoIAAnalisar");

        if (!arquivo) {
            informar("SELECIONE UMA IMAGEM.", true);
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            informar("ARQUIVO INVALIDO.", true);
            return;
        }

        if (arquivo.size > 20 * 1024 * 1024) {
            informar("LIMITE DE 20 MB.", true);
            return;
        }

        if (link) {
            try {
                const url = new URL(link);

                if (!["https:", "http:"].includes(url.protocol)) {
                    throw new Error("URL invalida");
                }
            } catch {
                informar("LINK INVALIDO.", true);
                return;
            }
        }

        botao.disabled = true;

        try {
            const leitura = await executarOCR(arquivo);

            const dados = consolidar(
                leitura.textos,
                leitura.imagem
            );

            if (!dados.pesoConfere) {
                throw new Error(
                    "Leitura incompleta: pesos por cor " +
                    "nao conferem com o total. " +
                    "Nenhum custo foi preenchido automaticamente."
                );
            }

            const associados = preencherCalculadora(dados);

            mostrarResultado(
                dados,
                associados,
                link
            );

            informar(
                "ANALISE CONCLUIDA. ORCAMENTO ATUALIZADO."
            );

        } catch (erro) {
            console.error("[DUOLAB IA]", erro);

            informar(erro.message, true);
        } finally {
            botao.disabled = false;
        }
    }

    function iniciar() {
        const botao = $("duoIAAnalisar");

        if (!botao) return;

        // Substitui o botao para remover o listener antigo.
        const novo = botao.cloneNode(true);

        botao.replaceWith(novo);

        novo.addEventListener("click", analisar);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true }
        );
    } else {
        iniciar();
    }
})();