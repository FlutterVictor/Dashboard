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
    let somaHH = 0;
    let somaML = 0;
    let somaMont = 0;
    let somaMLPrevisto = 0;

    let mlPorDia = Array(7).fill(0);
    let areas = {
        'Estrutura': {ml:0, hh:0},
        'Elétrica': {ml:0, hh:0},
        'Pintura': {ml:0, hh:0},
        'Mecânica': {ml:0, hh:0},
    };

    dados.forEach(row => {
        const hhRow = parseNumber(row['HH Total']);
        const mlRow = parseNumber(row['ML Montados']);
        const montRow = parseNumber(row['Mont.Presente']);
        const mlPrevistoRow = parseNumber(row['ML PREVISTO']);

        somaHH += hhRow;
        somaML += mlRow;
        somaMont += montRow;
        somaMLPrevisto += mlPrevistoRow;
        if (row['Data']) diasSet.add(row['Data'].trim());

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

    const mediaMont = diasSet.size > 0 ? somaMont / diasSet.size : 0;
    const stdSemanalCalc = somaML > 0 ? (somaHH / somaML) : 0;
    const tbodyAreas = document.getElementById('tabelaAreas');
    tbodyAreas.innerHTML = '';
    Object.entries(areas).forEach(([area, vals]) => {
        let stdArea = vals.hh > 0 ? (vals.ml / vals.hh) : 0;
        tbodyAreas.innerHTML += `<tr>
            <td>${area}</td>
            <td>${vals.ml.toFixed(0)}</td>
            <td>${stdArea.toFixed(2)}</td>
        </tr>`;
    });

    document.getElementById('hhTotal').textContent = somaHH.toFixed(1);
    document.getElementById('mlMontados').textContent = somaML.toFixed(0) + ' m';
    document.getElementById('montPresente').textContent = mediaMont.toFixed(1);
    document.getElementById('stdSemanal').textContent = stdSemanalCalc.toFixed(2);

    const prodMedia = mediaMont > 0 ? (somaML / mediaMont) : 0;
    document.getElementById('prodMedia').textContent = prodMedia.toFixed(0) + ' m';

    const atingMeta = somaMLPrevisto > 0 ? (somaML / somaMLPrevisto) * 100 : 0;
    document.getElementById('metaAtingida').textContent = atingMeta.toFixed(0) + '%';

    const desvio = stdSemanalCalc - 0.22;
    document.getElementById('desvioSTD').textContent = desvio.toFixed(2);

    const tbodyDados = document.getElementById('tabelaDados');
    tbodyDados.innerHTML = '';
    if(dados.length === 0){
        tbodyDados.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--gray);">Sem dados para o filtro selecionado</td></tr>`;
    } else {
        dados.slice(0, 5).forEach(row => {
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
}

function atualizarGraficoLinha(mlPorDia) {
    const svg = document.getElementById('graficoLinha');
    const width = 100;
    const height = 35;
    const marginBottom = 8;

    while(svg.querySelector('polyline')) svg.querySelector('polyline').remove();
    while(svg.querySelectorAll('.data-label').length){
        svg.querySelectorAll('.data-label').forEach(el => el.remove());
    }

    const maxML = Math.max(...mlPorDia, 1);
    const pontos = mlPorDia.map((v,i) => {
        const x = i * (width/6);
        const y = height - marginBottom - (v / maxML * (height - marginBottom * 2));
        return [x, y];
    });

    const pointsStr = pontos.map(p => p.join(',')).join(' ');

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#0b63d6");
    polyline.setAttribute("stroke-width", "1.6");
    polyline.setAttribute("points", pointsStr);
    svg.appendChild(polyline);

    pontos.forEach((p, i) => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.classList.add('data-label');
        text.setAttribute('x', p[0]);
        text.setAttribute('y', p[1] - 3);
        text.setAttribute('font-size', '3');
        text.setAttribute('fill', '#0b2340');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = mlPorDia[i].toFixed(0);
        svg.appendChild(text);
    });
}

document.getElementById('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            dadosCSV = results.data;
            aplicarFiltro();
        },
        error: function(err){
            alert('Erro ao ler o arquivo: ' + err);
        }
    });
});

function aplicarFiltro(){
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const dadosFiltrados = filtrarDadosPorData(dadosCSV, dataInicio, dataFim);
    atualizarDashboard(dadosFiltrados);
}

document.getElementById('btnApplyFilter').addEventListener('click', aplicarFiltro);

// PDF export
document.getElementById('btnExportPDF').addEventListener('click', () => {
    const dashboardWrap = document.getElementById('dashboardWrap');
    html2canvas(dashboardWrap, {scale: 2}).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'a4'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save('dashboard-std-andaime.pdf');
    });
});
