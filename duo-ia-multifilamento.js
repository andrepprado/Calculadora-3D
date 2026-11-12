"use strict";

/*
 * DUOLAB IA MULTIFILAMENTO
 * OCR local, sem API, sem login e sem backend.
 * Pesos somente quando efetivamente identificados.
 */
(() => {
    const $ = id => document.getElementById(id);

    const brl = valor => new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);

    const normalizar = texto => String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const numero = texto => {
        let s = String(texto || "").replace(/\s/g, "");

        if (s.includes(",") && s.includes(".")) {
            if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
                s = s.replace(/\./g, "").replace(",", ".");
            } else {
                s = s.replace(/,/g, "");
            }
        } else if (s.includes(",")) {
            s = s.replace(",", ".");
        }

        return Number(s);
    };

    const escapeHTML = valor => String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const ler = (chave, padrao) => {
        try {
            const valor = JSON.parse(localStorage.getItem(chave));
            return Array.isArray(valor) ? valor : padrao;
        } catch {
            return padrao;
        }
    };

    function obterFilamentos() {
        const padrao = typeof filamentos !== "undefined"
            ? filamentos
            : [];

        return ler("duolab_filamentos_v2", padrao)
            .filter(f => f && f.nome);
    }

    function custoKg(f) {
        for (const campo of [
            "preco",
            "custo",
            "valor",
            "precoKg",
            "custoKg",
            "valorKg",
            "preco_kg",
            "custo_kg"
        ]) {
            const n = numero(f[campo]);

            if (Number.isFinite(n) && n > 0) return n;
        }

        return null;
    }

    function extrairPesos(texto) {
        const linhas = texto.split(/\r?\n/);
        const registros = [];

        const padrao =
            /(\d+(?:[.,]\d+)?)\s*(kg|gramas?|gr|g)\b/gi;

        linhas.forEach((linha, indice) => {
            for (const match of linha.matchAll(padrao)) {
                let peso = numero(match[1]);

                if (!Number.isFinite(peso) || peso <= 0) continue;

                if (normalizar(match[2]) === "kg") peso *= 1000;

                if (peso > 100000) continue;

                registros.push({
                    linha: indice,
                    contexto: linha.trim(),
                    gramas: peso
                });
            }
        });

        return registros;
    }

    function extrairTempos(texto) {
        const resultados = [];
        const padrao =
            /(?:(\d+)\s*(?:d|dias?)\s*)?(?:(\d+)\s*(?:h|horas?)\s*)?(?:(\d+)\s*(?:min|m|minutos?)\b)/gi;

        for (const match of texto.matchAll(padrao)) {
            const dias = Number(match[1] || 0);
            const horas = Number(match[2] || 0);
            const minutos = Number(match[3] || 0);
            const total = dias * 24 + horas + minutos / 60;

            if (total > 0 && total < 10000) {
                resultados.push(total);
            }
        }

        const padraoHoras =
            /(\d+(?:[.,]\d+)?)\s*(?:h|horas?)\b/gi;

        for (const match of texto.matchAll(padraoHoras)) {
            const total = numero(match[1]);

            if (total > 0 && total < 10000) {
                resultados.push(total);
            }
        }

        return [...new Set(resultados)];
    }

    function detectarPlacas(texto) {
        const placas = [];

        for (const match of texto.matchAll(
            /(?:placa|plate)\s*#?\s*(\d+)/gi
        )) {
            const id = Number(match[1]);

            if (!placas.includes(id)) placas.push(id);
        }

        return placas.sort((a, b) => a - b);
    }

    function associarFilamentos(texto, registros) {
        const disponiveis = obterFilamentos();
        const linhas = texto.split(/\r?\n/);

        return registros.map(registro => {
            const inicio = Math.max(0, registro.linha - 2);
            const fim = Math.min(linhas.length, registro.linha + 3);

            const contexto = normalizar(
                linhas.slice(inicio, fim).join(" ")
            );

            const candidatos = disponiveis
                .map(f => ({
                    f,
                    nome: normalizar(f.nome)
                }))
                .filter(item =>
                    item.nome.length >= 3 &&
                    contexto.includes(item.nome)
                )
                .sort((a, b) =>
                    b.nome.length - a.nome.length
                );

            const filamento = candidatos.length
                ? candidatos[0].f
                : null;

            const preco = filamento
                ? custoKg(filamento)
                : null;

            return {
                ...registro,
                filamento,
                preco,
                custo: preco === null
                    ? null
                    : registro.gramas / 1000 * preco
            };
        });
    }

    function elemento(tag, texto, classe) {
        const el = document.createElement(tag);

        if (texto !== undefined) el.textContent = texto;
        if (classe) el.className = classe;

        return el;
    }

    function mostrarResultado(texto, url) {
        const area = $("duoIAResultado");
        area.replaceChildren();
        area.hidden = false;

        const pesos = extrairPesos(texto);
        const tempos = extrairTempos(texto);
        const placas = detectarPlacas(texto);
        const itens = associarFilamentos(texto, pesos);

        area.appendChild(elemento(
            "h3",
            "Resultado da análise"
        ));

        const resumo = elemento("div", "", "duo-ia-resumo");

        resumo.appendChild(elemento(
            "p",
            "Placas identificadas: " +
            (placas.length ? placas.join(", ") : "não identificadas")
        ));

        resumo.appendChild(elemento(
            "p",
            "Tempos identificados: " +
            (tempos.length
                ? tempos.map(t => t.toFixed(2) + " h").join(" | ")
                : "não identificados")
        ));

        resumo.appendChild(elemento(
            "p",
            "Registros de peso encontrados: " + pesos.length
        ));

        area.appendChild(resumo);

        if (url) {
            const p = elemento("p");
            const a = elemento("a", "Abrir modelo 3D");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            p.appendChild(a);
            area.appendChild(p);
        }

        if (!pesos.length) {
            area.appendChild(elemento(
                "p",
                "Não foi possível identificar pesos legíveis na imagem.",
                "duo-ia-aviso"
            ));
        } else {
            const tabela = elemento("table");
            tabela.className = "duo-ia-tabela";

            const thead = elemento("thead");
            const cabecalho = elemento("tr");

            ["Texto identificado", "Peso", "Filamento", "Custo material"]
                .forEach(titulo => {
                    cabecalho.appendChild(elemento("th", titulo));
                });

            thead.appendChild(cabecalho);
            tabela.appendChild(thead);

            const tbody = elemento("tbody");

            itens.forEach(item => {
                const tr = elemento("tr");

                [
                    item.contexto,
                    item.gramas.toFixed(2) + " g",
                    item.filamento
                        ? item.filamento.nome
                        : "Não associado",
                    item.custo === null
                        ? "Não calculado"
                        : brl(item.custo)
                ].forEach(valor => {
                    tr.appendChild(elemento("td", valor));
                });

                tbody.appendChild(tr);
            });

            tabela.appendChild(tbody);
            area.appendChild(tabela);
        }

        const validos = itens.filter(item =>
            item.filamento && item.custo !== null
        );

        const total = validos.reduce(
            (soma, item) => soma + item.custo,
            0
        );

        if (validos.length) {
            area.appendChild(elemento(
                "p",
                "Soma dos custos de material associados: " +
                brl(total),
                "duo-ia-total"
            ));
        }

        area.appendChild(elemento(
            "p",
            "Atenção: pesos totais, pesos por placa e pesos por cor " +
            "podem aparecer simultaneamente no fatiador. " +
            "Por segurança, a soma acima não é tratada como " +
            "custo final quando há possibilidade de duplicidade.",
            "duo-ia-aviso"
        ));

        const detalhes = elemento("details");
        const summary = elemento("summary", "Conferir texto extraído");
        const pre = elemento("pre", texto);

        detalhes.appendChild(summary);
        detalhes.appendChild(pre);
        area.appendChild(detalhes);

        const botao = elemento(
            "button",
            "Copiar dados identificados"
        );

        botao.type = "button";

        botao.addEventListener("click", async () => {
            const dados = {
                modelo: url,
                placas,
                tempos_horas: tempos,
                pesos: itens.map(item => ({
                    contexto: item.contexto,
                    gramas: item.gramas,
                    filamento: item.filamento?.nome || null,
                    custo_material: item.custo
                }))
            };

            try {
                await navigator.clipboard.writeText(
                    JSON.stringify(dados, null, 2)
                );
                status("Dados copiados.", false);
            } catch {
                status("Não foi possível copiar.", true);
            }
        });

        area.appendChild(botao);
    }

    function status(mensagem, erro = false) {
        const area = $("duoIAStatus");
        if (!area) return;

        area.textContent = mensagem;
        area.className = erro
            ? "duo-ia-erro"
            : "duo-ia-sucesso";
    }

    async function analisar() {
        const arquivo = $("duoIAImagem")?.files?.[0];
        const url = $("duoIALink")?.value.trim() || "";
        const botao = $("duoIAAnalisar");

        if (!arquivo) {
            status("Selecione uma imagem do fatiador.", true);
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            status("O arquivo deve ser uma imagem.", true);
            return;
        }

        if (arquivo.size > 20 * 1024 * 1024) {
            status("A imagem deve ter até 20 MB.", true);
            return;
        }

        if (url) {
            try {
                const parsed = new URL(url);

                if (!["https:", "http:"].includes(parsed.protocol)) {
                    throw new Error("Protocolo inválido");
                }
            } catch {
                status("Informe um link HTTP ou HTTPS válido.", true);
                return;
            }
        }

        if (!window.Tesseract) {
            status("O mecanismo OCR não foi carregado.", true);
            return;
        }

        botao.disabled = true;

        let worker = null;

        try {
            status("Carregando IA local. Aguarde...");

            worker = await Tesseract.createWorker(
                "por+eng",
                1,
                {
                    workerPath: "vendor/ocr/worker.min.js",
                    corePath: "vendor/ocr",
                    langPath: "vendor/ocr",
                    gzip: false,
                    logger: evento => {
                        if (
                            evento.status &&
                            typeof evento.progress === "number"
                        ) {
                            status(
                                evento.status + " — " +
                                Math.round(evento.progress * 100) + "%"
                            );
                        }
                    }
                }
            );

            status("Lendo placas, filamentos, tempos e pesos...");

            const resultado = await worker.recognize(arquivo);
            const texto = resultado?.data?.text || "";

            if (!texto.trim()) {
                status(
                    "Não foi possível reconhecer texto na imagem.",
                    true
                );
                return;
            }

            mostrarResultado(texto, url);
            status("Análise concluída.");

        } catch (erro) {
            console.error("[DUOLAB IA]", erro);
            status(
                "Erro na análise local: " + erro.message,
                true
            );
        } finally {
            if (worker) {
                try {
                    await worker.terminate();
                } catch {}
            }

            botao.disabled = false;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        $("duoIAAnalisar")?.addEventListener(
            "click",
            analisar
        );
    });
})();