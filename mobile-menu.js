/**
 * Menu hambúrguer responsivo
 */

(function () {
    "use strict";

    function fecharMenu(header, botao) {
        if (!header || !botao) {
            return;
        }

        header.classList.remove(
            "app-menu-open"
        );

        botao.setAttribute(
            "aria-expanded",
            "false"
        );

        botao.setAttribute(
            "aria-label",
            "Abrir menu"
        );
    }

    function abrirMenu(header, botao) {
        if (!header || !botao) {
            return;
        }

        header.classList.add(
            "app-menu-open"
        );

        botao.setAttribute(
            "aria-expanded",
            "true"
        );

        botao.setAttribute(
            "aria-label",
            "Fechar menu"
        );
    }

    function alternarMenu(header, botao) {
        const aberto =
            header.classList.contains(
                "app-menu-open"
            );

        if (aberto) {
            fecharMenu(
                header,
                botao
            );
        }
        else {
            abrirMenu(
                header,
                botao
            );
        }
    }

    function inicializarMenu(header) {
        const botao =
            header.querySelector(
                ".app-menu-toggle"
            );

        if (!botao) {
            return;
        }

        botao.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                alternarMenu(
                    header,
                    botao
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

                if (
                    window.matchMedia(
                        "(max-width: 720px)"
                    ).matches
                ) {
                    fecharMenu(
                        header,
                        botao
                    );
                }
            }
        );

        document.addEventListener(
            "click",
            function (event) {
                if (
                    !header.contains(
                        event.target
                    )
                ) {
                    fecharMenu(
                        header,
                        botao
                    );
                }
            }
        );

        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key ===
                    "Escape"
                ) {
                    fecharMenu(
                        header,
                        botao
                    );
                }
            }
        );

        window.addEventListener(
            "resize",
            function () {
                if (
                    window.innerWidth >
                    720
                ) {
                    fecharMenu(
                        header,
                        botao
                    );
                }
            }
        );
    }

    function iniciar() {
        document
            .querySelectorAll(
                ".app-header-inner"
            )
            .forEach(
                inicializarMenu
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