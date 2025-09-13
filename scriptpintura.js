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
                backgroundColor: cores, 
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

// Repetir cores se necessário
function coloresAleatorias(qtd, cores) {
    const result = [];
    for (let i = 0; i < qtd; i++) result.push(cores[i % cores.length]);
    return result;
}

// Valores fixos iniciais
function atualizarDashboard() {
    // Área de Aplicação (LT)
    criarGrafico('areaAplicacaoChart','bar',
        ['Prédio GAD','Prédio PCI/Utilidades'],
        [40.78,17.48],
        ['#0b63d6','#f59e0b']
    );

    // Consumo HH - fixo
    criarGrafico('consumoHHChart','bar',['Total HH'],[974],['#f59e0b']);

    // Consumo por OS - fixo
    criarGrafico('consumoOSChart','bar',
        ['37131','37132'],
        [40.78,17.48],
        ['#10b981','#6366f1']
    );

    // Consumo GAD e PCI - cards
    document.getElementById('valorGAD').innerText = '40,78 L';
    document.getElementById('valorPCI').innerText = '9,44 L';

    // Tinta Utilizada (quantidade)
    criarGrafico('tintaChart','bar',
        ['TINTA EPOXI, N2630 CINZA PREIME','TINTA MACROPOX 646 VERMELHO OXIDO','TINTA MACROPOX CINZA 6.5','TINTA N2677 AMARELO SINTÉTICO 5Y8/12','TINTA N2677 CINZA GELO N8'],
        [5.65,10.82,10.60,12.41,16.41],
        ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']
    );

    // Tinta Utilizada (M²)
    criarGrafico('tintaM2Chart','bar',
        ['TINTA EPOXI, N2630 CINZA PREIME','TINTA MACROPOX 646 VERMELHO OXIDO','TINTA MACROPOX CINZA 6.5','TINTA N2677 AMARELO SINTÉTICO 5Y8/12','TINTA N2677 CINZA GELO N8'],
        [25.05,54.10,53.50,60.03,77.73],
        ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']
    );
}

// Função para ler CSV e transformar em array de objetos
function csvParaArray(strCSV) {
    const linhas = strCSV.split('\n').filter(l => l.trim() !== '');
    const cabecalho = linhas[0].split(',').map(c => c.trim());
    return linhas.slice(1).map(linha => {
        const valores = linha.split(',').map(v => v.trim());
        const obj = {};
        cabecalho.forEach((c,i)=> obj[c]=valores[i]);
        return obj;
    });
}

// Atualiza gráficos com CSV de pintura
function atualizarDashboardComCSV(dados) {
    // Exemplo: Tinta Utilizada M²
    const tintasMap = {};
    dados.forEach(d => {
        if(d['Tipo'] && d['M²']){
            const tipo = d['Tipo'];
            const m2 = parseFloat(d['M²'].replace(',', '.')) || 0;
            tintasMap[tipo] = (tintasMap[tipo] || 0) + m2;
        }
    });
    const tipos = Object.keys(tintasMap);
    const m2Valores = Object.values(tintasMap);
    criarGrafico('tintaM2Chart','bar', tipos, m2Valores, ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6','#8b5cf6']);

    // Consumo por OS
    const osMap = {};
    dados.forEach(d => {
        if(d['OS'] && d['Litros']){
            const os = d['OS'];
            const litros = parseFloat(d['Litros'].replace(',', '.')) || 0;
            osMap[os] = (osMap[os] || 0) + litros;
        }
    });
    criarGrafico('consumoOSChart','bar', Object.keys(osMap), Object.values(osMap), ['#10b981','#6366f1','#f59e0b']);

    // Consumo GAD
    const gad = dados.filter(d=>d['Local']==='Prédio GAD')
        .reduce((acc,d)=> acc + (parseFloat(d['Litros'].replace(',', '.')) || 0),0);
    document.getElementById('valorGAD').innerText = gad.toFixed(2)+' L';

    // Consumo PCI
    const pci = dados.filter(d=>d['Local']==='Prédio PCI 3N')
        .reduce((acc,d)=> acc + (parseFloat(d['Litros'].replace(',', '.')) || 0),0);
    document.getElementById('valorPCI').innerText = pci.toFixed(2)+' L';
}

// Atualiza gráfico HH com CSV SGE
function atualizarHHComCSV(dadosSGE) {
    const totalHH = dadosSGE
        .filter(d=>['Pintor de estruturas metálicas','Pintor de Obras'].includes(d['Cargo']) && d['Contrato']==='4600184457')
        .reduce((acc,d)=> acc + (parseFloat(d['Total Horas'].replace(',', '.')) || 0),0);
    criarGrafico('consumoHHChart','bar',['Total HH'],[totalHH],['#f59e0b']);
}

// Inicializa com valores fixos
window.addEventListener('load', atualizarDashboard);

// Upload pintura
document.getElementById('uploadPintura').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
        const csvText = ev.target.result;
        const dados = csvParaArray(csvText);
        atualizarDashboardComCSV(dados);
    };
    reader.readAsText(file);
});

// Upload SGE
document.getElementById('uploadSGE').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
        const csvText = ev.target.result;
        const dadosSGE = csvParaArray(csvText);
        atualizarHHComCSV(dadosSGE);
    };
    reader.readAsText(file);
});
