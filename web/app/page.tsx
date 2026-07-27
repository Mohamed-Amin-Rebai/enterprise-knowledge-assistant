"use client";

import { FormEvent, useRef, useState } from "react";
import { FileUp, Send, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
type Citation = {
  filename: string;
  chunk: number;
};
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [conversationId] = useState(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("Upload documents to begin building your knowledge base.");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setNotice(`Indexing ${file.name}…`);
    const body = new FormData();
    body.append("file", file);
    try {
      const r = await fetch(`${API}/api/documents/upload`, {
        method: "POST",
        body,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail);
      setNotice(`${data.filename}: ${data.chunks} chunks indexed.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || busy) return;
    const text = question.trim();
    setQuestion("");
    setBusy(true);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: text,
          conversation_id: conversationId,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error("Unable to answer");
      setMessages((m) => [
        ...m,
        {
          id: data.id,
          role: "assistant",
          text: data.answer,
          citations: data.citations,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "The service is unavailable. Confirm the API is running, then try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function feedback(messageId: string, rating: number) {
    await fetch(`${API}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, rating }),
    });
  }

  return (
    <main className="min-h-screen font-sans">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <span className="rounded-lg bg-indigo-600 p-2 text-white">
            <Sparkles size={20} />
          </span>

          <div>
            <h1 className="font-semibold">Enterprise Knowledge Assistant</h1>
            <p className="text-sm text-slate-500">
              Grounded answers from your internal knowledge
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border bg-white p-4">
          <h2 className="font-medium">Knowledge base</h2>
          <p className="mt-2 text-sm text-slate-500">{notice}</p>
          <input
            ref={input}
            className="hidden"
            type="file"
            accept=".pdf,.docx,.txt,.csv,.md,.markdown"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <button
            onClick={() => input.current?.click()}
            disabled={uploading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <FileUp size={16} />
            {uploading ? "Indexing…" : "Upload document"}
          </button>
          <p className="mt-3 text-xs text-slate-400">
            PDF, DOCX, TXT, CSV, Markdown
          </p>
        </aside>

        <section className="flex min-h-[620px] flex-col rounded-xl border bg-white">
          <div className="flex-1 space-y-5 p-6">
            {messages.length === 0 && (
              <div className="pt-28 text-center">
                <Sparkles className="mx-auto text-indigo-500" />
                <h2 className="mt-3 text-lg font-semibold">
                  Ask your knowledge base
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Responses are generated only from retrieved internal
                  documents.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <article
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] rounded-xl bg-indigo-600 p-3 text-white"
                    : "max-w-[85%] rounded-xl bg-slate-100 p-4"
                }
              >
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {m.text}
                </p>
                {m.citations?.length ? (
                  <div className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500">
                    Sources:{" "}
                    {m.citations.map((c, i) => (
                      <span
                        key={i}
                        className="mr-2 rounded-sm bg-white px-2 py-1"
                      >
                        {c.filename}, chunk {c.chunk}
                      </span>
                    ))}
                  </div>
                ) : null}
                {m.role === "assistant" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      aria-label="Helpful"
                      onClick={() => feedback(m.id, 1)}
                    >
                      <ThumbsUp size={15} />
                    </button>
                    <button
                      aria-label="Not helpful"
                      onClick={() => feedback(m.id, -1)}
                    >
                      <ThumbsDown size={15} />
                    </button>
                  </div>
                )}
              </article>
            ))}
            {busy && (
              <p className="text-sm text-slate-500">
                Retrieving and drafting a grounded answer…
              </p>
            )}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-4">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your documents…"
              className="flex-1 rounded-lg border px-3 py-2 outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              className="rounded-lg bg-indigo-600 px-4 text-white disabled:opacity-60"
              disabled={busy}
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
