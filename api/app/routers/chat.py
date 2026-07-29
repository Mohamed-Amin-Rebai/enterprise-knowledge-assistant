from pydantic import BaseModel, Field
from fastapi import APIRouter
from ..services.rag import answer
from typing import Optional
from fastapi import Depends
from ..auth import get_current_user_id

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


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user_id)):
    return answer(
        request.question,
        request.conversation_id,
        user_id,
    )