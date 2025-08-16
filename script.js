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

function diaSemanaIndex(diaJS){
    if(diaJS === 0) return 6; else return diaJS-1;
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

function atualizarDashboard(dados){
    const diasSet = new Set();
    let somaHH=0, somaML=0, somaMont=0, somaMLPrevisto=0;
    let mlPorDia = Array(7).fill(0);
    let rankingMap = {};

    dados.forEach(row=>{
        const hhRow = parseNumber(row['HH Total']);
        const mlRow = parseNumber(row['ML Montados']);
        const montRow = parseNumber(row['Mont.Presente']);
        const mlPrevistoRow = parseNumber(row['ML PREVISTO']);
        somaHH += hhRow;
        somaML += mlRow;
        somaMont += montRow;
        somaMLPrevisto += mlPrevistoRow;
        if(row['Data']) diasSet.add(row['Data'].trim());

        // Tendência
        if(row['Data']){
            const dataObj = parseDateBR(row['Data']);
            if(dataObj && !isNaN(dataObj)) mlPorDia[diaSemanaIndex(dataObj.getDay())] += mlRow;
        }

        // Ranking
        const enc = row['Encarregado Responsavel']?.trim();
        if(enc){
            if(!rankingMap[enc]) rankingMap[enc] = {ml:0, mlPrevisto:0, stdAcumulado:0, qtd:0};
            rankingMap[enc].ml += mlRow;
            rankingMap[enc].mlPrevisto += mlPrevistoRow;
            rankingMap[enc].stdAcumulado += parseNumber(row['STD Montado']);
            rankingMap[enc].qtd++;
        }
    });

    // Atualiza cards linha 1
    document.getElementById('hhTotal').textContent = somaHH.toFixed(1);
    document.getElementById('mlMontados').textContent = somaML.toFixed(0)+' m';
    document.getElementById('montPresente').textContent = (diasSet.size>0? (somaMont/diasSet.size).toFixed(1) : 0);
    document.getElementById('stdSemanal').textContent = (somaML>0?(somaHH/somaML).toFixed(2):0);
    document.getElementById('metaAtingida').textContent = (somaMLPrevisto>0?(somaML/somaMLPrevisto*100).toFixed(0):0)+'%';

    // Ranking Top 5
    let rankingArr = Object.entries(rankingMap)
        .map(([enc, val])=>{
            const pctMeta = val.mlPrevisto>0 ? (val.ml/val.mlPrevisto*100):0;
            const stdMedio = val.qtd>0 ? (val.stdAcumulado/val.qtd) : 0;
            return {enc,pctMeta,stdMedio};
        })
        .filter(r=>r.pctMeta>0)
        .sort((a,b)=>b.pctMeta-a.pctMeta)
        .slice(0,5);

    const tbodyRank = document.querySelector('#rankingTable tbody');
    tbodyRank.innerHTML='';
    if(rankingArr.length===0){
        tbodyRank.innerHTML='<tr><td colspan="3" style="text-align:center;color:#475569">Sem dados</td></tr>';
    } else {
        rankingArr.forEach(r=>{
            const trend = r.stdMedio>0.22 ? '▲' : '▼';
            const color = r.stdMedio>0.22 ? 'green' : 'crimson';
            tbodyRank.innerHTML+=`<tr>
                <td>${r.enc}</td>
                <td>${r.pctMeta.toFixed(0)}%</td>
                <td style="color:${color};font-weight:700">${trend}</td>
            </tr>`;
        });
    }

    // Atualiza gráfico de linha
    const svg = document.getElementById('graficoLinha');
    svg.querySelectorAll('circle, line, text.valueLabel').forEach(n=>n.remove());
    const maxML = Math.max(...mlPorDia,1);
    mlPorDia.forEach((ml, i)=>{
        const x = i*16.66;
        const y = 35 - (ml/maxML*30);
        const c = document.createElementNS("http://www.w3.org/2000/svg",'circle');
        c.setAttribute('cx',x);
        c.setAttribute('cy',y);
        c.setAttribute('r',1.5);
        c.setAttribute('fill','#0b63d6');
        svg.appendChild(c);

        // Label de valor
        const t = document.createElementNS("http://www.w3.org/2000/svg",'text');
        t.setAttribute('x',x);
        t.setAttribute('y',y-1.5);
        t.setAttribute('class','valueLabel');
        t.setAttribute('font-size','3');
        t.setAttribute('text-anchor','middle');
        t.setAttribute('fill','#0b2340');
        t.textContent = ml.toFixed(0);
        svg.appendChild(t);

        if(i>0){
            const line = document.createElementNS("http://www.w3.org/2000/svg",'line');
            line.setAttribute('x1',(i-1)*16.66);
            line.setAttribute('y1',35-(mlPorDia[i-1]/maxML*30));
            line.setAttribute('x2',x);
            line.setAttribute('y2',y);
            line.setAttribute('stroke','#0b63d6');
            line.setAttribute('stroke-width',0.7);
            svg.appendChild(line);
        }
    });

    // Atualiza tabela de amostra CSV
    const tbody = document.getElementById('tabelaDados');
    tbody.innerHTML='';
    if(dados.length===0){
        tbody.innerHTML='<tr><td colspan="10" style="text-align:center; color: var(--gray);">Sem dados</td></tr>';
    } else {
        dados.forEach(r=>{
            tbody.innerHTML+=`<tr>
                <td>${r['Semanas']||''}</td>
                <td>${r['OS']||''}</td>
                <td>${r['Matricula']||''}</td>
                <td>${r['Encarregado Responsavel']||''}</td>
                <td>${r['ÁREA']||''}</td>
                <td>${r['Mont.Presente']||''}</td>
                <td>${r['HH Total']||''}</td>
                <td>${r['ML Montados']||''}</td>
                <td>${r['STD Montado']||''}</td>
                <td>${r['Data']||''}</td>
            </tr>`;
        });
    }
}

// Eventos
document.getElementById('fileInput').addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;
    Papa.parse(file, {header:true, skipEmptyLines:true, complete:function(results){
        dadosCSV = results.data;
        atualizarDashboard(dadosCSV);
    }});
});

document.getElementById('btnApplyFilter').addEventListener('click', function(){
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const dadosFiltrados = filtrarDadosPorData(dadosCSV, dataInicio, dataFim);
    atualizarDashboard(dadosFiltrados);
});
