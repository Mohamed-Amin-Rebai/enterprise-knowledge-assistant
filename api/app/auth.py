from fastapi import HTTPException, Request
from clerk_backend_api import authenticate_request, AuthenticateRequestOptions

from .config import settings


def get_current_user_id(request: Request) -> str:
    state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key,
            jwt_key=settings.clerk_jwt_key,
            accepts_token=["session_token"],
        ),
    )

    if not state.is_signed_in:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    return state.payload["sub"]
