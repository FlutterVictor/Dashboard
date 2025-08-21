// Gráfico de Produção por Turno
const ctxTurno = document.getElementById("graficoTurno").getContext("2d");
new Chart(ctxTurno, {
  type: "bar",
  data: {
    labels: ["Manhã", "Tarde", "Noite"],
    datasets: [{
      label: "Produção (m³)",
      data: [120, 150, 325],
      backgroundColor: ["#0b63d6", "#6b7280", "#1d4ed8"],
      borderRadius: 6
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } }
  }
});

// Gráfico de Eficiência por Equipe
const ctxEquipe = document.getElementById("graficoEquipe").getContext("2d");
new Chart(ctxEquipe, {
  type: "line",
  data: {
    labels: ["Equipe A", "Equipe B", "Equipe C"],
    datasets: [{
      label: "Eficiência (%)",
      data: [85, 90, 87],
      borderColor: "#0b63d6",
      backgroundColor: "rgba(11, 99, 214, 0.2)",
      tension: 0.3,
      fill: true,
      pointBackgroundColor: "#0b63d6"
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: "bottom" } }
  }
});
