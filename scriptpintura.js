// ==================== VARIÁVEIS GLOBAIS ====================
let pinturaData = [];
let sgeData = [];
let charts = {};

// ==================== FUNÇÃO PARA NORMALIZAR NÚMEROS ====================
function parseNumber(valor) {
  if (!valor) return 0;
  return parseFloat(valor.toString().replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
}

// ==================== FUNÇÃO PARA CRIAR/ATUALIZAR GRÁFICO ====================
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
      plugins: { legend: { display: true } }
    }
  });
}

// ==================== FUNÇÕES PARA CADA GRÁFICO ====================

function renderAreaAplicacao() {
  const counts = {};
  pinturaData.forEach(item => {
    const area = item["ÁREA DE APLICAÇÃO"]?.trim();
    const qtd = parseNumber(item["Qtd."]);
    if (area) counts[area] = (counts[area] || 0) + qtd;
  });
  criarGrafico("areaAplicacaoChart", "bar", Object.keys(counts), Object.values(counts),
    Object.keys(counts).map(_ => "rgba(54,162,235,0.7)"));
}

function renderPCI() {
  let total = 0;
  pinturaData.forEach(item => {
    if (item["ÁREA DE APLICAÇÃO"]?.trim() === "Prédio PCI 3N") {
      total += parseNumber(item["Qtd."]);
    }
  });
  criarGrafico("pciChart", "doughnut", ["Prédio PCI 3N"], [total], ["rgba(255,99,132,0.7)"]);
}

function renderTinta() {
  const counts = {};
  pinturaData.forEach(item => {
    const tinta = item["DESCRIÇÃO"]?.trim();
    if (tinta) counts[tinta] = (counts[tinta] || 0) + 1;
  });
  criarGrafico("tintaChart", "bar", Object.keys(counts), Object.values(counts),
    Object.keys(counts).map(_ => "rgba(75,192,192,0.7)"));
}

function renderTintaM2() {
  const totals = {};
  pinturaData.forEach(item => {
    const tinta = item["DESCRIÇÃO"]?.trim();
    const m2 = parseNumber(item["m²"]);
    if (tinta) totals[tinta] = (totals[tinta] || 0) + m2;
  });
  criarGrafico("tintaM2Chart", "bar", Object.keys(totals), Object.values(totals),
    Object.keys(totals).map(_ => "rgba(153,102,255,0.7)"));
}

function renderHH() {
  let totalHoras = 0;
  sgeData.forEach(item => {
    const cargo = item["Cargo"]?.trim();
    const contrato = item["Contrato"]?.trim();
    if ((cargo === "Pintor de estruturas metálicas" || cargo === "Pintor de Obras") &&
        contrato === "4600184457") {
      totalHoras += parseNumber(item["Total Horas"]);
    }
  });
  criarGrafico("hhChart", "bar", ["Consumo de HH"], [totalHoras], ["rgba(255,206,86,0.7)"]);
}

function renderGAD() {
  let total = 0;
  pinturaData.forEach(item => {
    if (item["ÁREA DE APLICAÇÃO"]?.trim() === "Prédio GAD") {
      total += parseNumber(item["Qtd."]);
    }
  });
  criarGrafico("gadChart", "doughnut", ["Prédio GAD"], [total], ["rgba(54,162,235,0.7)"]);
}

function renderConsumoOS() {
  const totals = {};
  pinturaData.forEach(item => {
    const os = item["O.S"]?.trim();
    const qtd = parseNumber(item["Qtd."]);
    if (os) totals[os] = (totals[os] || 0) + qtd;
  });
  criarGrafico("osChart", "bar", Object.keys(totals), Object.values(totals),
    Object.keys(totals).map(_ => "rgba(255,159,64,0.7)"));
}

// ==================== EVENTOS DE UPLOAD ====================

document.getElementById("uploadPintura").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        pinturaData = results.data;
        console.log("Pintura Data:", pinturaData); // DEBUG
        renderAreaAplicacao();
        renderPCI();
        renderTinta();
        renderTintaM2();
        renderGAD();
        renderConsumoOS();
      }
    });
  }
});

document.getElementById("uploadSGE").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        sgeData = results.data;
        console.log("SGE Data:", sgeData); // DEBUG
        renderHH();
      }
    });
  }
});
