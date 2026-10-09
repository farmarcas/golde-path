import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("verificando...");

  useEffect(() => {
    fetch("/health/ready")
      .then((r) => setStatus(r.ok ? "API: ok · Banco: ok" : "API no ar, banco indisponível"))
      .catch(() => setStatus("API indisponível"));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>Golden Path</h1>
      <p>{status}</p>
    </main>
  );
}
