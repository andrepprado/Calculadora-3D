(function () {
    "use strict";

    const brl = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    function numero(valor) {
        if (typeof valor === "number") return valor;
        let s = String(valor ?? "").trim().replace(/[^\d,.-]/g, "");
        if (s.includes(",")) {
            s = s.replace(/\./g, "").replace(",", ".");
        } else if ((s.match(/\./g) || []).length > 1) {
            s = s.replace(/\./g, "");
        }
        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
    }

    function moeda(valor) {
        return brl.format(numero(valor));
    }

    function digitosMoeda(valor) {
        const d = String(valor ?? "").replace(/\D/g, "");
        return d ? brl.format(Number(d) / 100) : "";
    }

    function data(valor) {
        const d = String(valor ?? "").replace(/\D/g, "").slice(0, 8);
        if (d.length <= 2) return d;
        if (d.length <= 4) return d.slice(0, 2) + "/" + d.slice(2);
        return d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
    }

    function dataValida(valor) {
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
        if (!m) return false;
        const dia = +m[1], mes = +m[2], ano = +m[3];
        if (ano < 1900 || ano > 9999) return false;
        const d = new Date(ano, mes - 1, dia);
        return d.getFullYear() === ano &&
            d.getMonth() === mes - 1 &&
            d.getDate() === dia;
    }

    function iniciar() {
        document.querySelectorAll("#pedidoValor").forEach(el => {
            el.inputMode = "numeric";
            el.addEventListener("input", () => {
                el.value = digitosMoeda(el.value);
            });
            el.addEventListener("blur", () => {
                if (el.value) el.value = moeda(el.value);
            });
        });

        ["pedidoData", "pedidoPrazo"].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.inputMode = "numeric";
            el.maxLength = 10;
            el.placeholder = "DD/MM/AAAA";
            el.addEventListener("input", () => {
                el.value = data(el.value);
                el.setCustomValidity("");
            });
            el.addEventListener("blur", () => {
                el.setCustomValidity(
                    el.value && !dataValida(el.value)
                        ? "Informe uma data valida no formato DD/MM/AAAA."
                        : ""
                );
            });
        });

        const custo = document.getElementById("custoKg");
        if (custo) {
            custo.type = "text";
            custo.inputMode = "decimal";
            custo.placeholder = "R$ 0,00";
            if (custo.value) custo.value = moeda(custo.value);
            custo.addEventListener("focus", () => {
                if (numero(custo.value) === 0) custo.select();
            });
            custo.addEventListener("input", () => {
                custo.value = digitosMoeda(custo.value);
            });
            custo.addEventListener("blur", () => {
                if (custo.value) custo.value = moeda(custo.value);
            });
        }
    }

    window.Calculadora3DMascaras = {
        numero, moeda, data, dataValida
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();