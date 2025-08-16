let dadosCSV = [];
let setores = [
    {
        area: "Canteiro de Obras",
        lat: -19.4848081040112,
        lng: -42.528268838465145,
        produtividade: 0.8,
        comentario: "Produção estável",
        foto: "fotos/canteiro.jpg"
    },
    {
        area: "Prédio GAD",
        lat: -19.485730911089373,
        lng: -42.527222305029305,
        produtividade: 0.6,
        comentario: "Retrabalho em algumas estruturas",
        foto: "fotos/predioGAD.jpg"
    }
];

// Inicializa mapa
const centroUsina = {lat: -19.4848081, lng: -42.5282688};
const map = L.map('map').setView([centroUsina.lat, centroUsina.lng], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Função para atualizar marcadores
function atualizarMapa(dataInicio, dataFim){
    // Remove todos marcadores antigos
    if(window.markersLayer) window.markersLayer.clearLayers();
    window.markersLayer = L.layerGroup().addTo(map);

    // Para cada setor, cria o marcador
    setores.forEach(s => {
        const color = s.produtividade >= 0.8 ? 'green' : s.produtividade >= 0.5 ? 'orange' : 'red';
        const marker = L.circleMarker([s.lat, s.lng], {
            radius: 12,
            color: color,
            fillColor: color,
            fillOpacity: 0.6
        }).addTo(window.markersLayer);

        marker.bindPopup(`
            <b>${s.area}</b><br>
            Produtividade: ${(s.produtividade*100).toFixed(0)}%<br>
            Comentário: ${s.comentario}<br>
            <img src="${s.foto}" alt="${s.area}" width="120">
        `);
    });

    // Atualiza cards informativos
    const mediaProd = setores.reduce((sum,s)=>sum+s.produtividade,0)/setores.length;
    document.getElementById('prodMedia').textContent = (mediaProd*100).toFixed(0) + '%';

    const topSetores = setores.sort((a,b)=>b.produtividade-a.produtividade).slice(0,3);
    const ul = document.getElementById('topSetores');
    ul.innerHTML = '';
    topSetores.forEach(s => ul.innerHTML += `<li>${s.area} - ${(s.produtividade*100).toFixed(0)}%</li>`);

    const fotosDiv = document.getElementById('fotosRecentes');
    fotosDiv.innerHTML = '';
    topSetores.forEach(s => {
        const img = document.createElement('img');
        img.src = s.foto;
        img.alt = s.area;
        fotosDiv.appendChild(img);
    });
}

// Botão aplicar filtro
document.getElementById('btnApplyFilter').addEventListener('click', ()=>{
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    atualizarMapa(dataInicio,dataFim);
});

// Botão voltar
document.getElementById('btnBack').addEventListener('click', ()=>{
    window.location.href = 'dashboard.html'; // link para o Dashboard STD
});

// Inicializa mapa com todos os dados
window.addEventListener('load', ()=>atualizarMapa());
