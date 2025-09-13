let pinturaData = [];
let sgeData = [];
let charts = {};

// --- Função para limpar e normalizar o CSV
function limparCSV(csv) {
    return csv.map(item => {
        const obj = {};
        for (let key in item) {
            // Remove acentos, espaços extras e deixa maiúscula/minúscula consistente
            const cleanKey = key
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            obj[cleanKey] = item[key]?.trim();
        }
        return obj;
    });
}

// --- Converte string em número, trata vírgula decimal
function parseNumber(valor) {
    if (!valor) return 0;
    return parseFloat(valor.toString().replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
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
                backgroundColor: coloresAleatorias(dados.length, cores),
                borderColor: "rgba(0,0,0,0.1)",
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

// --- Gera cores
function coloresAleatorias(qtd, cores) {
    const result = [];
    for (let i = 0; i < qtd; i++) {
        result.push(cores[i % cores.length]);
    }
    return result;
}

// --- Atualiza todos os gráficos
function atualizarDashboard() {
    if (!pinturaData.length && !sgeData.length) return;

    // --- Área de Aplicação (LT)
    const areaMap = {};
    pinturaData.forEach(item => {
        const area = item["AREADEAPLICACAO"];
        const qtd = parseNumber(item["Qtd"]);
        if (!area) return;
        areaMap[area] = (areaMap[area] || 0) + qtd;
    });
    crearGrafico("areaAplicacaoChart", "bar", Object.keys(areaMap), Object.values(areaMap), ["#0b63d6"]);

    // --- Consumo PCI+Utilidades
    const pciTotal = pinturaData.reduce((sum, item) => {
        const area = item["AREADEAPLICACAO"]?.toLowerCase();
        const qtd = parseNumber(item["Qtd"]);
        return sum + (area === "predio pci 3n" ? qtd : 0);
    }, 0);
    crearGrafico("pciChart", "doughnut", ["Prédio PCI 3N"], [pciTotal], ["#f59e0b"]);

    // --- Tinta Utilizada
    const tintaMap = {};
    pinturaData.forEach(item => {
        const tinta = item["DESCRICAOPRODUTO"];
        if (!tinta) return;
        tintaMap[tinta] = (tintaMap[tinta] || 0) + 1;
    });
    crearGrafico("tintaChart", "bar", Object.keys(tintaMap), Object.values(tintaMap), ["#0b63d6","#f87171","#fbbf24","#10b981","#8b5cf6"]);

    // --- Tinta Utilizada (M²)
    const tintaM2Map = {};
    pinturaData.forEach(item => {
        const tinta = item["DESCRICAOPRODUTO"];
        const m2 = parseNumber(item["m2"]);
        if (!tinta) return;
        tintaM2Map[tinta] = (tintaM2Map[tinta] || 0) + m2;
    });
    crearGrafico("tintaM2Chart", "bar", Object.keys(tintaM2Map), Object.values(tintaM2Map), ["#6366f1"]);

    // --- Consumo de HH
    const hhTotal = sgeData.reduce((sum, item) => {
        const cargo = item["Cargo"]?.toLowerCase();
        const contrato = item["Contrato"];
        const horas = parseNumber(item["TotalHoras"]);
        if ((cargo === "pintor de estruturas metalicas" || cargo === "pintor de obras") && contrato === "4600184457") {
            return sum + horas;
        }
        return sum;
    }, 0);
    crearGrafico("hhChart", "bar", ["Total Horas"], [hhTotal], ["#0b63d6"]);

    // --- Consumo GAD
    const gadTotal = pinturaData.reduce((sum, item) => {
        const area = item["AREADEAPLICACAO"]?.toLowerCase();
        const qtd = parseNumber(item["Qtd"]);
        return sum + (area === "predio gad" ? qtd : 0);
    }, 0);
    crearGrafico("gadChart", "doughnut", ["Prédio GAD"], [gadTotal], ["#10b981"]);

    // --- Consumo por OS
    const osMap = {};
    pinturaData.forEach(item => {
        const os = item["OS"];
        const qtd = parseNumber(item["Qtd"]);
        if (!os) return;
        osMap[os] = (osMap[os] || 0) + qtd;
    });
    crearGrafico("osChart", "bar", Object.keys(osMap), Object.values(osMap), ["#f97316"]);
}

// --- Upload Planilha Pintura
document.getElementById("uploadPintura").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
            pinturaData = limparCSV(results.data);
            console.log("Pintura Data:", pinturaData[0]);
            atualizarDashboard();
        }
    });
});

// --- Upload Planilha SGE
document.getElementById("uploadSGE").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
            sgeData = limparCSV(results.data);
            console.log("SGE Data:", sgeData[0]);
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

// --- Botão Filtrar (por datas)
document.getElementById("filtrar").addEventListener("click", atualizarDashboard);

// Inicializa vazio
window.addEventListener("load", atualizarDashboard);
