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
  resumo: "Turno ocorreu conforme planejamento. Área 31 liberada às 20:15. Interferência por falta de material entre 22:00 e 23:10.",
  atividades: [
    {atividade:"Montagem andaime","ini":"18:00","fim":"20:15","interfer":"0:00","obs":""}
  ],
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
  btnEditar: document.getElementById('btnEditar'),

  gauge: document.getElementById('gauge'),
  barChart: document.getElementById('barChart'),
};

/* =========================
   HELPERS
========================= */
function toFixed(n,d=2){ const x=Number(n); return isFinite(x)?x.toFixed(d).replace('.',','):'0,00'; }
function parseNum(v){ const n=parseFloat(String(v).replace(',','.')); return isNaN(n)?0:n; }
function hmToHours(hm){ if(!hm) return 0; const [h,m]=hm.split(':').map(n=>parseInt(n||'0',10)); return (h||0)+(m||0)/60; }
function diffHM(ini,fim){ const [h1,m1]=ini.split(':').map(n=>parseInt(n,10)); const [h2,m2]=fim.split(':').map(n=>parseInt(n,10)); let t1=h1*60+m1; let t2=h2*60+m2; if(t2<t1)t2+=24*60; const d=Math.max(0,t2-t1); return `${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`; }

/* =========================
   ATUALIZAÇÃO DE UI
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
  const stdPrev = state.mlPrev>0 ? (hhPrev/state.mlPrev) : 0;
  const stdReal = state.mlReal>0 ? (state.hhReal/state.mlReal) : 0;

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
  els.tabelaBody.innerHTML='';
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
    const [cb,inpAtv,inpIni,inpFim,inpInterf,inpObs] = tr.querySelectorAll('input');
    inpAtv.addEventListener('input',e=>{ state.atividades[idx].atividade=e.target.value; });
    inpIni.addEventListener('change',e=>{
      state.atividades[idx].ini=e.target.value;
      state.atividades[idx].interfer=diffHM(state.atividades[idx].ini,state.atividades[idx].fim);
      renderTabela(); atualizarCards();
    });
    inpFim.addEventListener('change',e=>{
      state.atividades[idx].fim=e.target.value;
      state.atividades[idx].interfer=diffHM(state.atividades[idx].ini,state.atividades[idx].fim);
      renderTabela(); atualizarCards();
    });
    inpInterf.addEventListener('input',e=>{ state.atividades[idx].interfer=e.target.value; atualizarCards(); });
    inpObs.addEventListener('input',e=>{ state.atividades[idx].obs=e.target.value; });
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   UPLOAD DE FOTOS
========================= */
els.uploadFotos.addEventListener('change', e=>{
  const files = Array.from(e.target.files);
  files.forEach(f=>{
    const reader = new FileReader();
    reader.onload = ev=>{
      state.fotos.push(ev.target.result);
      renderFotos();
    };
    reader.readAsDataURL(f);
  });
});

function renderFotos(){
  els.previewFotos.innerHTML='';
  state.fotos.forEach((f,idx)=>{
    const img = document.createElement('img');
    img.src=f;
    img.style.width='80px';
    img.style.margin='4px';
    els.previewFotos.appendChild(img);
  });
}

/* =========================
   BOTÕES
========================= */
els.btnAddLinha.addEventListener('click',()=>{
  state.atividades.push({atividade:'',ini:'',fim:'',interfer:'',obs:''});
  renderTabela();
});
els.btnRemoverSel.addEventListener('click',()=>{
  const sel = Array.from(els.tabelaBody.querySelectorAll('input[type=checkbox]:checked')).map(cb=>parseInt(cb.dataset.idx,10));
  state.atividades = state.atividades.filter((_,i)=>!sel.includes(i));
  renderTabela(); atualizarCards();
});

els.btnSalvar.addEventListener('click',()=>{
  const key=`${state.data}_${state.turno}`;
  state.supervisor=els.inpSupervisor.value;
  state.encarregado=els.inpEncarregado.value;
  state.local=els.inpLocal.value;
  state.disciplina=els.inpDisciplina.value;
  state.montadores=parseNum(els.inpMontadores.value);
  state.faltas=parseNum(els.inpFaltas.value);
  state.ART=els.inpART.value;
  state.hhReal=parseNum(els.inpHHReal.value);
  state.mlPrev=parseNum(els.inpMLPrev.value);
  state.mlReal=parseNum(els.inpMLReal.value);
  state.resumo=els.resumoTurno.value;
  dbNoturno[key]=JSON.parse(JSON.stringify(state));
  alert('Dados salvos!');
});

els.btnCarregar.addEventListener('click',()=>{
  const key=`${state.data}_${state.turno}`;
  if(dbNoturno[key]){
    Object.assign(state,JSON.parse(JSON.stringify(dbNoturno[key])));
    preencherFormulario(); renderTabela(); atualizarCards(); atualizarCalculos();
    alert('Dados carregados!');
  } else alert('Nenhum registro encontrado.');
});

