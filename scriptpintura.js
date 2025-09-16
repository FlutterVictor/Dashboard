let charts = {};

// Função para criar gráficos Chart.js
function criarGrafico(id, tipo, labels, dados, cores, options = {}) {
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
            plugins: { legend: { display: true } },
            ...options
        }
    });
}

// Repetir cores se necessário
function coloresAleatorias(qtd, cores) {
    const result = [];
    for (let i = 0; i < qtd; i++) result.push(cores[i % cores.length]);
    return result;
}

// Inicializa os dashboards com valores fixos
function atualizarDashboard() {
    // Área de Aplicação (L)
    criarGrafico('areaAplicacaoChart','bar',['Prédio GAD','Prédio PCI/Utilidades'],[40.78,17.48],['#0b63d6','#f59e0b']);

    // Consumo HH - fixo
    criarGrafico('consumoHHChart','bar',['Total HH'],[974],['#f59e0b']);

    // Consumo por OS
    criarGrafico('consumoOSChart','bar',['37131','37132'],[40.78,17.48],['#10b981','#6366f1']);

    // Consumo GAD e PCI - cards
    document.getElementById('valorGAD').innerText = '40,78 L';
    document.getElementById('valorPCI').innerText = '17,48 L';

    // Tinta Utilizada (quantidade)
    criarGrafico('tintaChart','bar',
        ['TINTA EPOXI, N2630 CINZA PREIME','TINTA MACROPOX 646 VERMELHO OXIDO','TINTA MACROPOX CINZA 6.5','TINTA N2677 AMARELO SINTÉTICO 5Y8/12','TINTA N2677 CINZA GELO N8'],
        [5.65,10.82,10.6,12.41,16.41],
        ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']
    );

    // Tinta Utilizada (M²)
    criarGrafico('tintaM2Chart','bar',
        ['TINTA EPOXI, N2630 CINZA PREIME','TINTA MACROPOX 646 VERMELHO OXIDO','TINTA MACROPOX CINZA 6.5','TINTA N2677 AMARELO SINTÉTICO 5Y8/12','TINTA N2677 CINZA GELO N8'],
        [25.05,54.10,53.50,60.03,77.73],
        ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']
    );

    // Gráficos RNC
    criarGrafico('rncStatusChart','doughnut',['Em Execução','Concluídas'],[19,1],['#f59e0b','#10b981']);
    criarGrafico('rncAreaChart','bar',['GAD','PCI','Utilidades'],[12,3,5],['#0b63d6','#f59e0b','#10b981'], {
        onClick: function(evt, elements) {
            if(elements.length > 0) {
                const idx = elements[0].index;
                const area = this.data.labels[idx];
                abrirCardRNC(area);
            }
        }
    });
}

// Card flutuante RNC com exibição do PDF
function abrirCardRNC(area) {
    const card = document.getElementById("cardRNC");
    const viewer = document.getElementById("pdfViewer");
    card.style.display = 'block';

    // Mapear área para PDFs
    const pdfMap = {
        "GAD": [
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20160%20OS-37131%20Interna.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20168%20OS-37131%20Interna.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20179%20OS-37131%20Interna.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20207%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20208%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20209%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20210%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20211%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20212%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20237%20-%20OS%2037131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20238%20-%20OS%2037131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20297%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20299%20OS-37131.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20310%20OS-37131.pdf"
        ],
        "PCI": [
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20163%20OS-37132%20Interna.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20166%20OS-37132.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20239%20-%20OS%2037132.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20276%20OS-37132.pdf",
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20309%20OS-37132.pdf"
        ],
        "Utilidades": [
            "https://github.com/FlutterVictor/Dashboard/raw/main/PDFs/PCI%20166%20OS-37132.pdf"
        ]
    };

    const areaPDFs = pdfMap[area] || [];
    if(areaPDFs.length === 0) {
        viewer.innerHTML = `<div style="padding:20px; text-align:center; font-size:16px; color:#555;">Nenhum PDF disponível para ${area}</div>`;
        return;
    }

    // Exibe o primeiro PDF do array dentro do iframe
    viewer.innerHTML = `
        <iframe src="${areaPDFs[0]}" style="width:100%; height:500px;" frameborder="0"></iframe>
        <div style="margin-top:10px; font-size:14px; color:#555;">
            Área: ${area} | PDF 1 de ${areaPDFs.length}
        </div>
    `;
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

// Atualiza gráficos e cards com CSV de pintura
function atualizarDashboardComCSV(dados) {
    // Tinta Utilizada M²
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
    criarGrafico('tintaM2Chart','bar', tipos, m2Valores, ['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']);

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
    const gad = dados.filter(d=>d['OS']==='37131')
        .reduce((acc,d)=> acc + (parseFloat(d['Litros'].replace(',', '.')) || 0),0);
    document.getElementById('valorGAD').innerText = gad.toFixed(2)+' L';

    // Consumo PCI
    const pci = dados.filter(d=>d['OS']==='37132')
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
