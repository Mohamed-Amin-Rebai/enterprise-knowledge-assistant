"use client";

import Header from "../components/Header";
import { FormEvent, useRef, useState, useEffect } from "react";
import { 
  FileUp, 
  Send, 
  Sparkles, 
  ThumbsDown, 
  ThumbsUp, 
  FileText, 
  Database, 
  ChevronDown,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { toast } from "sonner";

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
  timestamp?: number;
};

type DocumentInfo = {
  id: string;
  filename: string;
  content_type?: string;
  created_at: string;
};

export default function Home() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [conversationId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState(
    "Upload documents to begin building your knowledge base."
  );
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    loadDocuments();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-violet-600 animate-spin" />
            <p className="text-gray-500">Loading your workspace...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  async function loadDocuments() {
    try {
      const token = await getToken();

      const r = await fetch(`${API}/api/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!r.ok) {
        throw new Error("Failed to load documents");
      }

      const data = await r.json();

      setDocuments(data);
    } catch (error) {
      console.error("Failed to load documents", error);
    }
  }

  async function deleteDocument(documentId: string) {
    try {
      const token = await getToken();

      const r = await fetch(
        `${API}/api/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!r.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments(prev =>
        prev.filter(doc => doc.id !== documentId)
      );

      toast.success("Document deleted");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    
    setUploading(true);
    setIsUploadSuccess(false);
    setUploadProgress(0);
    setNotice(`Indexing ${file.name}…`);

    const body = new FormData();
    body.append("file", file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const token = await getToken();
      const r = await fetch(`${API}/api/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Upload failed");
      
      setIsUploadSuccess(true);
      await loadDocuments();
      setNotice(`${data.filename}: ${data.chunks} chunks indexed successfully.`);
      toast.success(`✅ ${data.filename} uploaded!`, {
        description: `${data.chunks} chunks indexed successfully.`
      });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Upload failed");
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : "Please try again."
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || busy) return;
    
    const text = question.trim();
    setQuestion("");
    setBusy(true);
    
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: Date.now()
    };
    setMessages((m) => [...m, userMessage]);

    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: text,
          conversation_id: conversationId,
        }),
      });
      
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Unable to answer");
      
      const assistantMessage: Message = {
        id: data.id || crypto.randomUUID(),
        role: "assistant",
        text: data.answer || "No answer generated.",
        citations: data.citations || [],
        timestamp: Date.now()
      };
      
      setMessages((m) => [...m, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "⚠️ The service is currently unavailable. Please confirm the API is running and try again.",
        timestamp: Date.now()
      };
      setMessages((m) => [...m, errorMessage]);
      toast.error("Service unavailable", {
        description: "Could not connect to the API. Please check your connection."
      });
    } finally {
      setBusy(false);
    }
  }

  async function feedback(messageId: string, rating: number) {
    try {
      await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId, rating }),
      });
      toast.success(rating > 0 ? "Thanks for your feedback! 👍" : "We'll improve! 👎");
    } catch (error) {
      console.error("Feedback error:", error);
    }
  }

  const clearMessages = () => {
    setMessages([]);
    toast.info("Conversation cleared");
  };

  return (
    <main className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          
          {/* Sidebar - Knowledge Base */}
          <aside className={`rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl p-6 transition-all duration-300 ${
            isSidebarCollapsed ? "lg:col-span-0" : ""
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-600" />
                Knowledge Base
              </h2>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="lg:hidden text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`} />
              </button>
            </div>

            <div className={`space-y-4 ${isSidebarCollapsed ? "hidden lg:block" : ""}`}>
              <div className="rounded-xl bg-gradient-to-br from-violet-50/50 to-indigo-50/50 p-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {notice}
                </p>
              </div>

              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv,.md,.markdown"
                // onChange={(e) => upload(e.target.files?.[0])}
                onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach(upload);
                }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60 transition-all hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Indexing… {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4" />
                      Upload Document
                    </>
                  )}
                </span>
                
                {/* Progress bar */}
                {uploading && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
              </button>

              {isUploadSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50/80 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4" />
                  <span>Upload successful!</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 text-xs text-gray-400">
                <span className="px-2 py-1 rounded-md bg-gray-100/80">PDF</span>
                <span className="px-2 py-1 rounded-md bg-gray-100/80">DOCX</span>
                <span className="px-2 py-1 rounded-md bg-gray-100/80">TXT</span>
                <span className="px-2 py-1 rounded-md bg-gray-100/80">CSV</span>
                <span className="px-2 py-1 rounded-md bg-gray-100/80">Markdown</span>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2 border-t border-gray-200/50 pt-3">
                    <p className="text-xs font-semibold text-gray-600">
                    Uploaded Documents
                    </p>

                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between text-xs bg-gray-100/80 rounded-lg px-3 py-2"
                      >
                        <span className="truncate">
                          📄 {doc.filename}
                        </span>

                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                </div>
                )}

              {/* Clear conversation button */}
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 pt-2 border-t border-gray-200/50"
                >
                  <X className="w-3 h-3" />
                  Clear conversation
                </button>
              )}
            </div>
          </aside>

          {/* Chat Section */}
          <section className="flex flex-col min-h-[620px] rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {messages.length === 0 && (
                <div className="pt-20 text-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Ask your knowledge base
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Responses are generated only from retrieved internal documents and include citations.
                  </p>
                </div>
              )}
              
              {messages.map((m, index) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] sm:max-w-[75%] rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-lg shadow-violet-500/20"
                        : "max-w-[90%] sm:max-w-[80%] rounded-2xl bg-gray-100/80 backdrop-blur-sm p-4 shadow-sm border border-gray-100/50"
                    }
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {m.text}
                    </p>
                    
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 border-t border-gray-200/50 pt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">📎 Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {m.citations.map((c, i) => (
                            <span
                              key={i}
                              className="text-xs bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm text-gray-600 border border-gray-200/50"
                            >
                              {c.filename} <span className="text-gray-400">·</span> chunk {c.chunk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {m.role === "assistant" && (
                      <div className="mt-3 flex items-center gap-3 pt-2 border-t border-gray-200/30">
                        <button
                          aria-label="Helpful"
                          onClick={() => feedback(m.id, 1)}
                          className="text-gray-400 hover:text-emerald-600 transition-colors hover:scale-110 transform duration-200"
                        >
                          <ThumbsUp size={15} />
                        </button>
                        <button
                          aria-label="Not helpful"
                          onClick={() => feedback(m.id, -1)}
                          className="text-gray-400 hover:text-rose-600 transition-colors hover:scale-110 transform duration-200"
                        >
                          <ThumbsDown size={15} />
                        </button>
                        {m.timestamp && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {busy && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-[80%] rounded-2xl bg-gray-100/80 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
                      <span>Retrieving and drafting grounded answer…</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={send} className="flex gap-3 border-t border-gray-200/50 p-4 bg-gray-50/50 backdrop-blur-sm">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about your documents…"
                className="flex-1 rounded-xl border border-gray-200/50 px-4 py-2.5 text-sm bg-white/80 backdrop-blur-sm outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                disabled={busy}
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center"
                disabled={busy || !question.trim()}
              >
                <Send size={18} className={busy ? "animate-pulse" : ""} />
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Mobile file upload floating button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center"
        disabled={uploading}
      >
        <FileUp className="w-6 h-6" />
      </button>
    </main>
  );
}