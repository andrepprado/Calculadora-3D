const CONFIG = {
    depreciacao_impressora_hora: 0.65,
    depreciacao_pc_hora: 0.25,
    custo_energia_kwh: 0.95,
    consumo_medio_impressora: 0.12,
    custo_infra_hora: 0.40,
    valor_acabamento_unit: 1.50,
    margem_perda_material: 0.10,
    valor_chaveiro: 0.47,
    valor_ima: 0.20,
    valor_luminaria: 21.15,
    valor_adesivo: 0.20,
    taxa_fixa_shopee: 3.00,
    valor_embalagem_plastica_fixa: 0.50,
    valor_sacola_kraft: 1.50
};

const filamentos = [
    { nome: "VOOLT - PLA BEGE CAUCASIANO VELVET HIGH SPEED PREMIUM", custo: 92.32, cor: "#D6BC9B" },
    { nome: "VOOLT - PLA BRANCO VELVET HIGH SPEED PREMIUM", custo: 92.32, cor: "#F8F8F6" },
    { nome: "VOOLT - PLA PRETO VELVET HIGH SPEED PREMIUM", custo: 92.32, cor: "#181818" },
    { nome: "VOOLT - PLA VERMELHO VELVET HIGH SPEED PREMIUM", custo: 92.32, cor: "#C62828" },
    { nome: "BAMBU LAB - PLA AMARELO", custo: 128.90, cor: "#FFD400" },
    { nome: "BAMBU LAB - PLA AZUL", custo: 128.90, cor: "#0057B8" },
    { nome: "BAMBU LAB - PLA VERDE", custo: 128.90, cor: "#00A651" },
    { nome: "SUNLU - PETG AZUL BRILHANTE", custo: 75.20, cor: "#005EB8" },
    { nome: "SUNLU - PLA MARMORE BRANCO", custo: 120.99, cor: "#ECEAE4" },
    { nome: "ELEGOO - PLA SILK ROXO E PRETO", custo: 113.90, cor: "#5B2A86" },
    { nome: "ELEGOO - PLA MATTE LARANJA", custo: 103.80, cor: "#E67E22" },
    { nome: "ELEGOO - PLA SILK ROXO E AZUL", custo: 113.90, cor: "#5D3FD3" },
    { nome: "MASTERPRINT - PETG MARROM", custo: 83.90, cor: "#6B4423" },
    { nome: "MASTERPRINT - PETG BEGE", custo: 83.90, cor: "#D9C2A0" }
];

function popularFilamentos() {
    const select = document.getElementById('filamentoSelect');

    select.innerHTML = "";

    filamentos.forEach((f, index) => {
        const opt = document.createElement('option');

        opt.value = index;
        opt.text = f.nome;

        select.add(opt);
    });

    carregarConfiguracoes();
    atualizarFilamento();
}

