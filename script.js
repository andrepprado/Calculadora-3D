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
    { nome: "MASTERPRINT - PETG BEGE", custo: 83.90, cor: "#D9C2A0" },
    { nome: "MASTERPRINT - PETG PRETO", custo: 99.99, cor: "#171717" },
    { nome: "VOOLT - PLA ROSA P├ÜRPURA HIGH SPEED", custo: 97.14, cor: "#A62D78" },
    { nome: "VOOLT - PLA OUTLET (COR VARI├üVEL)", custo: 74.78, cor: "#888888" },
    { nome: "VOOLT - PLA VERDE V-SILK HIGH SPEED", custo: 96.18, cor: "#278F5B" },
    { nome: "VOOLT - PLA DOURADO V-SILK HIGH SPEED", custo: 96.18, cor: "#C8A44B" }
];

/* DUOLAB AGRUPAMENTO DEFINITIVO PLA PETG */

function duoTipoFilamento(filamento) {
    const nome = String(filamento.nome || '').toUpperCase();

    if (/\bPETG\b/.test(nome)) return 'PETG';
    if (/\bPLA\b/.test(nome)) return 'PLA';

    return 'OUTROS';
}

function duoNomeFilamento(filamento) {
    const nome = String(filamento.nome || '');

    return nome
        .replace(/\b(PLA|PETG)\b/gi, '')
        .replace(/\b(VELVET|V-SILK|SILK|MATTE|HIGH SPEED|PREMIUM|ORIGINAL)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function duoPopularSelectFilamentos(select) {
    if (!select) return;

    const valorAnterior = select.value;
    const fragmento = document.createDocumentFragment();

    const grupos = ['PLA', 'PETG', 'OUTROS'];

    for (const tipo of grupos) {
        const itens = filamentos
            .map((filamento, index) => ({
                filamento,
                index
            }))
            .filter(item => duoTipoFilamento(item.filamento) === tipo)
            .sort((a, b) =>
                duoNomeFilamento(a.filamento).localeCompare(
                    duoNomeFilamento(b.filamento),
                    'pt-BR',
                    { sensitivity: 'base', numeric: true }
                )
            );

        if (!itens.length) continue;

        const grupo = document.createElement('optgroup');
        grupo.label = tipo === 'OUTROS'
            ? 'OUTROS MATERIAIS'
            : 'FILAMENTOS ' + tipo;

        for (const item of itens) {
            const opcao = document.createElement('option');

            // Preservar o indice original usado nos calculos.
            opcao.value = String(item.index);
            opcao.textContent = duoNomeFilamento(item.filamento);
            opcao.dataset.tipo = tipo;
            opcao.dataset.cor = item.filamento.cor || '';

            grupo.appendChild(opcao);
        }

        fragmento.appendChild(grupo);
    }

    select.replaceChildren(fragmento);

    if (Array.from(select.options).some(o => o.value === valorAnterior)) {
        select.value = valorAnterior;
    } else if (select.options.length) {
        select.selectedIndex = 0;
    }
}

/* FIM DUOLAB AGRUPAMENTO DEFINITIVO */
function popularFilamentos() {
    const select = document.getElementById('filamentoSelect');

    if (!select) return;

    duoPopularSelectFilamentos(select);
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
    const multiparte = document.getElementById('modoMultipartes')?.checked || false;
    const bandejas = multiparte ? lerBandejas() : [];
    const peso = multiparte ? bandejas.reduce((a,b)=>a+b.peso,0) : (parseFloat(document.getElementById('peso').value) || 0);

    const tempoRaw =
        document.getElementById('tempo').value || "00:00";

    const tVal = tempoRaw.split(':');

    const horasDec = multiparte ? bandejas.reduce((a,b)=>a+b.horas,0) :
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
    const cMatTotal = multiparte
        ? bandejas.reduce((total,b)=>total+(b.peso/1000)*b.custo*(1+CONFIG.margem_perda_material),0)*qtd
        : (peso / 1000) * custoKg * (1 + CONFIG.margem_perda_material) * qtd;

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
    setText('resNomeFilamento', multiparte ? bandejas.filter(b=>b.peso>0).map(b=>b.nome).join(' + ') || 'Multipartes' : filamentos[parseInt(document.getElementById('filamentoSelect').value)]?.nome || '-');
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
    window.duolabOrcamento = { valor:vendaTotal, quantidade:qtd, filamento:document.getElementById('resNomeFilamento').innerText, bandejas, peso, horas:horasDec, multiparte };

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
                : "N├úo");

        setText('cliLuminaria', document.getElementById('chkLuminaria').checked
                ? "Sim"
                : "N├úo");

        setText('cliChaveiro', document.getElementById('chkChaveiro').checked
                ? "Sim"
                : "N├úo");

        setText('cliIma', document.getElementById('chkIma').checked
                ? "Sim"
                : "N├úo");

        setText('cliAdesivo', document.getElementById('chkAdesivoFixo').checked
                ? "Sim"
                : "N├úo");

        setText('cliEmbalagem', (
                document.getElementById('chkPlastica').checked ||
                document.getElementById('chkSacolaKraft').checked
            )
                ? "Sim"
                : "N├úo");
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
    const get = id => document.getElementById(id);

    const definir = (id, valor) => {
        const el = get(id);
        if (el) el.value = valor;
    };

    const marcar = (id, valor) => {
        const el = get(id);
        if (el) el.checked = valor;
    };

    // Desativar multipartes e restaurar layout original.
    const toggle = get('modoMultipartes');
    if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Restaurar os campos originais.
    const select = get('filamentoSelect');
    if (select) select.selectedIndex = 0;

    definir('margem', 100);
    definir('peso', '');
    definir('tempo', '00:00');
    definir('quantidade', 1);

    const canal = get('canalVenda');
    if (canal) canal.selectedIndex = 0;

    // Restaurar checkboxes.
    [
        'chkChaveiro',
        'chkIma',
        'chkLuminaria',
        'chkPlastica',
        'chkSacolaKraft',
        'chkAdesivoFixo'
    ].forEach(id => marcar(id, false));

    [
        'chkAcabamento',
        'chkDepreciacao',
        'chkCustosFixos'
    ].forEach(id => marcar(id, true));

    // Reiniciar todas as bandejas din├ómicas.
    const area = get('bandejasArea');

    if (area) {
        const linhas = Array.from(
            area.querySelectorAll('.duo-bandeja')
        );

        // Excluir as bandejas adicionais usando os
        // pr├│prios eventos da interface.
        for (let i = linhas.length - 1; i >= 4; i--) {
            const remover = linhas[i].querySelector(
                '.duo-remover-bandeja'
            );

            if (remover) {
                remover.click();
            } else {
                linhas[i].remove();
            }
        }

        // Garantir quatro bandejas iniciais.
        const adicionar = get('duoAdicionarBandeja');

        if (adicionar) {
            while (
                area.querySelectorAll('.duo-bandeja').length < 4
            ) {
                adicionar.click();
            }
        }

        // Limpar todos os dados das bandejas restantes.
        area.querySelectorAll('.duo-bandeja').forEach(
            (linha, indice) => {
                const filamento = linha.querySelector('select');
                const peso = linha.querySelector('.bandeja-peso');
                const tempo = linha.querySelector('.bandeja-tempo');
                const label = linha.querySelector('.duo-bandeja-label');

                if (filamento) filamento.selectedIndex = 0;
                if (peso) peso.value = '';
                if (tempo) tempo.value = '00:00';
                if (label) label.textContent = 'Bandeja ' + (indice + 1);
            }
        );
    }

    // Sincronizar quantidade do multipartes.
    const rodape = get('duoRodapeMultipartes');

    if (rodape) {
        const campoQuantidade = rodape.querySelector(
            'input[type="number"]'
        );

        if (campoQuantidade) campoQuantidade.value = 1;
    }

    // Fechar o Planner incorporado.
    const overlay = get('duoPlannerOverlay');
    if (overlay) overlay.hidden = true;

    const frame = get('duoPlannerFrame');
    if (frame) frame.src = 'about:blank';

    // Remover rascunho n├úo confirmado.
    sessionStorage.removeItem('duolab_planner_rascunho_v1');

    // Restaurar armazenamento da calculadora.
    localStorage.removeItem('cal3d_duolab_final');
    localStorage.removeItem('cal3d_duolab_filamento');

    // Restaurar o filamento padr├úo.
    if (select && typeof atualizarFilamento === 'function') {
        atualizarFilamento();
    }

    // Recalcular o or├ºamento zerado.
    if (typeof calcular === 'function') {
        calcular();
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

/* Modo multipartes: despesas de acabamento, embalagem, infraestrutura e deprecia├º├úo
   continuam calculadas uma ├║nica vez por unidade; material e energia somam bandejas. */
function lerBandejas(){
    return [...document.querySelectorAll('.duo-bandeja')].map((row)=>{
        const index=Number(row.querySelector('select').value);
        const f=filamentos[index] || filamentos[0];
        const peso=Math.max(0,Number(row.querySelector('.bandeja-peso').value)||0);
        const tempo=row.querySelector('.bandeja-tempo').value || '00:00';
        const [h,m]=tempo.split(':').map(Number);
        return {nome:f.nome,peso,horas:(h||0)+(m||0)/60,custo:f.custo,tempo};
    });
}


function configurarMultipartes() {
    const toggle = document.getElementById('modoMultipartes');
    const area = document.getElementById('bandejasArea');
    const campos = document.getElementById('camposPecaSimples');
    const margem = document.getElementById('margem');
    const seletorPrincipal = document.getElementById('filamentoSelect');
    const custoPrincipal = document.getElementById('custoKg');

    if (!toggle || !area || !campos || !margem) return;

    // Preservar o formul├írio e os estilos originais.
    const card = toggle.closest('.card');
    const tituloFilamento = card.querySelector('h3');
    const grupoFilamento = seletorPrincipal.closest('.input-group');
    const linhaOriginal = margem.closest('.input-row');
    const grupoMargem = margem.closest('.input-group');
    const grupoCusto = custoPrincipal.closest('.input-group');

    const ancoraMargem = document.createComment('posicao-original-margem');
    grupoMargem.parentNode.insertBefore(ancoraMargem, grupoMargem);

    // Controles de quantidade e margem ap├│s a ├║ltima bandeja.
    const rodape = document.createElement('div');
    rodape.id = 'duoRodapeMultipartes';

    const linhaRodape = document.createElement('div');
    linhaRodape.className = 'input-row duo-linha-rodape';

    const grupoQuantidade = document.createElement('div');
    grupoQuantidade.className = 'input-group';

    const tituloQuantidade = document.createElement('label');
    tituloQuantidade.textContent = 'Quantidade de produtos';

    const quantidadeOriginal = document.getElementById('quantidade');

    const quantidadeMulti = document.createElement('input');
    quantidadeMulti.type = 'number';
    quantidadeMulti.min = '1';
    quantidadeMulti.step = '1';
    quantidadeMulti.value = quantidadeOriginal.value || '1';
    quantidadeMulti.className = 'calc-trigger';

    quantidadeMulti.addEventListener('input', () => {
        quantidadeOriginal.value = quantidadeMulti.value;
        calcular();
    });

    grupoQuantidade.append(tituloQuantidade, quantidadeMulti);
    linhaRodape.append(grupoQuantidade, grupoMargem);
    rodape.append(linhaRodape);
    area.after(rodape);

    // Controles para adicionar e excluir linhas.
    const acoes = document.createElement('div');
    acoes.id = 'duoAcoesBandejas';

    const adicionar = document.createElement('button');
    adicionar.type = 'button';
    adicionar.id = 'duoAdicionarBandeja';
    adicionar.className = 'btn-limpar-calculadora';
    adicionar.textContent = '+ ADICIONAR BANDEJA';

    acoes.append(adicionar);
    area.after(acoes);
    acoes.after(rodape);

    let proximoId = 0;

    function renumerar() {
        area.querySelectorAll('.duo-bandeja').forEach((row, index) => {
            const numero = index + 1;
            row.querySelector('.duo-bandeja-label').textContent =
                'Bandeja ' + numero;
            row.querySelector('select').setAttribute(
                'aria-label', 'Filamento da bandeja ' + numero
            );
        });
    }

    function criarBandeja(dados = null) {
        proximoId++;

        const row = document.createElement('div');
        row.className = 'duo-bandeja';
        row.dataset.id = String(proximoId);

        const label = document.createElement('label');
        label.className = 'duo-bandeja-label';
        label.textContent = 'Bandeja';

        const select = document.createElement('select');
        select.className = 'calc-trigger duo-bandeja-filamento';

        duoPopularSelectFilamentos(select);

        const peso = document.createElement('input');
        peso.type = 'number';
        peso.className = 'calc-trigger bandeja-peso';
        peso.min = '0';
        peso.step = '0.01';
        peso.placeholder = 'Gramas';
        peso.setAttribute('aria-label', 'Peso em gramas');

        const tempo = document.createElement('input');
        tempo.type = 'time';
        tempo.className = 'calc-trigger bandeja-tempo';
        tempo.value = '00:00';
        tempo.setAttribute('aria-label', 'Tempo de impress├úo');

        const remover = document.createElement('button');
        remover.type = 'button';
        remover.className = 'btn-limpar-calculadora duo-remover-bandeja';
        remover.textContent = 'REMOVER';
        remover.title = 'Remover bandeja';

        if (dados) {
            if (dados.filamento != null) {
                select.value = String(dados.filamento);
            }
            if (dados.peso != null) peso.value = dados.peso;
            if (dados.tempo) tempo.value = dados.tempo;
        }

        remover.addEventListener('click', () => {
            if (area.querySelectorAll('.duo-bandeja').length <= 1) {
                return;
            }
            row.remove();
            renumerar();
            calcular();
        });

        [select, peso, tempo].forEach(elemento => {
            elemento.addEventListener('input', calcular);
            elemento.addEventListener('change', calcular);
        });

        row.append(label, select, peso, tempo, remover);
        area.append(row);
        renumerar();
        calcular();
    }

    adicionar.addEventListener('click', () => criarBandeja());

    function atualizarModo() {
        const ativo = toggle.checked;

        area.hidden = !ativo;
        acoes.hidden = !ativo;
        rodape.hidden = !ativo;
        campos.hidden = ativo;

        // Ocultar apenas os campos que n├úo fazem sentido
        // no modo multipartes.
        tituloFilamento.hidden = ativo;
        grupoFilamento.hidden = ativo;
        grupoCusto.hidden = ativo;

        if (ativo) {
            rodape.append(linhaRodape);
            linhaRodape.append(grupoMargem);
            linhaOriginal.hidden = true;

            quantidadeMulti.value = quantidadeOriginal.value || '1';

            if (!area.querySelector('.duo-bandeja')) {
                criarBandeja();
            }


        } else {
            ancoraMargem.parentNode.insertBefore(
                grupoMargem, ancoraMargem.nextSibling
            );
            linhaOriginal.hidden = false;

        }

        calcular();
    }

    toggle.addEventListener('change', atualizarModo);

    // Criar quatro linhas iniciais, sem limitar a quantidade m├íxima.
    for (let i = 0; i < 4; i++) {
        criarBandeja();
    }

    atualizarModo();

    // Restaurar corretamente os campos ao limpar.
    const botaoLimpar = document.getElementById('btnLimparCalculadora');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarMultipartes);
} else {
    configurarMultipartes();
}

/* DUOLAB FINAL FILAMENT SELECT V9 */
(function () {
    "use strict";

    const marcas = [
        "BAMBU LAB", "ELEGOO", "MASTERPRINT",
        "SUNLU", "VOOLT"
    ];

    const cores = [
        "BEGE CAUCASIANO", "MARMORE BRANCO",
        "ROXO E AZUL", "ROXO E PRETO",
        "AZUL BRILHANTE", "ROSA PURPURA",
        "AMARELO", "LARANJA", "DOURADO",
        "VERMELHO", "MARROM", "BRANCO",
        "PRETO", "VERDE", "AZUL",
        "BEGE", "ROSA", "OUTLET"
    ];

    function normalizar(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();
    }

    function identificar(option) {
        const valor = String(option.value);
        let item = null;

        if (typeof filamentos !== "undefined" &&
            Array.isArray(filamentos)) {
            const indice = Number(valor);

            if (Number.isInteger(indice) &&
                indice >= 0 &&
                indice < filamentos.length) {
                item = filamentos[indice];
            }
        }

        const nome = normalizar(
            item && item.nome ||
            option.dataset.duolabOriginal ||
            option.textContent
        );

        const descricao = normalizar([
            nome,
            item && item.tipo,
            item && item.material,
            option.textContent
        ].filter(Boolean).join(" "));

        const marca = marcas.find(m =>
            descricao.includes(m)
        ) || "";

        const cor = cores.find(c =>
            descricao.includes(c)
        ) || "";

        let tipo = "";

        if (/\bPETG\b/.test(descricao)) {
            tipo = "PETG";
        } else if (/\bPLA\b/.test(descricao)) {
            tipo = "PLA";
        } else if (marca === "MASTERPRINT") {
            tipo = "PETG";
        }

        return { marca, cor, tipo };
    }

    function ehFilamento(select) {
        const identificacao = normalizar(
            (select.id || "") + " " +
            (select.className || "")
        );

        if (/FILAMENTO|BANDEJA/.test(identificacao)) {
            return true;
        }

        return Array.from(select.options).filter(o =>
            marcas.some(m =>
                normalizar(o.textContent).includes(m)
            )
        ).length >= 3;
    }

    function organizar(select) {
        if (!ehFilamento(select)) return;

        const opcoes = Array.from(select.options);
        const validas = opcoes.filter(o =>
            o.value !== "" && !o.disabled
        );

        if (!validas.length) return;

        const assinatura = validas.map(o =>
            o.value + ":" + o.textContent
        ).sort().join("|");

        if (
            select.dataset.duolabFinalV9 === assinatura &&
            select.querySelector("optgroup")
        ) return;

        const valorAtual = select.value;
        const fragmento = document.createDocumentFragment();

        const grupos = {
            PLA: document.createElement("optgroup"),
            PETG: document.createElement("optgroup"),
            OUTROS: document.createElement("optgroup")
        };

        grupos.PLA.label = "──────── PLA ────────";
        grupos.PETG.label = "──────── PETG ────────";
        grupos.OUTROS.label = "──────── OUTROS ────────";

        for (const option of opcoes) {
            if (option.value === "" || option.disabled) {
                fragmento.appendChild(option);
                continue;
            }

            const info = identificar(option);

            if (!option.dataset.duolabOriginal) {
                option.dataset.duolabOriginal =
                    option.textContent;
            }

            if (!info.marca || !info.cor) {
                grupos.OUTROS.appendChild(option);
                continue;
            }

            option.textContent = [
                info.marca,
                info.cor,
                info.tipo
            ].filter(Boolean).join(" - ");

            option.style.backgroundColor = "#ffffff";
            option.style.color = "#17243a";

            const destino = grupos[info.tipo] || grupos.OUTROS;
            destino.appendChild(option);
        }

        for (const tipo of ["PLA", "PETG", "OUTROS"]) {
            const grupo = grupos[tipo];

            if (!grupo.children.length) continue;

            const itens = Array.from(grupo.children)
                .sort((a, b) =>
                    a.textContent.localeCompare(
                        b.textContent, "pt-BR"
                    )
                );

            grupo.replaceChildren(...itens);
            fragmento.appendChild(grupo);
        }

        select.replaceChildren(fragmento);
        select.value = valorAtual;

        select.dataset.duolabFinalV9 =
            Array.from(select.options)
                .filter(o => o.value !== "" && !o.disabled)
                .map(o => o.value + ":" + o.textContent)
                .sort().join("|");
    }

    function aplicar() {
        document.querySelectorAll("select").forEach(organizar);
    }

    function iniciar() {
        aplicar();

        const observer = new MutationObserver(records => {
            if (!records.some(record =>
                Array.from(record.addedNodes).some(node =>
                    node.nodeType === 1 &&
                    (
                        node.matches?.("select") ||
                        node.querySelector?.("select")
                    )
                )
            )) return;

            aplicar();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
/* END DUOLAB FINAL FILAMENT SELECT V9 */
