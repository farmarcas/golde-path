import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [status, setStatus] = useState("verificando...");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((d) => setStatus(`API: ${d.api} · Banco: ${d.db}`))
      .catch(() => setStatus("API indisponível"));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>Golden Path</h1>
      <p>{status}</p>
    </main>
  );
}
