import os, tempfile, uuid
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    CSVLoader,
    UnstructuredMarkdownLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .database import engine, db_ready
from sqlalchemy import text
import json
from .embeddings import (embed_batch, vector_literal)
from langsmith import traceable
from langchain_core.documents import Document

def _load(path: str, suffix: str):
    loaders = {
        ".pdf": PyPDFLoader,
        ".docx": Docx2txtLoader,
        ".csv": CSVLoader,
        ".md": UnstructuredMarkdownLoader,
        ".markdown": UnstructuredMarkdownLoader,
    }
    return (loaders.get(suffix, TextLoader)(path)).load()


MAX_FILE_SIZE = 50 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".csv",
    ".txt",
    ".md",
    ".markdown",
}

def _validate_file(filename: str, content: bytes):
    suffix = os.path.splitext(filename)[1].lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {suffix}")

    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File too large")
    
def _get_chunk_strategy(suffix: str):
    return {
        ".pdf": {"size": 900, "overlap": 150},
        ".docx": {"size": 1000, "overlap": 150},
        ".txt": {"size": 800, "overlap": 100},
        ".md": {"size": 600, "overlap": 100},
        ".markdown": {"size": 600, "overlap": 100},
    }.get(
        suffix,
        {"size": 900, "overlap": 150}
    )

    
@traceable(name="Document Ingestion")
def ingest_upload(user_id: str, filename: str, content_type: str | None, content: bytes):
    _validate_file(filename, content)
    suffix = os.path.splitext(filename)[1].lower()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(content)
        path = f.name
    
    try:
        docs = _load(path, suffix)
        
        if suffix == ".csv":
            combined_content = "\n".join(
                doc.page_content
                for doc in docs
            )
        
            chunks = [
                # Whole table chunk
                Document(
                    page_content=combined_content,
                    metadata={
                        "type": "table",
                        "row_count": len(docs)
                    }
                )
            ]

            # Individual row chunks
            chunks.extend(
                Document(
                    page_content=doc.page_content,
                    metadata={
                        "type": "row",
                        "row": i,
                    },
                )
                for i, doc in enumerate(docs)
            )
            
        else :
            strategy = _get_chunk_strategy(suffix)

            chunks = RecursiveCharacterTextSplitter(
                chunk_size=strategy["size"],
                chunk_overlap=strategy["overlap"],
            ).split_documents(docs)
        
        document_id = str(uuid.uuid4())
        
        chunk_texts = [
            chunk.page_content
            for chunk in chunks
        ]

        embeddings = embed_batch(chunk_texts)
        
        if db_ready():
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "INSERT INTO documents (id, user_id, filename, content_type) VALUES (:id, :user_id, :name, :type)"
                    ),
                    {"id": document_id, "user_id": user_id, "name": filename, "type": content_type},
                )
                for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    metadata = {
                        **chunk.metadata,
                        "chunk": index,
                        "filename": filename,
                    }
                    conn.execute(
                        text(
                            "INSERT INTO chunks (id, document_id, content, metadata, embedding) VALUES (:id, :doc, :content, CAST(:metadata AS jsonb), CAST(:embedding AS vector))"
                        ),
                        {
                            "id": str(uuid.uuid4()),
                            "doc": document_id,
                            "content": chunk.page_content,
                            "metadata": json.dumps(metadata),
                            "embedding": vector_literal(embedding),
                        },
                    )
        return {
            "id": document_id,
            "filename": filename,
            "chunks": len(chunks),
            "persisted": db_ready(),
        }
    finally:
        os.unlink(path)


def list_documents(user_id: str):
    if not db_ready():
        return []

    with engine.connect() as conn:
        return conn.execute(
            text(
                """
                SELECT
                    id,
                    filename,
                    content_type,
                    created_at
                FROM documents
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                """
            ),
            {"user_id": user_id},
        ).mappings().all()
        
def delete_document(document_id: str, user_id: str):
    if not db_ready():
        return False

    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                DELETE FROM documents
                WHERE id = :document_id
                AND user_id = :user_id
                """
            ),
            {
                "document_id": document_id,
                "user_id": user_id,
            },
        )

        return result.rowcount > 0