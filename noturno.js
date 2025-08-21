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

// Constantes de regra
const STD_ALVO = 0.22;
const HORAS_POR_MONTADOR = 8.8;

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
function hmToHours(hm){ // "HH:MM" -> horas decimais
  if(!hm) return 0;
  const [h,m] = hm.split(':').map(n=>parseInt(n||'0',10));
  return (h||0) + (m||0)/60;
}
function diffHM(ini, fim){ // retorna "H:MM" (duração positiva simples)
  const [h1,m1] = ini.split(':').map(n=>parseInt(n,10));
  const [h2,m2] = fim.split(':').map(n=>parseInt(n,10));
  let t1 = h1*60 + m1;
  let t2 = h2*60 + m2;
  if(t2 < t1) t2 += 24*60;
  const d = Math.max(0, t2 - t1);
  const H = Math.floor(d/60), M = d%60;
  return `${H}:${String(M).padStart(2,'0')}`;
}

/* =========================
   ATUALIZAÇÕES DE UI
========================= */
function atualizarCards(){
  els.kpiSupervisor.textContent = state.supervisor;
  els.kpiEncarregado.textContent = state.encarregado;
  els.kpiMontadores.textContent = state.montadores;
  els.kpiFaltas.textContent = state.faltas;

  // total de interferências em horas decimais 1 casa
  const totalInterfH = state.atividades.reduce((acc, a)=> acc + hmToHours(a.interfer), 0);
  els.kpiInterf.textContent = `${toFixed(totalInterfH,1)} h`;
}

function atualizarCalculos(){
  const hhPrev = state.montadores * HORAS_POR_MONTADOR;
  const stdPrev = state.mlPrev > 0 ? (hhPrev / state.mlPrev) : 0;
  const stdReal = state.mlReal > 0 ? (state.hhReal / state.mlReal) : 0;

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
  els.resumoTurno.value = els.resumoTurno.value || "";

  // Tornando readonly no Dashboard
  els.inpSupervisor.readOnly = true;
  els.inpEncarregado.readOnly = true;
  els.inpLocal.readOnly = true;
  els.inpDisciplina.readOnly = true;
  els.inpMontadores.readOnly = true;
  els.inpFaltas.readOnly = true;
  els.inpART.readOnly = true;
  els.inpHHReal.readOnly = true;
  els.inpMLPrev.readOnly = true;
  els.inpMLReal.readOnly = true;
  els.resumoTurno.readOnly = true;
}