function atualizarFilamento() {
    const select = document.getElementById('filamentoSelect');

    const index = parseInt(select.value);

    if (isNaN(index) || !filamentos[index]) {
        return;
    }

    const fil = filamentos[index];

    document.getElementById('custoKg').value =
        fil.custo.toFixed(2);

    document.getElementById('colorPreview').style.backgroundColor =
        fil.cor;

    setText('resNomeFilamento', fil.nome);

    calcular();
}
function setText(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerText = valor;
    }
}
function calcular() {
    const peso = parseFloat(document.getElementById('peso').value) || 0;

    const tempoRaw =
        document.getElementById('tempo').value || "00:00";

    const tVal = tempoRaw.split(':');

    const horasDec =
        (parseInt(tVal[0]) || 0) +
        (parseInt(tVal[1]) || 0) / 60;

    const qtd =
        parseInt(document.getElementById('quantidade').value) || 1;

    const custoKg =
        parseFloat(document.getElementById('custoKg').value) || 0;

    const margemLucro =
        parseFloat(document.getElementById('margem').value) || 0;

    /*
     * MATERIAL
     */
    const cMatTotal =
        (peso / 1000) *
        custoKg *
        (1 + CONFIG.margem_perda_material) *
        qtd;

    /*
     * ENERGIA + INFRAESTRUTURA
     *
     * Energia depende do tempo.
     * Infraestrutura marcada possui custo fixo mesmo
     * antes de informar peso ou tempo.
     */
    const custoEnergia =
        horasDec *
        CONFIG.consumo_medio_impressora *
        CONFIG.custo_energia_kwh *
        qtd;

    const custoInfraestrutura =
        document.getElementById('chkCustosFixos').checked
            ? CONFIG.custo_infra_hora * qtd
            : 0;

    const cInfraTotal =
        custoEnergia +
        custoInfraestrutura;

    /*
     * DEPRECIACAO
     *
     * Se marcada, existe custo mesmo com tempo zerado.
     */
    const cDepreTotal =
        document.getElementById('chkDepreciacao').checked
            ? (
                CONFIG.depreciacao_impressora_hora +
                CONFIG.depreciacao_pc_hora
              ) * qtd
            : 0;

    /*
     * ADICIONAIS
     *
     * Todo adicional marcado entra no custo,
     * independentemente de peso ou tempo.
     */
    const valChaveiro =
        document.getElementById('chkChaveiro').checked
            ? CONFIG.valor_chaveiro * qtd
            : 0;

    const valIma =
        document.getElementById('chkIma').checked
            ? CONFIG.valor_ima * qtd
            : 0;

    const valAcabamento =
        document.getElementById('chkAcabamento').checked
            ? CONFIG.valor_acabamento_unit * qtd
            : 0;

    const valLuminaria =
        document.getElementById('chkLuminaria').checked
            ? CONFIG.valor_luminaria * qtd
            : 0;

    const valAdesivo =
        document.getElementById('chkAdesivoFixo').checked
            ? CONFIG.valor_adesivo * qtd
            : 0;

    const valPlastica =
        document.getElementById('chkPlastica').checked
            ? CONFIG.valor_embalagem_plastica_fixa * qtd
            : 0;

    const valSacolaPapel =
        document.getElementById('chkSacolaKraft').checked
            ? CONFIG.valor_sacola_kraft * qtd
            : 0;

    const totalEmbalagens =
        valPlastica +
        valSacolaPapel;

    /*
     * CUSTO DE PRODUCAO
     */
    const custoProducaoSubtotal =
        cMatTotal +
        cInfraTotal +
        cDepreTotal +
        valChaveiro +
        valIma +
        valAcabamento +
        valLuminaria +
        valAdesivo +
        totalEmbalagens;

    /*
     * CANAL DE VENDA
     */
    const canalVenda =
        document.getElementById('canalVenda');

    const percTaxaCanal =
        parseFloat(canalVenda.value) || 0;

    let valorTaxaFixaCanal = 0;

    if (
        percTaxaCanal > 0 &&
        canalVenda.selectedOptions[0] &&
        canalVenda.selectedOptions[0].text.includes("Shopee")
    ) {
        valorTaxaFixaCanal =
            CONFIG.taxa_fixa_shopee * qtd;
    }

    /*
     * PRECO
     */
    const precoComLucro =
        custoProducaoSubtotal *
        (1 + margemLucro / 100);

    const vendaTotalBruta =
        (precoComLucro / (1 - percTaxaCanal)) +
        valorTaxaFixaCanal;

    const vendaTotal =
        Math.ceil(vendaTotalBruta);

    const vendaUnitaria =
        qtd > 0
            ? Math.ceil(vendaTotalBruta / qtd)
            : 0;

    const valorTaxasTotais =
        vendaTotalBruta -
        precoComLucro;

    /*
     * RESULTADOS
     */
    setText('resMatDetalhe', format(cMatTotal));

    setText('resEneDetalhe', format(cInfraTotal));

    setText('resDepre', format(cDepreTotal));

    setText('resMaoObra', format(valAcabamento));

    setText('resLuminaria', format(valLuminaria));

    setText('resChaveiro', format(valChaveiro));

    setText('resIma', format(valIma));

    setText('resAdesivo', format(valAdesivo));

    setText('resPlaDetalhe', format(totalEmbalagens));

    setText('resTaxas', format(valorTaxasTotais));

    setText('resCustoTotal', format(custoProducaoSubtotal));

    setText('resVendaUnid', format(vendaUnitaria));

    setText('resVendaTotal', format(vendaTotal));

    setText('dataAtual', "Data: " +
        new Date().toLocaleDateString('pt-BR'));

    /*
     * ORCAMENTO CLIENTE
     */
    const cliFilamento =
        document.getElementById('cliFilamento');

    if (cliFilamento) {
        cliFilamento.innerText =
            document.getElementById('resNomeFilamento').innerText;

        setText('cliQtd', qtd);

        setText('cliValorUnid', format(vendaUnitaria));

        setText('cliValorTotal', format(vendaTotal));

        setText('dataAtualCliente', "Data: " +
            new Date().toLocaleDateString('pt-BR'));

        setText('cliAcabamento', document.getElementById('chkAcabamento').checked
                ? "Sim"
                : "Não");

        setText('cliLuminaria', document.getElementById('chkLuminaria').checked
                ? "Sim"
                : "Não");

        setText('cliChaveiro', document.getElementById('chkChaveiro').checked
                ? "Sim"
                : "Não");

        setText('cliIma', document.getElementById('chkIma').checked
                ? "Sim"
                : "Não");

        setText('cliAdesivo', document.getElementById('chkAdesivoFixo').checked
                ? "Sim"
                : "Não");

        setText('cliEmbalagem', (
                document.getElementById('chkPlastica').checked ||
                document.getElementById('chkSacolaKraft').checked
            )
                ? "Sim"
                : "Não");
    }
}
function format(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function carregarConfiguracoes() {
    const salvo = JSON.parse(
        localStorage.getItem('cal3d_duolab_final')
    );

    if (salvo) {
        document.getElementById('margem').value =
            salvo.margem;

        document.getElementById('filamentoSelect').value =
            salvo.filIndex || 0;
    }
}
document.querySelectorAll('.calc-trigger').forEach(el => {
    el.addEventListener('input', handleChange);
    el.addEventListener('change', handleChange);
});

function handleChange(e) {
    if (e.target.id === "filamentoSelect") {
        atualizarFilamento();
    } else {
        calcular();
    }
}

/* ===== CALCULADORA INIT START ===== */

function definirCheckbox(id, marcado) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.checked = marcado;
    }
}

