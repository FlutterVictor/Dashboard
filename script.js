let dadosCSV = [];

// Função para converter números
function parseNumber(str){
    if(!str) return 0;
    str = str.toString().trim().replace(',', '.');
    let num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Função para converter datas BR
function parseDateBR(str){
    if(!str) return null;
    const parts = str.split('/');
    if(parts.length !== 3) return null;
    const [d,m,y] = parts;
    return new Date(+y, m-1, +d);
}

function diaSemanaIndex(diaJS){
    return diaJS === 0 ? 6 : diaJS-1;
}

// Filtra dados por data
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

// Atualiza dashboard
function atualizarDashboard(dados){
    if(!dados || dados.length===0){
        document.getElementById('hhTotal').textContent='0';
        document.getElementById('mlMontados').textContent='0 m';
        document.getElementById('montPresente').textContent='0';
        document.getElementById('stdSemanal').textContent='0,00';
        document.getElementById('metaAtingida').textContent='0%';
        document.getElementById('rankingTable').querySelector('tbody').innerHTML='<tr><td colspan="3" style="text-align:center;color:gray;">Sem dados</td></tr>';
        document.getElementById('tabelaDados').innerHTML='<tr><td colspan="10" style="text-align:center;color:gray;">Sem dados</td></tr>';
        atualizarGraficoLinha(Array(7).fill(0));
        return;
    }

    let somaHH=0, somaML=0, somaMont=0, somaMLPrevisto=0;
    let mlPorDia=Array(7).fill(0);
    let ranking={};

    dados.forEach(row=>{
        try{
            const hh=parseNumber(row['HH Total']);
            const ml=parseNumber(row['ML Montados']);
            const mont=parseNumber(row['Mont.Presente']);
            const mlPrev=parseNumber(row['ML PREVISTO']);

            somaHH+=hh; somaML+=ml; somaMont+=mont; somaMLPrevisto+=mlPrev;

            if(row['Data']){
                const ds=diaSemanaIndex(parseDateBR(row['Data']).getDay());
                mlPorDia[ds]+=ml;
            }

            const nome=row['Encarregado Responsavel'] ? row['Encarregado Responsavel'].trim() : '';
            if(nome){
                if(!ranking[nome]) ranking[nome]={ml:0,mlPrev:0,hh:0};
                ranking[nome].ml+=ml;
                ranking[nome].mlPrev+=mlPrev;
                ranking[nome].hh+=hh;
            }
        } catch(e){
            console.warn('Linha ignorada por erro:', row, e);
        }
    });

    document.getElementById('hhTotal').textContent=somaHH.toFixed(1);
    document.getElementById('mlMontados').textContent=somaML.toFixed(0)+' m';
    const mediaMont=somaMont/dados.length;
    document.getElementById('montPresente').textContent=mediaMont.toFixed(1);
    const std=somaML>0?somaHH/somaML:0;
    document.getElementById('stdSemanal').textContent=std.toFixed(2);
    const meta=(somaMLPrevisto>0?somaML/somaMLPrevisto*100:0);
    document.getElementById('metaAtingida').textContent=meta.toFixed(0)+'%';

    // Ranking Top 5
    const rankingArr=Object.entries(ranking).map(([nome,val])=>{
        const pctMeta=val.mlPrev>0?val.ml/val.mlPrev*100:0;
        const stdReal=val.ml>0?val.hh/val.ml:0;
        const indicador=stdReal<=0.22 ? '↑' : '↓';
        return {nome,pctMeta,indicador};
    }).sort((a,b)=>b.pctMeta-a.pctMeta).slice(0,5);

    const tbodyRanking=document.getElementById('rankingTable').querySelector('tbody');
    tbodyRanking.innerHTML='';
    rankingArr.forEach(r=>{
        const row=document.createElement('tr');
        row.innerHTML=`<td>${r.nome}</td><td>${r.pctMeta.toFixed(0)}%</td><td class="${r.indicador==='↑'?'ind-up':'ind-down'}">${r.indicador}</td>`;
        tbodyRanking.appendChild(row);
    });
    if(rankingArr.length===0) tbodyRanking.innerHTML='<tr><td colspan="3" style="text-align:center;color:gray;">Sem dados</td></tr>';

    // Tabela de dados (amostra)
    const tbodyDados=document.getElementById('tabelaDados');
    tbodyDados.innerHTML='';
    dados.slice(0,5).forEach(row=>{
        tbodyDados.innerHTML+=`<tr>
            <td>${row['Semanas']||''}</td>
            <td>${row['OS']||''}</td>
            <td>${row['Matricula']||''}</td>
            <td>${row['Encarregado Responsavel']||''}</td>
            <td>${row['ÁREA']||''}</td>
            <td>${row['Mont.Presente']||''}</td>
            <td>${parseNumber(row['HH Total']).toFixed(1)}</td>
            <td>${parseNumber(row['ML Montados']).toFixed(0)}</td>
            <td>${parseNumber(row['STD Montado']).toFixed(2)}</td>
            <td>${row['Data']||''}</td>
        </tr>`;
    });

    atualizarGraficoLinha(mlPorDia);
}

// Atualiza gráfico de linha
function atualizarGraficoLinha(mlPorDia){
    const svg=document.getElementById('graficoLinha');
    while(svg.querySelector('polyline')) svg.querySelector('polyline').remove();
    while(svg.querySelectorAll('.data-label').length) svg.querySelectorAll('.data-label').forEach(el=>el.remove());

    const width=100, height=35, marginBottom=8;
    const maxML=Math.max(...mlPorDia,1);
    const pontos=mlPorDia.map((v,i)=>{
        const x=i*(width/6);
        const y=height-marginBottom-(v/maxML*(height-marginBottom*2));
        return [x,y];
    });

    const pointsStr=pontos.map(p=>p.join(',')).join(' ');
    const polyline=document.createElementNS("http://www.w3.org/2000/svg","polyline");
    polyline.setAttribute("fill","none");
    polyline.setAttribute("stroke","#0b63d6");
    polyline.setAttribute("stroke-width","1.6");
    polyline.setAttribute("points",pointsStr);
    svg.appendChild(polyline);

    pontos.forEach((p,i)=>{
        const text=document.createElementNS("http://www.w3.org/2000/svg","text");
        text.classList.add('data-label');
        text.setAttribute('x',p[0]);
        text.setAttribute('y',p[1]-3);
        text.setAttribute('font-size','3');
        text.setAttribute('fill','#0b2340');
        text.setAttribute('text-anchor','middle');
        text.textContent=mlPorDia[i].toFixed(0);
        svg.appendChild(text);
    });
}

// Carregar CSV via input
document.getElementById('fileInput').addEventListener('change', e=>{
    const file=e.target.files[0];
    if(!file) return;
    Papa.parse(file,{
        header:true,
        skipEmptyLines:true,
        complete: results=>{
            dadosCSV=results.data;
            aplicarFiltro();
        },
        error: err=>alert('Erro ao ler o arquivo: '+err)
    });
});

// Filtro por datas
function aplicarFiltro(){
    const dataInicio=document.getElementById('dataInicio').value;
    const dataFim=document.getElementById('dataFim').value;
    const dadosFiltrados=filtrarDadosPorData(dadosCSV,dataInicio,dataFim);
    atualizarDashboard(dadosFiltrados);
}

document.getElementById('btnApplyFilter').addEventListener('click', aplicarFiltro);

// Exportar PDF
document.getElementById('btnExportPDF').addEventListener('click',()=>{
    const dashboardWrap=document.getElementById('dashboardWrap');
    html2canvas(dashboardWrap,{scale:2}).then(canvas=>{
        const imgData=canvas.toDataURL('image/png');
        const { jsPDF }=window.jspdf;
        const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
        const pdfWidth=pdf.internal.pageSize.getWidth();
        const pdfHeight=pdf.internal.pageSize.getHeight();
        const imgProps=pdf.getImageProperties(imgData);
        const imgHeight=(imgProps.height*pdfWidth)/imgProps.width;
        pdf.addImage(imgData,'PNG',0,0,pdfWidth,imgHeight);
        pdf.save('dashboard.pdf');
    });
});

// Botão para abrir Dashboard 2 (Mapa de Produtividade)
document.getElementById('btnDashboard2').addEventListener('click', () => {
    window.location.href = 'mapa.html';
});

// Função para carregar CSV padrão ao iniciar
function carregarCSVPadrao(){
    fetch('STD_Geral.csv')
        .then(response => response.text())
        .then(csvText => {
            const resultados = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            dadosCSV = resultados.data;
            aplicarFiltro(); // Atualiza o Dashboard com todos os dados
        })
        .catch(err => alert('Erro ao carregar CSV: ' + err));
}

// Chama ao iniciar a página
window.addEventListener('load', carregarCSVPadrao);
