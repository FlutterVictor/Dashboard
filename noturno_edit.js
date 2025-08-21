/* =========================
   MOCK INICIAL + ESTADO
========================= */
const state = {
  supervisor: "Carlos Silva",
  encarregado: "João Pereira",
  local: "ÁREA 31 - Pipe Rack",
  disciplina: "Andaime",
  montadores: 12,
  faltas: 1,
  ART: "ART-2025-00123",
  data: new Date().toISOString().slice(0,10),
  turno: "Noturno",
  hhReal: 98,
  mlPrev: 250,
  mlReal: 230,
  atividades: [
    { atividade:"Montagem módulo PR-31", ini:"18:20", fim:"20:10", interfer:"0:30", obs:"Acesso restrito" },
    { atividade:"Apoio técnico - liberação", ini:"20:20", fim:"21:00", interfer:"0:10", obs:"Aguardando PT" },
    { atividade:"Desmontagem plataforma N3", ini:"21:10", fim:"23:40", interfer:"0:20", obs:"Material" }
  ],
  fotos: []
};

/* =========================
   ELEMENTOS
========================= */
const els = {
  kpiSupervisor: document.getElementById('kpiSupervisor'),
  kpiEncarregado: document.getElementById('kpiEncarregado'),
  kpiMontadores: document.getElementById('kpiMontadores'),
  kpiFaltas: document.getElementById('kpiFaltas'),
  kpiInterf: document.getElementById('kpiInterf'),

  inpSupervisor: document.getElementById('inpSupervisor'),
  inpEncarregado: document.getElementById('inpEncarregado'),
  inpLocal: document.getElementById('inpLocal'),
  inpDisciplina: document.getElementById('inpDisciplina'),
  inpMontadores: document.getElementById('inpMontadores'),
  inpFaltas: document.getElementById('inpFaltas'),
  inpART: document.getElementById('inpART'),
  inpHHReal: document.getElementById('inpHHReal'),
  inpMLPrev: document.getElementById('inpMLPrev'),
  inpMLReal: document.getElementById('inpMLReal'),

  outHHPrev: document.getElementById('outHHPrev'),
  outSTDPrev: document.getElementById('outSTDPrev'),
  outSTDReal: document.getElementById('outSTDReal'),

  campoData: document.getElementById('campoData'),
  campoTurno: document.getElementById('campoTurno'),

  tabelaBody: document.querySelector('#tabelaAtiv tbody'),
  btnAddLinha: document.getElementById('btnAddLinha'),
  btnRemoverSel: document.getElementById('btnRemoverSel'),

  resumoTurno: document.getElementById('resumoTurno'),
  uploadFotos: document.getElementById('uploadFotos'),
  previewFotos: document.getElementById('previewFotos'),

  btnSalvar: document.getElementById('btnSalvar'),
  btnCarregar: document.getElementById('btnCarregar'),
  btnExportPDF: document.getElementById('btnExportPDF'),
  btnVoltarMenu: document.getElementById('btnVoltarMenu'),

  gauge: document.getElementById('gauge'),
  barChart: document.getElementById('barChart'),
};

/* =========================
   HELPERS
========================= */
function toFixed(n, d=2){
  const x = Number(n);
  return isFinite(x) ? x.toFixed(d).replace('.',',') : '0,00';
}
function parseNum(v){ const n = parseFloat(String(v).replace(',','.')); return isNaN(n)?0:n; }
function hmToHours(hm){ if(!hm) return 0; const [h,m] = hm.split(':').map(n=>parseInt(n||'0',10)); return (h||0)+(m||0)/60; }
function diffHM(ini, fim){ const [h1,m1]=ini.split(':').map(n=>parseInt(n,10)); const [h2,m2]=fim.split(':').map(n=>parseInt(n,10)); let t1=h1*60+m1; let t2=h2*60+m2; if(t2<t1) t2+=24*60; const d=Math.max(0,t2-t1); const H=Math.floor(d/60),M=d%60; return `${H}:${String(M).padStart(2,'0')}`; }