function resetarCalculadora() {
    const filamentoSelect =
        document.getElementById('filamentoSelect');

    const custoKg =
        document.getElementById('custoKg');

    const margem =
        document.getElementById('margem');

    const peso =
        document.getElementById('peso');

    const tempo =
        document.getElementById('tempo');

    const quantidade =
        document.getElementById('quantidade');

    const canalVenda =
        document.getElementById('canalVenda');

    if (filamentoSelect) {
        filamentoSelect.selectedIndex = 0;
    }

    if (margem) {
        margem.value = 100;
    }

    if (peso) {
        peso.value = 0;
    }

    if (tempo) {
        tempo.value = "00:00";
    }

    if (quantidade) {
        quantidade.value = 1;
    }

    if (canalVenda) {
        canalVenda.selectedIndex = 0;
    }

    definirCheckbox('chkChaveiro', false);
    definirCheckbox('chkIma', false);
    definirCheckbox('chkLuminaria', false);
    definirCheckbox('chkPlastica', false);
    definirCheckbox('chkSacolaKraft', false);
    definirCheckbox('chkAdesivoFixo', false);

    definirCheckbox('chkAcabamento', true);
    definirCheckbox('chkDepreciacao', true);
    definirCheckbox('chkCustosFixos', true);

    localStorage.removeItem('cal3d_duolab_final');
    localStorage.removeItem('cal3d_duolab_filamento');

    if (filamentoSelect) {
        atualizarFilamento();
    } else {
        calcular();
    }

    if (custoKg && filamentoSelect) {
        const indice =
            parseInt(filamentoSelect.value) || 0;

        if (filamentos[indice]) {
            custoKg.value =
                filamentos[indice].custo.toFixed(2);
        }
    }
}

function configurarBotaoLimpar() {
    const botao =
        document.getElementById('btnLimparCalculadora');

    if (!botao || botao.dataset.configurado === 'true') {
        return;
    }

    botao.dataset.configurado = 'true';

    botao.addEventListener(
        'click',
        resetarCalculadora
    );
}

function iniciarCalculadora() {
    popularFilamentos();
    configurarBotaoLimpar();
}

/*
 * Nao espera window.load.
 *
 * Se o JS estiver no final do BODY, executa imediatamente.
 * Caso esteja no HEAD, espera somente o DOM.
 *
 * Imagens, fontes e demais recursos nao bloqueiam
 * a inicializacao da calculadora.
 */
if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        iniciarCalculadora,
        { once: true }
    );

} else {

    iniciarCalculadora();
}

/* ===== CALCULADORA INIT END ===== */
