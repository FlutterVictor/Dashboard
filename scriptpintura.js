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

// Valores fixos (fallback)
const valoresFixos = {
    areaAplicacao: [28.2, 9.44],
    consumoHH: [974],
    consumoOS: [28.2, 9.44],
    tintaQtd: [4.9, 3.22, 10.5, 6.5, 12.52],
    tintaM2: [24.5,16.1,52.5,32.5,59.1],
    tintaNomes: [
        'TINTA EPOXI, N2630 CINZA PREIME',
        'TINTA MACROPOX 646 VERMELHO OXIDO',
        'TINTA MACROPOX CINZA 6.5',
        'TINTA N2677 AMARELO SINTÉTICO 5Y8/12',
        'TINTA N2677 CINZA GELO N8'
    ],
    consumoGAD: '28,2 L',
    consumoPCI: '9,44 L'
};

// Atualiza todos os gráficos
function atualizarDashboard(dadosPintura=null, dadosSGE=null) {
    // Se houver CSV, usar os dados, senão fallback
    let areaAplicacao = valoresFixos.areaAplicacao;
    let consumoHH = valoresFixos.consumoHH;
    let consumoOS = valoresFixos.consumoOS;
    let tintaQtd = valoresFixos.tintaQtd;
    let tintaM2 = valoresFixos.tintaM2;
    let consumoGAD = valoresFixos.consumoGAD;
    let consumoPCI = valoresFixos.consumoPCI;

    if(dadosPintura){
        // Consumo por OS
        let osMap = {};
        dadosPintura.forEach(d => {
            const os = d['OS'];
            const litros = parseFloat(d['Litros']) || 0;
            osMap[os] = (osMap[os] || 0) + litros;
        });
        consumoOS = Object.values(osMap);
        
        // Área de Aplicação
        let gad = 0, pci = 0;
        dadosPintura.forEach(d=>{
            const litros = parseFloat(d['Litros'])||0;
            if(d['Local'] === 'Prédio GAD') gad += litros;
            if(d['Local'] === 'Prédio PCI 3N') pci += litros;
        });
        consumoGAD = gad.toFixed(2)+' L';
        consumoPCI = pci.toFixed(2)+' L';

        // Tinta Utilizada
        let tintaMap = {};
        let tintaM2Map = {};
        dadosPintura.forEach(d=>{
            const tinta = d['Tipo'];
            const m2 = parseFloat(d['M²'])||0;
            tintaMap[tinta] = (tintaMap[tinta]||0) + 1; // quantidade
            tintaM2Map[tinta] = (tintaM2Map[tinta]||0) + m2;
        });
        tintaQtd = Object.values(tintaMap);
        tintaM2 = Object.values(tintaM2Map);
        valoresFixos.tintaNomes = Object.keys(tintaMap);
    }

    if(dadosSGE){
        let totalHH = 0;
        dadosSGE.forEach(d=>{
            const cargo = d['Cargo'];
            const contrato = d['Contrato'];
            const horas = parseFloat(d['Total Horas'])||0;
            if((cargo==='Pintor de estruturas metálicas' || cargo==='Pintor de Obras') && contrato==='4600184457'){
                totalHH += horas;
            }
        });
        consumoHH = [totalHH];
    }

    // Cria gráficos
    criarGrafico('areaAplicacaoChart','bar',['Prédio GAD','Prédio PCI/Utilidades'],areaAplicacao,['#0b63d6','#f59e0b']);
    criarGrafico('consumoHHChart','bar',['Total HH'],consumoHH,['#f59e0b']);
    criarGrafico('consumoOSChart','bar',Object.keys(osMap||{'37131':1,'37132':2}),consumoOS,['#10b981','#6366f1']);
    criarGrafico('tintaChart','bar',valoresFixos.tintaNomes,tintaQtd,['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']);
    criarGrafico('tintaM2Chart','bar',valoresFixos.tintaNomes,tintaM2,['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']);

    // Atualiza cards
    document.getElementById('valorGAD').innerText = consumoGAD;
    document.getElementById('valorPCI').innerText = consumoPCI;
}

// Função para ler CSV e retornar array de objetos
function lerCSV(file, callback){
    const reader = new FileReader();
    reader.onload = e => {
        const text = e.target.result;
        const linhas = text.split('\n').filter(l=>l.trim()!=='');
        const headers = linhas[0].split(',').map(h=>h.trim());
        const dados = linhas.slice(1).map(l=>{
            const valores = l.split(',');
            let obj = {};
            headers.forEach((h,i)=>{
                obj[h] = valores[i];
            });
            return obj;
        });
        callback(dados);
    };
    reader.readAsText(file);
}

// Eventos de upload
document.getElementById('uploadPintura').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(file) lerCSV(file, dados=>{
        atualizarDashboard(dados, null);
    });
});

document.getElementById('uploadSGE').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(file) lerCSV(file, dados=>{
        atualizarDashboard(null, dados);
    });
});

// Inicializa dashboard com valores fixos
window.addEventListener('load', ()=>atualizarDashboard());
