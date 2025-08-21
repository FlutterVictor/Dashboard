function toggleIndicadores() {
  document.getElementById("indicadores").classList.remove("hidden");
  document.getElementById("relatorios").classList.add("hidden");
}

function toggleRelatorios() {
  document.getElementById("relatorios").classList.remove("hidden");
  document.getElementById("indicadores").classList.add("hidden");
}

function voltar() {
  alert("Voltando para o menu anterior...");
}
