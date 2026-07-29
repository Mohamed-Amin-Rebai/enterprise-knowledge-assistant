from fastapi import APIRouter, File, HTTPException, UploadFile
from ..services.ingestion import ingest_upload, list_documents, delete_document
from pydantic import BaseModel
from datetime import datetime
from fastapi import Depends
from ..auth import get_current_user_id
from uuid import UUID

router = APIRouter()
ALLOWED_TYPES = {".pdf", ".docx", ".txt", ".csv", ".md", ".markdown"}
MAX_FILE_SIZE = 20 * 1024 * 1024


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    content_type: str | None
    created_at: datetime
    
@router.get("", response_model=list[DocumentResponse])
def documents(user_id: str = Depends(get_current_user_id)):
    return list_documents(user_id)

@router.delete("/{document_id}")
def delete_doc(document_id: str, user_id: str = Depends(get_current_user_id)):
    deleted = delete_document(
        document_id,
        user_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return {"deleted": True}

@router.post("/upload")
async def upload(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    suffix = (
        "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    )
    if suffix not in ALLOWED_TYPES:
        raise HTTPException(415, "Supported formats: PDF, DOCX, TXT, CSV, Markdown")
    
    content = await file.read()
    if not content:
        raise HTTPException(400, "The uploaded file is empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            413,
            "Maximum file size is 20MB"
        )
    return ingest_upload(user_id, file.filename, file.content_type, content)