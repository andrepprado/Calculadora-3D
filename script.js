function calcular() {
    // Inputs
    const peso = parseFloat(document.getElementById('peso').value) || 0;
    const tempo = parseFloat(document.getElementById('tempo').value) || 0;
    const custoKg = parseFloat(document.getElementById('custoKg').value) || 0;
    const custoHora = parseFloat(document.getElementById('custoHora').value) || 0;
    const margemPercentual = parseFloat(document.getElementById('margem').value) || 0;

    // Cálculo Material
    const custoMaterial = (peso * custoKg) / 1000;

    // Cálculo Despesas (Tempo x Custo Hora Máquina)
    const custoDespesas = tempo * custoHora;

    // Cálculo Acessórios
    let custoAcessorios = 0;
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        custoAcessorios += parseFloat(checkbox.getAttribute('data-valor'));
    });

    // Totais
    const custoTotalProducao = custoMaterial + custoDespesas + custoAcessorios;
    const valorMargem = custoTotalProducao * (margemPercentual / 100);
    const precoVenda = custoTotalProducao + valorMargem;

    // Atualização do DOM
    document.getElementById('resMaterial').innerText = formatarMoeda(custoMaterial);
    document.getElementById('resDespesas').innerText = formatarMoeda(custoDespesas);
    document.getElementById('resAcessorios').innerText = formatarMoeda(custoAcessorios);
    document.getElementById('resCustoTotal').innerText = formatarMoeda(custoTotalProducao);
    document.getElementById('resVenda').innerText = formatarMoeda(precoVenda);

    // Guardar configurações no LocalStorage
    salvarConfiguracoes(custoKg, custoHora, margemPercentual);
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function salvarConfiguracoes(custoKg, custoHora, margem) {
    const config = { custoKg, custoHora, margem };
    localStorage.setItem('configCalculadora3D', JSON.stringify(config));
}

function carregarConfiguracoes() {
    const salvo = localStorage.getItem('configCalculadora3D');
    if (salvo) {
        const config = JSON.parse(salvo);
        document.getElementById('custoKg').value = config.custoKg;
        document.getElementById('custoHora').value = config.custoHora;
        document.getElementById('margem').value = config.margem;
    }
}

// Event Listeners para recálculo instantâneo
document.querySelectorAll('.calc-trigger').forEach(elemento => {
    elemento.addEventListener('input', calcular);
    elemento.addEventListener('change', calcular);
});

// Inicialização
window.onload = () => {
    carregarConfiguracoes();
    calcular();
};