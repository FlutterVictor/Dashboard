let dadosCSV = [];

// Lista de setores com coordenadas
const setores = [
    {nome:'Canteiro de Obras', lat:-19.4848081040112, lng:-42.528268838465145},
    {nome:'Prédio GAD', lat:-19.485730911089373, lng:-42.527222305029305},
    {nome:'Cable Rack', lat:-19.485603334390927, lng:-42.528119978112144},
    {nome:'TT-05', lat:-19.485241866524284, lng:-42.52721328319023},
    {nome:'BFG Rua 32', lat:-19.486041347318533, lng:-42.53066413698842},
    {nome:'BFG Rua 29', lat:-19.485994569296004, lng:-42.52901314026494},
    {nome:'BFG Rua 31', lat:-19.484786841123945, lng:-42.52941461214152},
    {nome:'BFG Rua 30', lat:-19.483284654693485, lng:-42.52986270243735},
    {nome:'BFG Gasômetro', lat:-19.485755407678745, lng:-42.53671027885501}
];

// Inicializa mapa satélite
const map = L.map('map').setView([-19.485, -42.528], 17);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, NASA, USGS',
    maxZoom: 20
}).addTo(map);

// Função para gerar cor aleatória de produtividade
function corProdutividade(){
    const rnd = Math.random();
    if(rnd < 0.33) return 'red';       // improdutivo
    if(rnd < 0.66) return 'yellow';    // média
    return 'green';                     // produtivo
}

// Cria ícones coloridos
function criarIcone(cor){
    return L.icon({
        iconUrl: `https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=home|${cor}`,
        iconSize: [21, 34],
        iconAnchor: [10, 34],
        popupAnchor: [0, -28]
    });
}

// Adiciona marcadores com cores aleatórias
let markers = [];
setores.forEach(s=>{
    const cor = corProdutividade();
    const marker = L.marker([s.lat,s.lng], {icon: criarIcone(cor)})
        .addTo(map)
        .bindPopup(`${s.nome}<br>Produtividade: ${cor.toUpperCase()}`);
    markers.push(marker);
});

// Carrega CSV (simulação)
function carregarCSVPadrao(){
    fetch('STD_Geral.csv')
        .then(resp => resp.text())
        .then(texto => {
            const resultados = Papa.parse(texto, { header:true, skipEmptyLines:true });
            dadosCSV = resultados.data.filter(r=>r['Data']); // ignora linhas incompletas
            aplicarFiltro();
        })
        .catch(err => alert('Erro ao carregar CSV: '+err));
}

// Função de filtro
function filtrarDadosPorData(dados, dataInicio, dataFim){
    if(!dataInicio && !dataFim) return dados;
    const dtInicio = dataInicio?new Date(dataInicio):null;
    const dtFim = dataFim?new Date(dataFim):null;
    return dados.filter(r=>{
        if(!r['Data']) return false;
        const parts = r['Data'].split('/');
        if(parts.length!==3) return false;
        const [d,m,y] = parts;
        const dataRow = new Date(+y, m-1, +d);
        if(dtInicio && dataRow<dtInicio) return false;
        if(dtFim && dataRow>dtFim) return false;
        return true;
    });
}

// Atualiza cards (simples simulação)
function atualizarCards(dados){
    let totalHH=0, totalML=0;
    dados.forEach(r=>{
        totalHH += parseFloat(r['HH Total'])||0;
        totalML += parseFloat(r['ML Montados'])||0;
    });
    const std = totalML>0?(totalHH/totalML).toFixed(2):'0.00';
    document.getElementById('valorProdutividadeMedia').textContent = std;
    document.getElementById('valorTopSetores').textContent = setores.map(s=>s.nome).join(', ');
}

// Aplica filtro
function aplicarFiltro(){
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const dadosFiltrados = filtrarDadosPorData(dadosCSV,dataInicio,dataFim);
    atualizarCards(dadosFiltrados);
}

// Eventos
document.getElementById('btnApplyFilter').addEventListener('click', aplicarFiltro);
document.getElementById('btnVoltar').addEventListener('click', ()=>window.location.href='dashboard.html');

// Inicializa
window.addEventListener('load', carregarCSVPadrao);
