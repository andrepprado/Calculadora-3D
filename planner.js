(() => {
    "use strict";

    const STORAGE_KEY = "duolab_planner_pedidos_v1";

    const STATUS = [
        "modelar",
        "produzir",
        "producao",
        "backlog",
        "receber",
        "entregue"
    ];

    const STATUS_LABELS = {
        modelar: "Modelar",
        produzir: "A Produzir",
        producao: "Em Produção",
        backlog: "Backlog",
        receber: "Concluído / Receber",
        entregue: "Pago / Entregue"
    };

    const PRIORIDADE_LABELS = {
        alta: "Alta",
        media: "Média",
        baixa: "Baixa"
    };

    const elements = {
        btnNovo: document.getElementById("btnNovoPedido"),
        busca: document.getElementById("buscaPedidos"),
        filtroPrioridade: document.getElementById("filtroPrioridade"),
        btnLimparFiltros: document.getElementById("btnLimparFiltros"),

        modal: document.getElementById("pedidoModal"),
        modalTitulo: document.getElementById("modalTitulo"),
        btnFecharModal: document.getElementById("btnFecharModal"),
        btnCancelarModal: document.getElementById("btnCancelarModal"),
        btnExcluir: document.getElementById("btnExcluirPedido"),
        form: document.getElementById("pedidoForm"),

        id: document.getElementById("pedidoId"),
        cliente: document.getElementById("pedidoCliente"),
        contato: document.getElementById("pedidoContato"),
        projeto: document.getElementById("pedidoProjeto"),
        quantidade: document.getElementById("pedidoQuantidade"),
        cor: document.getElementById("pedidoCor"),
        valor: document.getElementById("pedidoValor"),
        data: document.getElementById("pedidoData"),
        prazo: document.getElementById("pedidoPrazo"),
        prioridade: document.getElementById("pedidoPrioridade"),
        status: document.getElementById("pedidoStatus"),
        observacoes: document.getElementById("pedidoObservacoes"),

        statAtivos: document.getElementById("statAtivos"),
        statProducao: document.getElementById("statProducao"),
        statAtrasados: document.getElementById("statAtrasados"),
        statReceber: document.getElementById("statReceber"),
        statValorAberto: document.getElementById("statValorAberto")
    };

    let pedidos = carregarPedidos();
    let dragId = null;

    migrarPedidosAntigos();

    function carregarPedidos() {
        try {
            const salvo = localStorage.getItem(STORAGE_KEY);

            if (!salvo) {
                return [];
            }

            const dados = JSON.parse(salvo);

            return Array.isArray(dados)
                ? dados
                : [];
        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
            return [];
        }
    }

    function migrarPedidosAntigos() {
        let alterou = false;

        pedidos.forEach((pedido) => {
            const mapa = {
                novo: "produzir",
                orcamento: "backlog",
                aguardando: "backlog",
                producao: "producao",
                finalizacao: "receber",
                concluido: "entregue"
            };

            if (mapa[pedido.status]) {
                pedido.status = mapa[pedido.status];
                alterou = true;
            }

            if (!STATUS.includes(pedido.status)) {
                pedido.status = "produzir";
                alterou = true;
            }

            if (pedido.cor === undefined) {
                pedido.cor = "";
                alterou = true;
            }
        });

        if (alterou) {
            salvarPedidos();
        }
    }

    function salvarPedidos() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(pedidos)
        );
    }

    function gerarId() {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function hojeISO() {
        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(
            hoje.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            hoje.getDate()
        ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function normalizarTexto(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function escaparHtml(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatarMoeda(valor) {
        return (Number(valor) || 0)
            .toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );
    }

    function formatarData(data) {
        if (!data) {
            return "";
        }

        const partes = data.split("-");

        if (partes.length !== 3) {
            return data;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function estaAtrasado(pedido) {
        if (
            !pedido.prazo ||
            pedido.status === "entregue"
        ) {
            return false;
        }

        return pedido.prazo < hojeISO();
    }

    function prioridadeClasse(prioridade) {
        if (prioridade === "alta") {
            return "prioridade-alta";
        }

        if (prioridade === "baixa") {
            return "prioridade-baixa";
        }

        return "prioridade-media";
    }

    function obterFiltrados() {
        const termo =
            normalizarTexto(
                elements.busca.value
            );

        const prioridade =
            elements.filtroPrioridade.value;

        return pedidos.filter((pedido) => {
            if (
                prioridade &&
                pedido.prioridade !== prioridade
            ) {
                return false;
            }

            if (!termo) {
                return true;
            }

            const texto = normalizarTexto([
                pedido.cliente,
                pedido.contato,
                pedido.projeto,
                pedido.cor,
                pedido.observacoes
            ].join(" "));

            return texto.includes(termo);
        });
    }

    function criarCard(pedido) {
        const card =
            document.createElement("article");

        const atrasado =
            estaAtrasado(pedido);

        card.className =
            atrasado
                ? "pedido-card pedido-atrasado"
                : "pedido-card";

        card.draggable = true;
        card.dataset.id = pedido.id;
        card.tabIndex = 0;

        const cor = pedido.cor
            ? `
                <div class="pedido-card-line">
                    <span>Cor / Material</span>
                    <strong>${escaparHtml(pedido.cor)}</strong>
                </div>
            `
            : "";

        const prazo = pedido.prazo
            ? `
                <div class="pedido-card-line ${atrasado ? "pedido-prazo-atrasado" : ""}">
                    <span>${atrasado ? "Atrasado" : "Entrega"}</span>
                    <strong>${escaparHtml(formatarData(pedido.prazo))}</strong>
                </div>
            `
            : "";

        const observacao = pedido.observacoes
            ? `
                <div class="pedido-observacao">
                    ${escaparHtml(pedido.observacoes)}
                </div>
            `
            : "";

        card.innerHTML = `
            <div class="pedido-card-top">
                <span class="pedido-prioridade ${prioridadeClasse(pedido.prioridade)}">
                    ${escaparHtml(
                        PRIORIDADE_LABELS[pedido.prioridade] || "Média"
                    )}
                </span>

                <button
                    type="button"
                    class="pedido-edit-btn"
                    title="Editar pedido"
                >
                    ⋯
                </button>
            </div>

            <h3>${escaparHtml(pedido.projeto)}</h3>

            <p class="pedido-cliente">
                ${escaparHtml(pedido.cliente)}
            </p>

            <div class="pedido-card-details">

                <div class="pedido-card-line">
                    <span>Quantidade</span>
                    <strong>${escaparHtml(pedido.quantidade || 1)}</strong>
                </div>

                ${cor}

                ${prazo}

            </div>

            ${observacao}

            <div class="pedido-card-footer">
                <strong>${formatarMoeda(pedido.valor)}</strong>

                <span>
                    ${escaparHtml(
                        STATUS_LABELS[pedido.status] || ""
                    )}
                </span>
            </div>
        `;

        card.addEventListener(
            "click",
            () => abrirEdicao(pedido.id)
        );

        card.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    abrirEdicao(pedido.id);
                }
            }
        );

        card.addEventListener(
            "dragstart",
            (event) => {
                dragId = pedido.id;

                card.classList.add("dragging");

                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = "move";

                    event.dataTransfer.setData(
                        "text/plain",
                        pedido.id
                    );
                }
            }
        );

        card.addEventListener(
            "dragend",
            () => {
                dragId = null;

                card.classList.remove("dragging");

                document
                    .querySelectorAll(".kanban-list")
                    .forEach((lista) => {
                        lista.classList.remove("drag-over");
                    });
            }
        );

        return card;
    }

    function renderizar() {
        const filtrados =
            obterFiltrados();

        STATUS.forEach((status) => {
            const lista =
                document.querySelector(
                    `[data-list="${status}"]`
                );

            if (!lista) {
                return;
            }

            lista.innerHTML = "";

            const pedidosStatus =
                filtrados
                    .filter(
                        (pedido) =>
                            pedido.status === status
                    )
                    .sort(
                        (a, b) => {
                            const prioridades = {
                                alta: 0,
                                media: 1,
                                baixa: 2
                            };

                            const prioridadeA =
                                prioridades[a.prioridade] ?? 1;

                            const prioridadeB =
                                prioridades[b.prioridade] ?? 1;

                            if (
                                prioridadeA !==
                                prioridadeB
                            ) {
                                return (
                                    prioridadeA -
                                    prioridadeB
                                );
                            }

                            return String(
                                a.prazo || "9999-12-31"
                            ).localeCompare(
                                String(
                                    b.prazo || "9999-12-31"
                                )
                            );
                        }
                    );

            pedidosStatus.forEach(
                (pedido) => {
                    lista.appendChild(
                        criarCard(pedido)
                    );
                }
            );

            if (pedidosStatus.length === 0) {
                const vazio =
                    document.createElement("div");

                vazio.className =
                    "kanban-empty";

                vazio.textContent =
                    "Nenhum pedido";

                lista.appendChild(vazio);
            }

            const contador =
                document.querySelector(
                    `[data-count="${status}"]`
                );

            if (contador) {
                contador.textContent =
                    pedidos.filter(
                        (pedido) =>
                            pedido.status === status
                    ).length;
            }
        });

        atualizarEstatisticas();
    }

    function atualizarEstatisticas() {
        const pendentes =
            pedidos.filter(
                (pedido) =>
                    pedido.status !== "entregue"
            );

        const producao =
            pedidos.filter(
                (pedido) =>
                    pedido.status === "producao"
            );

        const atrasados =
            pedidos.filter(estaAtrasado);

        const receber =
            pedidos.filter(
                (pedido) =>
                    pedido.status === "receber"
            );

        const valorReceber =
            receber.reduce(
                (total, pedido) =>
                    total +
                    (Number(pedido.valor) || 0),
                0
            );

        elements.statAtivos.textContent =
            pendentes.length;

        elements.statProducao.textContent =
            producao.length;

        elements.statAtrasados.textContent =
            atrasados.length;

        elements.statReceber.textContent =
            receber.length;

        elements.statValorAberto.textContent =
            formatarMoeda(valorReceber);
    }

    function limparFormulario() {
        elements.form.reset();

        elements.id.value = "";
        elements.quantidade.value = "1";
        elements.prioridade.value = "media";
        elements.status.value = "produzir";
        elements.data.value = hojeISO();

        elements.btnExcluir.hidden = true;
    }

    function abrirNovoPedido() {
        limparFormulario();

        elements.modalTitulo.textContent =
            "Novo Pedido";

        elements.modal.hidden = false;

        document.body.classList.add(
            "modal-open"
        );

        requestAnimationFrame(
            () => elements.cliente.focus()
        );
    }

    function abrirEdicao(id) {
        const pedido =
            pedidos.find(
                (item) => item.id === id
            );

        if (!pedido) {
            return;
        }

        elements.id.value =
            pedido.id;

        elements.cliente.value =
            pedido.cliente || "";

        elements.contato.value =
            pedido.contato || "";

        elements.projeto.value =
            pedido.projeto || "";

        elements.quantidade.value =
            pedido.quantidade || 1;

        elements.cor.value =
            pedido.cor || "";

        elements.valor.value =
            pedido.valor || "";

        elements.data.value =
            pedido.data || "";

        elements.prazo.value =
            pedido.prazo || "";

        elements.prioridade.value =
            pedido.prioridade || "media";

        elements.status.value =
            pedido.status || "produzir";

        elements.observacoes.value =
            pedido.observacoes || "";

        elements.modalTitulo.textContent =
            "Editar Pedido";

        elements.btnExcluir.hidden = false;
        elements.modal.hidden = false;

        document.body.classList.add(
            "modal-open"
        );

        requestAnimationFrame(
            () => elements.cliente.focus()
        );
    }

    function fecharModal() {
        elements.modal.hidden = true;

        document.body.classList.remove(
            "modal-open"
        );
    }

    function salvarFormulario(event) {
        event.preventDefault();

        const cliente =
            elements.cliente.value.trim();

        const projeto =
            elements.projeto.value.trim();

        if (!cliente || !projeto) {
            return;
        }

        const id =
            elements.id.value;

        const anterior =
            pedidos.find(
                (item) => item.id === id
            );

        const pedido = {
            id: id || gerarId(),

            cliente,

            contato:
                elements.contato.value.trim(),

            projeto,

            quantidade:
                Math.max(
                    1,
                    parseInt(
                        elements.quantidade.value,
                        10
                    ) || 1
                ),

            cor:
                elements.cor.value.trim(),

            valor:
                Math.max(
                    0,
                    Number(
                        elements.valor.value
                    ) || 0
                ),

            data:
                elements.data.value ||
                hojeISO(),

            prazo:
                elements.prazo.value || "",

            prioridade:
                elements.prioridade.value ||
                "media",

            status:
                STATUS.includes(
                    elements.status.value
                )
                    ? elements.status.value
                    : "produzir",

            observacoes:
                elements.observacoes.value.trim(),

            criadoEm:
                anterior?.criadoEm ||
                new Date().toISOString(),

            atualizadoEm:
                new Date().toISOString()
        };

        if (id) {
            const indice =
                pedidos.findIndex(
                    (item) => item.id === id
                );

            if (indice >= 0) {
                pedidos[indice] = pedido;
            }
        } else {
            pedidos.unshift(pedido);
        }

        salvarPedidos();
        fecharModal();
        renderizar();
    }

    function excluirPedido() {
        const id =
            elements.id.value;

        if (!id) {
            return;
        }

        const pedido =
            pedidos.find(
                (item) => item.id === id
            );

        if (!pedido) {
            return;
        }

        const confirmado =
            window.confirm(
                `Excluir "${pedido.projeto}" de "${pedido.cliente}"?`
            );

        if (!confirmado) {
            return;
        }

        pedidos =
            pedidos.filter(
                (item) => item.id !== id
            );

        salvarPedidos();
        fecharModal();
        renderizar();
    }

    function moverPedido(
        id,
        novoStatus
    ) {
        if (
            !STATUS.includes(novoStatus)
        ) {
            return;
        }

        const pedido =
            pedidos.find(
                (item) => item.id === id
            );

        if (!pedido) {
            return;
        }

        pedido.status =
            novoStatus;

        pedido.atualizadoEm =
            new Date().toISOString();

        salvarPedidos();
        renderizar();
    }

    function configurarDragDrop() {
        document
            .querySelectorAll(
                ".kanban-list"
            )
            .forEach(
                (lista) => {
                    lista.addEventListener(
                        "dragover",
                        (event) => {
                            event.preventDefault();

                            lista.classList.add(
                                "drag-over"
                            );
                        }
                    );

                    lista.addEventListener(
                        "dragleave",
                        () => {
                            lista.classList.remove(
                                "drag-over"
                            );
                        }
                    );

                    lista.addEventListener(
                        "drop",
                        (event) => {
                            event.preventDefault();

                            lista.classList.remove(
                                "drag-over"
                            );

                            const id =
                                dragId ||
                                event.dataTransfer
                                    ?.getData(
                                        "text/plain"
                                    );

                            const status =
                                lista.dataset.list;

                            if (
                                id &&
                                status
                            ) {
                                moverPedido(
                                    id,
                                    status
                                );
                            }
                        }
                    );
                }
            );
    }

    elements.btnNovo.addEventListener(
        "click",
        abrirNovoPedido
    );

    elements.btnFecharModal.addEventListener(
        "click",
        fecharModal
    );

    elements.btnCancelarModal.addEventListener(
        "click",
        fecharModal
    );

    elements.btnExcluir.addEventListener(
        "click",
        excluirPedido
    );

    elements.form.addEventListener(
        "submit",
        salvarFormulario
    );

    elements.busca.addEventListener(
        "input",
        renderizar
    );

    elements.filtroPrioridade.addEventListener(
        "change",
        renderizar
    );

    elements.btnLimparFiltros.addEventListener(
        "click",
        () => {
            elements.busca.value = "";
            elements.filtroPrioridade.value = "";
            renderizar();
        }
    );

    elements.modal.addEventListener(
        "mousedown",
        (event) => {
            if (
                event.target ===
                elements.modal
            ) {
                fecharModal();
            }
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                !elements.modal.hidden
            ) {
                fecharModal();
            }
        }
    );

    configurarDragDrop();
    renderizar();
})();