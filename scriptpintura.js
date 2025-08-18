// Variáveis globais
let dadosCSV = [];
let charts = {};

// Função para carregar CSV usando PapaParse
function carregarCSV() {
    fetch('pintura.csv')
        .then(resp => resp.text())
        .then(texto => {
            const resultados = Papa.parse(texto, { header: true, skipEmptyLines: true });
            dadosCSV = resultados.data.filter(r => r['Data']); // ignora linhas sem Data
            atualizarDashboard();
        })
        .catch(err => alert('Erro ao carregar CSV: ' + err));
}

// Filtra dados por datas
function filtrarPorData(dados, dataInicio, dataFim){
    const dtInicio = dataInicio ? new Date(dataInicio) : null;
    const dtFim = dataFim ? new Date(dataFim) : null;
    return dados.filter(r => {
        if(!r['Data']) return false;
        const [d,m,y] = r['Data'].split('/');
        const dataRow = new Date(+y, m-1, +d);
        if(dtInicio && dataRow < dtInicio) return false;
        if(dtFim && dataRow > dtFim) return false;
        return true;
    });
}

// Função para gerar gráficos Chart.js
function criarGrafico(id, tipo, labels, dados, cores){
    if(charts[id]) charts[id].destroy(); // destrói gráfico antigo
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
                borderWidth:1
            }]
        },
        options: {
            responsive:true,
            maintainAspectRatio:false,
            plugins:{
                legend:{ display:true }
            }
        }
    });
}

// Atualiza todos os gráficos
function atualizarDashboard(){
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const dadosFiltrados = filtrarPorData(dadosCSV, dataInicio, dataFim);

    // === Efetivo Presente/Falta ===
    const presentes = dadosFiltrados.reduce((sum,r)=>sum + (parseFloat(r['Presente'])||0),0);
    const faltas = dadosFiltrados.reduce((sum,r)=>sum + (parseFloat(r['Falta'])||0),0);
    criarGrafico('efetivoChart','doughnut',['Presente','Falta'],[presentes,faltas],['#0b63d6','#f87171']);

    // === HH Trabalhado por OS ===
    const osLabels = [...new Set(dadosFiltrados.map(r=>r['OS']))];
    const hhData = osLabels.map(os=>{
        return dadosFiltrados
            .filter(r=>r['OS']===os)
            .reduce((sum,r)=>sum + (parseFloat(r['HH'])||0),0);
    });
    criarGrafico('hhChart','bar',osLabels,hhData,'#0b63d6');

    // === Litros Utilizados no Mês ===
    const meses = [...new Set(dadosFiltrados.map(r=>r['Mes']))];
    const litrosMes = meses.map(mes=>{
        return dadosFiltrados
            .filter(r=>r['Mes']===mes)
            .reduce((sum,r)=>sum + (parseFloat(r['Litros'])||0),0);
    });
    criarGrafico('litrosMesChart','bar',meses,litrosMes,'#0b63d6');

    // === Total de Litros por OS ===
    const litrosOS = osLabels.map(os=>{
        return dadosFiltrados
            .filter(r=>r['OS']===os)
            .reduce((sum,r)=>sum + (parseFloat(r['Litros'])||0),0);
    });
    criarGrafico('litrosOSChart','bar',osLabels,litrosOS,'#f59e0b');

    // === Cores e Tipos de Tintas ===
    const tintas = [...new Set(dadosFiltrados.map(r=>r['Cor']))];
    const qtdTintas = tintas.map(cor=>{
        return dadosFiltrados.filter(r=>r['Cor']===cor).length;
    });
    criarGrafico('tintasChart','doughnut',tintas,qtdTintas,['#0b63d6','#f87171','#fbbf24','#10b981','#8b5cf6']);

    // === M² Pintados por Mês ===
    const m2Mes = meses.map(mes=>{
        return dadosFiltrados
            .filter(r=>r['Mes']===mes)
            .reduce((sum,r)=>sum + (parseFloat(r['M2'])||0),0);
    });
    criarGrafico('m2MesChart','bar',meses,m2Mes,'#6366f1');

    // === M² Pintados por OS ===
    const m2OS = osLabels.map(os=>{
        return dadosFiltrados
            .filter(r=>r['OS']===os)
            .reduce((sum,r)=>sum + (parseFloat(r['M2'])||0),0);
    });
    criarGrafico('m2OSChart','bar',osLabels,m2OS,'#f97316');
}

// Exportar PDF
document.getElementById('exportarPDF').addEventListener('click',()=>{
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text("Dashboard Pintura", 10, 10);
    pdf.save("dashboard_pintura.pdf");
});

// Filtrar por datas
document.getElementById('filtrar').addEventListener('click', atualizarDashboard);

// Inicializa
window.addEventListener('load', carregarCSV);
