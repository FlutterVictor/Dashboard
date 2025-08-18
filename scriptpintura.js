// Filtrar gráficos por datas (mockup)
document.getElementById('filtrar').addEventListener('click', () => {
  const inicio = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;

  if(!inicio || !fim) {
    alert('Selecione a data de início e fim!');
    return;
  }

  alert(`Filtrando dados de ${inicio} até ${fim} (mockup)`);

  // Aqui você colocaria a lógica real para atualizar os gráficos com os dados filtrados
});

// Exportar PDF
document.getElementById('exportarPDF').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Dashboard Pintura", 10, 10);
  doc.text("Exportação mockup", 10, 20);
  doc.save("Dashboard_Pintura.pdf");
});
