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


def _load(path: str, suffix: str):
    loaders = {
        ".pdf": PyPDFLoader,
        ".docx": Docx2txtLoader,
        ".csv": CSVLoader,
        ".md": UnstructuredMarkdownLoader,
        ".markdown": UnstructuredMarkdownLoader,
    }
    return (loaders.get(suffix, TextLoader)(path)).load()


def ingest_upload(filename: str, content_type: str | None, content: bytes):
    
    suffix = os.path.splitext(filename)[1].lower()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(content)
        path = f.name
        
    try:
        docs = _load(path, suffix)
        chunks = RecursiveCharacterTextSplitter(
            chunk_size=900, chunk_overlap=150
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
                        "INSERT INTO documents (id, filename, content_type) VALUES (:id, :name, :type)"
                    ),
                    {"id": document_id, "name": filename, "type": content_type},
                )
                for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    metadata = {
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


def list_documents():
    if not db_ready():
        return []
    with engine.connect() as conn:
        return [
            dict(row)
            for row in conn.execute(
                text(
                    "SELECT id, filename, content_type, created_at FROM documents ORDER BY created_at DESC"
                )
            )
        ]
