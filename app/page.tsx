"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo, ich bin mit deinem Mistral-Agenten verbunden. Was soll ich fuer dich tun?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Der Agent konnte gerade nicht antworten.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.answer,
        },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unbekannter Fehler.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <main className="shell">
      <section className="workspace" aria-label="Mistral Agent Chat">
        <header className="topbar">
          <div>
            <p className="eyebrow">Mistral Agent</p>
            <h1>Agent-Konsole</h1>
          </div>
          <span className="status">Verbunden</span>
        </header>

        <div className="messages" aria-live="polite">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <div className="avatar" aria-hidden="true">
                {message.role === "assistant" ? "M" : "Du"}
              </div>
              <p>{message.content}</p>
            </article>
          ))}
          {isSending ? (
            <article className="message assistant">
              <div className="avatar" aria-hidden="true">M</div>
              <p>Ich frage den Agenten ...</p>
            </article>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}

        <form className="composer" onSubmit={sendMessage}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Nachricht an den Agenten"
            rows={3}
          />
          <button type="submit" disabled={!canSend} aria-label="Nachricht senden">
            Senden
          </button>
        </form>
      </section>
    </main>
  );
}
