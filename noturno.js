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
  resumo: "",
  atividades: [],
  fotos: []
};

let dbNoturno = {}; // banco de dados JSON

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
function hmToHours(hm){
  if(!hm) return 0;
  const [h,m] = hm.split(':').map(n=>parseInt(n||'0',10));
  return (h||0) + (m||0)/60;
}
function diffHM(ini, fim){
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
   UI
========================= */
function atualizarCards(){
  els.kpiSupervisor.textContent = state.supervisor;
  els.kpiEncarregado.textContent = state.encarregado;
  els.kpiMontadores.textContent = state.montadores;
  els.kpiFaltas.textContent = state.faltas;
  const totalInterfH = state.atividades.reduce((acc,a)=> acc + hmToHours(a.interfer),0);
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
  els.resumoTurno.value = state.resumo || "";
  els.campoData.value = state.data;
  els.campoTurno.value = state.turno;
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
    const [cb, inpAtv, inpIni, inpFim, inpInterf, inpObs] = tr.querySelectorAll('input');
    inpAtv.addEventListener('input', e=> state.atividades[idx].atividade = e.target.value );
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
    inpObs.addEventListener('input', e=> state.atividades[idx].obs = e.target.value );
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   GRÁFICOS
========================= */
function desenharGauge(){
  const svg = els.gauge;
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  const w=200,h=120,cx=100,cy=110,r=90;
  const p = state.mlPrev>0 ? Math.max(0, Math.min(1,state.mlReal/state.mlPrev)) : 0;
  const pct = Math.round(p*100);

  const arcPath = describeArc(cx,cy,r,180,0);
  svg.appendChild(path(arcPath,'#e5e7eb',14));

  const color = p>=1?'#14b8a6':(p>=0.8?'#f59e0b':'#ef4444');
  const progPath = describeArc(cx,cy,r,180,180*(1-p));
  svg.appendChild(path(progPath,color,14));

  for(let i=0;i<=10;i++){
    const ang = 180 - i*18;
    const a = (ang-90)*Math.PI/180;
    const x1=cx+(r-8)*Math.cos(a), y1=cy+(r-8)*Math.sin(a);
    const x2=cx+r*Math.cos(a), y2=cy+r*Math.sin(a);
    svg.appendChild(line(x1,y1,x2,y2,'#cbd5e1',1.5));
  }

  svg.appendChild(text(cx,cy-10,`${pct}%`,18,'#0b2340','middle'));
  svg.appendChild(text(cx,cy+10,`ML ${state.mlReal} / ${state.mlPrev}`,10,'#6b7280','middle'));

  function path(d,stroke,sw){
    const p = document.createElementNS("http://www.w3.org/2000/svg","path");
    p.setAttribute('d',d); p.setAttribute('fill','none'); p.setAttribute('stroke',stroke); p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-width',sw);
    return p;
  }
  function line(x1,y1,x2,y2,stroke,sw){
    const l=document.createElementNS("http://www.w3.org/2000/svg","line");
    l.setAttribute('x1',x1); l.setAttribute('y1',y1); l.setAttribute('x2',x2); l.setAttribute('y2',y2);
    l.setAttribute('stroke',stroke); l.setAttribute('stroke-width',sw);
    return l;
  }
  function text(x,y,txt,size,fill,anchor){
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute('x',x); t.setAttribute('y',y); t.setAttribute('font-size',size); t.setAttribute('fill',fill); t.setAttribute('text-anchor',anchor||'start');
    t.textContent = txt; return t;
  }
  function polarToCartesian(cx,cy,r,angle){
    const a=(angle-90)*Math.PI/180; return {x: cx+r*Math.cos(a), y: cy+r*Math.sin(a)};
  }
  function describeArc(x,y,r,startAngle,endAngle){
    const start=polarToCartesian(x,y,r,endAngle);
    const end=polarToCartesian(x,y,r,startAngle);
    const largeArcFlag=endAngle-startAngle<=180?"0":"1";
    return ["M",start.x,start.y,"A",r,r,0,largeArcFlag,0,end.x,end.y].join(" ");
  }
}

function desenharBarChart(){
  const svg=els.barChart;
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  const series=[
    {nome:'HH',prev:state.montadores*HORAS_POR_MONTADOR,real:state.hhReal},
    {nome:'ML',prev:state.mlPrev,real:state.mlReal},
  ];

  const width=100,height=60,margin={l:10,r:4,t:6,b:14};
  const plotW=width-margin.l-margin.r, plotH=height-margin.t-margin.b;
  const g=createGroup(margin.l,margin.t);
  svg.appendChild(g);

  const maxVal=Math.max(...series.map(s=>Math.max(s.prev,s.real)),1);
  const barW=(plotW/series.length)*0.8, gap=(plotW/series.length)*0.2;

  series.forEach((s,i)=>{
    const x0=i*(barW+gap);
    const hPrev=(s.prev/maxVal)*plotH, yPrev=plotH-hPrev;
    g.appendChild(rect(x0,yPrev,barW/2-2,hPrev,'#0b63d6'));

    const hReal=(s.real/maxVal)*plotH, yReal=plotH-hReal;
    g.appendChild(rect(x0+barW/2+2,yReal,barW/2-2,hReal,'#6b7280'));

    g.appendChild(text(x0+barW/2,plotH+10,s.nome,4,'#0b2340','middle'));
  });

  const axis=document.createElementNS("http://www.w3.org/2000/svg","line");
  axis.setAttribute('x1',0); axis.setAttribute('y1',plotH);
  axis.setAttribute('x2',plotW); axis.setAttribute('y2',plotH);
  axis.setAttribute('stroke','#cbd5e1'); axis.setAttribute('stroke-width','0.6');
  g.appendChild(axis);

  function createGroup(x,y){ const grp=document.createElementNS("http://www.w3.org/2000/svg","g"); grp.setAttribute('transform',`translate(${x},${y})`); return grp;}
  function rect(x,y,w,h,fill){ const r=document.createElementNS("http://www.w3.org/2000/svg","rect"); r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',w); r.setAttribute('height',h); r.setAttribute('fill',fill); return r;}
  function text(x,y,txt,size,fill,anchor){ const t=document.createElementNS("http://www.w3.org/2000/svg","text"); t.setAttribute('x',x); t.setAttribute('y',y); t.setAttribute('font-size',size); t.setAttribute('fill',fill); t.setAttribute('text-anchor',anchor||'start'); t.textContent=txt; return t;}
}

/* =========================
   FOTOS
========================= */
els.uploadFotos.addEventListener('change', e=>{
  const files=[...e.target.files];
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=(ev)=>{
      state.fotos.push(ev.target.result);
      renderFotos();
    };
    reader.readAsDataURL(file);
  });
  e.target.value="";
});

function renderFotos(){
  els.previewFotos.innerHTML='';
  state.fotos.forEach((f,idx)=>{
    const img=document.createElement('img');
    img.src=f;
    img.style.width='50px';
    img.style.height='50px';
    img.style.margin='2px';
    img.title=`Foto ${idx+1}`;
    els.previewFotos.appendChild(img);
  });
}

/* =========================
   BOTÕES
========================= */
els.btnAddLinha.addEventListener('click', ()=>{
  state.atividades.push({atividade:'',ini:'00:00',fim:'00:00',interfer:'0:00',obs:''});
  renderTabela();
});

els.btnRemoverSel.addEventListener('click', ()=>{
  const checkboxes=[...els.tabelaBody.querySelectorAll('input[type=checkbox]')];
  checkboxes.forEach(cb=>{
    if(cb.checked){
      state.atividades.splice(cb.dataset.idx,1);
    }
  });
  renderTabela();
  atualizarCards();
});

els.btnSalvar.addEventListener('click', ()=>{
  const key=`${state.data}_${state.turno}`;
  dbNoturno[key]=JSON.parse(JSON.stringify(state));
  alert('Salvo no banco JSON interno!');
});

els.btnCarregar.addEventListener('click', ()=>{
  const key=`${state.data}_${state.turno}`;
  if(dbNoturno[key]){
    Object.assign(state,JSON.parse(JSON.stringify(dbNoturno[key])));
    preencherFormulario(); renderTabela(); atualizarCards(); atualizarCalculos(); renderFotos();
  } else alert('Nenhum registro encontrado para a data e turno atuais.');
});

els.btnExportPDF.addEventListener('click', ()=>{
  alert('Exportação PDF ainda não implementada. Use bibliotecas como jsPDF para isso.');
});

/* =========================
   INICIALIZAÇÃO
========================= */
preencherFormulario();
renderTabela();
atualizarCards();
atualizarCalculos();
renderFotos();
