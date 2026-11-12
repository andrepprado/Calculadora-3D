"use strict";

/* DUOLAB CADASTROS V4 - ACOES INDEPENDENTES */

const FKEY = "duolab_filamentos_v2";
const AKEY = "duolab_adicionais_v2";
const $ = id => document.getElementById(id);

const padraoF = [
["VOOLT - PLA BEGE CAUCASIANO VELVET HIGH SPEED PREMIUM",92.32,"#D6BC9B"],
["VOOLT - PLA BRANCO VELVET HIGH SPEED PREMIUM",92.32,"#F8F8F6"],
["VOOLT - PLA PRETO VELVET HIGH SPEED PREMIUM",92.32,"#181818"],
["VOOLT - PLA VERMELHO VELVET HIGH SPEED PREMIUM",92.32,"#C62828"],
["BAMBU LAB - PLA AMARELO",128.90,"#FFD400"],
["BAMBU LAB - PLA AZUL",128.90,"#0057B8"],
["BAMBU LAB - PLA VERDE",128.90,"#00A651"],
["SUNLU - PETG AZUL BRILHANTE",75.20,"#005EB8"],
["SUNLU - PLA MARMORE BRANCO",120.99,"#ECEAE4"],
["ELEGOO - PLA SILK ROXO E PRETO",113.90,"#5B2A86"],
["ELEGOO - PLA MATTE LARANJA",103.80,"#E67E22"],
["ELEGOO - PLA SILK ROXO E AZUL",113.90,"#5D3FD3"],
["MASTERPRINT - PETG MARROM",83.90,"#6B4423"],
["MASTERPRINT - PETG BEGE",83.90,"#D9C2A0"],
["MASTERPRINT - PETG PRETO",99.99,"#171717"],
["VOOLT - PLA ROSA PÚRPURA HIGH SPEED",97.14,"#A62D78"],
["VOOLT - PLA OUTLET (COR VARIÁVEL)",74.78,"#888888"],
["VOOLT - PLA VERDE V-SILK HIGH SPEED",96.18,"#278F5B"],
["VOOLT - PLA DOURADO V-SILK HIGH SPEED",96.18,"#C8A44B"]
].map(([nome,custo,cor]) => ({nome,custo,cor}));


const padraoA = [
    {
        id: "vela-led-natal",
        nome: "Vela LED - Natal",
        custo: 1.39,
        ativo: true
    }
];

function ler(chave, padrao) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados : padrao;
    } catch {
        return padrao;
    }
}

let fil = ler(FKEY, padraoF);
let adi = ler(AKEY, padraoA);

let editF = -1;
let editA = null;
let confirmacao = null;

const moeda = valor => Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function mensagem(texto, erro = false) {
    const el = $("statusCadastro");
    if (!el) return;

    el.textContent = texto;
    el.style.cssText = [
        "padding:12px 16px",
        "margin:15px 0",
        "border-radius:8px",
        "font-weight:600",
        erro
            ? "background:#fff0f0;color:#a32020"
            : "background:#e8f7f3;color:#006b58"
    ].join(";");
}

function salvar(texto) {
    try {
        localStorage.setItem(FKEY, JSON.stringify(fil));
        localStorage.setItem(AKEY, JSON.stringify(adi));
        render();
        mensagem(texto);
    } catch (erro) {
        mensagem("Erro ao salvar: " + erro.message, true);
    }
}

function criarBotao(texto, acao, estilo = "") {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;

    if (estilo) b.style.cssText = estilo;

    b.addEventListener("click", evento => {
        evento.preventDefault();
        evento.stopPropagation();
        acao();
    });

    return b;
}

function celula(tr, conteudo) {
    const td = document.createElement("td");

    if (conteudo instanceof Node) {
        td.appendChild(conteudo);
    } else {
        td.textContent = String(conteudo);
    }

    tr.appendChild(td);
    return td;
}

function fecharConfirmacao() {
    if (confirmacao) {
        confirmacao.remove();
        confirmacao = null;
    }
}

function confirmarExclusao(tipo, indice, nome, linhaOriginal) {
    fecharConfirmacao();

    const linha = document.createElement("tr");
    linha.className = "duo-confirmacao-inline";

    const td = document.createElement("td");
    td.colSpan = 4;
    td.style.cssText =
        "padding:18px;background:#fff5ed;border-left:4px solid #d97706;";

    const titulo = document.createElement("strong");
    titulo.textContent = "Excluir " + nome + "?";

    const descricao = document.createElement("p");
    descricao.textContent =
        "Esta ação removerá o item do cadastro.";
    descricao.style.margin = "8px 0 12px";

    const acoes = document.createElement("div");
    acoes.style.cssText =
        "display:flex;gap:10px;flex-wrap:wrap";

    const confirmar = criarBotao(
        "Sim, excluir",
        () => {
            if (tipo === "filamento") {
                const atual = fil[indice];

                if (!atual || atual !== referencia) {
                    fecharConfirmacao();
                    mensagem("A lista foi alterada. Selecione o item novamente.", true);
                    return;
                }

                fil.splice(indice, 1);
                editF = -1;
                $("formFil").reset();
            } else {
                const pos = adi.findIndex(a => a.id === referencia.id);

                if (pos < 0) {
                    fecharConfirmacao();
                    mensagem("Adicional não encontrado.", true);
                    return;
                }

                adi.splice(pos, 1);
                editA = null;
                $("formAdi").reset();
            }

            fecharConfirmacao();
            salvar("Excluído com sucesso: " + nome);
        },
        "background:#b42318;color:#fff;padding:10px 16px"
    );

    const cancelar = criarBotao(
        "Cancelar",
        () => {
            fecharConfirmacao();
            mensagem("Exclusão cancelada.");
        },
        "background:#e5e7eb;color:#222;padding:10px 16px"
    );

    // Guarda a referencia exata, sem depender do nome.
    const referencia = tipo === "filamento"
        ? fil[indice]
        : adi[indice];

    acoes.append(confirmar, cancelar);
    td.append(titulo, descricao, acoes);
    linha.appendChild(td);

    linhaOriginal.insertAdjacentElement("afterend", linha);
    confirmacao = linha;
}

