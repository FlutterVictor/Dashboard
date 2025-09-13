// Variáveis globais
let pinturaData = [];
let sgeData = [];
let charts = {};

// Função genérica para criar gráfico e atualizar
function criarGrafico(id, tipo, labels, dados, cores) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id).getContext("2d");
  charts[id] = new Chart(ctx, {
    type: tipo,
    data: { labels, datasets: [{ data: dados, backgroundColor: cores, borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } }
  });
}

// ==================== FUNÇÕES PARA GRÁFICOS ====================
function renderAreaAplicacao() {
  const counts = {};
  pinturaData.forEach(item => {
    const area = item["ÁREA DE APLICAÇÃO"];
    if (area) counts[area] = (counts[area] || 0) + 1;
  });
  criarGrafico("areaAplicacaoChart", "bar", Object.keys(counts), Object.values(counts), Object.keys(counts).map(_ => "rgba(54,162,235,0.7)"));
}

function renderPCI() {
  let total = 0;
  pinturaData.forEach(item => { if(item["ÁREA DE APLICAÇÃO"] === "Prédio PCI 3N") total += parseFloat(item["Qtd."]||0); });
  criarGrafico("pciChart","doughnut",["Prédio PCI 3N"],[total],["rgba(255,99,132,0.7)"]);
}

function renderTinta() {
  const counts = {};
  pinturaData.forEach(item => { const t = item["DESCRIÇÃO"]; if(t) counts[t]=(counts[t]||0)+1; });
  criarGrafico("tintaChart","bar",Object.keys(counts),Object.values(counts),Object.keys(counts).map(_=>"rgba(75,192,192,0.7)"));
}

function renderTintaM2() {
  const totals = {};
  pinturaData.forEach(item => { const t = item["DESCRIÇÃO"]; const m2 = parseFloat(item["m²"]||0); if(t) totals[t]=(totals[t]||0)+m2; });
  criarGrafico("tintaM2Chart","bar",Object.keys(totals),Object.values(totals),Object.keys(totals).map(_=>"rgba(153,102,255,0.7)"));
}

function renderHH() {
  let totalHoras = 0;
  sgeData.forEach(item => {
    const cargo = item["Cargo"];
    const contrato = item["Contrato"];
    if((cargo==="Pintor de estruturas metálicas"||cargo==="Pintor de Obras") && contrato==="4600184457")
      totalHoras += parseFloat(item["Total Horas"]||0);
  });
  criarGrafico("hhChart","bar",["Consumo de HH"],[totalHoras],["rgba(255,206,86,0.7)"]);
}

function renderGAD() {
  let total=0;
  pinturaData.forEach(item => { if(item["ÁREA DE APLICAÇÃO"]==="Prédio GAD") total+=parseFloat(item["Qtd."]||0); });
  criarGrafico("gadChart","doughnut",["Prédio GAD"],[total],["rgba(54,162,235,0.7)"]);
}

function renderConsumoOS() {
  const totals = {};
  pinturaData.forEach(item => { const os=item["O.S"]; const qtd=parseFloat(item["Qtd."]||0); if(os) totals[os]=(totals[os]||0)+qtd; });
  criarGrafico("osChart","bar",Object.keys(totals),Object.values(totals),Object.keys(totals).map(_=>"rgba(255,159,64,0.7)"));
}

// ==================== EVENTOS UPLOAD ====================

document.getElementById("uploadPintura").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(file){
    Papa.parse(file, {
      header:true,
      skipEmptyLines:true,
      complete:function(results){
        pinturaData = results.data;
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

document.getElementById("uploadSGE").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(file){
    Papa.parse(file, {
      header:true,
      skipEmptyLines:true,
      complete:function(results){
        sgeData = results.data;
        renderHH();
      }
    });
  }
});
