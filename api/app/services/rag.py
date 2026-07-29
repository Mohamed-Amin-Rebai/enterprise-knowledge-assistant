import uuid
from sqlalchemy import text
from .database import engine, db_ready
from ..config import settings
from .embeddings import (embed, vector_literal, rerank)
from langchain_google_genai import ChatGoogleGenerativeAI
from langsmith import traceable
from typing import Optional

SYSTEM = "You are a precise enterprise knowledge assistant. Answer only from the supplied context. If context is insufficient, say so. Cite sources as [filename, chunk N]."
        
#  Input Sanitization
def _sanitize_input(text: str) -> str:
    # Remove potentially harmful content
    return text.strip()[:10000]  # Limit length


def get_llm() -> Optional[ChatGoogleGenerativeAI]:
    if not settings.ai_api_key:
        return None
    return ChatGoogleGenerativeAI(
        model=settings.ai_model,
        google_api_key=settings.ai_api_key,
        temperature=0,
    )

@traceable(name="Hybrid Retrieval")
def _retrieve(question: str, user_id: str):
    if not db_ready():
        return []

    sql = """
    WITH lexical AS (
        SELECT
            c.id,
            row_number() OVER (
                ORDER BY ts_rank(
                    c.tsv,
                    websearch_to_tsquery('english', :q)
                ) DESC
            ) AS rank
        FROM chunks c
        JOIN documents d
            ON d.id = c.document_id
        WHERE d.user_id = :user_id
        AND c.tsv @@ websearch_to_tsquery('english', :q)
        LIMIT 50
    ),
    semantic AS (
        SELECT
            c.id,
            row_number() OVER (
                ORDER BY c.embedding <=> CAST(:embedding AS vector)
            ) AS rank
        FROM chunks c
        JOIN documents d
            ON d.id = c.document_id
        WHERE d.user_id = :user_id
        AND c.embedding IS NOT NULL
        LIMIT 50
    ),
    fused AS (
        SELECT
            id,
            SUM(score) AS score
        FROM (
            SELECT id, 1.0 / (60 + rank) AS score FROM lexical
            UNION ALL
            SELECT id, 1.0 / (60 + rank) AS score FROM semantic
        ) ranks
        GROUP BY id
    )
    SELECT
        d.filename,
        c.content,
        c.metadata
    FROM fused f
    JOIN chunks c
        ON c.id = f.id
    JOIN documents d
        ON d.id = c.document_id
    ORDER BY f.score DESC
    LIMIT 20
    """

    params = {
        "q": question,
        "embedding": vector_literal(embed(question)),
        "user_id": user_id,
    }

    with engine.connect() as conn:
        return conn.execute(
            text(sql),
            params,
        ).mappings().all()
            

def save_message(user_id: str, conversation_id: str, role: str, content: str)-> str | None:
    
    if not db_ready():
        return None

    message_id = str(uuid.uuid4())

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO chat_messages (
                    id,
                    user_id,
                    conversation_id,
                    role,
                    content
                )
                VALUES (
                    :id,
                    :user_id,
                    :conversation_id,
                    :role,
                    :content
                )
                """
            ),
            {
                "id": message_id,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
            },
        )

    return message_id

def get_conversation_history(conversation_id: str, user_id: str, limit: int = 10):
    if not db_ready():
        return []

    with engine.connect() as conn:
        return conn.execute(
            text(
                """
                SELECT role, content
                FROM chat_messages
                WHERE user_id = :user_id AND conversation_id = :conversation_id
                ORDER BY created_at DESC
                LIMIT :limit
                """
            ),
            {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "limit": limit,
            },
        ).mappings().all()

@traceable(name="Answer Generation")
def answer(question: str, conversation_id: str, user_id: str,):
    question = _sanitize_input(question)
    history = get_conversation_history(conversation_id, user_id, limit=10)

    history_text = "\n".join(
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in reversed(history)
    )
    
    sources = rerank(
        question,
        _retrieve(question, user_id),
        top_k=4,
    )
    
    seen = set()
    citations = []
    

    for s in sources:
        citation = (
            s["filename"],
            s["metadata"].get("chunk", 0),
        )
        if citation not in seen:
            seen.add(citation)
            citations.append(
                {
                    "filename": citation[0],
                    "chunk": citation[1],
                }
            )
    context = "\n\n".join(
        f"Source: [{s['filename']}, chunk {s['metadata'].get('chunk', 0)}]\n{s['content']}"
        for s in sources
    )
    
    if not sources:
        response = "I couldn't find relevant information in your knowledge base. Please ensure documents are uploaded and indexed correctly, or try rephrasing your question."
    elif not settings.ai_api_key:
        response = "Relevant context was found, but set AI_API_KEY to enable generated answers."
    else:

        response = (
            get_llm().invoke(
                [
                    ("system", SYSTEM),
                    (
                        "human",
                        f"""
                    Conversation History:
                    {history_text}

                    Retrieved Context:
                    {context}

                    Question:
                    {question}
                    """
                    )
                ]
            )
            .content
        )
    
    save_message(user_id, conversation_id, "user", question)
    message_id = save_message(user_id, conversation_id, "assistant", response)
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
