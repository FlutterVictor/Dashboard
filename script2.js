let dadosCSV = [];

// Coordenadas fixas dos setores
const setores = [
    {nome:'Canteiro de Obras', lat:-19.4848081040112, lng:-42.528268838465145},
    {nome:'Prédio GAD', lat:-19.485730911089373, lng:-42.527222305029305}
];

// Inicializa mapa
const map = L.map('map').setView([-19.485, -42.528], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; OpenStreetMap contributors'
}).addTo(map);

// Marcadores dos setores
let markers = [];
setores.forEach(s=>{
    const marker = L.marker([s.lat,s.lng]).addTo(map)
        .bindPopup(`${s.nome}<br>Produtividade: carregando...`);
    markers.push(marker);
});

// Carrega CSV automaticamente
function carregarCSVPadrao(){
    fetch('STD_Geral.csv')
        .then(response => response.text())
        .then(csvText => {
            const resultados = Papa.parse(csvText, { header: true, skipEmptyLines:true });
            dadosCSV = resultados.data.filter(row => row['Data']); // ignora linhas incompletas
            aplicarFiltro();
        })
        .catch(err => alert('Erro ao carregar CSV: '+err));
}

// Função para filtrar por datas
function filtrarDadosPorData(dados, dataInicio, dataFim){
    if(!dataInicio && !dataFim) return dados;
    let dtInicio = dataInicio ? new Date(dataInicio) : null;
    let dtFim = dataFim ? new Date(dataFim) : null;
    return dados.filter(row=>{
        if(!row['Data']) return false;
        const parts=row['Data'].split('/');
        if(parts.length!==3) return false;
        const [d,m,y] = parts;
        const dataRow=new Date(+y, m-1, +d);
        if(dtInicio && dataRow<dtInicio) return false;
        if(dtFim && dataRow>dtFim) return false;
        return true;
    });
}

// Atualiza os cards
function atualizarCards(dados){
    // Produtividade Média (STD = HH/ML)
    let totalHH=0, totalML=0;
    dados.forEach(row=>{
        totalHH += parseFloat(row['HH Total'])||0;
        totalML += parseFloat(row['ML Montados'])||0;
    });
    const std = totalML>0 ? (totalHH/totalML).toFixed(2) : '0.00';
    document.getElementById('valorProdutividadeMedia').textContent = std;

    // Top Setores (para teste, apenas os nomes fixos)
    document.getElementById('valorTopSetores').textContent = setores.map(s=>s.nome).join(', ');
}

// Aplica filtro e atualiza dashboard
function aplicarFiltro(){
    const dataInicio=document.getElementById('dataInicio').value;
    const dataFim=document.getElementById('dataFim').value;
    const dadosFiltrados = filtrarDadosPorData(dadosCSV, dataInicio, dataFim);
    atualizarCards(dadosFiltrados);
}

// Eventos
document.getElementById('btnApplyFilter').addEventListener('click', aplicarFiltro);
document.getElementById('btnVoltar').addEventListener('click', ()=>{
    window.location.href='dashboard.html';
});

// Inicializa
window.addEventListener('load', carregarCSVPadrao);
