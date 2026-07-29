from pydantic import BaseModel, Field
from fastapi import APIRouter
from ..services.rag import save_feedback
from typing import Literal
from uuid import UUID

router = APIRouter()


class FeedbackRequest(BaseModel):
    message_id: UUID | None = None
    rating: Literal[-1, 1]
    comment: str | None = Field(
        default=None,
        max_length=1000,
    )

class FeedbackResponse(BaseModel):
    ok: bool

@router.post("", response_model=FeedbackResponse)
def feedback(request: FeedbackRequest):
    save_feedback(request.message_id, request.rating, request.comment)
    return {"ok": True}
