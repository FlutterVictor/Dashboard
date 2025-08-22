/* =========================
   ESTADO INICIAL (FORMATO JSON)
========================= */
const state = {
  data: new Date().toISOString().slice(0,10),
  turno: "Noturno",
  informacoesTurno: {
    local: "",
    disciplina: "",
    montadoresPrevisto: 0,
    montadoresReal: 0,
    faltas: 0,
    ART: "",
    MLReal: 0
  },
  calculos: {
    HHPrevisto: 0,
    HHReal: 0,
    MLPrevisto: 0,
    STDPrevisto: 0,
    STDReal: 0
  },
  atividades: [],
  resumoTurno: "",
  fotos: []
};

let dbNoturno = {}; // banco de dados JSON simulado

/* =========================
   ELEMENTOS
========================= */
const els = {
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
   ATUALIZA UI
========================= */
function atualizarCards(){
  // KPIs
  els.outMLPrev.textContent = toFixed(state.calculos.MLPrevisto,0);
  els.outHHPrev.textContent = toFixed(state.calculos.HHPrevisto,1);
  els.outHHReal.textContent = toFixed(state.calculos.HHReal,1);
  els.outSTDPrev.textContent = toFixed(state.calculos.STDPrevisto,2);
  els.outSTDReal.textContent = toFixed(state.calculos.STDReal,2);
}

function atualizarCalculos(){
  const info = state.informacoesTurno;

  state.calculos.HHPrevisto = info.montadoresPrevisto * 8.8;
  state.calculos.HHReal = info.montadoresReal * 8.8;
  state.calculos.MLPrevisto = info.montadoresPrevisto * 40;
  state.calculos.MLReal = info.MLReal || info.montadoresReal * 40;
  state.calculos.STDPrevisto = state.calculos.MLPrevisto>0 ? state.calculos.HHPrevisto/state.calculos.MLPrevisto : 0;
  state.calculos.STDReal = state.calculos.MLReal>0 ? state.calculos.HHReal/state.calculos.MLReal : 0;

  atualizarCards();
  desenharGauge();
  desenharBarChart();
}

function preencherFormulario(){
  const info = state.informacoesTurno;
  els.inpLocal.value = info.local;
  els.inpDisciplina.value = info.disciplina;
  els.inpMontadoresPrev.value = info.montadoresPrevisto;
  els.inpMontadoresReal.value = info.montadoresReal;
  els.inpFaltas.value = info.faltas;
  els.inpART.value = info.ART;
  els.inpMLReal.value = info.MLReal;
  els.resumoTurno.value = state.resumoTurno;
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
    inpIni.addEventListener('change',e=>{
      state.atividades[idx].ini=e.target.value;
      state.atividades[idx].interfer=diffHM(state.atividades[idx].ini,state.atividades[idx].fim);
      renderTabela();
    });
    inpFim.addEventListener('change',e=>{
      state.atividades[idx].fim=e.target.value;
      state.atividades[idx].interfer=diffHM(state.atividades[idx].ini,state.atividades[idx].fim);
      renderTabela();
    });
    inpInterf.addEventListener('input',e=>state.atividades[idx].interfer=e.target.value);
    inpObs.addEventListener('input',e=>state.atividades[idx].obs=e.target.value);
    els.tabelaBody.appendChild(tr);
  });
}

/* =========================
   EVENTOS
========================= */
els.inpLocal.addEventListener('input',e=>state.informacoesTurno.local=e.target.value);
els.inpDisciplina.addEventListener('input',e=>state.informacoesTurno.disciplina=e.target.value);
els.inpMontadoresPrev.addEventListener('input',e=>{ state.informacoesTurno.montadoresPrevisto=parseNum(e.target.value); atualizarCalculos(); });
els.inpMontadoresReal.addEventListener('input',e=>{ state.informacoesTurno.montadoresReal=parseNum(e.target.value); atualizarCalculos(); });
els.inpFaltas.addEventListener('input',e=>{ state.informacoesTurno.faltas=parseNum(e.target.value); atualizarCalculos(); });
els.inpART.addEventListener('input',e=>state.informacoesTurno.ART=e.target.value);
els.inpMLReal.addEventListener('input',e=>{ state.informacoesTurno.MLReal=parseNum(e.target.value); atualizarCalculos(); });
els.resumoTurno.addEventListener('input',e=>state.resumoTurno=e.target.value);
els.campoData.addEventListener('change',e=>state.data=e.target.value);
els.campoTurno.addEventListener('change',e=>state.turno=e.target.value);

/* Tabela */
els.btnAddLinha.addEventListener('click',()=>{
  state.atividades.push({atividade:'',ini:'',fim:'',interfer:'',obs:''});
  renderTabela();
});
els.btnRemoverSel.addEventListener('click',()=>{
  const checkboxes=document.querySelectorAll('#tabelaAtiv tbody input[type="checkbox"]:checked');
  const idxs=[...checkboxes].map(cb=>parseInt(cb.dataset.idx,10));
  state.atividades=state.atividades.filter((_,i)=>!idxs.includes(i));
  renderTabela();
});

/* Upload Fotos */
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

/* Salvar JSON */
els.btnSalvar.addEventListener('click',()=>{
  const key=`${state.data}_${state.turno}`;
  dbNoturno[key]=JSON.parse(JSON.stringify(state));
  localStorage.setItem('dbNoturno',JSON.stringify(dbNoturno));
  alert('Dados salvos com sucesso!');
});

/* Inicialização */
function init(){
  const stored=localStorage.getItem('dbNoturno');
  if(stored) dbNoturno=JSON.parse(stored);
  preencherFormulario();
  atualizarCalculos();
  renderTabela();
  atualizarFotos();
}

init();
