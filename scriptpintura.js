let pinturaData = [];
let sgeData = [];
let charts = {};

// --- Converte string em número
function parseNumber(valor) {
    if (!valor) return 0;
    return parseFloat(valor.toString().replace(",", ".").replace(/\s/g,'')) || 0;
}

// --- Normaliza texto (remove acentos e espaços)
function normalizeText(txt) {
    return txt?.toString().trim().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .replace(/\s/g,"") || "";
}

// --- Cria gráficos Chart.js
function criarGrafico(id, tipo, labels, dados, cores) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext("2d");
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
            plugins: {
                legend: { display: true }
            }
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
    criarGrafico("areaAplicacaoChart","bar", Object.keys(areaMap), Object.values(areaMap), ["#0b63d6"]);

    // --- Consumo PCI+Utilidades
    const pciTotal = pinturaData.reduce((sum,item)=>{
        return sum + (normalizeText(item["Local"])==="prediopci3n" ? parseNumber(item["Litros"]) : 0);
    },0);
    criarGrafico("pciChart","doughnut", ["Prédio PCI 3N"], [pciTotal], ["#f59e0b"]);

    // --- Consumo GAD
    const gadTotal = pinturaData.reduce((sum,item)=>{
        return sum + (normalizeText(item["Local"])==="prediogad" ? parseNumber(item["Litros"]) : 0);
    },0);
    criarGrafico("gadChart","doughnut", ["Prédio GAD"], [gadTotal], ["#10b981"]);

    // --- Tinta Utilizada (contagem)
    const tintaMap = {};
    pinturaData.forEach(item=>{
        const tipo = item["Tipo"];
        if(!tipo) return;
        tintaMap[tipo] = (tintaMap[tipo] || 0) + 1;
    });
    criarGrafico("tintaChart","bar", Object.keys(tintaMap), Object.values(tintaMap),
        ["#0b63d6","#f87171","#fbbf24","#10b981","#8b5cf6"]);

    // --- Tinta Utilizada (M²)
    const tintaM2Map = {};
    pinturaData.forEach(item=>{
        const tipo = item["Tipo"];
        const m2 = parseNumber(item["M²"]);
        if(!tipo) return;
        tintaM2Map[tipo] = (tintaM2Map[tipo] || 0) + m2;
    });
    criarGrafico("tintaM2Chart","bar", Object.keys(tintaM2Map), Object.values(tintaM2Map),
        ["#6366f1"]);

    // --- Consumo HH
    const hhTotal = sgeData.reduce((sum,item)=>{
        const cargo = normalizeText(item["Cargo"]);
        const contrato = item["Contrato"]?.trim();
        const horas = parseNumber(item["TotalHoras"] || item["Total Horas"]);
        if ((cargo.includes("pintordeestruturasmetalicas") || cargo.includes("pintordeobras")) 
            && contrato === "4600184457") {
            return sum + horas;
        }
        return sum;
    }, 0);
    criarGrafico("hhChart","bar", ["Total Horas"], [hhTotal], ["#0b63d6"]);

    // --- Consumo por OS
    const osMap = {};
    pinturaData.forEach(item=>{
        const os = item["OS"];
        const litros = parseNumber(item["Litros"]);
        if(!os) return;
        osMap[os] = (osMap[os] || 0) + litros;
    });
    criarGrafico("osChart","bar", Object.keys(osMap), Object.values(osMap), ["#f97316"]);
}

// --- Leitura CSV de Pintura
document.getElementById("uploadPintura").addEventListener("change", e=>{
    const file = e.target.files[0];
    if(!file) return;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            pinturaData = results.data;
            atualizarDashboard();
        }
    });
});

// --- Leitura CSV de SGE
document.getElementById("uploadSGE").addEventListener("change", e=>{
    const file = e.target.files[0];
    if(!file) return;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            sgeData = results.data;
            atualizarDashboard();
        }
    });
});

// --- Exportar PDF
document.getElementById("exportarPDF").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text("Dashboard Pintura", 10, 10);
    pdf.save("dashboard_pintura.pdf");
});

// --- Filtrar (ainda simples, recarrega dashboard)
document.getElementById("filtrar").addEventListener("click", atualizarDashboard);
