(function () {
    "use strict";

    const HEADER_SELECTOR =
        ".app-header.no-print";

    const INNER_SELECTOR =
        ".app-header-inner";

    const BUTTON_SELECTOR =
        ".app-menu-toggle";

    const OPEN_CLASS =
        "app-menu-open";

    function fecharMenu(header) {
        if (!header) {
            return;
        }

        const botao =
            header.querySelector(
                BUTTON_SELECTOR
            );

        header.classList.remove(
            OPEN_CLASS
        );

        if (botao) {
            botao.setAttribute(
                "aria-expanded",
                "false"
            );

            botao.setAttribute(
                "aria-label",
                "Abrir menu"
            );
        }
    }

    function abrirMenu(header) {
        if (!header) {
            return;
        }

        const botao =
            header.querySelector(
                BUTTON_SELECTOR
            );

        header.classList.add(
            OPEN_CLASS
        );

        if (botao) {
            botao.setAttribute(
                "aria-expanded",
                "true"
            );

            botao.setAttribute(
                "aria-label",
                "Fechar menu"
            );
        }
    }

    function alternarMenu(header) {
        if (!header) {
            return;
        }

        if (
            header.classList.contains(
                OPEN_CLASS
            )
        ) {
            fecharMenu(header);
        }
        else {
            abrirMenu(header);
        }
    }

    function inicializarHeader(header) {
        const inner =
            header.querySelector(
                INNER_SELECTOR
            );

        const botao =
            header.querySelector(
                BUTTON_SELECTOR
            );

        if (!inner || !botao) {
            return;
        }

        botao.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                alternarMenu(
                    header
                );
            }
        );

        header.addEventListener(
            "click",
            function (event) {
                const link =
                    event.target.closest(
                        "a"
                    );

                if (!link) {
                    return;
                }

                fecharMenu(
                    header
                );
            }
        );
    }

    function iniciar() {
        const headers =
            document.querySelectorAll(
                HEADER_SELECTOR
            );

        headers.forEach(
            inicializarHeader
        );

        document.addEventListener(
            "click",
            function (event) {

                document
                    .querySelectorAll(
                        HEADER_SELECTOR +
                        "." +
                        OPEN_CLASS
                    )
                    .forEach(
                        function (header) {

                            if (
                                !header.contains(
                                    event.target
                                )
                            ) {
                                fecharMenu(
                                    header
                                );
                            }
                        }
                    );
            }
        );

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                document
                    .querySelectorAll(
                        HEADER_SELECTOR +
                        "." +
                        OPEN_CLASS
                    )
                    .forEach(
                        fecharMenu
                    );
            }
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );
    }
    else {
        iniciar();
    }
})();