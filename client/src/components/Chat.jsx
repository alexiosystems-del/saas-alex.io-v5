import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);

  return (
    <div className="chat-container">
      {messages.map((m, i) => (
        <div key={i} className={m.role}>
          {m.text}
          <small>{m.translated}</small>
        </div>
      ))}
    </div>
  );
}
