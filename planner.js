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
        produzir: "Backlog",
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

        filtroPrioridade:
            document.getElementById("filtroPrioridade"),

        btnLimparFiltros:
            document.getElementById("btnLimparFiltros"),

        modal:
            document.getElementById("pedidoModal"),

        modalTitulo:
            document.getElementById("modalTitulo"),

        btnFecharModal:
            document.getElementById("btnFecharModal"),

        btnCancelarModal:
            document.getElementById("btnCancelarModal"),

        btnExcluir:
            document.getElementById("btnExcluirPedido"),

        form:
            document.getElementById("pedidoForm"),

        id:
            document.getElementById("pedidoId"),

        cliente:
            document.getElementById("pedidoCliente"),

        contato:
            document.getElementById("pedidoContato"),

        projeto:
            document.getElementById("pedidoProjeto"),

        quantidade:
            document.getElementById("pedidoQuantidade"),

        cor:
            document.getElementById("pedidoCor"),

        valor:
            document.getElementById("pedidoValor"),

        data:
            document.getElementById("pedidoData"),

        prazo:
            document.getElementById("pedidoPrazo"),

        prioridade:
            document.getElementById("pedidoPrioridade"),

        status:
            document.getElementById("pedidoStatus"),

        observacoes:
            document.getElementById("pedidoObservacoes"),

        statAtivos:
            document.getElementById("statAtivos"),

        statProducao:
            document.getElementById("statProducao"),

        statAtrasados:
            document.getElementById("statAtrasados"),

        statReceber:
            document.getElementById("statReceber"),

        statValorAberto:
            document.getElementById("statValorAberto")
    };

    let pedidos = [];

    let dragId = null;

    async function carregarBaseCompartilhada() {
        try {
            const resposta = await fetch(
                `data/pedidos.json?v=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );

            if (!resposta.ok) {
                throw new Error(
                    `HTTP ${resposta.status}`
                );
            }

            const base = await resposta.json();

            const remotos =
                Array.isArray(base)
                    ? base
                    : (
                        Array.isArray(base.pedidos)
                            ? base.pedidos
                            : []
                    );

            const locais =
                carregarPedidos();

            /*
             * A base publicada no site e a base principal.
             *
             * Alteracoes realizadas neste navegador continuam
             * sendo preservadas no localStorage.
             *
             * Se existir uma versao local do mesmo ID,
             * prevalece a mais recentemente atualizada.
             */

            const mapa = new Map();

            remotos.forEach(
                (pedido) => {
                    mapa.set(
                        pedido.id,
                        pedido
                    );
                }
            );

            locais.forEach(
                (local) => {
                    const remoto =
                        mapa.get(local.id);

                    if (!remoto) {
                        mapa.set(
                            local.id,
                            local
                        );

                        return;
                    }

                    const dataLocal =
                        new Date(
                            local.atualizadoEm ||
                            local.criadoEm ||
                            0
                        ).getTime();

                    const dataRemota =
                        new Date(
                            remoto.atualizadoEm ||
                            remoto.criadoEm ||
                            0
                        ).getTime();

                    if (
                        dataLocal >
                        dataRemota
                    ) {
                        mapa.set(
                            local.id,
                            local
                        );
                    }
                }
            );

            pedidos =
                Array.from(
                    mapa.values()
                );

            salvarPedidos();

            renderizar();

            console.log(
                `Planner carregado: ${pedidos.length} pedidos.`
            );
        }
        catch (error) {
            console.warn(
                "Nao foi possivel carregar a base compartilhada. Usando cache local.",
                error
            );

            pedidos =
                carregarPedidos();

            renderizar();
        }
    }
    function carregarPedidos() {
        try {
            const salvo =
                localStorage.getItem(STORAGE_KEY);

            if (!salvo) {
                return [];
            }

            const dados =
                JSON.parse(salvo);

            return Array.isArray(dados)
                ? dados
                : [];
        }
        catch (error) {
            console.error(
                "Erro ao carregar pedidos:",
                error
            );

            return [];
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

        return (
            Date.now() +
            "-" +
            Math.random()
                .toString(16)
                .slice(2)
        );
    }

    function hojeISO() {
        const hoje = new Date();

        const ano =
            hoje.getFullYear();

        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                hoje.getDate()
            ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function normalizarTexto(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
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
        return (
            Number(valor) || 0
        ).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    }

    function moedaParaNumero(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return 0;
    }

    if (typeof valor === "number") {
        return Number.isFinite(valor)
            ? valor
            : 0;
    }

    let texto = String(valor)
        .trim()
        .replace(/\s/g, "")
        .replace(/R\$/gi, "");

    if (!texto) {
        return 0;
    }

    if (
        texto.includes(",") &&
        texto.includes(".")
    ) {
        texto = texto
            .replace(/\./g, "")
            .replace(",", ".");
    }
    else if (texto.includes(",")) {
        texto = texto.replace(",", ".");
    }

    texto = texto.replace(
        /[^0-9.-]/g,
        ""
    );

    const numero = Number(texto);

    return Number.isFinite(numero)
        ? numero
        : 0;
}

function aplicarMascaraMoeda(campo) {
    if (!campo) {
        return;
    }

    const somenteDigitos = String(
        campo.value || ""
    )
        .replace(/\D/g, "");

    if (!somenteDigitos) {
        campo.value = "";
        return;
    }

    const numero =
        Number(somenteDigitos) / 100;

    campo.value =
        numero.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}

function aplicarMascaraData(campo) {
    if (!campo) {
        return;
    }

    const digitos = String(
        campo.value || ""
    )
        .replace(/\D/g, "")
        .slice(0, 8);

    if (!digitos) {
        campo.value = "";
        return;
    }

    let formatado =
        digitos.slice(0, 2);

    if (digitos.length > 2) {
        formatado +=
            "/" +
            digitos.slice(2, 4);
    }

    if (digitos.length > 4) {
        formatado +=
            "/" +
            digitos.slice(4, 8);
    }

    campo.value = formatado;
}

function dataBRParaISO(valor) {
    if (!valor) {
        return "";
    }

    const texto =
        String(valor).trim();

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {
        return texto;
    }

    const match = texto.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

    if (!match) {
        return "";
    }

    const dia =
        Number(match[1]);

    const mes =
        Number(match[2]);

    const ano =
        Number(match[3]);

    const data =
        new Date(
            ano,
            mes - 1,
            dia
        );

    if (
        data.getFullYear() !== ano ||
        data.getMonth() !== mes - 1 ||
        data.getDate() !== dia
    ) {
        return "";
    }

    return (
        String(ano).padStart(4, "0") +
        "-" +
        String(mes).padStart(2, "0") +
        "-" +
        String(dia).padStart(2, "0")
    );
}

function dataISOParaBR(valor) {
    if (!valor) {
        return "";
    }

    const texto =
        String(valor).trim();

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(
            texto
        )
    ) {
        return texto;
    }

    const match = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (!match) {
        return texto;
    }

    return (
        match[3] +
        "/" +
        match[2] +
        "/" +
        match[1]
    );
}

function formatarData(data) {
        if (!data) {
            return "";
        }

        const partes =
            data.split("-");

        if (partes.length !== 3) {
            return data;
        }

        return (
            partes[2] +
            "/" +
            partes[1] +
            "/" +
            partes[0]
        );
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

        return pedidos.filter(
            (pedido) => {

                if (
                    prioridade &&
                    pedido.prioridade !== prioridade
                ) {
                    return false;
                }

                if (!termo) {
                    return true;
                }

                const texto =
                    normalizarTexto(
                        [
                            pedido.cliente,
                            pedido.contato,
                            pedido.projeto,
                            pedido.cor,
                            pedido.observacoes
                        ].join(" ")
                    );

                return texto.includes(termo);
            }
        );
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

        card.dataset.id =
            pedido.id;

        card.tabIndex = 0;

        const cor =
            pedido.cor
                ? `
                    <div class="pedido-card-line">
                        <span>Cor / Material</span>
                        <strong>
                            ${escaparHtml(pedido.cor)}
                        </strong>
                    </div>
                `
                : "";

        const prazo =
            pedido.prazo
                ? `
                    <div class="pedido-card-line ${
                        atrasado
                            ? "pedido-prazo-atrasado"
                            : ""
                    }">
                        <span>
                            ${
                                atrasado
                                    ? "Atrasado"
                                    : "Entrega"
                            }
                        </span>

                        <strong>
                            ${escaparHtml(
                                formatarData(
                                    pedido.prazo
                                )
                            )}
                        </strong>
                    </div>
                `
                : "";

        const observacao =
            pedido.observacoes
                ? `
                    <div class="pedido-observacao">
                        ${escaparHtml(
                            pedido.observacoes
                        )}
                    </div>
                `
                : "";

        card.innerHTML = `
            <div class="pedido-card-top">

                <span
                    class="pedido-prioridade ${
                        prioridadeClasse(
                            pedido.prioridade
                        )
                    }"
                >
                    ${
                        escaparHtml(
                            PRIORIDADE_LABELS[
                                pedido.prioridade
                            ] || "Média"
                        )
                    }
                </span>

                <button
                    type="button"
                    class="pedido-edit-btn"
                    title="Editar pedido"
                >
                    ⋯
                </button>

            </div>

            <h3>
                ${escaparHtml(
                    pedido.projeto
                )}
            </h3>

            <p class="pedido-cliente">
                ${escaparHtml(
                    pedido.cliente
                )}
            </p>

            <div class="pedido-card-details">

                <div class="pedido-card-line">
                    <span>Quantidade</span>

                    <strong>
                        ${escaparHtml(
                            pedido.quantidade || 1
                        )}
                    </strong>
                </div>

                ${cor}

                ${prazo}

            </div>

            ${observacao}

            <div class="pedido-card-footer">

                <strong>
                    ${formatarMoeda(
                        pedido.valor
                    )}
                </strong>

                <span>
                    ${escaparHtml(
                        STATUS_LABELS[
                            pedido.status
                        ] || ""
                    )}
                </span>

            </div>
        `;

        card.addEventListener(
            "click",
            () => {
                abrirEdicao(
                    pedido.id
                );
            }
        );

        card.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();

                    abrirEdicao(
                        pedido.id
                    );
                }
            }
        );

        card.addEventListener(
            "dragstart",
            (event) => {

                dragId =
                    pedido.id;

                card.classList.add(
                    "dragging"
                );

                if (
                    event.dataTransfer
                ) {
                    event.dataTransfer.effectAllowed =
                        "move";

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

                card.classList.remove(
                    "dragging"
                );

                document
                    .querySelectorAll(
                        ".kanban-list"
                    )
                    .forEach(
                        (lista) => {
                            lista.classList.remove(
                                "drag-over"
                            );
                        }
                    );
            }
        );

        return card;
    }

    function criarTicketFantasma(status) {
        const ghost =
            document.createElement("button");

        ghost.type = "button";

        ghost.className =
            "kanban-ghost-ticket";

        ghost.dataset.ghostStatus =
            status;

        ghost.innerHTML = `
            <span class="kanban-ghost-plus">
                +
            </span>

            <span>
                Adicionar pedido
            </span>
        `;

        ghost.addEventListener(
            "click",
            () => {
                abrirNovoPedido(
                    status
                );
            }
        );

        return ghost;
    }



    /* PLANNER_WHATSAPP_EXPORT_START */

    const WHATSAPP_STATUS_CONFIG = {

        produzir: {
            titulo: "A produzir"
        },

        modelar: {
            titulo: "Modelar"
        },

        fatiar: {
            titulo: "Fatiar"
        },

        imprimir: {
            titulo: "Em produção"
        },

        acabamento: {
            titulo: "Concluídos / Receber Pagamento"
        },

        pronto: {
            titulo: "Pagos / Entregues"
        }
    };

    function limparTextoWhatsApp(valor) {

        return String(
            valor ?? ""
        )
            .replace(
                /\r?\n+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function obterNomeClienteWhatsApp(pedido) {

        return limparTextoWhatsApp(
            pedido.contato ||
            pedido.cliente ||
            ""
        );
    }

    function formatarQuantidadeWhatsApp(pedido) {

        const quantidade =
            Math.max(
                1,
                Number(
                    pedido.quantidade
                ) || 1
            );

        if (quantidade <= 1) {
            return "";
        }

        return (
            ` (${quantidade} unidades)`
        );
    }

    function formatarPedidoWhatsApp(pedido) {

        const projeto =
            limparTextoWhatsApp(
                pedido.projeto
            ) || "Pedido sem descrição";

        const quantidade =
            formatarQuantidadeWhatsApp(
                pedido
            );

        const cliente =
            obterNomeClienteWhatsApp(
                pedido
            );

        const observacao =
            limparTextoWhatsApp(
                pedido.observacoes
            );

        let linha =
            `• ${projeto}${quantidade}`;

        if (cliente) {

            linha +=
                ` - ${cliente}`;
        }

        if (observacao) {

            linha +=
                ` (${observacao})`;
        }

        return linha;
    }

    function obterOrdemExportacaoWhatsApp() {

        /*
         * Usa a mesma ordem configurada visualmente
         * pelo usuário no Planner.
         */

        if (
            typeof boardLayout !==
                "undefined" &&
            Array.isArray(
                boardLayout?.ordem
            ) &&
            boardLayout.ordem.length
        ) {

            const ordem =
                boardLayout.ordem.filter(
                    (status) =>
                        STATUS.includes(
                            status
                        )
                );

            STATUS.forEach(
                (status) => {

                    if (
                        !ordem.includes(
                            status
                        )
                    ) {

                        ordem.push(
                            status
                        );
                    }
                }
            );

            return ordem;
        }

        return [...STATUS];
    }

    function gerarTextoPlannerWhatsApp() {

        const blocos = [];

        const ordem =
            obterOrdemExportacaoWhatsApp();

        ordem.forEach(
            (status) => {

                const config =
                    WHATSAPP_STATUS_CONFIG[
                        status
                    ];

                if (!config) {
                    return;
                }

                const itens =
                    pedidos
                        .filter(
                            (pedido) =>
                                pedido.status ===
                                status
                        )
                        .map(
                            formatarPedidoWhatsApp
                        );

                const linhas = [
                    `*${config.titulo}:*`
                ];

                if (itens.length) {

                    linhas.push(
                        "",
                        ...itens
                    );
                }

                blocos.push(
                    linhas.join("\n")
                );
            }
        );

        return blocos.join(
            "\n\n"
        );
    }

    function abrirExportacaoWhatsApp() {

        const modal =
            document.getElementById(
                "modalExportarWhatsApp"
            );

        const textarea =
            document.getElementById(
                "textoExportacaoWhatsApp"
            );

        if (
            !modal ||
            !textarea
        ) {
            return;
        }

        textarea.value =
            gerarTextoPlannerWhatsApp();

        modal.hidden =
            false;

        document.body.classList.add(
            "planner-modal-open"
        );

        window.setTimeout(
            () => {

                textarea.focus();

                textarea.setSelectionRange(
                    0,
                    0
                );
            },
            0
        );
    }

    function fecharExportacaoWhatsApp() {

        const modal =
            document.getElementById(
                "modalExportarWhatsApp"
            );

        if (!modal) {
            return;
        }

        modal.hidden =
            true;

        document.body.classList.remove(
            "planner-modal-open"
        );
    }

    async function copiarExportacaoWhatsApp() {

        const textarea =
            document.getElementById(
                "textoExportacaoWhatsApp"
            );

        const botao =
            document.getElementById(
                "btnCopiarExportacaoWhatsApp"
            );

        if (!textarea) {
            return;
        }

        const texto =
            textarea.value;

        let copiado =
            false;

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            try {

                await navigator.clipboard.writeText(
                    texto
                );

                copiado =
                    true;
            }
            catch (erro) {

                console.warn(
                    "Clipboard API indisponível.",
                    erro
                );
            }
        }

        if (!copiado) {

            textarea.focus();
            textarea.select();

            try {

                copiado =
                    document.execCommand(
                        "copy"
                    );
            }
            catch (erro) {

                console.warn(
                    "Fallback de cópia indisponível.",
                    erro
                );
            }

            textarea.setSelectionRange(
                0,
                0
            );
        }

        if (!copiado) {

            window.alert(
                "Não foi possível copiar automaticamente. Selecione o texto e copie manualmente."
            );

            return;
        }

        if (botao) {

            const textoOriginal =
                botao.textContent;

            botao.textContent =
                "Copiado!";

            window.setTimeout(
                () => {

                    botao.textContent =
                        textoOriginal;
                },
                1600
            );
        }
    }

    function configurarExportacaoWhatsApp() {

        const abrir =
            document.getElementById(
                "btnExportarWhatsApp"
            );

        const fecharTopo =
            document.getElementById(
                "btnFecharExportacaoWhatsApp"
            );

        const fecharRodape =
            document.getElementById(
                "btnFecharExportacaoWhatsAppRodape"
            );

        const copiar =
            document.getElementById(
                "btnCopiarExportacaoWhatsApp"
            );

        const backdrop =
            document.querySelector(
                "[data-whatsapp-close]"
            );

        if (abrir) {

            abrir.addEventListener(
                "click",
                abrirExportacaoWhatsApp
            );
        }

        if (fecharTopo) {

            fecharTopo.addEventListener(
                "click",
                fecharExportacaoWhatsApp
            );
        }

        if (fecharRodape) {

            fecharRodape.addEventListener(
                "click",
                fecharExportacaoWhatsApp
            );
        }

        if (copiar) {

            copiar.addEventListener(
                "click",
                copiarExportacaoWhatsApp
            );
        }

        if (backdrop) {

            backdrop.addEventListener(
                "click",
                fecharExportacaoWhatsApp
            );
        }

        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                const modal =
                    document.getElementById(
                        "modalExportarWhatsApp"
                    );

                if (
                    modal &&
                    !modal.hidden
                ) {

                    fecharExportacaoWhatsApp();
                }
            }
        );
    }

    /* PLANNER_WHATSAPP_EXPORT_END */
    /* PLANNER_BOARD_LAYOUT_START */

    const BOARD_LAYOUT_KEY =
        "duolab_planner_board_layout_v1";

    let boardLayout =
        carregarLayoutQuadros();

    function carregarLayoutQuadros() {

        const padrao = {
            ordem: [...STATUS],
            ocultos: []
        };

        try {

            const salvo =
                JSON.parse(
                    localStorage.getItem(
                        BOARD_LAYOUT_KEY
                    ) || "null"
                );

            if (
                !salvo ||
                !Array.isArray(
                    salvo.ordem
                )
            ) {
                return padrao;
            }

            const ordemValida =
                salvo.ordem.filter(
                    (status) =>
                        STATUS.includes(
                            status
                        )
                );

            STATUS.forEach(
                (status) => {

                    if (
                        !ordemValida.includes(
                            status
                        )
                    ) {
                        ordemValida.push(
                            status
                        );
                    }
                }
            );

            return {
                ordem:
                    ordemValida,

                ocultos:
                    Array.isArray(
                        salvo.ocultos
                    )
                        ? salvo.ocultos.filter(
                            (status) =>
                                STATUS.includes(
                                    status
                                )
                        )
                        : []
            };
        }
        catch (erro) {

            console.warn(
                "Não foi possível carregar a organização dos quadros.",
                erro
            );

            return padrao;
        }
    }

    function salvarLayoutQuadros() {

        try {

            localStorage.setItem(
                BOARD_LAYOUT_KEY,
                JSON.stringify(
                    boardLayout
                )
            );
        }
        catch (erro) {

            console.warn(
                "Não foi possível salvar a organização dos quadros.",
                erro
            );
        }
    }

    function moverQuadro(
        status,
        direcao
    ) {

        const ordem =
            [...boardLayout.ordem];

        const indice =
            ordem.indexOf(
                status
            );

        const destino =
            indice + direcao;

        if (
            indice < 0 ||
            destino < 0 ||
            destino >= ordem.length
        ) {
            return;
        }

        [
            ordem[indice],
            ordem[destino]
        ] = [
            ordem[destino],
            ordem[indice]
        ];

        boardLayout.ordem =
            ordem;

        salvarLayoutQuadros();

        aplicarLayoutQuadros();
    }

    function definirQuadroOculto(
        status,
        ocultar
    ) {

        const ocultos =
            new Set(
                boardLayout.ocultos
            );

        if (ocultar) {

            ocultos.add(
                status
            );
        }
        else {

            ocultos.delete(
                status
            );
        }

        boardLayout.ocultos =
            [...ocultos];

        salvarLayoutQuadros();

        aplicarLayoutQuadros();
    }

    function criarBotaoControleQuadro(
        simbolo,
        titulo,
        acao
    ) {

        const botao =
            document.createElement(
                "button"
            );

        botao.type =
            "button";

        botao.className =
            "kanban-column-control-btn";

        botao.textContent =
            simbolo;

        botao.title =
            titulo;

        botao.setAttribute(
            "aria-label",
            titulo
        );

        botao.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                acao();
            }
        );

        return botao;
    }

    function garantirControlesQuadro(
        coluna,
        status
    ) {

        const header =
            coluna.querySelector(
                ".kanban-column-header"
            );

        if (
            !header ||
            header.querySelector(
                ".kanban-column-controls"
            )
        ) {
            return;
        }

        const controles =
            document.createElement(
                "div"
            );

        controles.className =
            "kanban-column-controls";

        controles.appendChild(
            criarBotaoControleQuadro(
                "←",
                "Mover quadro para a esquerda",
                () =>
                    moverQuadro(
                        status,
                        -1
                    )
            )
        );

        controles.appendChild(
            criarBotaoControleQuadro(
                "→",
                "Mover quadro para a direita",
                () =>
                    moverQuadro(
                        status,
                        1
                    )
            )
        );

        controles.appendChild(
            criarBotaoControleQuadro(
                "×",
                "Ocultar quadro",
                () =>
                    definirQuadroOculto(
                        status,
                        true
                    )
            )
        );

        header.appendChild(
            controles
        );
    }

    function renderizarMenuQuadros() {

        const menu =
            document.getElementById(
                "menuConfigurarQuadros"
            );

        if (!menu) {
            return;
        }

        menu.innerHTML =
            "";

        const titulo =
            document.createElement(
                "strong"
            );

        titulo.textContent =
            "Quadros visíveis";

        menu.appendChild(
            titulo
        );

        boardLayout.ordem.forEach(
            (status) => {

                const label =
                    document.createElement(
                        "label"
                    );

                label.className =
                    "planner-board-setting-item";

                const checkbox =
                    document.createElement(
                        "input"
                    );

                checkbox.type =
                    "checkbox";

                checkbox.checked =
                    !boardLayout.ocultos.includes(
                        status
                    );

                checkbox.addEventListener(
                    "change",
                    () => {

                        definirQuadroOculto(
                            status,
                            !checkbox.checked
                        );
                    }
                );

                const texto =
                    document.createElement(
                        "span"
                    );

                texto.textContent =
                    STATUS_LABELS[
                        status
                    ] || status;

                label.append(
                    checkbox,
                    texto
                );

                menu.appendChild(
                    label
                );
            }
        );

        const dica =
            document.createElement(
                "small"
            );

        dica.textContent =
            "Use as setas no cabeçalho de cada quadro para alterar a posição.";

        menu.appendChild(
            dica
        );
    }

    function aplicarLayoutQuadros() {

        const board =
            document.getElementById(
                "kanbanBoard"
            );

        if (!board) {
            return;
        }

        boardLayout.ordem.forEach(
            (status) => {

                const coluna =
                    board.querySelector(
                        `[data-status="${status}"]`
                    );

                if (!coluna) {
                    return;
                }

                garantirControlesQuadro(
                    coluna,
                    status
                );

                coluna.hidden =
                    boardLayout.ocultos.includes(
                        status
                    );

                /*
                 * appendChild em elemento existente
                 * move a coluna inteira.
                 *
                 * Portanto:
                 * - cabeçalho
                 * - contador
                 * - botão +
                 * - lista
                 * - todos os cards
                 *
                 * acompanham o quadro.
                 */

                board.appendChild(
                    coluna
                );
            }
        );

        const visiveis =
            boardLayout.ordem.filter(
                (status) =>
                    !boardLayout.ocultos.includes(
                        status
                    )
            ).length;

        const quantidade =
            Math.max(
                visiveis,
                1
            );

        board.style.gridTemplateColumns =
            `repeat(${quantidade}, minmax(220px, 1fr))`;

        board.style.minWidth =
            `${quantidade * 232}px`;

        renderizarMenuQuadros();
    }

    function configurarLayoutQuadros() {

        const botao =
            document.getElementById(
                "btnConfigurarQuadros"
            );

        const menu =
            document.getElementById(
                "menuConfigurarQuadros"
            );

        aplicarLayoutQuadros();

        if (
            !botao ||
            !menu
        ) {
            return;
        }

        botao.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                const abrir =
                    menu.hidden;

                menu.hidden =
                    !abrir;

                botao.setAttribute(
                    "aria-expanded",
                    String(
                        abrir
                    )
                );
            }
        );

        menu.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();
            }
        );

        document.addEventListener(
            "click",
            () => {

                menu.hidden =
                    true;

                botao.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        );
    }

    /* PLANNER_BOARD_LAYOUT_END */
    function renderizar() {
        const filtrados =
            obterFiltrados();

        STATUS.forEach(
            (status) => {

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

                                const pa =
                                    prioridades[
                                        a.prioridade
                                    ] ?? 1;

                                const pb =
                                    prioridades[
                                        b.prioridade
                                    ] ?? 1;

                                if (pa !== pb) {
                                    return pa - pb;
                                }

                                return String(
                                    a.prazo ||
                                    "9999-12-31"
                                ).localeCompare(
                                    String(
                                        b.prazo ||
                                        "9999-12-31"
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

                lista.appendChild(
                    criarTicketFantasma(
                        status
                    )
                );

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
            }
        );

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
            pedidos.filter(
                estaAtrasado
            );

        const receber =
            pedidos.filter(
                (pedido) =>
                    pedido.status === "receber"
            );

        const valorReceber =
            receber.reduce(
                (total, pedido) =>
                    total +
                    (
                        Number(
                            pedido.valor
                        ) || 0
                    ),
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
            formatarMoeda(
                valorReceber
            );
    }

    function limparFormulario() {
        elements.form.reset();

        elements.id.value = "";

        elements.quantidade.value =
            "1";

        elements.prioridade.value =
            "media";

        elements.status.value =
            "produzir";

        elements.data.value = dataISOParaBR(hojeISO());

        elements.btnExcluir.hidden =
            true;
    }

    function abrirNovoPedido(
        statusInicial = "produzir"
    ) {
        limparFormulario();

        if (
            STATUS.includes(
                statusInicial
            )
        ) {
            elements.status.value =
                statusInicial;
        }

        elements.modalTitulo.textContent =
            "Novo Pedido";

        elements.modal.hidden =
            false;

        document.body.classList.add(
            "modal-open"
        );

        requestAnimationFrame(
            () => {
                elements.cliente.focus();
            }
        );
    }

    function abrirEdicao(id) {
        const pedido =
            pedidos.find(
                (item) =>
                    item.id === id
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

        elements.valor.value = pedido.valor ? formatarMoeda(pedido.valor) : "";

        elements.data.value = dataISOParaBR(pedido.data);

        elements.prazo.value = dataISOParaBR(pedido.prazo);

        elements.prioridade.value =
            pedido.prioridade || "media";

        elements.status.value =
            pedido.status || "produzir";

        elements.observacoes.value =
            pedido.observacoes || "";

        elements.modalTitulo.textContent =
            "Editar Pedido";

        elements.btnExcluir.hidden =
            false;

        elements.modal.hidden =
            false;

        document.body.classList.add(
            "modal-open"
        );
    }

    function fecharModal() {
        elements.modal.hidden =
            true;

        document.body.classList.remove(
            "modal-open"
        );
    }


    /* FIREBASE_SYNC_START */

    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyBLTGktNsJUm-_IXtfh9cd65TYvUDk5gZ0",
        authDomain: "duolabcalc.firebaseapp.com",
        projectId: "duolabcalc",
        storageBucket: "duolabcalc.firebasestorage.app",
        messagingSenderId: "864677210505",
        appId: "1:864677210505:web:58b31d092e25f8e5791958"
    };

    const FIREBASE_COLLECTION = "pedidos";
    const FIREBASE_LOCAL_STORAGE_KEY = "duolab_planner_pedidos_v1";

    let firebaseDb = null;
    let firebaseAuth = null;
    let firebaseReady = false;
    let firebaseUnsubscribe = null;

    function normalizarPedidoFirestore(pedido) {
        return {
            id: String(pedido.id || gerarId()),

            cliente:
                String(pedido.cliente || ""),

            contato:
                String(pedido.contato || ""),

            projeto:
                String(pedido.projeto || ""),

            quantidade:
                Math.max(
                    1,
                    Number(pedido.quantidade) || 1
                ),

            cor:
                String(pedido.cor || ""),

            valor:
                Math.max(
                    0,
                    Number(pedido.valor) || 0
                ),

            data:
                String(
                    pedido.data ||
                    hojeISO()
                ),

            prazo:
                String(pedido.prazo || ""),

            prioridade:
                String(
                    pedido.prioridade ||
                    "media"
                ),

            status:
                STATUS.includes(
                    pedido.status
                )
                    ? pedido.status
                    : "produzir",

            observacoes:
                String(
                    pedido.observacoes ||
                    ""
                ),

            criadoEm:
                String(
                    pedido.criadoEm ||
                    new Date().toISOString()
                ),

            atualizadoEm:
                String(
                    pedido.atualizadoEm ||
                    new Date().toISOString()
                )
        };
    }

    function obterPedidosLocaisParaMigracao() {
        try {
            const bruto =
                localStorage.getItem(
                    FIREBASE_LOCAL_STORAGE_KEY
                );

            if (!bruto) {
                return [];
            }

            const dados =
                JSON.parse(bruto);

            if (!Array.isArray(dados)) {
                return [];
            }

            return dados
                .filter(
                    (pedido) =>
                        pedido &&
                        typeof pedido === "object"
                )
                .map(
                    normalizarPedidoFirestore
                );
        }
        catch (erro) {
            console.warn(
                "Não foi possível ler os pedidos locais:",
                erro
            );

            return [];
        }
    }

    async function migrarPedidosLocaisSeNecessario() {
        const referencia =
            firebaseDb.collection(
                FIREBASE_COLLECTION
            );

        const snapshot =
            await referencia
                .limit(1)
                .get();

        if (!snapshot.empty) {
            return;
        }

        const locais =
            obterPedidosLocaisParaMigracao();

        if (!locais.length) {
            return;
        }

        console.log(
            `Migrando ${locais.length} pedido(s) local(is) para o Firestore...`
        );

        const lotes = [];

        for (
            let inicio = 0;
            inicio < locais.length;
            inicio += 400
        ) {
            lotes.push(
                locais.slice(
                    inicio,
                    inicio + 400
                )
            );
        }

        for (const grupo of lotes) {
            const batch =
                firebaseDb.batch();

            grupo.forEach(
                (pedido) => {
                    const ref =
                        referencia.doc(
                            pedido.id
                        );

                    batch.set(
                        ref,
                        pedido,
                        {
                            merge: true
                        }
                    );
                }
            );

            await batch.commit();
        }

        console.log(
            "Migração local concluída."
        );
    }

    function iniciarSincronizacaoFirestore() {
        if (
            !firebaseDb ||
            firebaseUnsubscribe
        ) {
            return;
        }

        firebaseUnsubscribe =
            firebaseDb
                .collection(
                    FIREBASE_COLLECTION
                )
                .onSnapshot(
                    (snapshot) => {
                        pedidos =
                            snapshot.docs.map(
                                (documento) => {
                                    const dados =
                                        documento.data();

                                    return normalizarPedidoFirestore({
                                        ...dados,
                                        id: documento.id
                                    });
                                }
                            );

                        try {
                            localStorage.setItem(
                                FIREBASE_LOCAL_STORAGE_KEY,
                                JSON.stringify(
                                    pedidos
                                )
                            );
                        }
                        catch (erro) {
                            console.warn(
                                "Cache local indisponível:",
                                erro
                            );
                        }

                        renderizar();
                    },

                    (erro) => {
                        console.error(
                            "Erro na sincronização Firestore:",
                            erro
                        );

                        window.alert(
                            "Não foi possível sincronizar os pedidos com o banco de dados."
                        );
                    }
                );
    }

    async function salvarPedidoFirestore(pedido) {
        if (
            !firebaseReady ||
            !firebaseDb
        ) {
            throw new Error(
                "Firebase ainda não está conectado."
            );
        }

        const dados =
            normalizarPedidoFirestore(
                pedido
            );

        await firebaseDb
            .collection(
                FIREBASE_COLLECTION
            )
            .doc(
                dados.id
            )
            .set(
                dados,
                {
                    merge: true
                }
            );
    }

    async function excluirPedidoFirestore(id) {
        if (
            !firebaseReady ||
            !firebaseDb
        ) {
            throw new Error(
                "Firebase ainda não está conectado."
            );
        }

        await firebaseDb
            .collection(
                FIREBASE_COLLECTION
            )
            .doc(
                String(id)
            )
            .delete();
    }

    async function atualizarStatusFirestore(
        id,
        novoStatus
    ) {
        if (
            !firebaseReady ||
            !firebaseDb
        ) {
            throw new Error(
                "Firebase ainda não está conectado."
            );
        }

        await firebaseDb
            .collection(
                FIREBASE_COLLECTION
            )
            .doc(
                String(id)
            )
            .update({
                status: novoStatus,
                atualizadoEm:
                    new Date().toISOString()
            });
    }

    async function inicializarFirebasePlanner() {
        try {
            if (
                typeof firebase ===
                "undefined"
            ) {
                throw new Error(
                    "Firebase SDK não foi carregado."
                );
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(
                    FIREBASE_CONFIG
                );
            }

            firebaseAuth =
                firebase.auth();

            firebaseDb =
                firebase.firestore();

            try {
                firebaseDb.settings({
                    ignoreUndefinedProperties: true
                });
            }
            catch (erro) {
                console.debug(
                    "Firestore settings já inicializado.",
                    erro
                );
            }

            await firebaseAuth
                .signInAnonymously();

            firebaseReady = true;

            console.log(
                "Firebase conectado."
            );

            console.log(
                "UID anônimo:",
                firebaseAuth.currentUser?.uid
            );

            await migrarPedidosLocaisSeNecessario();

            iniciarSincronizacaoFirestore();
        }
        catch (erro) {
            firebaseReady = false;

            console.error(
                "Erro ao inicializar Firebase:",
                erro
            );

            const locais =
                obterPedidosLocaisParaMigracao();

            if (locais.length) {
                pedidos = locais;
                renderizar();
            }

            window.alert(
                "Não foi possível conectar ao banco online. Verifique sua internet e a configuração do Firebase."
            );
        }
    }

    /* FIREBASE_SYNC_END */
    async function salvarFormulario(event) {
        event.preventDefault();

        const cliente =
            elements.cliente.value.trim();

        const projeto =
            elements.projeto.value.trim();

        if (
            !cliente ||
            !projeto
        ) {
            return;
        }

        const dataPedidoFormatada =
            dataBRParaISO(
                elements.data.value
            );

        const prazoPedidoFormatado =
            dataBRParaISO(
                elements.prazo.value
            );

        if (
            elements.data.value &&
            !dataPedidoFormatada
        ) {
            window.alert(
                "Informe uma Data do pedido válida no formato DD/MM/AAAA."
            );

            elements.data.focus();

            return;
        }

        if (
            elements.prazo.value &&
            !prazoPedidoFormatado
        ) {
            window.alert(
                "Informe um Prazo / Entrega válido no formato DD/MM/AAAA."
            );

            elements.prazo.focus();

            return;
        }

        if (!firebaseReady) {
            window.alert(
                "Aguarde a conexão com o banco de dados."
            );

            return;
        }

        const id =
            elements.id.value;

        const anterior =
            pedidos.find(
                (item) =>
                    item.id === id
            );

        const pedido = {
            id:
                id ||
                gerarId(),

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
                    moedaParaNumero(
                        elements.valor.value
                    )
                ),

            data:
                dataPedidoFormatada ||
                hojeISO(),

            prazo:
                prazoPedidoFormatado,

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

        try {
            await salvarPedidoFirestore(
                pedido
            );

            fecharModal();
        }
        catch (erro) {
            console.error(
                "Erro ao salvar pedido:",
                erro
            );

            window.alert(
                "Erro ao salvar o pedido no banco de dados."
            );
        }
    }
    async function excluirPedido() {
        const id =
            elements.id.value;

        if (!id) {
            return;
        }

        const pedido =
            pedidos.find(
                (item) =>
                    item.id === id
            );

        if (!pedido) {
            return;
        }

        if (
            !window.confirm(
                `Excluir "${pedido.projeto}" de "${pedido.cliente}"?`
            )
        ) {
            return;
        }

        if (!firebaseReady) {
            window.alert(
                "Aguarde a conexão com o banco de dados."
            );

            return;
        }

        try {
            await excluirPedidoFirestore(
                id
            );

            fecharModal();
        }
        catch (erro) {
            console.error(
                "Erro ao excluir pedido:",
                erro
            );

            window.alert(
                "Erro ao excluir o pedido do banco de dados."
            );
        }
    }
    async function moverPedido(
        id,
        novoStatus
    ) {
        if (
            !STATUS.includes(
                novoStatus
            )
        ) {
            return;
        }

        const pedido =
            pedidos.find(
                (item) =>
                    item.id === id
            );

        if (!pedido) {
            return;
        }

        if (
            pedido.status ===
            novoStatus
        ) {
            return;
        }

        if (!firebaseReady) {
            window.alert(
                "Aguarde a conexão com o banco de dados."
            );

            return;
        }

        const statusAnterior =
            pedido.status;

        pedido.status =
            novoStatus;

        pedido.atualizadoEm =
            new Date().toISOString();

        renderizar();

        try {
            await atualizarStatusFirestore(
                id,
                novoStatus
            );
        }
        catch (erro) {
            pedido.status =
                statusAnterior;

            renderizar();

            console.error(
                "Erro ao mover pedido:",
                erro
            );

            window.alert(
                "Erro ao atualizar o status do pedido."
            );
        }
    }
    function configurarDragDrop() {
        document
            .querySelectorAll(
                ".kanban-list"
            )
            .forEach(
                (lista) => {

                    lista.addEventListener(
                        "dragenter",
                        (event) => {

                            event.preventDefault();

                            lista.classList.add(
                                "drag-over"
                            );
                        }
                    );

                    lista.addEventListener(
                        "dragover",
                        (event) => {

                            event.preventDefault();

                            if (
                                event.dataTransfer
                            ) {
                                event.dataTransfer.dropEffect =
                                    "move";
                            }

                            lista.classList.add(
                                "drag-over"
                            );
                        }
                    );

                    lista.addEventListener(
                        "dragleave",
                        (event) => {

                            if (
                                !lista.contains(
                                    event.relatedTarget
                                )
                            ) {
                                lista.classList.remove(
                                    "drag-over"
                                );
                            }
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

                            const novoStatus =
                                lista.dataset.list;

                            if (
                                id &&
                                novoStatus
                            ) {
                                moverPedido(
                                    id,
                                    novoStatus
                                );
                            }
                        }
                    );
                }
            );
    }

    function configurarBotoesAdicionar() {
        document
            .querySelectorAll(
                "[data-add-status]"
            )
            .forEach(
                (botao) => {

                    botao.addEventListener(
                        "click",
                        () => {

                            abrirNovoPedido(
                                botao.dataset.addStatus
                            );
                        }
                    );
                }
            );
    }

    elements.btnNovo.addEventListener(
        "click",
        () => {
            abrirNovoPedido(
                "produzir"
            );
        }
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

    /* PLANNER_MASK_EVENTS_START */

    if (elements.valor) {

        elements.valor.addEventListener(
            "input",
            function () {
                aplicarMascaraMoeda(
                    elements.valor
                );
            }
        );

        elements.valor.addEventListener(
            "blur",
            function () {

                if (
                    elements.valor.value
                ) {
                    elements.valor.value =
                        formatarMoeda(
                            moedaParaNumero(
                                elements.valor.value
                            )
                        );
                }
            }
        );
    }

    [
        elements.data,
        elements.prazo
    ].forEach(
        function (campo) {

            if (!campo) {
                return;
            }

            campo.addEventListener(
                "input",
                function () {
                    aplicarMascaraData(
                        campo
                    );
                }
            );

            campo.addEventListener(
                "blur",
                function () {

                    if (
                        campo.value &&
                        !dataBRParaISO(
                            campo.value
                        )
                    ) {
                        campo.classList.add(
                            "planner-field-invalid"
                        );
                    }
                    else {
                        campo.classList.remove(
                            "planner-field-invalid"
                        );
                    }
                }
            );

            campo.addEventListener(
                "focus",
                function () {
                    campo.classList.remove(
                        "planner-field-invalid"
                    );
                }
            );
        }
    );

    /* PLANNER_MASK_EVENTS_END */

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

            elements.busca.value =
                "";

            elements.filtroPrioridade.value =
                "";

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

    configurarExportacaoWhatsApp();

    configurarLayoutQuadros();

    configurarDragDrop();

    configurarBotoesAdicionar();

    inicializarFirebasePlanner();
})();