/* =========================
   ESTADO INICIAL
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
  resumo: "Turno ocorreu conforme planejamento. Área 31 liberada às 20:15. Interferência por falta de material entre 22:00 e 23:10.",
  atividades: [
    {atividade:'Montagem andaime', ini:'18:00', fim:'20:15', interfer:'2:15', obs:'Falta de material'},
    {atividade:'Ajuste tubo', ini:'20:30', fim:'21:15', interfer:'0:45', obs:''}
  ],
  fotos: [] // URLs ou Base64 carregados do Noturno_Edit
};

let dbNoturno = {}; // banco de dados JSON

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

  resumoTurno: document.getElementById('resumoTurno'),
  previewFotos: document.getElementById('previewFotos'),

  gauge: document.getElementById('gauge'),
  barChart: document.getElementById('barChart'),

  rankingContainer: document.getElementById('rankingInterf') // novo card de ranking
};

/* =========================
   FUNÇÕES AUXILIARES
========================= */
function toFixed(n, d=2){ const x = Number(n); return isFinite(x)? x.toFixed(d).replace('.',',') : '0,00'; }
function parseNum(v){ const n = parseFloat(String(v).replace(',','.')); return isNaN(n)?0:n; }
function hmToHours(hm){ if(!hm) return 0; const [h,m] = hm.split(':').map(n=>parseInt(n||'0',10)); return (h||0) + (m||0)/60; }
function diffHM(ini, fim){
  const [h1,m1] = ini.split(':').map(n=>parseInt(n,10));
  const [h2,m2] = fim.split(':').map(n=>parseInt(n,10));
  let t1=h1*60+m1, t2=h2*60+m2; if(t2<t1) t2+=24*60;
  const d=Math.max(0,t2-t1); const H=Math.floor(d/60), M=d%60;
  return `${H}:${String(M).padStart(2,'0')}`;
}

/* =========================
   ATUALIZAÇÃO UI
========================= */
function atualizarCards(){
  els.kpiSupervisor.textContent = state.supervisor;
  els.kpiEncarregado.textContent = state.encarregado;
  els.kpiMontadores.textContent = state.montadores;
  els.kpiFaltas.textContent = state.faltas;
  const totalInterfH = state.atividades.reduce((acc,a)=> acc+hmToHours(a.interfer),0);
  els.kpiInterf.textContent = toFixed(totalInterfH,1);
  atualizarRanking();
}

function atualizarCalculos(){
  const hhPrev = state.montadores*HORAS_POR_MONTADOR;
  const stdPrev = state.mlPrev>0? hhPrev/state.mlPrev : 0;
  const stdReal = state.mlReal>0? state.hhReal/state.mlReal : 0;

  els.outHHPrev.textContent = toFixed(hhPrev,1);
  els.outSTDPrev.textContent = toFixed(stdPrev,2);
  els.outSTDReal.textContent = toFixed(stdReal,2);

  desenharGauge();
  desenharBarChart();
}

function preencherFormulario(){
  // Apenas exibir valores
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
  els.resumoTurno.value = state.resumo;
  els.campoData.value = state.data;
  els.campoTurno.value = state.turno;
}

function renderTabela(){
  els.tabelaBody.innerHTML='';
  state.atividades.forEach((a)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td></td>
      <td>${a.atividade}</td>
      <td>${a.ini}</td>
      <td>${a.fim}</td>
      <td>${a.interfer}</td>
      <td>${a.obs||''}</td>
    `;
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   PREVIEW DE FOTOS
========================= */
function renderFotos(){
  els.previewFotos.innerHTML='';
  state.fotos.forEach(src=>{
    const img = document.createElement('img');
    img.src = src;
    img.classList.add('thumb');
    els.previewFotos.appendChild(img);
  });
}

/* =========================
   RANKING DE INTERFERÊNCIAS
========================= */
function atualizarRanking(){
  if(!els.rankingContainer) return;
  const ranking = state.atividades
    .filter(a=>hmToHours(a.interfer)>0)
    .sort((a,b)=>hmToHours(b.interfer)-hmToHours(a.interfer))
    .slice(0,5); // Top 5
  els.rankingContainer.innerHTML = '';
  ranking.forEach((a,idx)=>{
    const div = document.createElement('div');
    div.textContent = `${idx+1}. ${a.atividade} → ${a.interfer}h`;
    els.rankingContainer.appendChild(div);
  });
}

/* =========================
   GRÁFICOS
========================= */
function desenharGauge(){
  const svg=els.gauge; while(svg.firstChild) svg.removeChild(svg.firstChild);
  const w=200,h=120,cx=100,cy=110,r=90;
  const p = state.mlPrev>0? Math.max(0, Math.min(1,state.mlReal/state.mlPrev)) : 0;
  const arcPath = describeArc(cx,cy,r,180,0);
  const bg = path(arcPath,'#e5e7eb',14); svg.appendChild(bg);
  const color = p>=1 ? '#14b8a6' : (p>=0.8 ? '#f59e0b' : '#ef4444');
  const progPath = describeArc(cx,cy,r,180,180*(1-p));
  const fg = path(progPath,color,14); svg.appendChild(fg);
}

function desenharBarChart(){
  const svg=els.barChart; while(svg.firstChild) svg.removeChild(svg.firstChild);
  const labels=['HH Prev','ML Prev','ML Real','HH Real'];
  const valores=[state.montadores*HORAS_POR_MONTADOR,state.mlPrev,state.mlReal,state.hhReal];
  const max=Math.max(...valores)*1.1;
  valores.forEach((v,i)=>{
    const x = i*20+10;
    const y = 60 - (v/max*50);
    const h = v/max*50;
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x',x); rect.setAttribute('y',y); rect.setAttribute('width',12); rect.setAttribute('height',h);
    rect.setAttribute('fill',i<2?'#0b63d6':'#6b7280');
    svg.appendChild(rect);
  });
}

/* =========================
   FUNÇÕES AUXILIARES SVG
========================= */
function polarToCartesian(cx,cy,r,angle){
  const a=angle*Math.PI/180;
  return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)};
}
function describeArc(cx,cy,r,startAngle,endAngle){
  const start=polarToCartesian(cx,cy,r,endAngle);
  const end=polarToCartesian(cx,cy,r,startAngle);
  const largeArcFlag = endAngle - startAngle <=180? 0:1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}
function path(d,color,width){
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d',d); p.setAttribute('stroke',color); p.setAttribute('stroke-width',width);
  p.setAttribute('fill','none');
  return p;
}

/* =========================
   INICIALIZAÇÃO
========================= */
function init(){
  dbNoturno = JSON.parse(localStorage.getItem('dbNoturno')||'{}');
  preencherFormulario();
  renderTabela();
  atualizarCards();
  atualizarCalculos();
  renderFotos();
}

init();
