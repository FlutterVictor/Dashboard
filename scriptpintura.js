// Variáveis globais
let pinturaData = [];
let sgeData = [];

// Função para ler CSV
function readCSV(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const rows = text.split("\n").map(r => r.split(";")); // CSV separado por ponto e vírgula
    const headers = rows.shift().map(h => h.trim());
    const data = rows
      .filter(r => r.length === headers.length && r.some(cell => cell.trim() !== ""))
      .map(r => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[h] = r[i] ? r[i].trim() : "";
        });
        return obj;
      });
    callback(data);
  };
  reader.readAsText(file, "UTF-8");
}

// ==================== GRÁFICOS ====================

// Área de Aplicação (LT)
function renderAreaAplicacao() {
  const ctx = document.getElementById("areaAplicacaoChart").getContext("2d");
  const counts = {};
  pinturaData.forEach(item => {
    const area = item["ÁREA DE APLICAÇÃO"];
    if (area) {
      counts[area] = (counts[area] || 0) + 1;
    }
  });
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Quantidade",
        data: Object.values(counts),
        backgroundColor: "rgba(54, 162, 235, 0.7)"
      }]
    }
  });
}

// Consumo PCI+Utilidades
function renderPCI() {
  const ctx = document.getElementById("pciChart").getContext("2d");
  let total = 0;
  pinturaData.forEach(item => {
    if (item["ÁREA DE APLICAÇÃO"] === "Prédio PCI 3N") {
      total += parseFloat(item["Qtd."] || 0);
    }
  });
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Prédio PCI 3N"],
      datasets: [{
        data: [total],
        backgroundColor: ["rgba(255, 99, 132, 0.7)"]
      }]
    }
  });
}

// Tinta Utilizada
function renderTinta() {
  const ctx = document.getElementById("tintaChart").getContext("2d");
  const counts = {};
  pinturaData.forEach(item => {
    const tinta = item["DESCRIÇÃO"];
    if (tinta) {
      counts[tinta] = (counts[tinta] || 0) + 1;
    }
  });
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Quantidade",
        data: Object.values(counts),
        backgroundColor: "rgba(75, 192, 192, 0.7)"
      }]
    }
  });
}

// Tinta Utilizada (M²)
function renderTintaM2() {
  const ctx = document.getElementById("tintaM2Chart").getContext("2d");
  const totals = {};
  pinturaData.forEach(item => {
    const tinta = item["DESCRIÇÃO"];
    const m2 = parseFloat(item["m²"] || 0);
    if (tinta) {
      totals[tinta] = (totals[tinta] || 0) + m2;
    }
  });
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: "M²",
        data: Object.values(totals),
        backgroundColor: "rgba(153, 102, 255, 0.7)"
      }]
    }
  });
}

// Consumo de HH
function renderHH() {
  const ctx = document.getElementById("hhChart").getContext("2d");
  let totalHoras = 0;
  sgeData.forEach(item => {
    const cargo = item["Cargo"];
    const contrato = item["Contrato"];
    if ((cargo === "Pintor de estruturas metálicas" || cargo === "Pintor de Obras") &&
        contrato === "4600184457") {
      totalHoras += parseFloat(item["Total Horas"] || 0);
    }
  });
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Consumo de HH"],
      datasets: [{
        label: "Total de Horas",
        data: [totalHoras],
        backgroundColor: "rgba(255, 206, 86, 0.7)"
      }]
    }
  });
}

// Consumo GAD
function renderGAD() {
  const ctx = document.getElementById("gadChart").getContext("2d");
  let total = 0;
  pinturaData.forEach(item => {
    if (item["ÁREA DE APLICAÇÃO"] === "Prédio GAD") {
      total += parseFloat(item["Qtd."] || 0);
    }
  });
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Prédio GAD"],
      datasets: [{
        data: [total],
        backgroundColor: ["rgba(54, 162, 235, 0.7)"]
      }]
    }
  });
}

// Consumo por OS
function renderConsumoOS() {
  const ctx = document.getElementById("osChart").getContext("2d");
  const totals = {};
  pinturaData.forEach(item => {
    const os = item["O.S"];
    const qtd = parseFloat(item["Qtd."] || 0);
    if (os) {
      totals[os] = (totals[os] || 0) + qtd;
    }
  });
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: "Qtd. Utilizada",
        data: Object.values(totals),
        backgroundColor: "rgba(255, 159, 64, 0.7)"
      }]
    }
  });
}

// ==================== EVENTOS ====================

// Upload Planilha de Pintura
document.getElementById("uploadPintura").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    readCSV(file, data => {
      pinturaData = data;
      renderAreaAplicacao();
      renderPCI();
      renderTinta();
      renderTintaM2();
      renderGAD();
      renderConsumoOS();
    });
  }
});

// Upload Planilha de Horas SGE
document.getElementById("uploadSGE").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    readCSV(file, data => {
      sgeData = data;
      renderHH();
    });
  }
});
