from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

@lru_cache
def model():
    # Matches the project's chosen retrieval model; loaded lazily on first ingestion/query.
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("BAAI/bge-base-en-v1.5")

@lru_cache
def reranker():
    from sentence_transformers import CrossEncoder

    return CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def embed(text: str) -> list[float]:
    try :
        return model().encode(
                text,
                batch_size=32,
                normalize_embeddings=True,
            ).tolist()
    except Exception:
        logger.exception("Failed to generate embedding")
        raise


def embed_batch(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    texts = [t for t in texts if t.strip()]
    if not texts:
        return []

    try:
        embeddings = model().encode(
            texts,
            batch_size=16,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    except Exception:
        logger.exception("Failed to generate batch embeddings")
        raise

def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(str(v) for v in values) + "]"

def rerank(query: str, documents: list[dict], top_k: int = 6):
    if not documents:
        return []

    pairs = [
        (query, d["content"])
        for d in documents
    ]
    try :
        scores = reranker().predict(pairs)

        ranked = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True,
        )

        return [
            doc
            for doc, _ in ranked[:top_k]
        ]
    except Exception:
        logger.exception("Reranking failed")
        return documents[:top_k]