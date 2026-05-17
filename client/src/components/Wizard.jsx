import { useState } from "react";

export default function Wizard() {
  const [form, setForm] = useState({
    business: "",
    tone: "",
    objective: "",
    audience: "",
    language: "es"
  });

  const [prompt, setPrompt] = useState("");

  const generatePrompt = async () => {
    const res = await fetch("/api/generate-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    setPrompt(data.prompt);
  };

  return (
    <div className="bg-card p-6 rounded-xl">
      <h2>Crear tu IA</h2>

      <input placeholder="Tipo de negocio"
        onChange={e => setForm({...form, business: e.target.value})}
      />

      <input placeholder="Tono (formal, vendedor, etc)"
        onChange={e => setForm({...form, tone: e.target.value})}
      />

      <input placeholder="Objetivo (ventas, soporte...)"
        onChange={e => setForm({...form, objective: e.target.value})}
      />

      <input placeholder="Público objetivo"
        onChange={e => setForm({...form, audience: e.target.value})}
      />

      <button onClick={generatePrompt} className="btn-primary">
        🚀 Generar Prompt
      </button>

      {prompt && (
        <textarea value={prompt} readOnly />
      )}
    </div>
  );
}
