let dadosCSV = [];

// Funções auxiliares
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

// Filtrar dados por data
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

// Atualizar dashboard
function atualizarDashboard(dados){
    const diasSet = new Set();
    let somaHH = 0, somaML = 0, somaMont = 0, somaMLPrevisto = 0;

    let mlPorDia = Array(7).fill(0);
    let areas = { 'Estrutura': {ml:0, hh:0}, 'Elétrica': {ml:0, hh:0}, 'Pintura': {ml:0, hh:0}, 'Mecânica': {ml:0, hh:0} };
    let rankingMap = {};

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
        if(areas[area]) { areas[area].ml += mlRow; areas[area].hh += hhRow; }

        // Ranking por Encarregado
        const nome = row['Encarregado Responsavel'] ? row['Encarregado Responsavel'].trim() : '';
        if(nome){
            if(!rankingMap[nome]) rankingMap[nome] = {ml:0, meta:0, stdReal:0, stdPadrao:0, dias:0, prevML:0};
            rankingMap[nome].ml += mlRow;
            rankingMap[nome].meta += mlPrevistoRow;
            rankingMap[nome].stdReal += hhRow / (mlRow || 1);
            rankingMap[nome].stdPadrao += 0.22;
            rankingMap[nome].dias++;
        }
    });

    // Atualiza KPIs
    document.getElementById('hhTotal').textContent = somaHH.toFixed(1);
    document.getElementById('mlMontados').textContent = somaML.toFixed(0) + ' m';
    document.getElementById('montPresente').textContent = (diasSet.size ? somaMont/diasSet.size : 0).toFixed(1);
    document.getElementById('stdSemanal').textContent = (somaML ? (somaHH/somaML) : 0).toFixed(2);

    document.getElementById('prodMedia').textContent = (diasSet.size ? somaML/(somaMont/diasSet.size) : 0).toFixed(0) + ' m';
    document.getElementById('metaAtingida').textContent = (somaMLPrevisto ? (somaML/somaMLPrevisto*100) : 0).toFixed(0) + '%';
    document.getElementById('desvioSTD').textContent = ((somaML ? (somaHH/somaML) : 0) - 0.22).toFixed(2);

    // Atualiza tabela de amostra
    const tbodyDados = document.getElementById('tabelaDados');
    tbodyDados.innerHTML = '';
    if(dados.length === 0){
        tbodyDados.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--gray)">Sem dados para o filtro</td></tr>`;
    } else {
        dados.slice(0,5).forEach(row => {
            tbodyDados.innerHTML += `<tr>
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
    }

    // Atualiza label período
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    let labelSemana = 'Período completo';
    if(dataInicio || dataFim){
        labelSemana = 'Período: ';
        if(dataInicio) labelSemana += dataInicio;
        if(dataFim) labelSemana += ' a ' + dataFim;
    }
    document.getElementById('semanaLabel').textContent = labelSemana;

    atualizarGraficoLinha(mlPorDia);
    atualizarRanking(rankingMap);
}

// Atualiza gráfico de linhas
function atualizarGraficoLinha(mlPorDia){
    const svg = document.getElementById('graficoLinha');
    const width = 100;
    const height = 35;
    const marginBottom = 8;

    while(svg.querySelector('polyline')) svg.querySelector('polyline').remove();
    while(svg.querySelectorAll('.data-label').length) svg.querySelectorAll('.data-label').forEach(el => el.remove());

    const maxML = Math.max(...mlPorDia,1);
    const pontos = mlPorDia.map((v,i)=>{
        const x = i*(width/6);
        const y = height - marginBottom - (v/maxML*(height - marginBottom*2));
        return [x,y];
    });

    const pointsStr = pontos.map(p=>p.join(',')).join(' ');
    const polyline = document.createElementNS("http://www.w3.org/2000/svg","polyline");
    polyline.setAttribute("fill","none");
    polyline.setAttribute("stroke","#0b63d6");
    polyline.setAttribute("stroke-width","1.6");
    polyline.setAttribute("points",pointsStr);
    svg.appendChild(polyline);

    // Labels
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

// Atualiza ranking Top 5
function atualizarRanking(rankingMap){
    const rankingArray = Object.entries(rankingMap).map(([nome,val])=>{
        const percMeta = val.meta ? (val.ml/val.meta*100) : 0;
        const stdReal = val.dias ? (val.stdReal/val.dias) : 0;
        const indicador = stdReal <= 0.22 ? '▲' : '▼';
        const cor = stdReal <= 0.22 ? 'trend-up' : 'trend-down';
        return {nome, percMeta, indicador, cor};
    });
    rankingArray.sort((a,b)=>b.percMeta - a.percMeta);
    const top5 = rankingArray.slice(0,5);

    const tbody = document.querySelector('#rankingTable tbody');
    tbody.innerHTML = '';
    if(top5.length===0){
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--gray)">Sem dados</td></tr>`;
    } else {
        top5.forEach(item=>{
            tbody.innerHTML += `<tr>
                <td>${item.nome}</td>
                <td>${item.percMeta.toFixed(0)}%</td>
                <td class="${item.cor}" style="text-align:center">${item.indicador}</td>
            </tr>`;
        });
    }
}

// Carregar CSV
document.getElementById('csvFile').addEventListener('change',function(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
        const text = ev.target.result;
        const linhas = text.split('\n').filter(l=>l.trim());
        const headers = linhas[0].split(';');
        dadosCSV = linhas.slice(1).map(l=>{
            const cols = l.split(';');
            const obj = {};
            headers.forEach((h,i)=> obj[h.trim()] = cols[i]?cols[i].trim(): '');
            return obj;
        });
        atualizarDashboard(dadosCSV);
    }
    reader.readAsText(file, 'ISO-8859-1');
});

// Filtros
document.getElementById('btnApplyFilter').addEventListener('click',()=>{
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const filtrado = filtrarDadosPorData(dadosCSV,dataInicio,dataFim);
    atualizarDashboard(filtrado);
});
