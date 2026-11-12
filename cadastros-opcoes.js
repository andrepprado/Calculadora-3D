"use strict";

/* DUOLAB - ADMINISTRACAO DE ADICIONAIS E CANAIS */

(function () {

    const CHAVE_CUSTOS = "duolab_opcoes_fixos_v1";
    const CHAVE_ATIVOS = "duolab_opcoes_ativas_v1";
    const CHAVE_CANAIS = "duolab_canais_v1";

    const $ = id => document.getElementById(id);

    function ler(chave, padrao = {}) {
        try {
            const valor = JSON.parse(localStorage.getItem(chave));
            return valor && typeof valor === "object"
                ? valor
                : padrao;
        } catch {
            return padrao;
        }
    }

    const custos = ler(CHAVE_CUSTOS);
    const ativos = ler(CHAVE_ATIVOS);
    const canais = ler(CHAVE_CANAIS);

    const opcoes = [
        {
            nome: "Chaveiro",
            campo: "valor_chaveiro",
            checkbox: "chkChaveiro",
            padrao: 0.47,
            unidade: "por peça"
        },
        {
            nome: "Imã",
            campo: "valor_ima",
            checkbox: "chkIma",
            padrao: 0.20,
            unidade: "por peça"
        },
        {
            nome: "Acabamento",
            campo: "valor_acabamento_unit",
            checkbox: "chkAcabamento",
            padrao: 1.50,
            unidade: "por peça"
        },
        {
            nome: "Luminária",
            campo: "valor_luminaria",
            checkbox: "chkLuminaria",
            padrao: 21.15,
            unidade: "por peça"
        },
        {
            nome: "Embalagem Plástica",
            campo: "valor_embalagem_plastica_fixa",
            checkbox: "chkPlastica",
            padrao: 0.50,
            unidade: "por peça"
        },
        {
            nome: "Sacola Kraft",
            campo: "valor_sacola_kraft",
            checkbox: "chkSacolaKraft",
            padrao: 1.50,
            unidade: "por peça"
        },
        {
            nome: "Adesivo",
            campo: "valor_adesivo",
            checkbox: "chkAdesivoFixo",
            padrao: 0.20,
            unidade: "por peça"
        },
        {
            nome: "Depreciação - Impressora",
            campo: "depreciacao_impressora_hora",
            checkbox: "chkDepreciacao",
            padrao: 0.65,
            unidade: "parcela do cálculo"
        },
        {
            nome: "Depreciação - Computador",
            campo: "depreciacao_pc_hora",
            checkbox: "chkDepreciacao",
            padrao: 0.25,
            unidade: "parcela do cálculo"
        },
        {
            nome: "Infraestrutura",
            campo: "custo_infra_hora",
            checkbox: "chkCustosFixos",
            padrao: 0.40,
            unidade: "parcela do cálculo"
        }
    ];

    const canaisPadrao = [
        {
            id: "direta",
            nome: "Venda Direta",
            taxa: 0,
            fixa: 0
        },
        {
            id: "shopee",
            nome: "Shopee",
            taxa: 14,
            fixa: 3
        },
        {
            id: "mercadolivre",
            nome: "Mercado Livre",
            taxa: 20,
            fixa: 0
        }
    ];

    function numero(valor) {
        return Number(valor).toFixed(2);
    }

    function criar(tag, texto) {
        const el = document.createElement(tag);
        if (texto !== undefined) el.textContent = texto;
        return el;
    }

    function celula(tr, conteudo) {
        const td = criar("td");
        if (conteudo instanceof Node) td.appendChild(conteudo);
        else td.textContent = String(conteudo);
        tr.appendChild(td);
        return td;
    }

    function inputNumero(valor) {
        const input = criar("input");
        input.type = "number";
        input.min = "0";
        input.step = "0.01";
        input.value = numero(valor);
        input.className = "duo-opcao-numero";
        return input;
    }

    function botao(texto, acao) {
        const b = criar("button", texto);
        b.type = "button";
        b.className = "duo-opcao-salvar";
        b.addEventListener("click", evento => {
            evento.preventDefault();
            evento.stopPropagation();
            acao();
        });
        return b;
    }

    function status(texto, erro = false) {
        const el = $("duoStatusOpcoes");
        if (!el) return;

        el.textContent = texto;
        el.className = erro
            ? "duo-opcoes-erro"
            : "duo-opcoes-sucesso";
    }

    function gravar(chave, dados) {
        try {
            localStorage.setItem(chave, JSON.stringify(dados));
            return true;
        } catch (erro) {
            status("Erro ao salvar: " + erro.message, true);
            return false;
        }
    }

    function renderOpcoes() {
        const corpo = $("duoTabelaOpcoes");
        if (!corpo) return;

        corpo.replaceChildren();

        opcoes.forEach(opcao => {
            const tr = criar("tr");

            celula(tr, opcao.nome);

            const valor = Object.prototype.hasOwnProperty.call(
                custos, opcao.campo
            ) ? custos[opcao.campo] : opcao.padrao;

            const input = inputNumero(valor);
            celula(tr, input);

            celula(tr, opcao.unidade);

            const ativo = criar("input");
            ativo.type = "checkbox";
            ativo.checked = ativos[opcao.checkbox] !== false;
            ativo.setAttribute(
                "aria-label",
                "Disponibilidade de " + opcao.nome
            );

            celula(tr, ativo);

            const salvar = botao("Salvar", () => {
                const valorNovo = Number(input.value);

                if (
                    input.value.trim() === "" ||
                    !Number.isFinite(valorNovo) ||
                    valorNovo < 0
                ) {
                    status("Informe um custo válido.", true);
                    return;
                }

                custos[opcao.campo] = valorNovo;
                ativos[opcao.checkbox] = ativo.checked;

                if (
                    !gravar(CHAVE_CUSTOS, custos) ||
                    !gravar(CHAVE_ATIVOS, ativos)
                ) return;

                status(opcao.nome + " atualizado com sucesso.");
            });

            celula(tr, salvar);
            corpo.appendChild(tr);
        });
    }

    function renderCanais() {
        const corpo = $("duoTabelaCanais");
        if (!corpo) return;

        corpo.replaceChildren();

        canaisPadrao.forEach(canal => {
            const dados = canais[canal.id] || canal;
            const tr = criar("tr");

            celula(tr, canal.nome);

            const taxa = inputNumero(dados.taxa);
            const fixa = inputNumero(dados.fixa);

            taxa.max = "99.99";

            celula(tr, taxa);
            celula(tr, fixa);

            const salvar = botao("Salvar", () => {
                const percentual = Number(taxa.value);
                const custoFixo = Number(fixa.value);

                if (
                    taxa.value.trim() === "" ||
                    fixa.value.trim() === "" ||
                    !Number.isFinite(percentual) ||
                    !Number.isFinite(custoFixo) ||
                    percentual < 0 ||
                    percentual >= 100 ||
                    custoFixo < 0
                ) {
                    status("Valores do canal inválidos.", true);
                    return;
                }

                canais[canal.id] = {
                    id: canal.id,
                    nome: canal.nome,
                    taxa: percentual,
                    fixa: custoFixo
                };

                if (gravar(CHAVE_CANAIS, canais)) {
                    status(canal.nome + " atualizado com sucesso.");
                }
            });

            celula(tr, salvar);
            corpo.appendChild(tr);
        });
    }

    renderOpcoes();
    renderCanais();

})();
/* DUOLAB SINCRONIZACAO CADASTROS V1 */
(function () {
    const original = Storage.prototype.setItem;

    Storage.prototype.setItem = function(chave, valor) {
        const resultado = original.call(this, chave, valor);

        if (
            this === localStorage &&
            (
                chave === "duolab_opcoes_fixos_v1" ||
                chave === "duolab_opcoes_ativas_v1" ||
                chave === "duolab_canais_v1"
            )
        ) {
            original.call(
                this,
                "duolab_cadastros_atualizados",
                String(Date.now())
            );
        }

        return resultado;
    };
})();