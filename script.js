let dadosCSV = [];

function parseNumber(str){
    if(!str) return 0;
    str = str.toString().trim().replace(',', '.');
    let num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function parseDateBR(str){
    if(!str) return null;
    const parts = str.split('/');
    if(parts.length !== 3) return null;
    const [d,m,y] = parts;
    return new Date(+y, m-1, +d);
}

function diaSemanaIndex(diaJS){ return diaJS===0?6:diaJS-1; }

function filtrarDadosPorData(dados, dataInicio, dataFim){
    if(!dataInicio && !dataFim) return dados;
    let dtInicio = dataInicio ? new Date(dataInicio) : null;
    let dtFim = dataFim ? new Date(dataFim) : null;
    return dados.filter(row => {
        if(!row['Data']) return false;
        let dataRow = parseDateBR(row['Data']);
        if(!dataRow) return false;
        if(dtInicio && dataRow < dtInicio) return false;
        if(dtFim && dataRow > dtFim) return false;
        return true;
    });
}

function atualizarDashboard(dados) {
    const diasSet = new Set();
    let somaHH=0,somaML=0,somaMont=0,somaMLPrevisto=0;

    let mlPorDia = Array(7).fill(0);
    let areas = {};

    dados.forEach(row=>{
        const hh=parseNumber(row['HH Total']);
        const ml=parseNumber(row['ML Montados']);
        const mont=parseNumber(row['Mont.Presente']);
        somaHH+=hh; somaML+=ml; somaMont+=mont;
        if(row['Data']) diasSet.add(row['Data'].trim());

        if(row['Data']){
            const ds=diaSemanaIndex(parseDateBR(row['Data']).getDay());
            mlPorDia[ds]+=ml;
        }
    });

    document.getElementById('hhTotal').textContent=somaHH.toFixed(1);
    document.getElementById('mlMontados').textContent=somaML.toFixed(0)+' m';
    document.getElementById('montPresente').textContent=(diasSet.size>0?somaMont/diasSet.size:0).toFixed(1);
    document.getElementById('stdSemanal').textContent=(somaML>0?somaHH/somaML:0).toFixed(2);
    document.getElementById('metaAtingida').textContent='0%'; // Lógica meta pode ser adicionada

    atualizarGraficoLinha(mlPorDia);
    atualizarRanking(dados);
    atualizarTabela(dados);
}

function atualizarGraficoLinha(mlPorDia){
    const svg=document.getElementById('graficoLinha');
    const width=100, height=35;
    while(svg.querySelector('polyline')) svg.querySelector('polyline').remove();
    const maxML=Math.max(...mlPorDia,1);
    const pointsStr = mlPorDia.map((v,i)=>[(i*(width/6)),height-(v/maxML*(height-8*2))].join(',')).join(' ');
    const polyline=document.createElementNS("http://www.w3.org/2000/svg","polyline");
    polyline.setAttribute("fill","none");
    polyline.setAttribute("stroke","#0b63d6");
    polyline.setAttribute("stroke-width","1.6");
    polyline.setAttribute("points",pointsStr);
    svg.appendChild(polyline);
}

function atualizarRanking(dados){
    const tbody=document.getElementById('rankingTable').querySelector('tbody');
    tbody.innerHTML='';
    if(dados.length===0){
        tbody.innerHTML='<tr><td colspan="3" style="text-align:center;color:#888">Sem dados</td></tr>';
        return;
    }
    // Exemplo de ranking baseado em ML Montados (simplificado)
    const ranking=dados.slice(0,5);
    ranking.forEach(row=>{
        const nome=row['Encarregado']||'';
        const perc='100%'; // Lógica real de meta
        const indicador='▲'; // Lógica real de comparação
        tbody.innerHTML+=`<tr><td>${nome}</td><td>${perc}</td><td>${indicador}</td></tr>`;
    });
}

function atualizarTabela(dados){
    const tbody=document.getElementById('tabelaDados');
    tbody.innerHTML='';
    if(dados.length===0){
        tbody.innerHTML='<tr><td colspan="10" style="text-align:center;color:#888">Sem dados</td></tr>';
        return;
    }
    dados.slice(0,5).forEach(row=>{
        tbody.innerHTML+=`<tr>
            <td>${row['Semanas']||''}</td><td>${row['OS']||''}</td><td>${row['Matricula']||''}</td>
            <td>${row['Encarregado']||''}</td><td>${row['ÁREA']||''}</td><td>${row['Mont.Presente']||''}</td>
            <td>${parseNumber(row['HH Total']).toFixed(1)}</td><td>${parseNumber(row['ML Montados']).toFixed(0)}</td>
            <td>${parseNumber(row['STD Montado']).toFixed(2)}</td><td>${row['Data']||''}</td>
        </tr>`;
    });
}

document.getElementById('fileInput').addEventListener('change',e=>{
    const file=e.target.files[0];
    if(!file) return;
    Papa.parse(file,{header:true,skipEmptyLines:true,complete:results=>{
        dadosCSV=results.data;
        atualizarDashboard(dadosCSV);
    }});
});

document.getElementById('btnApplyFilter').addEventListener('click',()=>{
    const dataInicio=document.getElementById('dataInicio').value;
    const dataFim=document.getElementById('dataFim').value;
    const dadosFiltrados=filtrarDadosPorData(dadosCSV,dataInicio,dataFim);
    atualizarDashboard(dadosFiltrados);
});

// PDF export
document.getElementById('btnExportPDF').addEventListener('click',()=>{
    const dashboardWrap=document.getElementById('dashboardWrap');
    html2canvas(dashboardWrap,{scale:2}).then(canvas=>{
        const imgData=canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
        const pdfWidth=pdf.internal.pageSize.getWidth();
        const pdfHeight=pdf.internal.pageSize.getHeight();
        const imgProps=pdf.getImageProperties(imgData);
        const imgHeight=(imgProps.height*pdfWidth)/imgProps.width;
        pdf.addImage(imgData,'PNG',0,0,pdfWidth,imgHeight);
        pdf.save('dashboard-std-andaime.pdf');
    });
});
