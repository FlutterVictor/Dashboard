// Comparativo de Efetivo
const ctxEfetivo = document.getElementById('efetivoChart').getContext('2d');
new Chart(ctxEfetivo, {
    type: 'pie',
    data: {
        labels: ['Presente', 'Falta'],
        datasets: [{
            data: [45, 5],
            backgroundColor: ['#0b63d6', '#f44336']
        }]
    },
    options: {
        responsive: true
    }
});

// HH Trabalhado por OS
const ctxHH = document.getElementById('hhChart').getContext('2d');
new Chart(ctxHH, {
    type: 'bar',
    data: {
        labels: ['OS001', 'OS002', 'OS003', 'OS004'],
        datasets: [{
            label: 'HH Trabalhado',
            data: [120, 95, 80, 130],
            backgroundColor: '#0b63d6'
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// Litros Utilizados no Mês
const ctxLitrosMes = document.getElementById('litrosMesChart').getContext('2d');
new Chart(ctxLitrosMes, {
    type: 'bar',
    data: {
        labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril'],
        datasets: [{
            label: 'Litros',
            data: [200, 250, 180, 220],
            backgroundColor: '#0b63d6'
        }]
    },
    options: { responsive: true }
});

// Total de Litros por OS
const ctxLitrosOS = document.getElementById('litrosOSChart').getContext('2d');
new Chart(ctxLitrosOS, {
    type: 'bar',
    data: {
        labels: ['OS001', 'OS002', 'OS003', 'OS004'],
        datasets: [{
            label: 'Litros',
            data: [50, 70, 40, 90],
            backgroundColor: '#0b63d6'
        }]
    },
    options: { indexAxis: 'y', responsive: true }
});

// Cores e Tipos de Tintas
const ctxTintas = document.getElementById('tintasChart').getContext('2d');
new Chart(ctxTintas, {
    type: 'bar',
    data: {
        labels: ['Branco', 'Vermelho', 'Azul', 'Amarelo'],
        datasets: [
            { label: 'Tinta Fosca', data: [20, 15, 25, 10], backgroundColor: '#0b63d6' },
            { label: 'Tinta Brilhante', data: [10, 5, 15, 5], backgroundColor: '#f44336' }
        ]
    },
    options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }
});

// M² por Mês
const ctxM2Mes = document.getElementById('m2MesChart').getContext('2d');
new Chart(ctxM2Mes, {
    type: 'line',
    data: {
        labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril'],
        datasets: [{
            label: 'M² Pintados',
            data: [500, 600, 450, 700],
            borderColor: '#0b63d6',
            backgroundColor: 'rgba(11,99,214,0.2)',
            fill: true
        }]
    },
    options: { responsive: true }
});

// M² por OS
const ctxM2OS = document.getElementById('m2OSChart').getContext('2d');
new Chart(ctxM2OS, {
    type: 'bar',
    data: {
        labels: ['OS001', 'OS002', 'OS003', 'OS004'],
        datasets: [{
            label: 'M² Pintados',
            data: [120, 150, 100, 180],
            backgroundColor: '#0b63d6'
        }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
});
