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

let filamentoSelecionado = 0;

function popularFilamentos() {
    const grid = document.getElementById('filamentosGrid');

    if (!grid) {
        console.error('filamentosGrid nao encontrado.');
        return;
    }

    carregarConfiguracoes();

    grid.innerHTML = '';

    filamentos.forEach((filamento, index) => {
        const label = document.createElement('label');
        label.className = 'filamento-opcao';

        const checkbox = document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.className = 'filamento-checkbox';
        checkbox.dataset.index = String(index);
        checkbox.checked = index === filamentoSelecionado;

        const cor = document.createElement('span');
        cor.className = 'filamento-cor';
        cor.style.backgroundColor = filamento.cor;

        const nome = document.createElement('span');
        nome.className = 'filamento-nome';
        nome.textContent = filamento.nome;

        checkbox.addEventListener('change', () => {

            if (!checkbox.checked) {
                checkbox.checked = true;
                return;
            }

            document
                .querySelectorAll('.filamento-checkbox')
                .forEach(item => {
                    item.checked = item === checkbox;
                });

            filamentoSelecionado = index;

            localStorage.setItem(
                'cal3d_duolab_filamento',
                String(index)
            );

            atualizarFilamento();
        });

        label.appendChild(checkbox);
        label.appendChild(cor);
        label.appendChild(nome);

        grid.appendChild(label);
    });

    atualizarFilamento();
}

