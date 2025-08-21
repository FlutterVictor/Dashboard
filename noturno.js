// Mockup JS para relatório noturno
console.log("Dashboard Noturno carregado");

// Pré-visualização das fotos
const uploadFotos = document.getElementById('uploadFotos');
const previewFotos = document.getElementById('previewFotos');

uploadFotos.addEventListener('change', (e) => {
    previewFotos.innerHTML = '';
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev){
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '6px';
            previewFotos.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
});

// Botão Exportar PDF (Mockup)
document.getElementById('btnExportPDF').addEventListener('click', () => {
    alert('Exportar PDF do relatório noturno (em desenvolvimento)');
});
