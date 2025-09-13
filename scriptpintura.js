let dadosPintura = [];
let dadosSGE = [];
let charts = {};

// Função para criar gráficos Chart.js
function criarGrafico(id, tipo, labels, dados, cores){
    if(charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    charts[id] = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labels,
            datasets: [{
                label: '',
                data: dados,
                backgroundColor: cores.slice(0, dados.length),
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

// Função para atualizar dashboard
function atualizarDashboard(){

    // AREA DE APLICAÇÃO (LT)
    const areaAplicacao = {};
    dadosPintura.forEach(d => {
        const local = d.Local;
        const litros = parseFloat(d.Litros.replace(",", ".") || 0);
        if(local && !isNaN(litros)){
            areaAplicacao[local] = (areaAplicacao[local] || 0) + litros;
        }
    });
    criarGrafico(
        "areaAplicacaoChart",
        "bar",
        Object.keys(areaAplicacao),
        Object.values(areaAplicacao),
        ["#0b63d6"]
    );

    // CONSUMO HH - fixo em 974
    const consumoHH = 974;
    criarGrafico(
        "consumoHHChart",
        "bar",
        ["Horas Consumidas"],
        [consumoHH],
        ["#f97316"]
    );

    // CONSUMO POR OS
    const consumoOS = {};
    dadosPintura.forEach(d => {
        const os = d.OS;
        const litros = parseFloat(d.Litros.replace(",", ".") || 0);
        if(os && !isNaN(litros)){
            consumoOS[os] = (consumoOS[os] || 0) + litros;
        }
    });
    criarGrafico(
        "consumoOSChart",
        "bar",
        Object.keys(consumoOS),
        Object.values(consumoOS),
        ["#0b63d6"]
    );

    // CONSUMO GAD - CARD
    const consumoGAD = dadosPintura
        .filter(d => d.Local === "Prédio GAD")
        .reduce((sum, d) => sum + parseFloat(d.Litros.replace(",", ".") || 0), 0);
    document.getElementById("valorGAD").textContent = consumoGAD.toFixed(2) + " LT";

    // CONSUMO PCI+UTILIDADES - CARD
    const consumoPCI = dadosPintura
        .filter(d => d.Local === "Prédio PCI 3N")
        .reduce((sum, d) => sum + parseFloat(d.Litros.replace(",", ".") || 0), 0);
    document.getElementById("valorPCI").textContent = consumoPCI.toFixed(2) + " LT";

    // TINTA UTILIZADA (quantidade)
    const tintaQtd = {};
    dadosPintura.forEach(d => {
        const tipo = d.Tipo;
        if(tipo) {
            tintaQtd[tipo] = (tintaQtd[tipo] || 0) + 1;
        }
    });
    criarGrafico(
        "tintaChart",
        "doughnut",
        Object.keys(tintaQtd),
        Object.values(tintaQtd),
        ["#0b63d6","#f87171","#fbbf24","#10b981","#8b5cf6"]
    );

    // TINTA UTILIZADA (M²)
    const tintaM2 = {};
    dadosPintura.forEach(d => {
        const tipo = d.Tipo;
        const m2 = parseFloat(d["M²"].replace(",", ".") || 0);
        if(tipo && !isNaN(m2)) {
            tintaM2[tipo] = (tintaM2[tipo] || 0) + m2;
        }
    });
    criarGrafico(
        "tintaM2Chart",
        "bar",
        Object.keys(tintaM2),
        Object.values(tintaM2),
        ["#0b63d6","#f87171","#fbbf24","#10b981","#8b5cf6"]
    );
}

// Função para processar CSV (PapaParse)
function processarCSV(file, tipo){
    Papa.parse(file, {
        header:true,
        skipEmptyLines:true,
        complete:function(results){
            if(tipo === "pintura"){
                dadosPintura = results.data;
            } else if(tipo === "sge"){
                dadosSGE = results.data;
            }
            atualizarDashboard();
        }
    });
}

// Eventos dos uploads
document.getElementById("uploadPintura").addEventListener("change", function(e){
    processarCSV(e.target.files[0], "pintura");
});

document.getElementById("uploadSGE").addEventListener("change", function(e){
    processarCSV(e.target.files[0], "sge");
});

// Exportar PDF simples
document.getElementById('exportarPDF').addEventListener('click',()=>{
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text("Dashboard Pintura - Mockup", 10, 10);
    pdf.save("dashboard_pintura_mockup.pdf");
});

// Inicializa vazio
window.addEventListener('load', atualizarDashboard);
