const filamentos = [
    { nome: "MASTERPRINT - PETG PRETO BRILHANTE", custo: 58.38, cor: "#000000" },
    { nome: "MASTERPRINT - PETG VERMELHO BRILHANTE", custo: 77.74, cor: "#C12E1F" },
    { nome: "VOOLT - PETG HF ROXO TRANSLUCIDO", custo: 84.74, cor: "#660099" },
    { nome: "VOOLT - PETG HF ROSA CEREJA TRANSLUCIDO", custo: 84.74, cor: "#DE3163" },
    { nome: "VOOLT - PLA VELVET PRETO HF", custo: 104.38, cor: "#1A1A1A" },
    { nome: "VOOLT - PETG AZUL HF", custo: 79.48, cor: "#0086D6" },
    { nome: "VOOLT - PETG LARANJA HF", custo: 79.48, cor: "#FF6A13" },
    { nome: "SUNLU - PETG AZUL BRILHANTE", custo: 75.20, cor: "#0068AB" },
    { nome: "SUNLU - PETG VERMELHO BRILHANTE", custo: 75.20, cor: "#C12E1F" },
    { nome: "SUNLU - PETG BRANCO BRILHANTE", custo: 75.20, cor: "#FFFFFF" },
    { nome: "SUNLU - PETG CINZA BRILHANTE", custo: 75.20, cor: "#8E9089" },
    { nome: "SUNLU - PETG PRETO BRILHANTE", custo: 75.20, cor: "#000000" },
    { nome: "SUNLU - PLA MARMORE BRANCO", custo: 120.99, cor: "#E0E0E0" },
    { nome: "BAMBU LAB - PLA AMARELO", custo: 128.90, cor: "#F4EE2A" },
    { nome: "BAMBU LAB - PLA AZUL", custo: 128.90, cor: "#0A2989" },
    { nome: "BAMBU LAB - PLA VERDE", custo: 128.90, cor: "#00AE42" }
];

const CUSTO_HORA_FIXO = 0.12;

function popularFilamentos() {
    const select = document.getElementById('filamentoSelect');
    filamentos.forEach((f, index) => {
        let opt = document.createElement('option');
        opt.value = index;
        opt.text = f.nome;
        select.add(opt);
    });
    carregarConfiguracoes();
    atualizarFilamento();
}

function atualizarFilamento() {
    const index = document.getElementById('filamentoSelect').value;
    const fil = filamentos[index];
    document.getElementById('custoKg').value = fil.custo.toFixed(2);
    document.getElementById('colorPreview').style.backgroundColor = fil.cor;
    document.getElementById('resNomeFilamento').innerText = fil.nome;
    calcular();
}

function calcular() {
    const peso = parseFloat(document.getElementById('peso').value) || 0;
    const tempoRaw = document.getElementById('tempo').value || "00:00";
    const tVal = tempoRaw.split(':');
    const horasDec = (parseInt(tVal[0]) || 0) + (parseInt(tVal[1]) || 0) / 60;
    const qtd = parseInt(document.getElementById('quantidade').value) || 1;
    const custoKg = parseFloat(document.getElementById('custoKg').value) || 0;
    const margem = parseFloat(document.getElementById('margem').value) || 0;

    // 1. CUSTOS DE PRODUÇÃO
    const cMatTotal = (peso / 1000) * custoKg * qtd;
    const cEneTotal = horasDec * CUSTO_HORA_FIXO * qtd;

    const pUnit = parseFloat(document.getElementById('selPlastica').value) || 0;

    let extUnit = 0;
    extUnit += document.getElementById('chkChaveiro').checked ? 0.30 : 0;
    extUnit += document.getElementById('chkIma').checked ? 0.20 : 0;
    extUnit += document.getElementById('chkAcabamento').checked ? 0.50 : 0;

    // FIXO POR PEDIDO (CORRETO)
    let cFixoTotal = parseFloat(document.getElementById('selPapelFixo').value) || 0;
    cFixoTotal += document.getElementById('chkAdesivoFixo').checked ? 0.13 : 0;

    // TOTAL PRODUÇÃO (mantido)
    const custoTotalProducao = cMatTotal + cEneTotal + ((pUnit + extUnit) * qtd) + cFixoTotal;

    // =========================
    // 🔥 CORREÇÃO AQUI
    // =========================

    // custo unitário REAL (sem fixo)
    const custoUnitario = (cMatTotal / qtd) + (cEneTotal / qtd) + pUnit + extUnit;

    // aplica margem no unitário
    const vendaUnid = custoUnitario * (1 + (margem / 100));

    // total final soma fixo no pedido
    const vendaTotal = (vendaUnid * qtd) + cFixoTotal;

    // =========================

    // UI
    document.getElementById('resQtd').innerText = qtd + " unid.";

    document.getElementById('resMatDetalhe').innerText = format(cMatTotal);
    document.getElementById('resEneDetalhe').innerText = format(cEneTotal);
    document.getElementById('resPlaDetalhe').innerText = format(pUnit * qtd);
    document.getElementById('resExtDetalhe').innerText = format(extUnit * qtd);
    document.getElementById('resFixDetalhe').innerText = format(cFixoTotal);
    document.getElementById('resCustoTotal').innerText = format(custoTotalProducao);

    document.getElementById('resVendaUnid').innerText = format(vendaUnid);
    document.getElementById('resVendaTotal').innerText = format(vendaTotal);
    document.getElementById('dataAtual').innerText = "Data: " + new Date().toLocaleDateString('pt-BR');

    salvarConfiguracoes(margem);
}

function format(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function salvarConfiguracoes(margem) {
    localStorage.setItem('cal3d_andre', JSON.stringify({
        margem,
        filIndex: document.getElementById('filamentoSelect').value
    }));
}

function carregarConfiguracoes() {
    const salvo = JSON.parse(localStorage.getItem('cal3d_andre'));
    if (salvo) {
        document.getElementById('margem').value = salvo.margem;
        document.getElementById('filamentoSelect').value = salvo.filIndex || 0;
    }
}

document.querySelectorAll('.calc-trigger').forEach(el => {
    el.addEventListener('input', calcular);
    el.addEventListener('change', (e) => {
        if (e.target.id === 'filamentoSelect') atualizarFilamento();
        else calcular();
    });
});

window.onload = popularFilamentos;
