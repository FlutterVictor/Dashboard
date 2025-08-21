let dadosNoturno = [];

/* =========================
   Parsing e utilitários
========================= */
function parseNumber(str){
    if (str === null || str === undefined) return 0;
    const num = parseFloat(String(str).trim().replace(',', '.'));
    return isNaN(num) ? 0 : num;
}

function parseDateBR(str){
    if(!str) return null;
    const s = String(str).trim();
    let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
        let [ , d, mo, y ] = m;
        if (y.length === 2) y = (y > '50' ? '19' : '20') + y;
        const dt = new Date(+y, +mo - 1, +d);
        return isValidDate(dt, +d, +mo, +y) ? dt : null;
    }
    m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m) {
        const [ , y, mo, d ] = m;
        const dt = new Date(+y, +mo - 1, +d);
        return isValidDate(dt, +d, +mo, +y) ? dt : null;
    }
    return null;
}

function isValidDate(dt, d, m, y){
    return dt instanceof Date &&
           !isNaN(dt.getTime()) &&
           dt.getFullYear() === y &&
           dt.getMonth() === (m - 1) &&
           dt.getDate() === d;
}

/* =========================
   Filtro de datas
========================= */
function filtrarNoturno(dataInicio, dataFim){
    const dtInicio = dataInicio ? new Date(dataInicio) : null;
    const dtFim    = dataFim ? new Date(dataFim) : null;
    return dadosNoturno.filter(row => {
        const dt = parseDateBR(row['Data']);
        if(!dt) return false;
        if(dtInicio && dt < dtInicio) return false;
        if(dtFim && dt > dtFim) return false;
        return true;
    });
}

