let dadosCSV = [];

// Converte string em número, tratando vírgulas
function parseNumber(str) {
    if (!str) return 0;
    str = str.toString().trim().replace(',', '.');
    let num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Converte string no formato BR para Date
function parseDateBR(str) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    return new Date(+y, m - 1, +d);
}

// Ajusta índice do dia da semana (Seg=0, Dom=6)
function diaSemanaIndex(diaJS) {
    return diaJS === 0 ? 6 : diaJS - 1;
}

// Filtra dados por data
function filtrarDadosPorData(dados, dataInicio, dataFim) {
    if (!dataInicio && !dataFim) return dados;
    let dtInicio = dataInicio ? new Date(dataInicio) : null;
    let dtFim = dataFim ? new Date(dataFim) : null;
    return dados.filter(row => {
        if (!row['Data']) return false;
        let dataRow = parseDateBR(row['Data']);
        if (!dataRow) return false;
        if (dtInicio && dataRow < dtInicio) return false;
        if (dtFim && dataRow > dtFim) return false;
        return true;
    });
}

// Atualiza todos os KPIs, ranking, gráfico e tabela
function atualizarDashboard(dados, dataInicio = null, dataFim = null) {
    if (!dados || dados.length === 0) {
        document.getElementById('hhTotal').textContent = '0';
        document.getElementById('mlMontados').textContent = '0 m';
        document.getElementById('montPresente').textContent = '0';
        document.getElementById('stdSemanal').textContent = '0,00';
        document.getElementById('metaAtingida').textContent = '0%';
        document.getElementById('rankingTable').querySelector('tbody').innerHTML = '<tr><td colspan="3" style="text-align:center;color:gray;">Sem dados</td></tr>';
        document.getElementById('tabelaDados').innerHTML = '<tr><td colspan="10" style="text-align:center;color:gray;">Sem dados</td></tr>';
        atualizarGraficoLinha(Array(7).fill(0), []);
        return;
    }

    let somaHH = 0, somaML = 0, somaMLPrevisto = 0;
    let mlPorDia = Array(7).fill(0);
    let ranking = {};
    let montadoresSet = new Set();

    dados.forEach(row => {
        const hh = parseNumber(row['HH Total']);
        const ml = parseNumber(row['ML Montados']);
        const mlPrev = parseNumber(row['ML PREVISTO']);
        const mont = parseNumber(row['Mont.Presente']);

        somaHH += hh;
        somaML += ml;
        somaMLPrevisto += mlPrev;

        // Média de ML por dia
        if (row['Data']) {
            const ds = diaSemanaIndex(parseDateBR(row['Data']).getDay());
            mlPorDia[ds] += ml;
        }

        const nome = row['Encarregado Responsavel'] ? row['Encarregado Responsavel'].trim() : '';
        if (nome) {
            montadoresSet.add(nome);
            if (!ranking[nome]) ranking[nome] = { ml: 0, mlPrev: 0, hh: 0 };
            ranking[nome].ml += ml;
            ranking[nome].mlPrev += mlPrev;
            ranking[nome].hh += hh;
        }
    });

    // HH Total
    document.getElementById('hhTotal').textContent = somaHH.toFixed(1);

    // ML Montados
    document.getElementById('mlMontados').textContent = somaML.toFixed(0) + ' m';

    // ML por Montador
    let diasSelecionados = 0;
    if (dataInicio && dataFim) {
        const dtInicio = new Date(dataInicio);
        const dtFim = new Date(dataFim);
        diasSelecionados = Math.round((dtFim - dtInicio) / (1000 * 60 * 60 * 24)) + 1;
    } else {
        diasSelecionados = dados.length; // assume quantidade de registros como dias
    }

    let mlPorMontador;
    if (diasSelecionados === 1) {
        mlPorMontador = somaML / montadoresSet.size;
        if (mlPorMontador > 60) mlPorMontador = 60;
    } else {
        mlPorMontador = somaML / montadoresSet.size;
    }
    document.getElementById('montPresente').textContent = mlPorMontador.toFixed(1);

    // STD Semanal
    const std = somaML > 0 ? somaHH / somaML : 0;
    document.getElementById('stdSemanal').textContent = std.toFixed(2);

    // % Meta Atingida
    const meta = somaMLPrevisto > 0 ? somaML / somaMLPrevisto * 100 : 0;
    document.getElementById('metaAtingida').textContent = meta.toFixed(0) + '%';

    // Ranking Top 5
    const rankingArr = Object.entries(ranking).map(([nome, val]) => {
        const pctMeta = val.mlPrev > 0 ? val.ml / val.mlPrev * 100 : 0;
        const stdReal = val.ml > 0 ? val.hh / val.ml : 0;
        const indicador = stdReal <= 0.22 ? '↑' : '↓';
        return { nome, pctMeta, indicador };
    }).sort((a, b) => b.pctMeta - a.pctMeta).slice(0, 5);

    const tbodyRanking = document.getElementById('rankingTable').querySelector('tbody');
    tbodyRanking.innerHTML = '';
    rankingArr.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${r.nome}</td><td>${r.pctMeta.toFixed(0)}%</td><td class="${r.indicador==='↑'?'ind-up':'ind-down'}">${r.indicador}</td>`;
        tbodyRanking.appendChild(row);
    });
    if (rankingArr.length === 0) tbodyRanking.innerHTML = '<tr><td colspan="3" style="text-align:center;color:gray;">Sem dados</td></tr>';

    // Tabela de dados (amostra)
    const tbodyDados = document.getElementById('tabelaDados');
    tbodyDados.innerHTML = '';
    dados.slice(0, 5).forEach(row => {
        tbodyDados.innerHTML += `<tr>
            <td>${row['Semanas'] || ''}</td>
            <td>${row['OS'] || ''}</td>
            <td>${row['Matricula'] || ''}</td>
            <td>${row['Encarregado Responsavel'] || ''}</td>
            <td>${row['ÁREA'] || ''}</td>
            <td>${parseNumber(row['Mont.Presente']) || ''}</td>
            <td>${parseNumber(row['HH Total']).toFixed(1)}</td>
            <td>${parseNumber(row['ML Montados']).toFixed(0)}</td>
            <td>${parseNumber(row['STD Montado']).toFixed(2)}</td>
            <td>${row['Data'] || ''}</td>
        </tr>`;
    });

    // Atualiza gráfico com dias da semana
    const datas = dados.map(row => row['Data'] || '');
    atualizarGraficoLinha(mlPorDia, datas);
}

// Atualiza gráfico de linha com rótulos de dados e dias (ou datas)
function atualizarGraficoLinha(mlPorDia, datas = []) {
    const svg = document.getElementById('graficoLinha');
    while (svg.querySelector('polyline')) svg.querySelector('polyline').remove();
    while (svg.querySelectorAll('.data-label').length) svg.querySelectorAll('.data-label').forEach(el => el.remove());
    while (svg.querySelectorAll('.dia-label').length) svg.querySelectorAll('.dia-label').forEach(el => el.remove());

    const width = 100, height = 35, marginBottom = 8;
    const maxML = Math.max(...mlPorDia, 1);
    const pontos = mlPorDia.map((v, i) => {
        const x = i * (width / 6);
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

    // Rótulos de dados
    pontos.forEach((p, i) => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.classList.add('data-label');
        text.setAttribute('x', p[0]);
        text.setAttribute('y', p[1] - 2);
        text.setAttribute('font-size', '2.5'); // menor para caber no card
        text.setAttribute('fill', '#0b2340');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = mlPorDia[i].toFixed(0);
        svg.appendChild(text);
    });

    // Rótulos de dias ou datas
    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    pontos.forEach((p, i) => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.classList.add('dia-label');
        text.setAttribute('x', p[0]);
        text.setAttribute('y', height + 4);
        text.setAttribute('font-size', '3');
        text.setAttribute('fill', '#0b2340');
        text.setAttribute('text-anchor', 'middle');
        // Se datas fornecidas, usar datas, senão dias da semana
        text.textContent = datas[i] || dias[i];
        svg.appendChild(text);
    });
}

// Evento de importação de CSV
document.getElementById('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
            dadosCSV = results.data;
            aplicarFiltro(true);
        },
        error: err => alert('Erro ao ler o arquivo: ' + err)
    });
});

// Aplica filtro de datas
function aplicarFiltro(importCSV = false) {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const dadosFiltrados = filtrarDadosPorData(dadosCSV, dataInicio, dataFim);
    atualizarDashboard(dadosFiltrados, dataInicio, dataFim);

    // Se importCSV e nenhum filtro, exibe todos os dados
    if (importCSV && !dataInicio && !dataFim) {
        atualizarDashboard(dadosCSV);
    }
}

document.getElementById('btnApplyFilter').addEventListener('click', aplicarFiltro);

// Exportar PDF
document.getElementById('btnExportPDF').addEventListener('click', () => {
    const dashboardWrap = document.getElementById('dashboardWrap');
    html2canvas(dashboardWrap, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save('dashboard.pdf');
    });
});

// Atualiza automaticamente ao carregar todos os dados
window.addEventListener('load', () => {
    if (dadosCSV.length > 0) atualizarDashboard(dadosCSV);
});
