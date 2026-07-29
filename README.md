# Enterprise Knowledge Assistant

An AI-powered Enterprise Knowledge Assistant that enables users to upload internal documents and interact with them using natural language. The system leverages Retrieval-Augmented Generation (RAG), hybrid retrieval, semantic search, vector embeddings, reranking, and large language models to deliver grounded answers with citations.

---

## Features

### Authentication & Security

- Clerk Authentication
- Protected application routes
- Backend-verified user identity
- User-specific document isolation
- Secure access control using verified Clerk session tokens

### Supported Document Types

- PDF
- DOCX
- TXT
- CSV
- Markdown

### Document Management

- Upload documents
- Automatic document indexing
- Persistent document library
- Delete uploaded documents
- User-specific knowledge bases

### Retrieval-Augmented Generation (RAG)

The application provides a complete RAG pipeline:

1. Document ingestion
2. Intelligent chunking
3. Embedding generation
4. Vector storage
5. Hybrid retrieval
6. Cross-encoder reranking
7. Context construction
8. LLM answer generation
9. Citation extraction

### Hybrid Search

Retrieval combines:

- PostgreSQL Full-Text Search (FTS)
- pgvector Semantic Search
- Reciprocal Rank Fusion (RRF)
- Cross-Encoder Reranking

### Conversation Memory

- Multi-turn conversations
- Context retention
- Conversation history storage
- User-isolated memory

### Observability

- LangSmith tracing
- Retrieval monitoring
- Answer generation tracking
- End-to-end request visibility

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Sonner Notifications
- Lucide Icons

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- LangChain
- LangSmith

### AI Stack

#### LLM

- Google Gemini

#### Embeddings

- BAAI/bge-base-en-v1.5

#### Reranking

- cross-encoder/ms-marco-MiniLM-L-6-v2

#### Retrieval

- Hybrid Search
- Reciprocal Rank Fusion (RRF)
- Cross-Encoder Reranking

### Database

- PostgreSQL
- pgvector

### Deployment

- Docker
- Docker Compose

---

## Project Structure

```text
enterprise-knowledge-assistant/
│
├── api/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── chat.py
│   │   │   ├── documents.py
│   │   │   └── feedback.py
│   │   │
│   │   ├── services/
│   │   │   ├── rag.py
│   │   │   ├── ingestion.py
│   │   │   ├── embeddings.py
│   │   │   └── database.py
│   │   │
│   │   ├── auth.py
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── web/
│   ├── app/
│   ├── components/
│   ├── Dockerfile
│   └── package.json
│
├── infra/
│   └── init.sql
│
└── docker-compose.yml
```

---

## System Workflow

### Document Ingestion Pipeline

```text
Document Upload
       ↓
Document Loader
       ↓
Text Chunking
       ↓
Embedding Generation
       ↓
PostgreSQL + pgvector Storage
```

### Question Answering Pipeline

```text
User Question
       ↓
Query Embedding
       ↓
Hybrid Retrieval
       ↓
Reranking
       ↓
Context Construction
       ↓
Gemini Generation
       ↓
Answer + Citations
```

---

## CSV-Specific Processing

CSV files receive specialized treatment.

Instead of relying solely on row-level chunks, the application creates:

- One full-table chunk
- Individual row chunks

This approach allows both:

```text
"What category generated the most revenue?"
```

and

```text
"What was the revenue of Smartphone X?"
```

to be answered accurately.

---

## Key Capabilities

✅ PDF Ingestion

✅ DOCX Ingestion

✅ TXT Ingestion

✅ CSV Ingestion

✅ Markdown Ingestion

✅ Hybrid Search

✅ Semantic Search

✅ Full-Text Search

✅ Reciprocal Rank Fusion

✅ Reranking

✅ Citations

✅ Conversation Memory

✅ User Isolation

✅ Clerk Authentication

✅ LangSmith Tracing

✅ Dockerized Deployment

✅ Persistent Document Management

---

## API Endpoints

### Health

```http
GET /health
```

---

### Documents

```http
GET    /api/documents
POST   /api/documents/upload
DELETE /api/documents/{document_id}
```

---

### Chat

```http
POST /api/chat
```

Request:

```json
{
  "question": "What products generated the most revenue?",
  "conversation_id": "conversation-id"
}
```

---

### Feedback

```http
POST /api/feedback
```

Request:

```json
{
  "message_id": "message-id",
  "rating": 1,
  "comment": "Helpful answer"
}
```

---

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=

AI_API_KEY=
AI_MODEL=

CLERK_SECRET_KEY=
CLERK_JWT_KEY=

LANGSMITH_TRACING=
LANGSMITH_ENDPOINT=
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
```

---

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

CLERK_SECRET_KEY=
```

---

## Running Locally

### Using Docker

```bash
docker compose up --build
```

Services:

```text
Frontend : http://localhost:3000
Backend  : http://localhost:8000
Swagger  : http://localhost:8000/docs
```

---

## Example Questions

### PDF / DOCX / TXT

```text
Summarize this document.

What deadlines are mentioned?

What action items are listed?

Who is responsible for the project?
```

### CSV

```text
What product generated the most revenue?

What category generated the highest revenue?

Show the top 3 products by sales.

What was the revenue of Smartphone X?
```

---

## Future Improvements

- Streaming responses
- Multi-document summarization
- Role-based access control (RBAC)
- Background ingestion jobs
- Advanced analytics dashboard
- Enterprise SSO integrations
- Multi-tenant administration
- Collaborative knowledge spaces

---

## Author

**Mohamed Amine Rebai**

Enterprise Knowledge Assistant

Built with:

**FastAPI • Next.js • Gemini • PostgreSQL • pgvector • LangChain • Clerk • LangSmith**

---

## Version

**v1.0.0**

A production-style Retrieval-Augmented Generation platform featuring secure authentication, hybrid retrieval, semantic search, reranking, conversation memory, document citations, observability, and multi-user support.