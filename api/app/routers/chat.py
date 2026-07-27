from pydantic import BaseModel, Field
from fastapi import APIRouter
from ..services.rag import answer
from typing import Optional

router = APIRouter()

class Citation(BaseModel):
    filename: str
    chunk: int

class ChatResponse(BaseModel):
    id: str
    answer: str
    citations: list[Citation]

class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    conversation_id: Optional[str] = None


@router.post("")
async def chat(request: ChatRequest):
    return answer(request.question, request.conversation_id)