/* =========================
   Atualizar Dashboard
========================= */
function atualizarNoturno(dados){
    if(!dados || dados.length === 0){
        document.getElementById('cardInfo').innerHTML = 'Sem dados';
        document.getElementById('cardSTD').innerHTML = 'Sem dados';
        document.getElementById('cardInterferencia').innerHTML = 'Sem dados';
        document.getElementById('tabelaAtividades').innerHTML = '<tr><td colspan="5">Sem dados</td></tr>';
        atualizarGraficoVelocimetro(0,0);
        atualizarGraficoBarras(0,0,0,0);
        return;
    }

    // Resumir dados do turno
    const supervisor = dados[0]['Supervisor'];
    const encarregado = dados[0]['Encarregado'];
    const local = dados[0]['Local'];
    const montadores = parseNumber(dados[0]['Montadores']);
    const faltas = parseNumber(dados[0]['Faltas']);
    const art = dados[0]['ART'];
    const data = dados[0]['Data'];
    const turno = dados[0]['Turno'];
    const hhPrevisto = montadores * 8.8;
    const hhReal = parseNumber(dados[0]['HH Real']);
    const mlPrevisto = parseNumber(dados[0]['ML Previsto']);
    const mlReal = parseNumber(dados[0]['ML Montado']);
    const stdPrevisto = (hhPrevisto / mlPrevisto).toFixed(2);
    const stdReal = (hhReal / mlReal).toFixed(2);
    const disciplina = dados[0]['Disciplina atendida'];
    const resumo = dados[0]['Resumo'];

    // Calcular horas de interferência
    const totalInterferencia = dados.reduce((acc,row)=>{
        const hi = parseNumber(row['Hora inicio interferencia']);
        const hf = parseNumber(row['Hora fim interferencia']);
        return acc + (hf - hi);
    },0);

    // Atualizar Cards
    document.getElementById('cardInfo').innerHTML = `
        <p><b>Supervisor:</b> ${supervisor}</p>
        <p><b>Encarregado:</b> ${encarregado}</p>
        <p><b>Local:</b> ${local}</p>
        <p><b>Montadores:</b> ${montadores}</p>
        <p><b>Faltas:</b> ${faltas}</p>
        <p><b>ART:</b> ${art}</p>
        <p><b>HH Previsto:</b> ${hhPrevisto}</p>
        <p><b>HH Real:</b> ${hhReal}</p>
        <p><b>Data:</b> ${data}</p>
        <p><b>Turno:</b> ${turno}</p>
    `;

    document.getElementById('cardSTD').innerHTML = `
        <p><b>STD Previsto:</b> ${stdPrevisto}</p>
        <p><b>STD Real:</b> ${stdReal}</p>
        <p><b>ML Previsto:</b> ${mlPrevisto}</p>
        <p><b>ML Montado:</b> ${mlReal}</p>
        <p><b>Disciplina:</b> ${disciplina}</p>
    `;

    document.getElementById('cardInterferencia').innerHTML = `
        <p><b>Total de interferência:</b> ${totalInterferencia.toFixed(2)} horas</p>
    `;

    // Tabela de atividades
    const tbody = document.getElementById('tabelaAtividades');
    tbody.innerHTML = '';
    dados.forEach(row=>{
        const hi = parseNumber(row['Hora inicio interferencia']);
        const hf = parseNumber(row['Hora fim interferencia']);
        const dur = (hf - hi).toFixed(2);
        const tr = `<tr>
            <td>${row['Atividade']}</td>
            <td>${hi}</td>
            <td>${hf}</td>
            <td>${dur}</td>
            <td>${row['Observação']||''}</td>
        </tr>`;
        tbody.innerHTML += tr;
    });

    // Gráficos
    atualizarGraficoVelocimetro(mlPrevisto, mlReal);
    atualizarGraficoBarras(hhPrevisto, hhReal, mlPrevisto, mlReal);

    // Resumo
    document.getElementById('resumoTurno').textContent = resumo;

    // Fotos
    const containerFotos = document.getElementById('fotosContainer');
    containerFotos.innerHTML = '';
    dados[0]['Fotos']?.forEach((src,i)=>{
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Foto ${i+1}`;
        img.classList.add('foto-turno');
        containerFotos.appendChild(img);
    });
}

/* =========================
   Gráfico Velocímetro
========================= */
function atualizarGraficoVelocimetro(prev, real){
    const canvas = document.getElementById('gaugeCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0,0,width,height);

    const percent = Math.min(real / prev,1);
    const radius = width/2 - 20;
    const center = {x: width/2, y: height/2};

    // Fundo cinza
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, Math.PI, 0, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();

    // Arco real
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, Math.PI, Math.PI + Math.PI*percent, false);
    ctx.strokeStyle = '#0b63d6';
    ctx.stroke();

    // Texto
    ctx.font = '14px Arial';
    ctx.fillStyle = '#0b2340';
    ctx.textAlign = 'center';
    ctx.fillText(`${real} / ${prev} ML`, center.x, center.y + 5);
}

/* =========================
   Gráfico Barras
========================= */
function atualizarGraficoBarras(hhPrev, hhReal, mlPrev, mlReal){
    const canvas = document.getElementById('barCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const data = [
        {name:'HH', Prev: hhPrev, Real: hhReal},
        {name:'ML', Prev: mlPrev, Real: mlReal}
    ];

    const padding = 40;
    const barWidth = 30;
    const maxVal = Math.max(hhPrev, hhReal, mlPrev, mlReal);

    data.forEach((d,i)=>{
        const x = padding + i*100;
        const ph = (d.Prev/maxVal)*(canvas.height-padding*2);
        const rh = (d.Real/maxVal)*(canvas.height-padding*2);

        // Previsto
        ctx.fillStyle = '#0b63d6';
        ctx.fillRect(x, canvas.height-padding-ph, barWidth, ph);
        ctx.fillStyle = '#0b2340';
        ctx.font = '12px Arial';
        ctx.fillText(d.Prev, x + barWidth/2, canvas.height-padding-ph-5);

        // Real
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x+barWidth+5, canvas.height-padding-rh, barWidth, rh);
        ctx.fillStyle = '#0b2340';
        ctx.fillText(d.Real, x+barWidth+5 + barWidth/2, canvas.height-padding-rh-5);

        // Rótulo
        ctx.fillStyle = '#0b2340';
        ctx.fillText(d.name, x+barWidth/2, canvas.height-10);
    });
}

/* =========================
   Inicialização
========================= */
document.addEventListener('DOMContentLoaded',()=>{
    fetch('noturno_data.json')
        .then(r=>r.json())
        .then(json=>{
            dadosNoturno = json;
            atualizarNoturno(filtrarNoturno());
        });

    // Filtro datas
    document.getElementById('filtroDataInicio').addEventListener('change',()=>{
        atualizarNoturno(filtrarNoturno(
            document.getElementById('filtroDataInicio').value,
            document.getElementById('filtroDataFim').value
        ));
    });
    document.getElementById('filtroDataFim').addEventListener('change',()=>{
        atualizarNoturno(filtrarNoturno(
            document.getElementById('filtroDataInicio').value,
            document.getElementById('filtroDataFim').value
        ));
    });
});
