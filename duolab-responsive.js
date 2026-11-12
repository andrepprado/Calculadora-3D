/* DUOLAB_GLOBAL_RESPONSIVE_V2 */
(function () {
    "use strict";

    if (window.__duolabGlobalResponsiveV2) return;
    window.__duolabGlobalResponsiveV2 = true;

    const HEADER_ID = "duolab-desktop-header";
    const BREAKPOINT = 992;

    function texto(elemento) {
        return String(
            elemento?.textContent ||
            elemento?.getAttribute("aria-label") ||
            elemento?.getAttribute("title") ||
            ""
        ).replace(/\s+/g, " ").trim();
    }

    function obterMenu() {
        const toggle = document.querySelector(".app-menu-toggle");

        const seletores = [
            ".app-menu-panel",
            ".app-menu-dropdown",
            ".app-menu-content",
            ".app-menu-items",
            ".app-menu",
            "#app-menu",
            "#appMenu",
            ".mobile-menu",
            ".menu-dropdown",
            ".app-sidebar"
        ];

        if (toggle) {
            const id = toggle.getAttribute("aria-controls");

            if (id) {
                const painel = document.getElementById(id);
                if (painel) return painel;
            }

            const alvo =
                toggle.getAttribute("data-bs-target") ||
                toggle.getAttribute("data-target");

            if (alvo) {
                try {
                    const painel = document.querySelector(alvo);
                    if (painel) return painel;
                } catch (_) {}
            }
        }

        for (const seletor of seletores) {
            const painel = document.querySelector(seletor);

            if (
                painel &&
                painel.id !== HEADER_ID &&
                painel.querySelector("a[href], button")
            ) {
                return painel;
            }
        }

        if (toggle) {
            let pai = toggle.parentElement;

            for (let nivel = 0; pai && nivel < 4; nivel++, pai = pai.parentElement) {
                const candidatos = [...pai.querySelectorAll("nav, ul")];

                const painel = candidatos.find(item =>
                    item.querySelector("a[href], button") &&
                    !item.closest("#" + HEADER_ID)
                );

                if (painel) return painel;
            }
        }

        return null;
    }

    function obterOpcoes() {
        const painel = obterMenu();

        if (!painel) return [];

        const vistos = new Set();

        return [...painel.querySelectorAll("a[href], button")]
            .filter(elemento => {
                if (elemento.classList.contains("app-menu-toggle")) return false;
                if (elemento.closest("#" + HEADER_ID)) return false;

                const nome = texto(elemento);
                if (!nome) return false;

                const href = elemento.getAttribute("href") || "";
                const chave = nome.toLowerCase() + "|" + href;

                if (vistos.has(chave)) return false;

                vistos.add(chave);
                return true;
            });
    }

    function criarHeader() {
        if (document.getElementById(HEADER_ID)) return true;

        const opcoes = obterOpcoes();

        if (!opcoes.length) return false;

        const header = document.createElement("header");
        header.id = HEADER_ID;
        header.setAttribute("role", "banner");

        const marca = document.createElement("a");
        marca.className = "duolab-header-brand";
        marca.href = "index.html";
        marca.setAttribute("aria-label", "Duo.Lab - Inicio");

        const logo = document.querySelector(
            ".app-logo img, .logo img, .brand img"
        );

        if (logo) {
            const imagem = logo.cloneNode(true);
            imagem.removeAttribute("id");
            marca.appendChild(imagem);
        } else {
            marca.textContent = "Duo.Lab";
        }

        const nav = document.createElement("nav");
        nav.className = "duolab-header-nav";
        nav.setAttribute("aria-label", "Navegacao principal");

        for (const original of opcoes) {
            const nome = texto(original);
            let item;

            if (original.tagName === "A") {
                item = document.createElement("a");
                item.href = original.getAttribute("href") || "#";

                if (original.target) item.target = original.target;
                if (original.rel) item.rel = original.rel;

                if (original.hasAttribute("download")) {
                    item.setAttribute(
                        "download",
                        original.getAttribute("download")
                    );
                }
            } else {
                item = document.createElement("button");
                item.type = "button";

                item.addEventListener("click", function () {
                    original.click();
                });
            }

            item.textContent = nome;

            if (original.classList.contains("active")) {
                item.classList.add("active");
            }

            if (original.hasAttribute("aria-current")) {
                item.setAttribute(
                    "aria-current",
                    original.getAttribute("aria-current")
                );
            }

            nav.appendChild(item);
        }

        header.append(marca, nav);
        document.body.insertBefore(header, document.body.firstChild);

        return true;
    }

    function atualizar() {
        if (window.innerWidth >= BREAKPOINT) {
            criarHeader();
        }
    }

    function iniciar() {
        atualizar();

        window.addEventListener("resize", atualizar, {
            passive: true
        });

        window.addEventListener("orientationchange", atualizar, {
            passive: true
        });

        const observador = new MutationObserver(function () {
            if (
                window.innerWidth >= BREAKPOINT &&
                !document.getElementById(HEADER_ID)
            ) {
                criarHeader();
            }
        });

        observador.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, {
            once: true
        });
    } else {
        iniciar();
    }
})();

