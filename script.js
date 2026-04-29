// CONFIGURAÇÕES DE CUSTO EDITÁVEIS
const CONFIG = {
    depreciacao_impressora_hora: 0.65,
    depreciacao_pc_hora: 0.25,
    custo_energia_kwh: 0.95,
    consumo_medio_impressora: 0.12,
    custo_infra_hora: 0.40,
    valor_acabamento_unit: 5.50,
    margem_perda_material: 0.10,
    valor_chaveiro: 0.30,
    valor_ima: 0.20,
    valor_adesivo: 0.13,
    taxa_fixa_shopee: 3.00
};

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
    const margemLucro = parseFloat(document.getElementById('margem').value) || 0;

    // 1. MATERIAL
    const cMatTotal = (peso / 1000) * custoKg * (1 + CONFIG.margem_perda_material) * qtd;

    // 2. ENERGIA + INFRA
    let cInfraHora = (CONFIG.consumo_medio_impressora * CONFIG.custo_energia_kwh);
    if (document.getElementById('chkCustosFixos').checked) cInfraHora += CONFIG.custo_infra_hora;
    const cInfraTotal = horasDec * cInfraHora * qtd;

    // 3. HARDWARE
    let cDepreHora = 0;
    if (document.getElementById('chkDepreciacao').checked) cDepreHora = CONFIG.depreciacao_impressora_hora + CONFIG.depreciacao_pc_hora;
    const cDepreTotal = horasDec * cDepreHora * qtd;

    // 4. ADICIONAIS DISCRIMINADOS
    const valChaveiro = document.getElementById('chkChaveiro').checked ? CONFIG.valor_chaveiro * qtd : 0;
    const valIma = document.getElementById('chkIma').checked ? CONFIG.valor_ima * qtd : 0;
    const valAcabamento = document.getElementById('chkAcabamento').checked ? CONFIG.valor_acabamento_unit * qtd : 0;
    const valAdesivo = document.getElementById('chkAdesivoFixo').checked ? CONFIG.valor_adesivo : 0;

    // 5. EMBALAGENS (Plástica + Sacola de Papel)
    const valPlastica = (parseFloat(document.getElementById('selPlastica').value) || 0) * qtd;
    const valSacolaPapel = parseFloat(document.getElementById('selPapelFixo').value) || 0;
    const totalEmbalagens = valPlastica + valSacolaPapel;

    // CUSTO PRODUÇÃO BRUTO
    const custoProducaoSubtotal = cMatTotal + cInfraTotal + cDepreTotal + valChaveiro + valIma + valAcabamento + valAdesivo + totalEmbalagens;

    // 6. TAXAS CANAL
    const percTaxaCanal = parseFloat(document.getElementById('canalVenda').value) || 0;
    let valorTaxaFixaCanal = 0;
    if (percTaxaCanal > 0 && document.getElementById('canalVenda').selectedOptions[0].text.includes("Shopee")) valorTaxaFixaCanal = CONFIG.taxa_fixa_shopee * qtd;

    const precoComLucro = custoProducaoSubtotal * (1 + (margemLucro / 100));
    const vendaTotal = (precoComLucro / (1 - percTaxaCanal)) + valorTaxaFixaCanal;
    const valorTaxasTotais = vendaTotal - precoComLucro;

    // ATUALIZAÇÃO DA UI
    document.getElementById('resMatDetalhe').innerText = format(cMatTotal);
    document.getElementById('resEneDetalhe').innerText = format(cInfraTotal);
    document.getElementById('resDepre').innerText = format(cDepreTotal);
    document.getElementById('resMaoObra').innerText = format(valAcabamento);
    document.getElementById('resChaveiro').innerText = format(valChaveiro);
    document.getElementById('resIma').innerText = format(valIma);
    document.getElementById('resAdesivo').innerText = format(valAdesivo);
    document.getElementById('resPlaDetalhe').innerText = format(totalEmbalagens);
    document.getElementById('resTaxas').innerText = format(valorTaxasTotais);

    document.getElementById('resCustoTotal').innerText = format(custoProducaoSubtotal);
    document.getElementById('resVendaUnid').innerText = format(vendaTotal / qtd);
    document.getElementById('resVendaTotal').innerText = format(vendaTotal);
    document.getElementById('dataAtual').innerText = "Data: " + new Date().toLocaleDateString('pt-BR');
}

function format(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function carregarConfiguracoes() {
    const salvo = JSON.parse(localStorage.getItem('cal3d_duolab_final'));
    if (salvo) {
        document.getElementById('margem').value = salvo.margem;
        document.getElementById('filamentoSelect').value = salvo.filIndex || 0;
    }
}

document.querySelectorAll('.calc-trigger').forEach(el => {
    el.addEventListener('input', calcular);
    el.addEventListener('change', calcular);
});

window.onload = popularFilamentos;
