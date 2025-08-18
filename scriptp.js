// Lista de setores com coordenadas e produtividade fictícia
const setores = [
    {nome:'Prédio GAD', lat:-19.485615564368704, lng:-42.52727499248994, produtividade: 90},
    {nome:'Booster', lat:-19.485810337048832, lng:-42.52732172482585, produtividade: 60},
    {nome:'TT-05', lat:-19.48526311797103, lng:-42.52723563894393, produtividade: 60}
];

// Inicializa mapa
const map = L.map('map').setView([-19.4856, -42.5273], 18);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, NASA, USGS',
    maxZoom: 20
}).addTo(map);

// Função para definir cor do círculo baseado na produtividade
function corProdutividade(valor){
    if(valor >= 80) return 'red';
    if(valor >= 50) return 'orange';
    return 'green';
}

// Função para limitar tamanho do círculo
function tamanhoCirculo(valor){
    const min = 20;
    const max = 80;
    return Math.min(max, Math.max(min, valor));
}

// Adiciona círculos no mapa
setores.forEach(s=>{
    L.circle([s.lat,s.lng], {
        color: corProdutividade(s.produtividade),
        fillColor: corProdutividade(s.produtividade),
        fillOpacity: 0.4,
        radius: tamanhoCirculo(s.produtividade)
    }).addTo(map)
    .bindPopup(`${s.nome}<br>Produtividade: ${s.produtividade}%`);
});

// Atualiza KPIs (fictício)
function atualizarKPI(){
    const total = setores.reduce((acc,s)=>acc+s.produtividade,0);
    const media = (total / setores.length).toFixed(2);
    document.getElementById('valorProdutividadeMedia').textContent = media + '%';
    const top = setores.sort((a,b)=>b.produtividade-a.produtividade)[0].nome;
    document.getElementById('valorTopSetores').textContent = top;
}

// Inicializa
window.addEventListener('load', atualizarKPI);

// Botão filtrar (simulação)
document.getElementById('btnFiltrar').addEventListener('click',()=>{
    alert('Filtro aplicado (mockup)');
});
