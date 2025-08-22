/* =========================
   ESTADO INICIAL
========================= */
const state = {
  supervisor: "Carlos Silva",
  encarregado: "João Pereira",
  local: "",
  disciplina: "",
  montadoresPrev: 0,
  montadoresReal: 0,
  faltas: 0,
  ART: "",
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

let dbNoturno = {}; // banco de dados JSON simulado

/* =========================
   ELEMENTOS
========================= */
const els = {
  kpiSupervisor: document.getElementById('kpiSupervisor'),
  kpiEncarregado: document.getElementById('kpiEncarregado'),
  kpiMontadores: document.getElementById('kpiMontadores'),
  kpiFaltas: document.getElementById('kpiFaltas'),
  kpiInterf: document.getElementById('kpiInterf'),

  inpLocal: document.getElementById('inpLocal'),
  inpDisciplina: document.getElementById('inpDisciplina'),
  inpMontadoresPrev: document.getElementById('inpMontadoresPrev'),
  inpMontadoresReal: document.getElementById('inpMontadoresReal'),
  inpFaltas: document.getElementById('inpFaltas'),
  inpART: document.getElementById('inpART'),
  inpMLReal: document.getElementById('inpMLReal'),

  outHHPrev: document.getElementById('outHHPrev'),
  outHHReal: document.getElementById('outHHReal'),
  outSTDPrev: document.getElementById('outSTDPrev'),
  outSTDReal: document.getElementById('outSTDReal'),
  outMLPrev: document.getElementById('outMLPrev'),

  campoData: document.getElementById('campoData'),
  campoTurno: document.getElementById('campoTurno'),

  tabelaBody: document.querySelector('#tabelaAtiv tbody'),
  btnAddLinha: document.getElementById('btnAddLinha'),
  btnRemoverSel: document.getElementById('btnRemoverSel'),

  resumoTurno: document.getElementById('resumoTurno'),
  uploadFotos: document.getElementById('uploadFotos'),
  previewFotos: document.getElementById('previewFotos'),

  btnSalvar: document.getElementById('btnSalvar'),

  gauge: document.getElementById('gauge'),
  barChart: document.getElementById('barChart'),
};

/* =========================
   HELPERS
========================= */
function toFixed(n,d=2){ return isNaN(n)?'0,00':Number(n).toFixed(d).replace('.',','); }
function parseNum(v){ const n = parseFloat(String(v).replace(',','.')); return isNaN(n)?0:n; }
function hmToHours(hm){ if(!hm) return 0; const [h,m] = hm.split(':').map(n=>parseInt(n||'0',10)); return (h||0)+(m||0)/60; }
function diffHM(ini,fim){ const [h1,m1]=ini.split(':').map(n=>parseInt(n,10)); const [h2,m2]=fim.split(':').map(n=>parseInt(n,10)); let t1=h1*60+m1,t2=h2*60+m2; if(t2<t1)t2+=24*60; const d=Math.max(0,t2-t1); return `${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`; }

/* =========================
   CARREGAR STATE SALVO
========================= */
function carregarState(){
  const key = `${state.data}_${state.turno}`;
  if(dbNoturno[key]){
    Object.assign(state, JSON.parse(JSON.stringify(dbNoturno[key])));
  }
}

/* =========================
   ATUALIZA UI
========================= */
function atualizarCards(){
  els.kpiSupervisor.textContent = state.supervisor;
  els.kpiEncarregado.textContent = state.encarregado;
  els.kpiMontadores.textContent = state.montadoresReal;
  els.kpiFaltas.textContent = state.faltas;

  const totalInterf = state.atividades.reduce((acc,a)=>acc+hmToHours(a.interfer),0);
  els.kpiInterf.textContent = toFixed(totalInterf,1);
}

function atualizarCalculos(){
  state.hhPrev = state.montadoresPrev * 8.8;
  state.hhReal = state.montadoresReal * 8.8;
  state.mlPrev = state.montadoresPrev * 40;
  state.mlReal = state.mlReal ? state.mlReal : state.montadoresReal * 40;
  state.stdPrev = state.mlPrev>0 ? state.hhPrev/state.mlPrev : 0;
  state.stdReal = state.mlReal>0 ? state.hhReal/state.mlReal : 0;

  els.outHHPrev.textContent = toFixed(state.hhPrev,1);
  els.outHHReal.textContent = toFixed(state.hhReal,1);
  els.outMLPrev.textContent = toFixed(state.mlPrev,1);
  els.outSTDPrev.textContent = toFixed(state.stdPrev,2);
  els.outSTDReal.textContent = toFixed(state.stdReal,2);

  desenharGauge();
  desenharBarChart();
}

function preencherFormulario(){
  els.inpLocal.value = state.local;
  els.inpDisciplina.value = state.disciplina;
  els.inpMontadoresPrev.value = state.montadoresPrev;
  els.inpMontadoresReal.value = state.montadoresReal;
  els.inpFaltas.value = state.faltas;
  els.inpART.value = state.ART;
  els.inpMLReal.value = state.mlReal;
  els.resumoTurno.value = state.resumo;
  els.campoData.value = state.data;
  els.campoTurno.value = state.turno;
}

function renderTabela(){
  els.tabelaBody.innerHTML = '';
  state.atividades.forEach((a,idx)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><input type="checkbox" data-idx="${idx}"></td>
      <td><input type="text" value="${a.atividade}"></td>
      <td><input type="time" value="${a.ini}"></td>
      <td><input type="time" value="${a.fim}"></td>
      <td><input type="text" value="${a.interfer}" placeholder="H:MM"></td>
      <td><input type="text" value="${a.obs||''}" placeholder="Observações"></td>
    `;
    const [cb,inpAtv,inpIni,inpFim,inpInterf,inpObs]=tr.querySelectorAll('input');
    inpAtv.addEventListener('input',e=>state.atividades[idx].atividade=e.target.value);
    inpIni.addEventListener('change',e=>{state.atividades[idx].ini=e.target.value; state.atividades[idx].interfer=diffHM(state.atividades[idx].ini,state.atividades[idx].fim); renderTabela(); atualizarCards();});
    inpFim.addEventListener('change',e=>{state.atividades[idx].fim=e.target.value; state.atividades[idx].interfer=diffHM(state.atividades[idx].ini,state.atividades[idx].fim); renderTabela(); atualizarCards();});
    inpInterf.addEventListener('input',e=>{state.atividades[idx].interfer=e.target.value; atualizarCards();});
    inpObs.addEventListener('input',e=>state.atividades[idx].obs=e.target.value);
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   GRÁFICOS (SVG)
========================= */
function desenharGauge(){
  const svg=els.gauge; while(svg.firstChild) svg.removeChild(svg.firstChild);
  const w=200,h=120,cx=100,cy=110,r=90;
  const p=state.mlPrev>0?Math.max(0,Math.min(1,state.mlReal/state.mlPrev)):0;
  const arcPath = describeArc(cx,cy,r,180,0);
  const bg = path(arcPath,'#e5e7eb',14);
  svg.appendChild(bg);
  const color=p>=1?'#14b8a6':(p>=0.8?'#f59e0b':'#ef4444');
  const progPath=describeArc(cx,cy,r,180,180*(1-p));
  const fg=path(progPath,color,14);
  svg.appendChild(fg);
}
function desenharBarChart(){
  const svg=els.barChart; while(svg.firstChild) svg.removeChild(svg.firstChild);
  const max=Math.max(state.mlPrev,state.mlReal);
  const prevH=state.mlPrev/max*60,realH=state.mlReal/max*60;
  svg.innerHTML=`
    <rect x="20" y="${60-prevH}" width="20" height="${prevH}" fill="#0b63d6"></rect>
    <rect x="60" y="${60-realH}" width="20" height="${realH}" fill="#6b7280"></rect>
  `;
}
function path(d,color,w){ const p=document.createElementNS("http://www.w3.org/2000/svg",'path'); p.setAttribute('d',d); p.setAttribute('stroke',color); p.setAttribute('stroke-width',w); p.setAttribute('fill','none'); return p; }
function describeArc(x,y,r,startAngle,endAngle){ const start = polarToCartesian(x,y,r,endAngle); const end = polarToCartesian(x,y,r,startAngle); const largeArcFlag = endAngle - startAngle <=180 ? "0":"1"; return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`; }
function polarToCartesian(cx,cy,r,deg){ const rad=(deg-90)*Math.PI/180; return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}; }

/* =========================
   EVENTOS
========================= */
els.inpLocal.addEventListener('input',e=>state.local=e.target.value);
els.inpDisciplina.addEventListener('input',e=>state.disciplina=e.target.value);
els.inpMontadoresPrev.addEventListener('input',e=>{state.montadoresPrev=parseNum(e.target.value); atualizarCalculos();});
els.inpMontadoresReal.addEventListener('input',e=>{state.montadoresReal=parseNum(e.target.value); atualizarCalculos();});
els.inpFaltas.addEventListener('input',e=>{state.faltas=parseNum(e.target.value); atualizarCards();});
els.inpART.addEventListener('input',e=>state.ART=e.target.value);
els.inpMLReal.addEventListener('input',e=>{state.mlReal=parseNum(e.target.value); atualizarCalculos();});
els.resumoTurno.addEventListener('input',e=>state.resumo=e.target.value);

/* Troca de data/turno recarrega o state */
els.campoData.addEventListener('change', e=>{
  state.data = e.target.value;
  carregarState();
  preencherFormulario();
  atualizarCalculos();
  renderTabela();
  atualizarCards();
  atualizarFotos();
});
els.campoTurno.addEventListener('change', e=>{
  state.turno = e.target.value;
  carregarState();
  preencherFormulario();
  atualizarCalculos();
  renderTabela();
  atualizarCards();
  atualizarFotos();
});

/* =========================
   TABELA
========================= */
els.btnAddLinha.addEventListener('click',()=>{
  state.atividades.push({atividade:'',ini:'',fim:'',interfer:'',obs:''});
  renderTabela();
});
els.btnRemoverSel.addEventListener('click',()=>{
  const checkboxes=document.querySelectorAll('#tabelaAtiv tbody input[type="checkbox"]:checked');
  const idxs=[...checkboxes].map(cb=>parseInt(cb.dataset.idx,10));
  state.atividades=state.atividades.filter((_,i)=>!idxs.includes(i));
  renderTabela();
  atualizarCards();
});

/* =========================
   UPLOAD DE FOTOS
========================= */
els.uploadFotos.addEventListener('change',e=>{
  const files=Array.from(e.target.files);
  files.forEach(f=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      state.fotos.push(ev.target.result);
      atualizarFotos();
    };
    reader.readAsDataURL(f);
  });
});
function atualizarFotos(){
  els.previewFotos.innerHTML='';
  state.fotos.forEach(src=>{
    const img=document.createElement('img');
    img.src=src;
    img.className='thumb';
    els.previewFotos.appendChild(img);
  });
}

/* =========================
   SALVAR EM JSON
========================= */
els.btnSalvar.addEventListener('click',()=>{
  const key=`${state.data}_${state.turno}`;
  dbNoturno[key]=JSON.parse(JSON.stringify(state));
  localStorage.setItem('noturno_data',JSON.stringify(dbNoturno));
  alert('Dados salvos com sucesso!');
});

/* =========================
   INICIALIZAÇÃO
========================= */
function init(){
  const stored = localStorage.getItem('noturno_data');
  if(stored) dbNoturno = JSON.parse(stored);

  carregarState();       // <-- carrega dados do dia/turno atual
  preencherFormulario();
  atualizarCalculos();
  renderTabela();
  atualizarCards();
  atualizarFotos();
}

init();