function render() {
    const tabelaF = $("tabelaFil");
    const tabelaA = $("tabelaAdi");

    tabelaF.replaceChildren();
    tabelaA.replaceChildren();
    confirmacao = null;

    fil.forEach((f, indice) => {
        const tr = document.createElement("tr");

        celula(tr, f.nome);
        celula(tr, moeda(f.custo));

        const cor = document.createElement("input");
        cor.type = "color";
        cor.value = /^#[0-9a-f]{6}$/i.test(f.cor)
            ? f.cor
            : "#888888";
        cor.disabled = true;

        celula(tr, cor);

        const acoes = document.createElement("div");
        acoes.style.cssText =
            "display:flex;gap:6px;flex-wrap:wrap";

        const editar = criarBotao("Editar", () => {
            fecharConfirmacao();

            editF = indice;
            editA = null;

            $("filNome").value = f.nome;
            $("filCusto").value = f.custo;
            $("filCor").value = cor.value;

            $("filNome").focus();

            $("formFil").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            mensagem("Editando: " + f.nome);
        });

        const excluir = criarBotao("Excluir", () => {
            confirmarExclusao(
                "filamento",
                indice,
                f.nome,
                tr
            );
        });

        acoes.append(editar, excluir);
        celula(tr, acoes);
        tabelaF.appendChild(tr);
    });

    adi.forEach((a, indice) => {
        const tr = document.createElement("tr");

        celula(tr, a.nome);
        celula(tr, moeda(a.custo));
        celula(tr, a.ativo ? "Ativo" : "Inativo");

        const acoes = document.createElement("div");
        acoes.style.cssText =
            "display:flex;gap:6px;flex-wrap:wrap";

        const editar = criarBotao("Editar", () => {
            fecharConfirmacao();

            editA = a.id;
            editF = -1;

            $("adiNome").value = a.nome;
            $("adiCusto").value = a.custo;
            $("adiAtivo").value = String(a.ativo);

            $("adiNome").focus();

            $("formAdi").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            mensagem("Editando: " + a.nome);
        });

        const alternar = criarBotao(
            a.ativo ? "Desativar" : "Ativar",
            () => {
                a.ativo = !a.ativo;
                salvar("Disponibilidade atualizada: " + a.nome);
            }
        );

        const excluir = criarBotao("Excluir", () => {
            confirmarExclusao(
                "adicional",
                indice,
                a.nome,
                tr
            );
        });

        acoes.append(editar, alternar, excluir);
        celula(tr, acoes);
        tabelaA.appendChild(tr);
    });
}

$("formFil").addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = $("filNome").value.trim();
    const custo = Number($("filCusto").value);
    const cor = $("filCor").value;

    if (!nome || !Number.isFinite(custo) || custo < 0) {
        mensagem("Dados inválidos para o filamento.", true);
        return;
    }

    const item = { nome, custo, cor };

    if (editF >= 0 && editF < fil.length) {
        fil[editF] = item;
    } else {
        fil.push(item);
    }

    editF = -1;
    evento.target.reset();
    salvar("Filamento salvo: " + nome);
});

$("formAdi").addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = $("adiNome").value.trim();
    const custo = Number($("adiCusto").value);

    if (!nome || !Number.isFinite(custo) || custo < 0) {
        mensagem("Dados inválidos para o adicional.", true);
        return;
    }

    const id = editA || (
        "adicional-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8)
    );

    const item = {
        id,
        nome,
        custo,
        ativo: $("adiAtivo").value === "true"
    };

    if (editA) {
        const indice = adi.findIndex(a => a.id === editA);

        if (indice >= 0) {
            adi[indice] = item;
        } else {
            adi.push(item);
        }
    } else {
        adi.push(item);
    }

    editA = null;
    evento.target.reset();
    salvar("Adicional salvo: " + nome);
});

$("cancelarFil").addEventListener("click", evento => {
    evento.preventDefault();
    editF = -1;
    $("formFil").reset();
    fecharConfirmacao();
    mensagem("Edição cancelada.");
});

$("cancelarAdi").addEventListener("click", evento => {
    evento.preventDefault();
    editA = null;
    $("formAdi").reset();
    fecharConfirmacao();
    mensagem("Edição cancelada.");
});

render();