/* =========================
   ATUALIZAÇÕES DE UI
========================= */
function atualizarCards(){
  els.kpiSupervisor.textContent = state.supervisor;
  els.kpiEncarregado.textContent = state.encarregado;
  els.kpiMontadores.textContent = state.montadores;
  els.kpiFaltas.textContent = state.faltas;

  const totalInterfH = state.atividades.reduce((acc, a)=> acc + hmToHours(a.interfer), 0);
  els.kpiInterf.textContent = `${toFixed(totalInterfH,1)} h`;
}

function atualizarCalculos(){
  const HORAS_POR_MONTADOR = 8.8;
  const hhPrev = state.montadores * HORAS_POR_MONTADOR;
  const stdPrev = state.mlPrev>0 ? hhPrev/state.mlPrev : 0;
  const stdReal = state.mlReal>0 ? state.hhReal/state.mlReal : 0;

  els.outHHPrev.textContent = toFixed(hhPrev,1);
  els.outSTDPrev.textContent = toFixed(stdPrev,2);
  els.outSTDReal.textContent = toFixed(stdReal,2);

  desenharGauge();
  desenharBarChart();
}

function preencherFormulario(){
  els.inpSupervisor.value = state.supervisor;
  els.inpEncarregado.value = state.encarregado;
  els.inpLocal.value = state.local;
  els.inpDisciplina.value = state.disciplina;
  els.inpMontadores.value = state.montadores;
  els.inpFaltas.value = state.faltas;
  els.inpART.value = state.ART;
  els.inpHHReal.value = state.hhReal;
  els.inpMLPrev.value = state.mlPrev;
  els.inpMLReal.value = state.mlReal;
  els.campoData.value = state.data;
  els.campoTurno.value = state.turno;
  els.resumoTurno.value = state.resumoTurno || "";
  
  // TODOS liberados para edição
  els.inpSupervisor.readOnly = false;
  els.inpEncarregado.readOnly = false;
  els.inpLocal.readOnly = false;
  els.inpDisciplina.readOnly = false;
  els.inpMontadores.readOnly = false;
  els.inpFaltas.readOnly = false;
  els.inpART.readOnly = false;
  els.inpHHReal.readOnly = false;
  els.inpMLPrev.readOnly = false;
  els.inpMLReal.readOnly = false;
  els.resumoTurno.readOnly = false;
}

function renderTabela(){
  els.tabelaBody.innerHTML = '';
  state.atividades.forEach((a, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" data-idx="${idx}"></td>
      <td><input type="text" value="${a.atividade}"></td>
      <td><input type="time" value="${a.ini}"></td>
      <td><input type="time" value="${a.fim}"></td>
      <td><input type="text" value="${a.interfer}"></td>
      <td><input type="text" value="${a.obs||''}"></td>
    `;
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   FOTOS
========================= */
function drawFotos(){
  els.previewFotos.innerHTML = '';
  if(!state.fotos.length){
    const d = document.createElement('div');
    d.style.color = '#6b7280';
    d.textContent = 'Sem fotos anexadas.';
    els.previewFotos.appendChild(d);
    return;
  }
  state.fotos.forEach(src=>{
    const img = document.createElement('img');
    img.src = src; img.className='thumb';
    img.style.width='120px';
    img.style.height='90px';
    img.style.objectFit='cover';
    img.style.margin='2px';
    els.previewFotos.appendChild(img);
  });
}

els.uploadFotos.addEventListener('change', e=>{
  const files = Array.from(e.target.files);
  files.forEach(f=>{
    const reader = new FileReader();
    reader.onload = ev => { state.fotos.push(ev.target.result); drawFotos(); };
    reader.readAsDataURL(f);
  });
});

/* =========================
   INIT
========================= */
function initEdit(){
  document.getElementById('campoData').value = state.data;
  preencherFormulario();
  renderTabela();
  atualizarCards();
  atualizarCalculos();
  drawFotos();
}

window.addEventListener('load', initEdit);
