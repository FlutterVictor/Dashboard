let charts = {};

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
                backgroundColor: coloresAleatorias(dados.length, cores),
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

// Função para repetir cores se necessário
function coloresAleatorias(qtd, cores){
    const result = [];
    for(let i=0;i<qtd;i++){
        result.push(cores[i % cores.length]);
    }
    return result;
}

// Atualiza todos os gráficos com valores fixos
function atualizarDashboard() {
    // Área de Aplicação (LT)
    criarGrafico(
        'areaAplicacaoChart',
        'bar',
        ['Prédio GAD', 'Prédio PCI/Utilidades'],
        [28.2, 9.44],
        ['#0b63d6','#f59e0b']
    );

    // Consumo HH - fixo
    criarGrafico(
        'consumoHHChart',
        'bar',
        ['Total HH'],
        [974],
        ['#f59e0b']
    );

    // Consumo por OS
    criarGrafico(
        'consumoOSChart',
        'bar',
        ['37131', '37132'],
        [28.2, 9.44],
        ['#10b981','#6366f1']
    );

    // Consumo GAD e PCI - cards
    document.getElementById('valorGAD').innerText = '28,2 L';
    document.getElementById('valorPCI').innerText = '9,44 L';

    // Tinta Utilizada (quantidade) - valores fixos
    criarGrafico(
        'tintaChart',
        'bar',
        [
            'TINTA EPOXI, N2630 CINZA PREIME',
            'TINTA MACROPOX 646 VERMELHO OXIDO',
            'TINTA MACROPOX CINZA 6.5',
            'TINTA N2677 AMARELO SINTÉTICO 5Y8/12',
            'TINTA N2677 CINZA GELO N8'
        ],
        [4.9, 3.22, 10.5, 6.5, 12.52],
        ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']
    );

    // Tinta Utilizada (M²) - valores fixos
    criarGrafico(
        'tintaM2Chart',
        'bar',
        [
            'TINTA EPOXI, N2630 CINZA PREIME',
            'TINTA MACROPOX 646 VERMELHO OXIDO',
            'TINTA MACROPOX CINZA 6.5',
            'TINTA N2677 AMARELO SINTÉTICO 5Y8/12',
            'TINTA N2677 CINZA GELO N8'
        ],
        [24.5, 16.1, 52.5, 32.5, 59.1],
        ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']
    );
}

// Inicializa dashboard ao carregar a página
window.addEventListener('load', atualizarDashboard);
