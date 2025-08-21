// Gráfico de velocímetro (Gauge) simulando STD
const ctxGauge = document.getElementById('gaugeChart');
new Chart(ctxGauge, {
  type: 'doughnut',
  data: {
    labels: ['Produzindo Demais', 'Padrão', 'Improdutivo'],
    datasets: [{
      data: [0.20, 0.02, 0.58], // STD = 0,23 → 0.20 abaixo, 0.02 faixa padrão, resto acima
      backgroundColor: ['#2ecc71', '#3498db', '#e74c3c'],
      borderWidth: 0
    }]
  },
  options: {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  }
});

// Gráfico de colunas (Produção Diária)
const ctxBar = document.getElementById('barChart');
new Chart(ctxBar, {
  type: 'bar',
  data: {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    datasets: [
      {
        label: 'Meta (ML)',
        data: [400, 400, 400, 400, 400],
        backgroundColor: '#3498db'
      },
      {
        label: 'Realizado (ML)',
        data: [380, 320, 310, 340, 290],
        backgroundColor: '#2ecc71'
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  }
});