// Botão Editar
els.btnEditar.addEventListener('click', ()=>{
  const key = `${state.data}_${state.turno}`;
  if(dbNoturno[key]){
    localStorage.setItem('noturno_edit', JSON.stringify(dbNoturno[key]));
    window.open('noturno_edit.html', '_blank');
  } else {
    alert('Nenhum registro salvo para editar!');
  }
});

// Voltar Menu
els.btnVoltarMenu.addEventListener('click',()=>window.location.href='index.html');

/* =========================
   GRÁFICOS (SVG)
========================= */
function desenharGauge(){
  const svg = els.gauge;
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  const w=200,h=120,cx=100,cy=110,r=90;
  const p = state.mlPrev>0 ? Math.max(0,Math.min(1,state.mlReal/state.mlPrev)) : 0;
  const arcPath = describeArc(cx,cy,r,180,0);
  svg.appendChild(path(arcPath,'#e5e7eb',14));
  const color = p>=1?'#14b8a6':(p>=0.8?'#f59e0b':'#ef4444');
  svg.appendChild(path(describeArc(cx,cy,r,180,180*(1-p)),color,14));
}
function desenharBarChart(){
  const svg = els.barChart;
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  const max = Math.max(state.mlPrev,state.mlReal);
  const w=100,h=60;
  const barras = [
    {val:state.mlPrev,color:'#0b63d6'},
    {val:state.mlReal,color:'#14b8a6'}
  ];
  barras.forEach((b,i)=>{
    const bw=30;
    const x=i*(bw+10)+5;
    const y=h-(b.val/max)*h;
    const rect = document.createElementNS("http://www.w3.org/2000/svg",'rect');
    rect.setAttribute('x',x); rect.setAttribute('y',y); rect.setAttribute('width',bw); rect.setAttribute('height',(b.val/max)*h);
    rect.setAttribute('fill',b.color);
    svg.appendChild(rect);
  });
}

// Funções auxiliares para SVG Gauge
function path(d,c,w){const p=document.createElementNS("http://www.w3.org/2000/svg",'path');p.setAttribute('d',d);p.setAttribute('stroke',c);p.setAttribute('stroke-width',w);p.setAttribute('fill','none');return p;}
function polarToCartesian(cx,cy,r,angle){const a=(angle-90)*Math.PI/180;return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};}
function describeArc(cx,cy,r,startAngle,endAngle){const s=polarToCartesian(cx,cy,r,endAngle);const e=polarToCartesian(cx,cy,r,startAngle);const largeArcFlag = endAngle-startAngle<=180?0:1; return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${e.x} ${e.y}`;}

/* =========================
   EXPORTAR PDF
========================= */
els.btnExportPDF.addEventListener('click',exportPDF);

async function exportPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','mm','a4');

  // Página 1: Capa
  doc.setFontSize(18);
  doc.text('Relatório de Produtividade - Turno Noturno',105,20,{align:'center'});
  doc.setFontSize(12);
  doc.text(`Data: ${state.data}`,20,40);
  doc.text(`Turno: ${state.turno}`,20,48);
  doc.text(`Supervisor: ${state.supervisor}`,20,56);
  doc.text(`Encarregado: ${state.encarregado}`,20,64);
  doc.text(`Local: ${state.local}`,20,72);
  doc.text(`Disciplina: ${state.disciplina}`,20,80);
  doc.text(`Montadores: ${state.montadores}`,20,88);
  doc.text(`Faltas: ${state.faltas}`,20,96);
  doc.text(`ART: ${state.ART}`,20,104);
  doc.text('Resumo do Turno:',20,112);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(state.resumo||'---',170),20,120);

  // Página 2: Tabela de atividades
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Atividades do Turno',105,20,{align:'center'});
  const tableData = state.atividades.map(a=>[a.atividade,a.ini,a.fim,a.interfer,a.obs||'-']);
  doc.autoTable({
    startY:30,
    head:[['Atividade','Início','Fim','Interferência','Observações']],
    body: tableData,
    styles:{fontSize:10},
    headStyles:{fillColor:[11,35,64]}
  });

  // Página 3: Gráficos + Fotos
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Gráficos e Fotos',105,20,{align:'center'});
  const gaugeCanvas = await html2canvas(els.gauge);
  doc.addImage(gaugeCanvas.toDataURL('image/png'),'PNG',20,30,80,50);
  const barCanvas = await html2canvas(els.barChart);
  doc.addImage(barCanvas.toDataURL('image/png'),'PNG',20,90,120,50);
  let yOffset = 150;
  for(let f of state.fotos){
    doc.addImage(f,'PNG',20,yOffset,40,40);
    yOffset+=45;
    if(yOffset>250){doc.addPage(); yOffset=20;}
  }

  doc.save(`Relatorio_Noturno_${state.data}.pdf`);
}

/* =========================
   INIT
========================= */
preencherFormulario();
renderTabela();
atualizarCards();
atualizarCalculos();
