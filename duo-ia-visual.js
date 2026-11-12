"use strict";

import {
    Florence2ForConditionalGeneration,
    AutoProcessor,
    RawImage
} from "@huggingface/transformers";

const MODEL_ID = "onnx-community/Florence-2-base-ft";

let modelo = null;
let processador = null;
let carregamento = null;

const $ = id => document.getElementById(id);

function status(mensagem, erro = false) {
    const el = $("duoIAVisualStatus");
    if (!el) return;

    el.textContent = mensagem;
    el.className = erro
        ? "duo-ia-erro"
        : "duo-ia-sucesso";
}

async function carregarModelo() {
    if (modelo && processador) return;

    if (carregamento) return carregamento;

    carregamento = (async () => {
        status("Carregando modelo visual Florence-2...");

        const device = navigator.gpu ? "webgpu" : "wasm";

        modelo =
            await Florence2ForConditionalGeneration.from_pretrained(
                MODEL_ID,
                {
                    device,
                    dtype: device === "webgpu" ? "fp16" : "q8"
                }
            );

        processador = await AutoProcessor.from_pretrained(
            MODEL_ID
        );
    })();

    try {
        await carregamento;
    } catch (erro) {
        modelo = null;
        processador = null;
        throw erro;
    } finally {
        carregamento = null;
    }
}

async function descreverImagem(arquivo) {
    await carregarModelo();

    const url = URL.createObjectURL(arquivo);

    try {
        const imagem = await RawImage.fromURL(url);

        const tarefa = "<MORE_DETAILED_CAPTION>";
        const prompts = processador.construct_prompts(tarefa);

        status("Interpretando visualmente a imagem...");

        const entradas = await processador(
            imagem,
            prompts
        );

        const ids = await modelo.generate({
            ...entradas,
            max_new_tokens: 180
        });

        const texto = processador.batch_decode(
            ids,
            { skip_special_tokens: false }
        )[0];

        const resultado = processador.post_process_generation(
            texto,
            tarefa,
            imagem.size
        );

        return String(
            resultado[tarefa] || texto || ""
        ).trim();
    } finally {
        URL.revokeObjectURL(url);
    }
}

function filamentosCadastrados() {
    try {
        const dados = JSON.parse(
            localStorage.getItem("duolab_filamentos_v2")
        );

        if (Array.isArray(dados)) return dados;
    } catch {}

    return typeof filamentos !== "undefined"
        ? filamentos
        : [];
}

function normalizar(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function associarFilamentos(descricao) {
    const texto = normalizar(descricao);

    return filamentosCadastrados()
        .filter(f => {
            if (!f || !f.nome) return false;

            const nome = normalizar(f.nome);

            return nome.length >= 3 && texto.includes(nome);
        })
        .map(f => f.nome);
}

function apresentarResultado(descricao) {
    const area = $("duoIAVisualResultado");

    if (!area) return;

    area.replaceChildren();

    const titulo = document.createElement("h3");
    titulo.textContent = "Interpretação visual da IA";

    const conteudo = document.createElement("p");
    conteudo.textContent = descricao ||
        "A IA não conseguiu descrever a imagem.";

    area.append(titulo, conteudo);

    const identificados = associarFilamentos(descricao);

    const subtitulo = document.createElement("h4");
    subtitulo.textContent = "Correspondência com o cadastro";

    const correspondencias = document.createElement("p");

    correspondencias.textContent = identificados.length
        ? identificados.join(" | ")
        : "Nenhum nome de filamento foi confirmado " +
          "pela descrição visual.";

    area.append(subtitulo, correspondencias);

    const aviso = document.createElement("p");
    aviso.className = "duo-ia-aviso";
    aviso.textContent =
        "A descrição visual é uma estimativa da IA. " +
        "Os pesos e tempos devem ser obtidos dos dados " +
        "legíveis do fatiador. A associação visual não " +
        "substitui a identificação exata do material.";

    area.appendChild(aviso);
    area.hidden = false;
}

async function analisarVisualmente() {
    const arquivo = $("duoIAImagem")?.files?.[0];
    const botao = $("duoIAVisualBotao");

    if (!arquivo) {
        status("Selecione a imagem do fatiador.", true);
        return;
    }

    if (!arquivo.type.startsWith("image/")) {
        status("Selecione um arquivo de imagem.", true);
        return;
    }

    if (arquivo.size > 20 * 1024 * 1024) {
        status("A imagem deve ter no maximo 20 MB.", true);
        return;
    }

    botao.disabled = true;

    try {
        const descricao = await descreverImagem(arquivo);

        apresentarResultado(descricao);
        status("Interpretação visual concluída.");

    } catch (erro) {
        console.error("[DUOLAB IA VISUAL]", erro);

        status(
            "Não foi possível executar a IA visual: " +
            erro.message,
            true
        );
    } finally {
        botao.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    $("duoIAVisualBotao")?.addEventListener(
        "click",
        analisarVisualmente
    );
});