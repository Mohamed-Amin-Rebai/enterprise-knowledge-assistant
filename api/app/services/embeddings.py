from functools import lru_cache


@lru_cache
def model():
    # Matches the project's chosen retrieval model; loaded lazily on first ingestion/query.
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("BAAI/bge-base-en-v1.5")


def embed(text: str) -> list[float]:
    return model().encode(text, normalize_embeddings=True).tolist()

def embed_batch(texts: list[str]) -> list[list[float]]:
    return model().encode(
        texts,
        normalize_embeddings=True
    ).tolist()

def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(str(v) for v in values) + "]"