/* DUOLAB_IMAGE_PERFORMANCE_V3_START */
(function () {
    "use strict";

    if (window.__duolabImagePerformanceV3) return;
    window.__duolabImagePerformanceV3 = true;

    const imagensProcessadas = new WeakSet();
    const urlsPrecarregadas = new Set();

    function visivel(elemento) {
        const rect = elemento.getBoundingClientRect();

        return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom >= -400 &&
            rect.top <= window.innerHeight + 400
        );
    }

    function urlValida(src) {
        if (!src) return false;

        const valor = String(src).trim();

        return (
            valor.length > 0 &&
            !valor.startsWith("data:") &&
            !valor.startsWith("blob:") &&
            !valor.startsWith("javascript:")
        );
    }

    function preload(src, prioridade) {
        if (!urlValida(src)) return;
        if (urlsPrecarregadas.has(src)) return;

        urlsPrecarregadas.add(src);

        const imagem = new Image();

        imagem.decoding = "async";

        if ("fetchPriority" in imagem) {
            imagem.fetchPriority = prioridade ? "high" : "low";
        }

        imagem.src = src;
    }

    function otimizarImagem(img) {
        if (!(img instanceof HTMLImageElement)) return;
        if (imagensProcessadas.has(img)) return;

        imagensProcessadas.add(img);

        const importante = visivel(img);

        img.decoding = "async";

        if (importante) {
            img.loading = "eager";

            if ("fetchPriority" in img) {
                img.fetchPriority = "high";
            }
        } else {
            img.loading = "lazy";

            if ("fetchPriority" in img) {
                img.fetchPriority = "low";
            }
        }

        if (img.complete && img.naturalWidth > 0) {
            img.dataset.duolabLoaded = "true";
        } else {
            img.addEventListener("load", function () {
                img.dataset.duolabLoaded = "true";
            }, { once: true });
        }

        const src = img.currentSrc || img.getAttribute("src");

        if (importante && src) {
            preload(src, true);
        }
    }

    function otimizarImagens() {
        document.querySelectorAll("img").forEach(otimizarImagem);
    }

    function precarregarImagensDaPagina() {
        const imagens = [...document.querySelectorAll("img")];

        const principais = imagens
            .filter(visivel)
            .slice(0, 8);

        for (const img of principais) {
            const src = img.currentSrc || img.getAttribute("src");

            if (src) preload(src, true);
        }

        /*
         * Precarrega as imagens abaixo da dobra gradualmente.
         * Limita a concorrencia para nao prejudicar OCR,
         * scripts e demais recursos da calculadora.
         */
        const restantes = imagens
            .filter(img => !visivel(img))
            .slice(0, 24);

        let indice = 0;

        function proximoLote() {
            const lote = restantes.slice(indice, indice + 3);

            for (const img of lote) {
                const src = img.currentSrc || img.getAttribute("src");

                if (src) preload(src, false);
            }

            indice += lote.length;

            if (indice < restantes.length) {
                if ("requestIdleCallback" in window) {
                    window.requestIdleCallback(proximoLote, {
                        timeout: 2000
                    });
                } else {
                    window.setTimeout(proximoLote, 350);
                }
            }
        }

        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(proximoLote, {
                timeout: 2000
            });
        } else {
            window.setTimeout(proximoLote, 350);
        }
    }

    function iniciar() {
        otimizarImagens();
        precarregarImagensDaPagina();

        const observer = new MutationObserver(function (mutations) {
            let encontrouImagem = false;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) continue;

                    if (
                        node.matches("img") ||
                        node.querySelector("img")
                    ) {
                        encontrouImagem = true;
                        break;
                    }
                }

                if (encontrouImagem) break;
            }

            if (encontrouImagem) {
                otimizarImagens();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, {
            once: true
        });
    } else {
        iniciar();
    }
})();
/* DUOLAB_IMAGE_PERFORMANCE_V3_END */