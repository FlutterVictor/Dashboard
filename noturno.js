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
  // turno cruza madrugada: se fim menor que início, soma 24h
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

  // total de interferências em horas (somatório)
  const totalInterfH = state.atividades.reduce((acc, a)=> acc + hmToHours(a.interfer), 0);
  els.kpiInterf.textContent = toFixed(totalInterfH,1);
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
      <td><input type="text" value="${a.interfer}" placeholder="H:MM"></td>
      <td><input type="text" value="${a.obs||''}" placeholder="Observações"></td>
    `;
    // listeners de recalculo
    const [cb, inpAtv, inpIni, inpFim, inpInterf, inpObs] = tr.querySelectorAll('input');
    inpAtv.addEventListener('input', e=>{ state.atividades[idx].atividade = e.target.value; });
    inpIni.addEventListener('change', e=>{
      state.atividades[idx].ini = e.target.value;
      state.atividades[idx].interfer = diffHM(state.atividades[idx].ini, state.atividades[idx].fim);
      renderTabela(); atualizarCards();
    });
    inpFim.addEventListener('change', e=>{
      state.atividades[idx].fim = e.target.value;
      state.atividades[idx].interfer = diffHM(state.atividades[idx].ini, state.atividades[idx].fim);
      renderTabela(); atualizarCards();
    });
    inpInterf.addEventListener('input', e=>{
      state.atividades[idx].interfer = e.target.value;
      atualizarCards();
    });
    inpObs.addEventListener('input', e=>{ state.atividades[idx].obs = e.target.value; });
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   GRÁFICOS (SVG PURO)
========================= */
// Gauge semicircular (% atingimento ML = ML Real / ML Prev)
function desenharGauge(){
  const svg = els.gauge;
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  const w = 200, h = 120, cx = 100, cy = 110, r = 90;
  const p = (state.mlPrev>0) ? Math.max(0, Math.min(1, state.mlReal / state.mlPrev)) : 0;
  const pct = Math.round(p*100);

  // Arco de fundo
  const arcPath = describeArc(cx, cy, r, 180, 0);
  const bg = path(arcPath, '#e5e7eb', 14);
  svg.appendChild(bg);

  // Cor por faixa
  const color = p >= 1 ? '#14b8a6' : (p >= 0.8 ? '#f59e0b' : '#ef4444');

  // Arco de progresso
  const progPath = describeArc(cx, cy, r, 180, 180*(1-p));
  const fg = path(progPath, color, 14);
  svg.appendChild(fg);

  // Marcadores (ticks)
  for(let i=0;i<=10;i++){
    const ang = 180 - i*18;
    const a = (ang-90)*Math.PI/180;
    const x1 = cx + (r-8)*Math.cos(a), y1 = cy + (r-8)*Math.sin(a);
    const x2 = cx + (r)*Math.cos(a), y2 = cy + (r)*Math.sin(a);
    const tick = line(x1,y1,x2,y2,'#cbd5e1',1.5);
    svg.appendChild(tick);
  }

  // Texto central
  const t1 = text(cx, cy-10, `${pct}%`, 18, '#0b2340', 'middle');
  const t2 = text(cx, cy+10, `ML ${state.mlReal} / ${state.mlPrev}`, 10, '#6b7280', 'middle');
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
  // util para arco
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

// Bar chart (HH e ML: Previsto x Real)
function desenharBarChart(){
  const svg = els.barChart;
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  // dados
  const series = [
    { nome:'HH', prev: state.montadores*HORAS_POR_MONTADOR, real: state.hhReal },
    { nome:'ML', prev: state.mlPrev, real: state.mlReal },
  ];

  const width = 100, height = 60, margin = {l:10,r:4,t:6,b:14};
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const g = createGroup(margin.l, margin.t);
  svg.appendChild(g);

  const maxVal = Math.max(
    ...series.map(s=>Math.max(s.prev, s.real)), 1
  );
  const barW = (plotW / series.length) * 0.8;
  const gap = (plotW / series.length) * 0.2;

  series.forEach((s, i)=>{
    const x0 = i*(barW+gap);

    // Previsto (azul)
    const hPrev = (s.prev / maxVal) * plotH;
    const yPrev = plotH - hPrev;
    const rectPrev = rect(x0, yPrev, barW/2 - 2, hPrev, '#0b63d6');
    g.appendChild(rectPrev);

    // Real (cinza)
    const hReal = (s.real / maxVal) * plotH;
    const yReal = plotH - hReal;
    const rectReal = rect(x0 + barW/2 + 2, yReal, barW/2 - 2, hReal, '#6b7280');
    g.appendChild(rectReal);

    // Label categoria
    const tx = text(x0 + barW/2, plotH + 10, s.nome, 4, '#0b2340', 'middle');
    g.appendChild(tx);
  });

  // Eixos simples
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
   EVENTOS / BINDINGS
========================= */
function bindInputs(){
  els.inpSupervisor.addEventListener('input', e=>{ state.supervisor = e.target.value; atualizarCards(); });
  els.inpEncarregado.addEventListener('input', e=>{ state.encarregado = e.target.value; atualizarCards(); });
  els.inpLocal.addEventListener('input', e=>{ state.local = e.target.value; });
  els.inpDisciplina.addEventListener('input', e=>{ state.disciplina = e.target.value; });
  els.inpMontadores.addEventListener('input', e=>{ state.montadores = parseInt(e.target.value||'0',10); atualizarCards(); atualizarCalculos(); });
  els.inpFaltas.addEventListener('input', e=>{ state.faltas = parseInt(e.target.value||'0',10); atualizarCards(); });
  els.inpART.addEventListener('input', e=>{ state.ART = e.target.value; });
  els.inpHHReal.addEventListener('input', e=>{ state.hhReal = parseNum(e.target.value); atualizarCalculos(); });
  els.inpMLPrev.addEventListener('input', e=>{ state.mlPrev = parseNum(e.target.value); atualizarCalculos(); });
  els.inpMLReal.addEventListener('input', e=>{ state.mlReal = parseNum(e.target.value); atualizarCalculos(); });
  els.campoData.addEventListener('change', e=>{ state.data = e.target.value; });
  els.campoTurno.addEventListener('change', e=>{ state.turno = e.target.value; });
  els.resumoTurno.addEventListener('input', e=>{ state.resumo = e.target.value; });

  els.btnAddLinha.addEventListener('click', ()=>{
    state.atividades.push({ atividade:"", ini:"18:00", fim:"18:30", interfer:"0:00", obs:"" });
    renderTabela(); atualizarCards();
  });
  els.btnRemoverSel.addEventListener('click', ()=>{
    const checks = els.tabelaBody.querySelectorAll('input[type="checkbox"]:checked');
    const idxs = Array.from(checks).map(c=> parseInt(c.getAttribute('data-idx'),10)).sort((a,b)=>b-a);
    idxs.forEach(i=> state.atividades.splice(i,1));
    renderTabela(); atualizarCards();
  });

  // Upload fotos preview
  els.uploadFotos.addEventListener('change', e=>{
    const files = Array.from(e.target.files||[]);
    files.forEach(file=>{
      const reader = new FileReader();
      reader.onload = (ev)=>{
        state.fotos.push(ev.target.result);
        drawFotos();
      };
      reader.readAsDataURL(file);
    });
  });

  // Salvar/Carregar (localStorage por data+turno)
  els.btnSalvar.addEventListener('click', ()=>{
    const key = `noturno:${state.data}:${state.turno}`;
    localStorage.setItem(key, JSON.stringify(state));
    alert('Relatório salvo (navegador).');
  });
  els.btnCarregar.addEventListener('click', ()=>{
    const key = `noturno:${state.data}:${state.turno}`;
    const raw = localStorage.getItem(key);
    if(!raw) return alert('Nenhum registro salvo para esta data/turno.');
    const obj = JSON.parse(raw);
    Object.assign(state, obj);
    preencherFormulario(); renderTabela(); atualizarCards(); atualizarCalculos(); drawFotos();
  });

  // Exportar PDF (igual ao STD)
  els.btnExportPDF.addEventListener('click', ()=>{
    const el = document.getElementById('dashboardWrap');
    html2canvas(el, {scale:2}).then(canvas=>{
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({orientation:'landscape', unit:'pt', format:'a4'});
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`Relatorio_Noturno_${state.data}.pdf`);
    });
  });

  els.btnVoltarMenu.addEventListener('click', ()=>{ window.location.href = 'index.html'; });
}

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
    els.previewFotos.appendChild(img);
  });
}

/* =========================
   INIT
========================= */
function init(){
  // data default = hoje
  document.getElementById('campoData').value = state.data;

  preencherFormulario();
  renderTabela();
  atualizarCards();
  atualizarCalculos();
  drawFotos();
  bindInputs();
}
window.addEventListener('load', init);
