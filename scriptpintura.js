let charts = {};
let dadosPintura = [];
let dadosSGE = [];

// Função para criar gráficos Chart.js
function criarGrafico(id, tipo, labels, dados, cores) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    charts[id] = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labels,
            datasets: [{
                label: '',
                data: dados,
                backgroundColor: gerarCores(dados.length, cores),
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } }
        }
    });
}

// Gera cores repetidas ou padrão
function gerarCores(qtd, cores) {
    const result = [];
    for (let i = 0; i < qtd; i++) {
        result.push(cores[i % cores.length]);
    }
    return result;
}

// Função para atualizar o dashboard
function atualizarDashboard() {
    if (!dadosPintura.length) return;

    // Área de Aplicação (LT)
    const totalLitrosPorLocal = {};
    dadosPintura.forEach(d => {
        totalLitrosPorLocal[d.Local] = (totalLitrosPorLocal[d.Local] || 0) + parseFloat(d.Litros || 0);
    });
    criarGrafico('areaAplicacaoChart', 'bar', Object.keys(totalLitrosPorLocal), Object.values(totalLitrosPorLocal), ['#0b63d6']);

    // Consumo HH - fixo 974h
    criarGrafico('consumoHHChart', 'bar', ['Total HH'], [974], ['#f59e0b']);

    // Consumo por OS
    const totalPorOS = {};
    dadosPintura.forEach(d => {
        totalPorOS[d.OS] = (totalPorOS[d.OS] || 0) + parseFloat(d.Litros || 0);
    });
    criarGrafico('consumoOSChart', 'bar', Object.keys(totalPorOS), Object.values(totalPorOS), ['#10b981']);

    // Consumo GAD
    const gad = dadosPintura.filter(d => d.Local === 'Prédio GAD').reduce((acc, cur) => acc + parseFloat(cur.Litros || 0), 0);
    document.getElementById('valorGAD').innerText = `${gad} LT`;

    // Consumo PCI
    const pci = dadosPintura.filter(d => d.Local === 'Prédio PCI 3N').reduce((acc, cur) => acc + parseFloat(cur.Litros || 0), 0);
    document.getElementById('valorPCI').innerText = `${pci} LT`;

    // Tinta Utilizada
    const totalTipo = {};
    dadosPintura.forEach(d => {
        totalTipo[d.Tipo] = (totalTipo[d.Tipo] || 0) + 1;
    });
    criarGrafico('tintaChart', 'bar', Object.keys(totalTipo), Object.values(totalTipo), ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']);

    // Tinta Utilizada (M²)
    const totalTipoM2 = {};
    dadosPintura.forEach(d => {
        totalTipoM2[d.Tipo] = (totalTipoM2[d.Tipo] || 0) + parseFloat(d['M²'] || 0);
    });
    criarGrafico('tintaM2Chart', 'bar', Object.keys(totalTipoM2), Object.values(totalTipoM2), ['#6366f1','#f97316','#10b981','#f59e0b','#f87171']);
}

// Função para ler CSV e converter em array de objetos
function lerCSV(file, callback) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            callback(results.data);
        }
    });
}

// Upload de Pintura
document.getElementById('uploadPintura').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    lerCSV(file, (data) => {
        dadosPintura = data;
        atualizarDashboard();
    });
});

// Upload de SGE
document.getElementById('uploadSGE').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    lerCSV(file, (data) => {
        dadosSGE = data;
        // Consumo HH agora pode ser atualizado se quiser somar SGE, mas no layout fixamos 974h
        atualizarDashboard();
    });
});

// Exportar PDF
document.getElementById('exportarPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text("Dashboard Pintura", 10, 10);
    pdf.save("dashboard_pintura.pdf");
});

// Botão Filtrar
document.getElementById('filtrar').addEventListener('click', atualizarDashboard);
