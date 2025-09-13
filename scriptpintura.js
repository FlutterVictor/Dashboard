let pinturaData = [];
let sgeData = [];
let charts = {};

// --- Converte string em número
function parseNumber(valor) {
    if (!valor) return 0;
    return parseFloat(valor.toString().replace(",", ".").replace(/\s/g,'')) || 0;
}

// --- Cria gráficos Chart.js
function crearGrafico(id, tipo, labels, dados, cores) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext("2d");
    charts[id] = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labels,
            datasets: [{
                label: "",
                data: dados,
                backgroundColor: cores,
                borderColor: "rgba(0,0,0,0.1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display:true } }
        }
    });
}

// --- Atualiza todos os gráficos
function atualizarDashboard() {
    if (!pinturaData.length && !sgeData.length) return;

    // --- Área de Aplicação (LT)
    const areaMap = {};
    pinturaData.forEach(item => {
        const local = item["Local"];
        const litros = parseNumber(item["Litros"]);
        if(!local) return;
        areaMap[local] = (areaMap[local] || 0) + litros;
    });
    crearGrafico("areaAplicacaoChart","bar", Object.keys(areaMap), Object.values(areaMap), ["#0b63d6"]);

    // --- Consumo PCI+Utilidades
    const pciTotal = pinturaData.reduce((sum,item)=>{
        return sum + (item["Local"]==="Prédio PCI 3N" ? parseNumber(item["Litros"]) : 0);
    },0);
    crearGrafico("pciChart","doughnut", ["Prédio PCI 3N"], [pciTotal], ["#f59e0b"]);

    // --- Tinta Utilizada
    const tintaMap = {};
    pinturaData.forEach(item=>{
        const tipo = item["Tipo"];
        if(!tipo) return;
        tintaMap[tipo] = (tintaMap[tipo] || 0) + 1;
    });
    crearGrafico("tintaChart","bar", Object.keys(tintaMap), Object.values(tintaMap), ["#0b63d6","#f87171","#fbbf24","#10b981","#8b5cf6"]);

    // --- Tinta Utilizada (M²)
    const tintaM2Map = {};
    pinturaData.forEach(item=>{
        const tipo = item["Tipo"];
        const m2 = parseNumber(item["M²"]);
        if(!tipo) return;
        tintaM2Map[tipo] = (tintaM2Map[tipo] || 0) + m2;
    });
    crearGrafico("tintaM2Chart","bar", Object.keys(tintaM2Map), Object.values(tintaM2Map), ["#6366f1"]);

    // --- Consumo de HH
    const hhTotal = sgeData.reduce((sum,item)=>{
        const cargo = (item["Cargo"] || "").toLowerCase();
        const contrato = item["Contrato"];
        const horas = parseNumber(item["TotalHoras"] || item["Total Horas"]);
        if((cargo.includes("pintor de estruturas metalicas") || cargo.includes("pintor de obras")) && contrato==="4600184457") {
            return sum + horas;
        }
        return sum;
    },0);
    crearGrafico("hhChart","bar", ["Total Horas"], [hhTotal], ["#0b63d6"]);

    // --- Consumo GAD
    const gadTotal = pinturaData.reduce((sum,item)=>{
        return sum + (item["Local"]==="Prédio GAD" ? parseNumber(item["Litros"]) : 0);
    },0);
    crearGrafico("gadChart","doughnut", ["Prédio GAD"], [gadTotal], ["#10b981"]);

    // --- Consumo por OS
    const osMap = {};
    pinturaData.forEach(item=>{
        const os = item["OS"];
        const litros = parseNumber(item["Litros"]);
        if(!os) return;
        osMap[os] = (osMap[os] || 0) + litros;
    });
    crearGrafico("osChart","bar", Object.keys(osMap), Object.values(osMap), ["#f97316"]);
}

// --- Carrega o JSON
fetch("output.json")
    .then(res=>res.json())
    .then(data=>{
        pinturaData = data.pintura || [];
        sgeData = data.sge || [];
        atualizarDashboard();
        console.log("Dashboard carregado com sucesso!");
    })
    .catch(err=>console.error("Erro ao carregar output.json:", err));

// --- Exportar PDF
document.getElementById("exportarPDF").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text("Dashboard Pintura", 10, 10);
    pdf.save("dashboard_pintura.pdf");
});

// --- Botão Filtrar (por datas)
document.getElementById("filtrar").addEventListener("click", atualizarDashboard);
