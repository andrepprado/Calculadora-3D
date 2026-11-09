(function () {
    "use strict";

    const MARCAS = [
        "BAMBU LAB",
        "ELEGOO",
        "MASTERPRINT",
        "SUNLU",
        "VOOLT"
    ];

    const CORES = [
        "BEGE CAUCASIANO",
        "MARMORE BRANCO",
        "ROXO E PRETO",
        "ROXO E AZUL",
        "AZUL BRILHANTE",
        "ROSA PURPURA",
        "AMARELO",
        "LARANJA",
        "VERMELHO",
        "DOURADO",
        "MARROM",
        "BRANCO",
        "PRETO",
        "VERDE",
        "AZUL",
        "BEGE",
        "ROSA",
        "OUTLET"
    ];

    function normalizar(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function obterCadastro() {
        const candidatos = [
            window.filamentos,
            window.FILAMENTOS,
            window.listaFilamentos,
            window.filamentosDisponiveis
        ];

        return candidatos.find(Array.isArray) || [];
    }

    function identificar(option) {
        const cadastro = obterCadastro();
        const valor = option.value;
        const indice = Number(valor);

        let registro = null;

        if (Number.isInteger(indice) &&
            indice >= 0 &&
            indice < cadastro.length) {
            registro = cadastro[indice];
        }

        if (!registro) {
            registro = cadastro.find(item =>
                String(item.id ?? item.value ?? "") === valor
            );
        }

        const textoOriginal =
            option.dataset.duolabOriginal ||
            option.textContent;

        const descricao = normalizar([
            textoOriginal,
            registro?.nome,
            registro?.marca,
            registro?.cor,
            registro?.tipo,
            registro?.material,
            registro?.descricao,
            registro?.name,
            registro?.type
        ].filter(Boolean).join(" "));

        const marca = MARCAS.find(m =>
            descricao.includes(m)
        ) || "";

        const cor = CORES.find(c =>
            descricao.includes(c)
        ) || "";

        let tipo = "";

        if (/\bPETG\b/.test(descricao)) {
            tipo = "PETG";
        } else if (/\bPLA\b/.test(descricao)) {
            tipo = "PLA";
        } else if (marca === "MASTERPRINT") {
            tipo = "PETG";
        } else if (
            marca === "BAMBU LAB" ||
            marca === "ELEGOO" ||
            marca === "VOOLT"
        ) {
            tipo = "PLA";
        } else if (marca === "SUNLU") {
            tipo = cor === "AZUL BRILHANTE"
                ? "PETG"
                : "PLA";
        }

        return {
            marca,
            cor,
            tipo,
            texto: [marca, cor, tipo]
                .filter(Boolean)
                .join(" - ")
        };
    }

    function ehSeletorFilamento(select) {
        const opcoes = Array.from(select.options);

        const quantidade = opcoes.filter(option =>
            MARCAS.some(marca =>
                normalizar(
                    option.dataset.duolabOriginal ||
                    option.textContent
                ).includes(marca)
            )
        ).length;

        if (quantidade >= 2) return true;

        const identificador = normalizar(
            (select.id || "") + " " +
            (select.name || "") + " " +
            (select.className || "")
        );

        return /FILAMENTO|BANDEJA/.test(identificador) &&
            quantidade >= 1;
    }

    function organizar(select) {
        if (!ehSeletorFilamento(select)) return;

        const opcoes = Array.from(select.options);

        if (!opcoes.length) return;

        const valorSelecionado = select.value;

        const itens = opcoes.filter(option =>
            option.value !== "" &&
            !option.disabled
        );

        if (!itens.length) return;

        const grupos = {
            PLA: document.createElement("optgroup"),
            PETG: document.createElement("optgroup"),
            OUTROS: document.createElement("optgroup")
        };

        grupos.PLA.label = "PLA";
        grupos.PETG.label = "PETG";
        grupos.OUTROS.label = "OUTROS";

        const fragmento = document.createDocumentFragment();

        opcoes.filter(option =>
            option.value === "" || option.disabled
        ).forEach(option => fragmento.appendChild(option));

        for (const option of itens) {
            if (!option.dataset.duolabOriginal) {
                option.dataset.duolabOriginal =
                    option.textContent.trim();
            }

            const info = identificar(option);

            if (info.marca && info.cor && info.tipo) {
                option.textContent = info.texto;
            }

            option.style.backgroundColor = "#ffffff";
            option.style.color = "#17243a";

            const destino = grupos[info.tipo] ||
                grupos.OUTROS;

            destino.appendChild(option);
        }

        for (const tipo of ["PLA", "PETG", "OUTROS"]) {
            const grupo = grupos[tipo];

            if (!grupo.children.length) continue;

            const ordenadas = Array.from(grupo.children)
                .sort((a, b) =>
                    a.textContent.localeCompare(
                        b.textContent,
                        "pt-BR",
                        { sensitivity: "base" }
                    )
                );

            grupo.replaceChildren(...ordenadas);
            fragmento.appendChild(grupo);
        }

        select.replaceChildren(fragmento);

        if (Array.from(select.options).some(o =>
            o.value === valorSelecionado
        )) {
            select.value = valorSelecionado;
        }

        select.style.backgroundColor = "#ffffff";
        select.style.color = "#17243a";
    }

    let executando = false;

    function atualizar() {
        if (executando) return;

        executando = true;

        try {
            document.querySelectorAll("select")
                .forEach(organizar);
        } finally {
            executando = false;
        }
    }

    function iniciar() {
        atualizar();

        const observer = new MutationObserver(records => {
            const precisaAtualizar = records.some(record =>
                Array.from(record.addedNodes).some(node =>
                    node.nodeType === 1 &&
                    (
                        node.matches?.("select, option") ||
                        node.querySelector?.("select, option")
                    )
                )
            );

            if (precisaAtualizar) atualizar();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        document.addEventListener(
            "focusin",
            event => {
                if (
                    event.target instanceof HTMLSelectElement
                ) {
                    organizar(event.target);
                }
            },
            true
        );
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