let dadosCSV = [];
let dadosAnteriores = [];

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

function diaSemanaIndex(diaJS){
    if(diaJS === 0) return 6;
    else return diaJS - 1;
}

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
    let somaHH = 0, somaML = 0, somaMont = 0, somaMLPrevisto = 0;

    let mlPorDia = Array(7).fill(0);
    let areas = {'Estrutura':{ml:0, hh:0},'Elétrica':{ml:0, hh:0},'Pintura':{ml:0, hh:0},'Mecânica':{ml:0, hh:0}};

    dados.forEach(row => {
        const hhRow = parseNumber(row['HH Total']);
        const mlRow = parseNumber(row['ML Montados']);
        const montRow = parseNumber(row['Mont.Presente']);
        const mlPrevistoRow = parseNumber(row['ML PREVISTO']);

        somaHH += hhRow;
        somaML += mlRow;
        somaMont += montRow;
        somaMLPrevisto += mlPrevistoRow;

        if(row['Data']) diasSet.add(row['Data'].trim());

        if(row['Data']){
            const dataObj = parseDateBR(row['Data']);
            if(dataObj && !isNaN(dataObj)){
                const ds = diaSemanaIndex(dataObj.getDay());
                mlPorDia[ds] += mlRow;
            }
        }

        const area = row['ÁREA'] ? row['ÁREA'].trim() : '';
        if(areas[area]){
            areas[area].ml += mlRow;
            areas[area].hh += hhRow;
        }
    });

    // Atualização dos cards principais
    const mediaMont = diasSet.size > 0 ? somaMont / diasSet.size : 0;
    const stdSemanalCalc = somaML > 0 ? (somaHH / somaML) : 0;

    document.getElementById('hhTotal').textContent = somaHH.toFixed(1);
    document.getElementById('mlMontados').textContent = somaML.toFixed(0) + ' m';
    document.getElementById('montPresente').textContent = mediaMont.toFixed(1);
    document.getElementById('stdSemanal').textContent = stdSemanalCalc.toFixed(2);
    const atingMeta = somaMLPrevisto>0 ? (somaML/somaMLPrevisto)*100 : 0;
    document.getElementById('metaAtingida').textContent = atingMeta.toFixed(0) + '%';

    // Atualização da tabela de amostra CSV
    const tbodyDados = document.getElementById('tabelaDados');
    tbodyDados.innerHTML = '';
    if(dados.length === 0){
        tbodyDados.innerHTML = `<tr><td colspan="10" style="text-align:center; color: #6b7280;">Sem dados para o filtro selecionado</td></tr>`;
    } else {
        dados.slice(0,5).forEach(row=>{
            tbodyDados.innerHTML += `<tr>
                <td>${row['Semanas'] || ''}</td>
                <td>${row['OS'] || ''}</td>
                <td>${row['Matricula'] || ''}</td>
                <td>${row['Encarregado Responsavel'] || ''}</td>
                <td>${row['ÁREA'] || ''}</td>
                <td>${row['Mont.Presente'] || ''}</td>
                <td>${parseNumber(row['HH Total']).toFixed(1)}</td>
                <td>${parseNumber(row['ML Montados']).toFixed(0)}</td>
                <td>${parseNumber(row['STD Montado']).toFixed(2)}</td>
                <td>${row['Data'] || ''}</td>
            </tr>`;
        });
    }

    // Atualização do gráfico de linha
    atualizarGraficoLinha(mlPorDia);

    // Atualização do ranking Top 5
    atualizarRanking(dados);
}

function atualizarGraficoLinha(mlPorDia){
    const svg = document.getElementById('graficoLinha');
    const width = 100;
    const height = 35;
    const marginBottom = 8;

    while(svg.querySelector('polyline')) svg.querySelector('polyline').remove();
    while(svg.querySelectorAll('.data-label').length){
        svg.querySelectorAll('.data-label').forEach(el=>el.remove());
    }

    const maxML = Math.max(...mlPorDia, 1);
    const pontos = mlPorDia.map((v,i)=>{
        const x = i*(width/6);
        const y = height-marginBottom-(v/maxML*(height-marginBottom*2));
        return [x,y];
    });

    const pointsStr = pontos.map(p=>p.join(',')).join(' ');
    const polyline = document.createElementNS("http://www.w3.org/2000/svg","polyline");
    polyline.setAttribute("fill","none");
    polyline.setAttribute("stroke","#0b63d6");
    polyline.setAttribute("stroke-width","1.6");
    polyline.setAttribute("points",pointsStr);
    svg.appendChild(polyline);

    pontos.forEach((p,i)=>{
        const text = document.createElementNS("http://www.w3.org/2000/svg","text");
        text.classList.add('data-label');
        text.setAttribute('x',p[0]);
        text.setAttribute('y',p[1]-3);
        text.setAttribute('font-size','3');
        text.setAttribute('fill','#0b2340');
        text.setAttribute('text-anchor','middle');
        text.textContent = mlPorDia[i].toFixed(0);
        svg.appendChild(text);
    });
}

function atualizarRanking(dados){
    // Agrupamento por Encarregado
    let ranking = {};
    dados.forEach(row=>{
        const nome = row['Encarregado Responsavel'] || 'Sem Nome';
        const ml = parseNumber(row['ML Montados']);
        const meta = parseNumber(row['ML PREVISTO']);
        const stdReal = parseNumber(row['STD Montado']);
        const stdPadrao = 0.22;

        if(!ranking[nome]) ranking[nome]={mlTotal:0, metaTotal:0, stdReal:0, stdPadrao:0};
        ranking[nome].mlTotal += ml;
        ranking[nome].metaTotal += meta;
        ranking[nome].stdReal += stdReal;
        ranking[nome].stdPadrao = stdPadrao;
    });

    // Calcular % meta atingida e performance
    let rankingArray = Object.entries(ranking).map(([nome, val])=>{
        let percMeta = val.metaTotal>0 ? (val.mlTotal/val.metaTotal)*100 : 0;
        let desempenho = val.stdReal <= val.stdPadrao ? 1 : -1; // Verde se <= padrão
        return {nome, percMeta, desempenho};
    });

    rankingArray.sort((a,b)=>b.percMeta-a.percMeta);
    rankingArray = rankingArray.slice(0,5);

    const tbodyRanking = document.getElementById('rankingProd');
    tbodyRanking.innerHTML = '';
    rankingArray.forEach(r=>{
        const icon = r.desempenho>0 ? '⬆️' : '⬇️';
        const color = r.desempenho>0 ? 'green' : 'red';
        tbodyRanking.innerHTML += `<tr>
            <td>${r.nome}</td>
            <td>${r.percMeta.toFixed(0)}%</td>
            <td class="indicator" style="color:${color}; text-align:center">${icon}</td>
        </tr>`;
    });
}

// CSV Import
document.getElementById('fileInput').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;

    Papa.parse(file,{
        header:true,
        skipEmptyLines:true,
        complete:function(results){
            dadosCSV = results.data;
            dadosAnteriores = [...dadosCSV]; // cópia para comparação ranking
            atualizarDashboard(dadosCSV);
        }
    });
});

// Filtro de datas
document.getElementById('dataInicio').addEventListener('change', aplicarFiltro);
document.getElementById('dataFim').addEventListener('change', aplicarFiltro);

function aplicarFiltro(){
    const dtInicio = document.getElementById('dataInicio').value;
    const dtFim = document.getElementById('dataFim').value;
    const filtrados = filtrarDadosPorData(dadosCSV, dtInicio, dtFim);
    atualizarDashboard(filtrados);
}
