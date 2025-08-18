// Setores com coordenadas e produtividade (fictício)
const setores = [
    {nome:'Prédio GAD', lat:-19.485615564368704, lng:-42.52727499248994, indice:90},
    {nome:'Booster', lat:-19.485810337048832, lng:-42.52732172482585, indice:55},
    {nome:'TT-05', lat:-19.48526311797103, lng:-42.52723563894393, indice:55},
];

// Inicializa mapa
const map = L.map('map').setView([-19.4856, -42.5273], 18);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, NASA, USGS',
    maxZoom: 20
}).addTo(map);

// Função para cor do círculo
function corIndice(indice){
    if(indice >= 70) return 'green';
    if(indice >= 40) return 'orange';
    return 'red';
}

// Função para definir tamanho do círculo
function tamanhoIndice(indice){
    const min = 10;
    const max = 50;
    return Math.min(max, Math.max(min, indice/2)); // Ajusta para não ser muito grande ou pequeno
}

// Adiciona círculos no mapa
setores.forEach(s=>{
    L.circle([s.lat, s.lng], {
        color: corIndice(s.indice),
        fillColor: corIndice(s.indice),
        fillOpacity: 0.5,
        radius: tamanhoIndice(s.indice)
    }).addTo(map)
    .bindPopup(`${s.nome}<br>Produtividade: ${s.indice}%`);
});

// Atualiza KPIs (mockup)
function atualizarKPIs(){
    const media = (setores.reduce((acc,s)=>acc+s.indice,0)/setores.length).toFixed(2);
    document.getElementById('valorProdutividadeMedia').textContent = media;
    document.getElementById('valorTopSetores').textContent = setores.sort((a,b)=>b.indice-a.indice)[0].nome;
}

// Botão filtrar (mockup)
document.getElementById('btnFiltrar').addEventListener('click', atualizarKPIs);

// Inicializa KPIs
window.addEventListener('load', atualizarKPIs);
