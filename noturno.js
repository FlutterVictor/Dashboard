:root {
  --blue: #0b63d6;
  --dark: #0b2340;
  --muted: #f3f6fb;
  --card: #ffffff;
  --gray: #6b7280;
  font-family: Inter, system-ui, -apple-system, Roboto, 'Segoe UI', Arial;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--muted);
  color: var(--dark);
  font-size: 16px;
}

header {
  background: var(--blue);
  color: white;
  text-align: center;
  padding: 1rem;
  border-bottom: 4px solid var(--dark);
}

header h1 {
  margin-bottom: 0.5rem;
}

nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  position: relative;
}

.btn {
  background: #e5e7eb;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
}

.btn:hover {
  background: #d1d5db;
}

.btn.voltar {
  position: absolute;
  right: 2cm; /* afastamento de 2cm */
  background: #f87171;
  color: white;
}

main {
  padding: 2rem;
}

.conteudo {
  background: var(--card);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0px 4px 8px rgba(0,0,0,0.1);
}
