from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import chat, documents, feedback
from .services.database import db_ready

app = FastAPI(title="Enterprise Knowledge Assistant", version="0.1.0", docs_url="/docs", redoc_url="/redoc")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "database": db_ready(),
    }
