/* =========================
   ESTADO INICIAL
========================= */
const state = {
  supervisor: "-",
  encarregado: "-",
  local: "-",
  disciplina: "-",
  montadores: 0,
  faltas: 0,
  ART: "-",
  data: new Date().toISOString().slice(0,10),
  turno: "Noturno",
  hhPrev: 0,
  hhReal: 0,
  mlPrev: 0,
  mlReal: 0,
  stdPrev: 0,
  stdReal: 0,
  resumo: "",
  atividades: [],
  fotos: []
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

  campoData: document.getElementById('campoData'),
  campoTurno: document.getElementById('campoTurno'),

  infoLocal: document.getElementById('infoLocal'),
  infoDisciplina: document.getElementById('infoDisciplina'),
  infoMontadores: document.getElementById('infoMontadores'),
  infoFaltas: document.getElementById('infoFaltas'),
  infoART: document.getElementById('infoART'),
  outHHPrev: document.getElementById('outHHPrev'),
  outHHReal: document.getElementById('outHHReal'),
  outMLPrev: document.getElementById('outMLPrev'),
  outMLReal: document.getElementById('outMLReal'),
  outSTDPrev: document.getElementById('outSTDPrev'),
  outSTDReal: document.getElementById('outSTDReal'),

  tabelaBody: document.querySelector('#tabelaAtiv tbody'),
  previewFotos: document.getElementById('previewFotos'),

  rankingList: document.getElementById('rankingInterferencias'),

  btnCarregar: document.getElementById('btnCarregar'),
  btnEditar: document.getElementById('btnEditar'),
  btnVoltarMenu: document.getElementById('btnVoltarMenu'),

  gauge: document.getElementById('gauge'),
  barChart: document.getElementById('barChart'),
};

/* =========================
   FUNÇÕES AUXILIARES
========================= */
function toFixed(n, d=2){ return isFinite(n)? n.toFixed(d).replace('.',',') : '0,00'; }
function parseNum(v){ const n = parseFloat(String(v).replace(',','.')); return isNaN(n)?0:n; }
function hmToHours(hm){ if(!hm) return 0; const [h,m] = hm.split(':').map(n=>parseInt(n||'0',10)); return (h||0) + (m||0)/60; }
function diffHM(ini, fim){
  const [h1,m1] = ini.split(':').map(n=>parseInt(n,10));
  const [h2,m2] = fim.split(':').map(n=>parseInt(n,10));
  let t1=h1*60+m1, t2=h2*60+m2; if(t2<t1) t2+=24*60;
  const d=Math.max(0,t2-t1); const H=Math.floor(d/60), M=d%60; return `${H}:${String(M).padStart(2,'0')}`;
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
}

function atualizarCalculos(){
  const hhPrev = state.montadores*HORAS_POR_MONTADOR;
  const mlPrev = state.montadores*40;
  const stdPrev = mlPrev>0? hhPrev/mlPrev : 0;
  const stdReal = state.mlReal>0? state.hhReal/state.mlReal : 0;

  state.hhPrev = hhPrev; state.mlPrev = mlPrev; state.stdPrev = stdPrev; state.stdReal = stdReal;

  els.outHHPrev.textContent = toFixed(hhPrev,1);
  els.outSTDPrev.textContent = toFixed(stdPrev,2);
  els.outSTDReal.textContent = toFixed(stdReal,2);
  els.outHHReal.textContent = toFixed(state.hhReal,1);
  els.outMLPrev.textContent = mlPrev;
  els.outMLReal.textContent = state.mlReal;

  desenharGauge();
  desenharBarChart();
}

function preencherDashboard(){
  els.infoLocal.textContent = state.local;
  els.infoDisciplina.textContent = state.disciplina;
  els.infoMontadores.textContent = state.montadores;
  els.infoFaltas.textContent = state.faltas;
  els.infoART.textContent = state.ART;

  atualizarCards();
  atualizarCalculos();
  renderTabela();
  renderFotos();
  renderRanking();
}

function renderTabela(){
  els.tabelaBody.innerHTML='';
  state.atividades.forEach(a=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${a.atividade}</td>
      <td>${a.ini}</td>
      <td>${a.fim}</td>
      <td>${a.interfer}</td>
      <td>${a.obs||''}</td>
    `;
    els.tabelaBody.appendChild(tr);
  });
}

function renderFotos(){
  els.previewFotos.innerHTML='';
  state.fotos.forEach(f=>{
    const img=document.createElement('img');
    img.src = f;
    img.classList.add('thumb');
    els.previewFotos.appendChild(img);
  });
}

function renderRanking(){
  els.rankingList.innerHTML='';
  const sorted = state.atividades
    .filter(a=>a.interfer && a.interfer!=='')
    .sort((a,b)=> hmToHours(b.interfer)-hmToHours(a.interfer))
    .slice(0,5);
  sorted.forEach(a=>{
    const li=document.createElement('li');
    li.textContent = `${a.atividade} — ${a.interfer}h`;
    els.rankingList.appendChild(li);
  });
}

/* =========================
   CARREGAR DADOS
========================= */
els.btnCarregar.addEventListener('click', ()=>{
  dbNoturno = JSON.parse(localStorage.getItem('noturno_edit')||'{}');
  const dataSel = els.campoData.value;
  if(dbNoturno[dataSel]){
    Object.assign(state, dbNoturno[dataSel]);
    preencherDashboard();
  } else {
    alert('Nenhum registro encontrado para esta data!');
  }
});

/* =========================
   BOTÕES
========================= */
els.btnEditar.addEventListener('click', ()=>{
  window.open('noturno_edit.html','_blank');
});

els.btnVoltarMenu.addEventListener('click', ()=>{ window.location.href='index.html'; });

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
  const valores=[state.hhPrev,state.mlPrev,state.mlReal,state.hhReal];
  const max=Math.max(...valores)*1.1;
  valores.forEach((v,i)=>{
    const x = i*20+10;
    const y = 60 - (v/max*50);
    const h = v/max*50;
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x',x); rect.setAttribute('y',y);
    rect.setAttribute('width',12); rect.setAttribute('height',h);
    rect.setAttribute('fill',i<2?'#0b63d6':'#6b7280');
    svg.appendChild(rect);
  });
}

/* =========================
   FUNÇÕES AUXILIARES SVG
========================= */
function polarToCartesian(cx,cy,r,angle){ const a=angle*Math.PI/180; return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)}; }
function describeArc(cx,cy,r,startAngle,endAngle){
  const start=polarToCartesian(cx,cy,r,endAngle);
  const end=polarToCartesian(cx,cy,r,startAngle);
  const largeArcFlag = endAngle - startAngle <=180? 0:1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}
function path(d,color,width){ const p=document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d',d); p.setAttribute('stroke',color); p.setAttribute('stroke-width',width); p.setAttribute('fill','none'); return p; }

/* =========================
   INICIALIZAÇÃO
========================= */
function init(){
  preencherDashboard();
}

init();
