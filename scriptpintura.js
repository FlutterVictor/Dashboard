let charts = {};
let dadosPintura = [];
let dadosSGE = [];

// Função para criar gráficos Chart.js
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

// Função para processar CSV
function processarCSV(file, callback){
    Papa.parse(file, {
        header:true,
        skipEmptyLines:true,
        complete: function(results){
            callback(results.data);
        }
    });
}

// Função atualizar gráficos
function atualizarDashboard(){
    if(dadosPintura.length > 0){

        // Área de Aplicação (LT)
        const locais = {};
        dadosPintura.forEach(d=>{
            if(d.Local && d.Litros) locais[d.Local] = (locais[d.Local]||0) + parseFloat(d.Litros);
        });
        criarGrafico("areaAplicacaoChart","bar",
            Object.keys(locais),
            Object.values(locais),
            ["#0b63d6"]
        );

        // Consumo GAD
        const gad = dadosPintura.filter(d=>d.Local==="Prédio GAD").reduce((sum,d)=>sum+parseFloat(d.Litros||0),0);
        criarGrafico("gadChart","bar", ["Prédio GAD"], [gad], ["#f59e0b"]);

        // Consumo PCI+Utilidades
        const pci = dadosPintura.filter(d=>d.Local==="Prédio PCI 3N").reduce((sum,d)=>sum+parseFloat(d.Litros||0),0);
        criarGrafico("pciChart","bar", ["Prédio PCI 3N"], [pci], ["#10b981"]);

        // Tinta Utilizada (Qtd)
        const tipos = {};
        dadosPintura.forEach(d=>{
            if(d.Tipo) tipos[d.Tipo] = (tipos[d.Tipo]||0)+1;
        });
        criarGrafico("tintaChart","bar",
            Object.keys(tipos),
            Object.values(tipos),
            ["#0b63d6","#f87171","#fbbf24","#10b981","#8b5cf6"]
        );

        // Tinta Utilizada (M²)
        const tintaM2 = {};
        dadosPintura.forEach(d=>{
            if(d.Tipo && d["M²"]) tintaM2[d.Tipo] = (tintaM2[d.Tipo]||0) + parseFloat(d["M²"]);
        });
        criarGrafico("tintaM2Chart","bar",
            Object.keys(tintaM2),
            Object.values(tintaM2),
            ["#0b63d6","#f87171","#fbbf24","#10b981","#8b5cf6"]
        );

        // Consumo por OS
        const os = {};
        dadosPintura.forEach(d=>{
            if(d.OS && d.Litros) os[d.OS] = (os[d.OS]||0) + parseFloat(d.Litros);
        });
        criarGrafico("osChart","bar",
            Object.keys(os),
            Object.values(os),
            ["#6366f1"]
        );
    }

    // Consumo HH (fixo)
    criarGrafico("hhChart","bar", ["Total Horas"], [974], ["#0b63d6"]);
}

// Upload de Pintura
document.getElementById("uploadPintura").addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(file){
        processarCSV(file, data=>{
            dadosPintura = data;
            atualizarDashboard();
        });
    }
});

// Upload SGE (não usado para HH fixo, mas mantemos leitura caso precise depois)
document.getElementById("uploadSGE").addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(file){
        processarCSV(file, data=>{
            dadosSGE = data;
            // Se futuramente quiser calcular HH real, pode usar aqui
        });
    }
});

// Exportar PDF
document.getElementById("exportarPDF").addEventListener("click",()=>{
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text("Dashboard Pintura", 10, 10);
    pdf.save("dashboard_pintura.pdf");
});

// Botão Filtrar (atualiza dashboard)
document.getElementById("filtrar").addEventListener("click", atualizarDashboard);

// Inicializa dashboard vazio
window.addEventListener("load", atualizarDashboard);
