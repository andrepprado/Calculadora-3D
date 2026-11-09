
(() => {
  "use strict";

  const CONFIG = {
    apiKey: "AIzaSyBLTGktNsJUm-_IXtfh9cd65TYvUDk5gZ0",
    authDomain: "duolabcalc.firebaseapp.com",
    projectId: "duolabcalc",
    storageBucket: "duolabcalc.firebasestorage.app",
    messagingSenderId: "864677210505",
    appId: "1:864677210505:web:58b31d092e25f8e5791958"
  };

  const $ = id => document.getElementById(id);
  let salvando = false;
  let db = null;
  let auth = null;

  function mensagem(texto, erro = false) {
    const el = $("duoPedidoMensagem");
    el.textContent = texto;
    el.dataset.erro = String(erro);
  }

  function moeda(valor) {
    return (Number(valor) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function numeroMoeda(texto) {
    return Number(
      String(texto || "0")
        .replace(/[^0-9,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0;
  }

  function hojeBR() {
    return new Date().toLocaleDateString("pt-BR");
  }

  function dataISO(texto) {
    if (!texto) return "";
    const partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!partes) return "";

    const [, dia, mes, ano] = partes;
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

    if (
      data.getFullYear() !== Number(ano) ||
      data.getMonth() + 1 !== Number(mes) ||
      data.getDate() !== Number(dia)
    ) return "";

    return ano + "-" + mes + "-" + dia;
  }

  function simplificar(nome) {
    return String(nome || "")
      .replace(/\b(PLA|PETG|VELVET|SILK|V-SILK|HIGH SPEED|PREMIUM|ORIGINAL)\b/gi, "")
      .replace(/\s+/g, " ")
      .replace(/\s*-\s*-\s*/g, " - ")
      .trim();
  }

  function campo(id, valor) {
    const el = $(id);
    if (el) el.value = valor;
  }

  function abrir() {
    const o = window.duolabOrcamento;

    if (!o) {
      mensagem("Orçamento indisponível.", true);
      return;
    }

    const bandejas = o.multiparte
      ? (Array.isArray(o.bandejas) ? o.bandejas : [])
      : [];

    const cores = bandejas.length
      ? bandejas.map(b => simplificar(b.nome))
      : [simplificar(o.filamento)];

    const unicas = [...new Set(cores.filter(Boolean))];

    $("pedidoForm").reset();

    campo("pedidoId", "");
    campo("pedidoCliente", "");
    campo("pedidoContato", "");
    campo("pedidoProjeto", "");
    campo("pedidoQuantidade", Math.max(1, Number(o.quantidade) || 1));
    campo("pedidoCor", unicas.join(", ").slice(0, 120));
    campo("pedidoValor", moeda(o.valor));
    campo("pedidoData", hojeBR());
    campo("pedidoPrazo", "");
    campo("pedidoPrioridade", "media");
    campo("pedidoStatus", "produzir");

    const observacoes = bandejas.length
      ? bandejas.map((b, i) =>
          "Bandeja " + (i + 1) + ": " +
          simplificar(b.nome) + " | " +
          (b.peso || 0) + "g | " +
          (b.tempo || "00:00")
        ).join("\\\\n")
      : "Peso: " + (o.peso || 0) +
        "g | Tempo: " + Number(o.horas || 0).toFixed(2) + "h";

    campo("pedidoObservacoes", observacoes.slice(0, 1000));

    $("duoPedidoView").hidden = false;
    $("pedidoModal").hidden = false;
    document.body.classList.add("duo-pedido-ativo");

    mensagem("");
    window.scrollTo(0, 0);
    requestAnimationFrame(() => $("pedidoCliente").focus());
  }

  function voltar() {
    $("duoPedidoView").hidden = true;
    $("pedidoModal").hidden = true;
    document.body.classList.remove("duo-pedido-ativo");
    window.scrollTo(0, 0);
  }

  async function conectar() {
    if (db && auth && auth.currentUser) return db;

    if (typeof firebase === "undefined") {
      throw Error("Firebase nao carregado.");
    }

    if (!firebase.apps.length) firebase.initializeApp(CONFIG);

    auth = firebase.auth();
    db = firebase.firestore();

    if (!auth.currentUser) await auth.signInAnonymously();

    return db;
  }

  async function salvar(event) {
    event.preventDefault();
    if (salvando) return;

    const form = $("pedidoForm");
    if (!form.reportValidity()) return;

    const data = dataISO($("pedidoData").value);
    const prazoTexto = $("pedidoPrazo").value.trim();
    const prazo = prazoTexto ? dataISO(prazoTexto) : "";

    if (!data || (prazoTexto && !prazo)) {
      mensagem("Confira as datas no formato DD/MM/AAAA.", true);
      return;
    }

    const agora = new Date().toISOString();
    const id = crypto.randomUUID();

    const pedido = {
      id,
      cliente: $("pedidoCliente").value.trim(),
      contato: $("pedidoContato").value.trim(),
      projeto: $("pedidoProjeto").value.trim(),
      quantidade: Math.max(1, parseInt($("pedidoQuantidade").value, 10) || 1),
      cor: $("pedidoCor").value.trim(),
      valor: Math.max(0, numeroMoeda($("pedidoValor").value)),
      data,
      prazo,
      prioridade: $("pedidoPrioridade").value || "media",
      status: "produzir",
      observacoes: $("pedidoObservacoes").value.trim(),
      criadoEm: agora,
      atualizadoEm: agora
    };

    if (!pedido.cliente || !pedido.projeto) {
      mensagem("Preencha cliente e produto/projeto.", true);
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    salvando = true;
    botao.disabled = true;
    mensagem("Salvando pedido no Planner...");

    try {
      const banco = await conectar();

      await banco.collection("pedidos").doc(id).set(pedido);

      // Atualizar o cache utilizado pelo Planner.
      const chave = "duolab_planner_pedidos_v1";
      let lista = [];

      try {
        const salvo = JSON.parse(localStorage.getItem(chave) || "[]");
        if (Array.isArray(salvo)) lista = salvo;
      } catch (_) {}

      if (!lista.some(p => p.id === id)) lista.push(pedido);

      try {
        localStorage.setItem(chave, JSON.stringify(lista));
      } catch (_) {}

      mensagem("Pedido salvo com sucesso no Planner.");
      form.querySelectorAll("input,select,textarea,button")
        .forEach(el => el.disabled = true);

      const voltarBtn = $("duoVoltarOrcamento");
      voltarBtn.textContent = "Voltar à calculadora";
      voltarBtn.focus();

    } catch (erro) {
      console.error("Erro ao salvar pedido:", erro);
      mensagem(
        "Não foi possível salvar no banco. O pedido não foi confirmado.",
        true
      );
    } finally {
      salvando = false;
      botao.disabled = false;
    }
  }

  function iniciar() {
    const abrirBtn = $("btnEnviarPlanner");
    const form = $("pedidoForm");
    if (!abrirBtn || !form) return;

    abrirBtn.addEventListener("click", abrir);
    $("duoVoltarOrcamento").addEventListener("click", voltar);
    $("btnCancelarModal").addEventListener("click", voltar);
    form.addEventListener("submit", salvar);

    // Manter o campo de valor com mascara brasileira.
    $("pedidoValor").addEventListener("blur", event => {
      event.target.value = moeda(numeroMoeda(event.target.value));
    });

    // Novo acesso ao formulario reabilita os campos.
    abrirBtn.addEventListener("click", () => {
      form.querySelectorAll("input,select,textarea,button")
        .forEach(el => el.disabled = false);
      $("duoVoltarOrcamento").textContent = "Voltar ao orçamento";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, {once:true});
  } else {
    iniciar();
  }
})();