function renderTabela(){
  els.tabelaBody.innerHTML = '';
  state.atividades.forEach((a, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" data-idx="${idx}"></td>
      <td><input type="text" value="${a.atividade}" readonly></td>
      <td><input type="time" value="${a.ini}" readonly></td>
      <td><input type="time" value="${a.fim}" readonly></td>
      <td><input type="text" value="${a.interfer}" readonly></td>
      <td><input type="text" value="${a.obs||''}" readonly></td>
    `;
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   GRÁFICOS (SVG PURO)
========================= */
function desenharGauge(){
  const svg = els.gauge;
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  const w = 200, h = 120, cx = 100, cy = 110, r = 90;
  const p = (state.mlPrev>0) ? Math.max(0, Math.min(1, state.mlReal / state.mlPrev)) : 0;
  const pct = Math.round(p*100);

  const arcPath = describeArc(cx, cy, r, 180, 0);
  const bg = path(arcPath, '#e5e7eb', 14);
  svg.appendChild(bg);

  const color = p >= 1 ? '#14b8a6' : (p >= 0.8 ? '#f59e0b' : '#ef4444');
  const progPath = describeArc(cx, cy, r, 180, 180*(1-p));
  const fg = path(progPath, color, 14);
  svg.appendChild(fg);

  for(let i=0;i<=10;i++){
    const ang = 180 - i*18;
    const a = (ang-90)*Math.PI/180;
    const x1 = cx + (r-8)*Math.cos(a), y1 = cy + (r-8)*Math.sin(a);
    const x2 = cx + (r)*Math.cos(a), y2 = cy + (r)*Math.sin(a);
    const tick = line(x1,y1,x2,y2,'#cbd5e1',1.5);
    svg.appendChild(tick);
  }

  const t1 = text(cx, cy-8, `${pct}%`, 14, '#0b2340', 'middle');
  const t2 = text(cx, cy+12, `ML ${state.mlReal} / ${state.mlPrev}`, 10, '#6b7280', 'middle');
  svg.appendChild(t1); svg.appendChild(t2);

  function path(d, stroke, sw){
    const p = document.createElementNS("http://www.w3.org/2000/svg","path");
    p.setAttribute('d', d);
    p.setAttribute('fill','none');
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-linecap','round');
    p.setAttribute('stroke-width', sw);
    return p;
  }
  function line(x1,y1,x2,y2,stroke,sw){
    const l = document.createElementNS("http://www.w3.org/2000/svg","line");
    l.setAttribute('x1',x1); l.setAttribute('y1',y1);
    l.setAttribute('x2',x2); l.setAttribute('y2',y2);
    l.setAttribute('stroke',stroke); l.setAttribute('stroke-width',sw);
    return l;
  }
  function text(x,y,txt,size,fill,anchor){
    const t = document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute('x',x); t.setAttribute('y',y);
    t.setAttribute('font-size', size); t.setAttribute('fill', fill);
    t.setAttribute('text-anchor', anchor||'start');
    t.textContent = txt;
    return t;
  }
  function polarToCartesian(cx, cy, r, angleInDegrees){
    const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return { x: cx + (r * Math.cos(angleInRadians)), y: cy + (r * Math.sin(angleInRadians)) };
  }
  function describeArc(x, y, r, startAngle, endAngle){
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  }
}

function desenharBarChart(){
  const svg = els.barChart;
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  const series = [
    { nome:'HH', prev: state.montadores*HORAS_POR_MONTADOR, real: state.hhReal },
    { nome:'ML', prev: state.mlPrev, real: state.mlReal },
  ];

  const width = 100, height = 60, margin = {l:10,r:4,t:6,b:14};
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const g = createGroup(margin.l, margin.t);
  svg.appendChild(g);

  const maxVal = Math.max(...series.map(s=>Math.max(s.prev, s.real)), 1);
  const barW = (plotW / series.length) * 0.8;
  const gap = (plotW / series.length) * 0.2;

  series.forEach((s, i)=>{
    const x0 = i*(barW+gap);

    const hPrev = (s.prev / maxVal) * plotH;
    const yPrev = plotH - hPrev;
    const rectPrev = rect(x0, yPrev, barW/2 - 2, hPrev, '#0b63d6');
    g.appendChild(rectPrev);

    const hReal = (s.real / maxVal) * plotH;
    const yReal = plotH - hReal;
    const rectReal = rect(x0 + barW/2 + 2, yReal, barW/2 - 2, hReal, '#6b7280');
    g.appendChild(rectReal);

    const tx = text(x0 + barW/2, plotH + 10, s.nome, 4, '#0b2340', 'middle');
    g.appendChild(tx);

    // Valor sobre barras
    g.appendChild(text(x0 + barW/4, yPrev - 2, toFixed(s.prev,1), 3.5, '#0b2340', 'middle'));
    g.appendChild(text(x0 + 3*barW/4, yReal - 2, toFixed(s.real,1), 3.5, '#0b2340', 'middle'));
  });

  const axis = document.createElementNS("http://www.w3.org/2000/svg","line");
  axis.setAttribute('x1', 0); axis.setAttribute('y1', plotH);
  axis.setAttribute('x2', plotW); axis.setAttribute('y2', plotH);
  axis.setAttribute('stroke', '#cbd5e1'); axis.setAttribute('stroke-width', '0.6');
  g.appendChild(axis);

  function createGroup(x,y){
    const grp = document.createElementNS("http://www.w3.org/2000/svg","g");
    grp.setAttribute('transform', `translate(${x},${y})`);
    return grp;
  }
  function rect(x,y,w,h,fill){
    const r = document.createElementNS("http://www.w3.org/2000/svg","rect");
    r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',w); r.setAttribute('height',h);
    r.setAttribute('fill', fill); r.setAttribute('rx','1.5');
    return r;
  }
  function text(x,y,txt,size,fill,anchor){
    const t = document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute('x',x); t.setAttribute('y',y);
    t.setAttribute('font-size', size); t.setAttribute('fill', fill);
    t.setAttribute('text-anchor', anchor||'start');
    t.textContent = txt;
    return t;
  }
}

/* =========================
   INIT
========================= */
function init(){
  document.getElementById('campoData').value = state.data;
  preencherFormulario();
  renderTabela();
  atualizarCards();
  atualizarCalculos();
  drawFotos();
}
window.addEventListener('load', init);

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
    img.src = src; img.className = 'thumb';
    img.style.width = '120px';
    img.style.height = '90px';
    img.style.objectFit = 'cover';
    img.style.margin = '2px';
    els.previewFotos.appendChild(img);
  });
}
