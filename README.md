# Enterprise Knowledge Assistant

A production-oriented RAG starter for answering questions over internal documents.

## Stack

- **Web:** Next.js, TypeScript, Tailwind CSS
- **API:** FastAPI, LangChain, LangSmith
- **Data:** PostgreSQL with pgvector
- **Retrieval:** BM25 + vector similarity, reciprocal-rank fusion, reranking

## Quick start

1. Add the keys to `.env`.
2. Start database and API: `docker compose up --build`
3. In a separate terminal, run the web app:
   ```powershell
   cd web
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000`.

## API

- `POST /api/documents/upload` — ingest PDF, DOCX, TXT, CSV, or Markdown.
- `GET /api/documents` — list documents.
- `POST /api/chat` — retrieve, rerank, answer, and return citations.
- `POST /api/feedback` — store answer feedback.

The database schema is in `infra/init.sql`. For local development, the API remains usable before a database is configured, but persistent documents and chats require PostgreSQL.