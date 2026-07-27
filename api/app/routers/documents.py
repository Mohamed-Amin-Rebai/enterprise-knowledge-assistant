from fastapi import APIRouter, File, HTTPException, UploadFile
from ..services.ingestion import ingest_upload, list_documents

router = APIRouter()
ALLOWED_TYPES = {".pdf", ".docx", ".txt", ".csv", ".md", ".markdown"}
MAX_FILE_SIZE = 20 * 1024 * 1024

@router.get("")
def documents():
    return list_documents()


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
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
    return ingest_upload(file.filename, file.content_type, content)
    # return ingest_upload(
    #     user_id,
    #     file.filename,
    #     file.content_type,
    #     content
    # )
