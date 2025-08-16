let dadosCSV = [];
let dadosAnteriores = [];

function parseNumber(str){return parseFloat((str||'0').toString().replace(',','.'))||0;}
function parseDateBR(str){
    if(!str) return null;
    const [d,m,y] = str.split('/');
    return new Date(+y, m-1, +d);
}
function diaSemanaIndex(diaJS){return diaJS===0?6:diaJS-1;}

function filtrarDadosPorData(dados, inicio, fim){
    let dtInicio = inicio? new Date(inicio):null;
    let dtFim = fim? new Date(fim):null;
    return dados.filter(r=>{
        if(!r['Data']) return false;
        let data = parseDateBR(r['Data']);
        if(dtInicio && data<dtInicio) return false;
        if(dtFim && data>dtFim) return false;
        return true;
    });
}

function atualizarDashboard(dados){
    const diasSet = new Set();
    let somaHH=0, somaML=0, somaMont=0, somaMLPrev=0;
    let mlPorDia = Array(7).fill(0);
    let areas={'Estrutura':{ml:0,hh:0},'Elétrica':{ml:0,hh:0},'Pintura':{ml:0,hh:0},'Mecânica':{ml:0,hh:0}};
    
    dados.forEach(r=>{
        const hh=parseNumber(r['HH Total']);
        const ml=parseNumber(r['ML Montados']);
        const mont=parseNumber(r['Mont.Presente']);
        const mlPrev=parseNumber(r['ML PREVISTO']);
        somaHH+=hh;somaML+=ml;somaMont+=mont;somaMLPrev+=mlPrev;
        if(r['Data']) diasSet.add(r['Data'].trim());
        if(r['Data']){
            let d=parseDateBR(r['Data']);
            if(d && !isNaN(d)) mlPorDia[diaSemanaIndex(d.getDay())]+=ml;
        }
        let area=r['ÁREA']?r['ÁREA'].trim():'';
        if(areas[area]){areas[area].ml+=ml;areas[area].hh+=hh;}
    });

    document.getElementById('hhTotal').textContent = somaHH.toFixed(1);
    document.getElementById('mlMontados').textContent = somaML.toFixed(0)+' m';
    document.getElementById('montPresente').textContent = (diasSet.size? somaMont/diasSet.size:0).toFixed(1);
    document.getElementById('stdSemanal').textContent = (somaML? (somaHH/somaML):0).toFixed(2);
    document.getElementById('metaAtingida').textContent = (somaMLPrev? (somaML/somaMLPrev*100):0).toFixed(0)+'%';

    atualizarGraficoLinha(mlPorDia);
    atualizarRanking(dados);
    atualizarTabela(dados);
}

function atualizarGraficoLinha(mlPorDia){
    const svg=document.getElementById('graficoLinha');
    const width=100,height=35,marginBottom=8;
    while(svg.querySelector('polyline')) svg.querySelector('polyline').remove();
    const maxML=Math.max(...mlPorDia,1);
    const pontos=mlPorDia.map((v,i)=>[i*(width/6),height-marginBottom-(v/maxML*(height-marginBottom*2))]);
    const polyline=document.createElementNS("http://www.w3.org/2000/svg","polyline");
    polyline.setAttribute("fill","none");polyline.setAttribute("stroke","#0b63d6");
    polyline.setAttribute("stroke-width","1.6");polyline.setAttribute("points",pontos.map(p=>p.join(',')).join(' '));
    svg.appendChild(polyline);
}

function atualizarRanking(dados){
    if(dados.length===0){document.getElementById('rankingBody').innerHTML='<tr><td colspan="3" style="text-align:center;color:var(--gray)">Sem dados</td></tr>';return;}
    let ranking=dados.map(r=>{
        let meta=parseNumber(r['ML Montados'])/parseNumber(r['ML PREVISTO']||1)*100;
        let stdReal=parseNumber(r['STD Montado']);
        let stdPadrao=parseNumber(r['STD PADRAO']||0.22);
        let indicador=stdReal<=stdPadrao?'<span class="trend-up">▲</span>':'<span class="trend-down">▼</span>';
        return {nome:r['Encarregado Responsavel'],meta:meta.toFixed(0)+'%',indicador:indicador};
    });
    ranking.sort((a,b)=>parseFloat(b.meta)-parseFloat(a.meta));
    ranking=ranking.slice(0,5);
    const tbody=document.getElementById('rankingBody');tbody.innerHTML='';
    ranking.forEach(r=>tbody.innerHTML+=`<tr><td>${r.nome}</td><td>${r.meta}</td><td>${r.indicador}</td></tr>`);
}

function atualizarTabela(dados){
    const tbody=document.getElementById('tabelaDados');tbody.innerHTML='';
    if(dados.length===0){tbody.innerHTML='<tr><td colspan="10" style="text-align:center;color:var(--gray)">Sem dados</td></tr>';return;}
    dados.slice(0,10).forEach(r=>{
        tbody.innerHTML+=`<tr>
            <td>${r['Semanas']||''}</td>
            <td>${r['OS']||''}</td>
            <td>${r['Matricula']||''}</td>
            <td>${r['Encarregado Responsavel']||''}</td>
            <td>${r['ÁREA']||''}</td>
            <td>${r['Mont.Presente']||''}</td>
            <td>${parseNumber(r['HH Total']).toFixed(1)}</td>
            <td>${parseNumber(r['ML Montados']).toFixed(0)}</td>
            <td>${parseNumber(r['STD Montado']).toFixed(2)}</td>
            <td>${r['Data']||''}</td>
        </tr>`;
    });
}

// Import CSV
document.getElementById('fileInput').addEventListener('change',e=>{
    const file=e.target.files[0];if(!file) return;
    Papa.parse(file,{header:true,skipEmptyLines:true,
        complete:function(results){
            dadosCSV=results.data;
            dadosAnteriores=[...dadosCSV];
            atualizarDashboard(dadosCSV);
        }
    });
});

// Filtro de datas
document.getElementById('btnApplyFilter').addEventListener('click',()=>{
    const inicio=document.getElementById('dataInicio').value;
    const fim=document.getElementById('dataFim').value;
    const filtrados=filtrarDadosPorData(dadosCSV,inicio,fim);
    atualizarDashboard(filtrados);
});

// Export PDF
document.getElementById('btnExportPDF').addEventListener('click',()=>{
    html2canvas(document.getElementById('dashboardWrap'),{scale:2}).then(canvas=>{
        const imgData=canvas.toDataURL('image/png');
        const { jsPDF }=window.jspdf;
        const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
        const pdfWidth=pdf.internal.pageSize.getWidth();
        const pdfHeight=pdf.internal.pageSize.getHeight();
        const imgProps=pdf.getImageProperties(imgData);
        const imgHeight=(imgProps.height*pdfWidth)/imgProps.width;
        pdf.addImage(imgData,'PNG',0,0,pdfWidth,imgHeight);
        pdf.save('dashboard-std-andaime.pdf');
    });
});
