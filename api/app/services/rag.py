import uuid
from sqlalchemy import text
from .database import engine, db_ready
from ..config import settings
from .embeddings import embed, vector_literal
from langchain_google_genai import ChatGoogleGenerativeAI

SYSTEM = "You are a precise enterprise knowledge assistant. Answer only from the supplied context. If context is insufficient, say so. Cite sources as [filename, chunk N]."

def get_llm():
    return ChatGoogleGenerativeAI(
        model=settings.ai_model,
        google_api_key=settings.ai_api_key,
        temperature=0,
    )

def _retrieve(question: str):
    if not db_ready():
        return []
    # Reciprocal-rank fusion combines lexical precision with BGE semantic recall.
    sql = """WITH lexical AS (
        SELECT id, row_number() OVER (ORDER BY ts_rank(tsv, websearch_to_tsquery('english', :q)) DESC) AS rank
        FROM chunks WHERE tsv @@ websearch_to_tsquery('english', :q) LIMIT 20
      ), semantic AS (
        SELECT id, row_number() OVER (ORDER BY embedding <=> CAST(:embedding AS vector)) AS rank
        FROM chunks WHERE embedding IS NOT NULL LIMIT 20
      ), fused AS (
        SELECT id, SUM(score) AS score FROM (
          SELECT id, 1.0 / (60 + rank) AS score FROM lexical
          UNION ALL SELECT id, 1.0 / (60 + rank) AS score FROM semantic
        ) ranks GROUP BY id
      ) SELECT d.filename, c.content, c.metadata FROM fused f JOIN chunks c ON c.id=f.id
        JOIN documents d ON d.id=c.document_id ORDER BY f.score DESC LIMIT 6"""
    params = {"q": question, "embedding": vector_literal(embed(question))}
    with engine.connect() as conn:
        return conn.execute(
            text(sql),
            params
        ).mappings().all()

def save_message(conversation_id: str, role: str, content: str)-> str | None:
    
    if not db_ready():
        return None

    message_id = str(uuid.uuid4())

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO chat_messages (
                    id,
                    conversation_id,
                    role,
                    content
                )
                VALUES (
                    :id,
                    :conversation_id,
                    :role,
                    :content
                )
                """
            ),
            {
                "id": message_id,
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
            },
        )

    return message_id

def answer(question: str, conversation_id: str):
    sources = _retrieve(question)
    citations = [
        {"filename": s["filename"], "chunk": s["metadata"].get("chunk", 0)}
        for s in sources
    ]
    context = "\n\n".join(
        f"Source: [{c['filename']}, chunk {c['chunk']}]\n{s['content']}"
        for s, c in zip(sources, citations)
    )
    if not sources:
        response = "I couldn't find relevant indexed content yet. Upload documents, then try again."
    elif not settings.ai_api_key:
        response = "Relevant context was found, but set AI_API_KEY to enable generated answers."
    else:

        response = (
            get_llm().invoke(
                [
                    ("system", SYSTEM),
                    ("human", f"Context:\n{context}\n\nQuestion: {question}"),
                ]
            )
            .content
        )
    save_message(conversation_id, "user", question)
    message_id = save_message(conversation_id, "assistant", response)
    return {"id": message_id, "answer": response, "citations": citations}


def save_feedback(message_id, rating, comment):
    if not db_ready():
        return
    with engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO feedback (id, message_id, rating, comment) VALUES (:id, :message_id, :rating, :comment)"
            ),
            {
                "id": str(uuid.uuid4()),
                "message_id": message_id,
                "rating": rating,
                "comment": comment,
            },
        )