function atualizarFilamento() {
    const filamento = filamentos[filamentoSelecionado];

    if (!filamento) {
        return;
    }

    document.getElementById('custoKg').value =
        filamento.custo.toFixed(2);

    document.getElementById('resNomeFilamento').innerText =
        filamento.nome;

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

    const cMatTotal = (peso / 1000) * custoKg * (1 + CONFIG.margem_perda_material) * qtd;

    let cInfraHora = CONFIG.consumo_medio_impressora * CONFIG.custo_energia_kwh;
    if (document.getElementById('chkCustosFixos').checked) {
        cInfraHora += CONFIG.custo_infra_hora;
    }
    const cInfraTotal = horasDec * cInfraHora * qtd;

    let cDepreHora = 0;
    if (document.getElementById('chkDepreciacao').checked) {
        cDepreHora = CONFIG.depreciacao_impressora_hora + CONFIG.depreciacao_pc_hora;
    }
    const cDepreTotal = horasDec * cDepreHora * qtd;

    const valChaveiro = document.getElementById('chkChaveiro').checked ? CONFIG.valor_chaveiro * qtd : 0;
    const valIma = document.getElementById('chkIma').checked ? CONFIG.valor_ima * qtd : 0;
    const valAcabamento = document.getElementById('chkAcabamento').checked ? CONFIG.valor_acabamento_unit * qtd : 0;
    const valLuminaria = document.getElementById('chkLuminaria').checked ? CONFIG.valor_luminaria * qtd : 0;
    const valAdesivo = document.getElementById('chkAdesivoFixo').checked ? CONFIG.valor_adesivo * qtd : 0;

    const valPlastica = document.getElementById('chkPlastica').checked ? CONFIG.valor_embalagem_plastica_fixa * qtd : 0;
    const valSacolaPapel = document.getElementById('chkSacolaKraft').checked ? CONFIG.valor_sacola_kraft * qtd : 0;
    const totalEmbalagens = valPlastica + valSacolaPapel;

    const custoProducaoSubtotal = cMatTotal + cInfraTotal + cDepreTotal + valChaveiro + valIma + valAcabamento + valLuminaria + valAdesivo + totalEmbalagens;

    const percTaxaCanal = parseFloat(document.getElementById('canalVenda').value) || 0;
    let valorTaxaFixaCanal = 0;
    if (percTaxaCanal > 0 && document.getElementById('canalVenda').selectedOptions[0].text.includes("Shopee")) {
        valorTaxaFixaCanal = CONFIG.taxa_fixa_shopee * qtd;
    }

    const precoComLucro = custoProducaoSubtotal * (1 + margemLucro / 100);
    const vendaTotalBruta = (precoComLucro / (1 - percTaxaCanal)) + valorTaxaFixaCanal;

    const vendaTotal = Math.ceil(vendaTotalBruta);
    const vendaUnitaria = qtd > 0 ? Math.ceil(vendaTotalBruta / qtd) : 0;
    const valorTaxasTotais = vendaTotalBruta - precoComLucro;

    document.getElementById('resMatDetalhe').innerText = format(cMatTotal);
    document.getElementById('resEneDetalhe').innerText = format(cInfraTotal);
    document.getElementById('resDepre').innerText = format(cDepreTotal);
    document.getElementById('resMaoObra').innerText = format(valAcabamento);
    document.getElementById('resLuminaria').innerText = format(valLuminaria);
    document.getElementById('resChaveiro').innerText = format(valChaveiro);
    document.getElementById('resIma').innerText = format(valIma);
    document.getElementById('resAdesivo').innerText = format(valAdesivo);
    document.getElementById('resPlaDetalhe').innerText = format(totalEmbalagens);
    document.getElementById('resTaxas').innerText = format(valorTaxasTotais);
    document.getElementById('resCustoTotal').innerText = format(custoProducaoSubtotal);
    document.getElementById('resVendaUnid').innerText = format(vendaUnitaria);
    document.getElementById('resVendaTotal').innerText = format(vendaTotal);
    document.getElementById('dataAtual').innerText = "Data: " + new Date().toLocaleDateString('pt-BR');

    document.getElementById('cliFilamento').innerText = document.getElementById('resNomeFilamento').innerText;
    document.getElementById('cliQtd').innerText = qtd;
    document.getElementById('cliValorUnid').innerText = format(vendaUnitaria);
    document.getElementById('cliValorTotal').innerText = format(vendaTotal);
    document.getElementById('dataAtualCliente').innerText = "Data: " + new Date().toLocaleDateString('pt-BR');

    document.getElementById('cliAcabamento').innerText = document.getElementById('chkAcabamento').checked ? "Sim" : "N├úo";
    document.getElementById('cliLuminaria').innerText = document.getElementById('chkLuminaria').checked ? "Sim" : "N├úo";
    document.getElementById('cliChaveiro').innerText = document.getElementById('chkChaveiro').checked ? "Sim" : "N├úo";
    document.getElementById('cliIma').innerText = document.getElementById('chkIma').checked ? "Sim" : "N├úo";
    document.getElementById('cliAdesivo').innerText = document.getElementById('chkAdesivoFixo').checked ? "Sim" : "N├úo";
    document.getElementById('cliEmbalagem').innerText = (document.getElementById('chkPlastica').checked || document.getElementById('chkSacolaKraft').checked) ? "Sim" : "N├úo";
}

function format(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function carregarConfiguracoes() {
    let salvo = null;

    try {
        salvo = JSON.parse(
            localStorage.getItem('cal3d_duolab_final')
        );
    } catch (erro) {
        salvo = null;
    }

    if (
        salvo &&
        salvo.margem !== undefined &&
        document.getElementById('margem')
    ) {
        document.getElementById('margem').value =
            salvo.margem;
    }

    const filamentoSalvo = parseInt(
        localStorage.getItem('cal3d_duolab_filamento'),
        10
    );

    if (
        !Number.isNaN(filamentoSalvo) &&
        filamentos[filamentoSalvo]
    ) {
        filamentoSelecionado = filamentoSalvo;
        return;
    }

    if (
        salvo &&
        salvo.filIndex !== undefined
    ) {
        const indiceAntigo = parseInt(
            salvo.filIndex,
            10
        );

        if (
            !Number.isNaN(indiceAntigo) &&
            filamentos[indiceAntigo]
        ) {
            filamentoSelecionado = indiceAntigo;
        }
    }
}

document.querySelectorAll('.calc-trigger').forEach(el => {
    el.addEventListener('input', calcular);
    el.addEventListener('change', calcular);
});

window.onload = popularFilamentos;
