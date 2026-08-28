"""
Authentication API — CardioRetina AI
Endpoints: /login, /me, /refresh, /mfa/verify
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    decode_token, verify_totp, generate_totp_secret, get_totp_uri,
)
from app.core.rbac import get_current_user
from app.core.audit_chain import write_audit_log

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    mfa_required: bool = False


class MFAVerifyRequest(BaseModel):
    totp_code: str


class MFASetupResponse(BaseModel):
    secret: str
    uri: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    org_id: int
    mfa_enabled: bool

    class Config:
        from_attributes = True


# ─── Login ────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with email + password. Returns JWT tokens."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Update last login
    user.last_login_at = datetime.utcnow()
    await db.commit()

    # Audit log
    ip = request.client.host if request.client else None
    await write_audit_log(
        db, action="LOGIN", user_id=user.id, org_id=user.org_id,
        resource=f"user:{user.email}", ip_address=ip,
    )

    token_data = {"sub": str(user.id), "org_id": user.org_id, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        mfa_required=user.mfa_enabled,
    )


# ─── Current User ─────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


# ─── Token Refresh ────────────────────────────────────────────────────────────
class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a refresh token for new access + refresh tokens."""
    from jose import JWTError
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token type")
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or disabled")

    token_data = {"sub": str(user.id), "org_id": user.org_id, "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


# ─── MFA Verify ───────────────────────────────────────────────────────────────
@router.post("/mfa/verify")
async def verify_mfa(
    body: MFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify a TOTP code for MFA-enabled accounts."""
    if not current_user.mfa_enabled or not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA is not enabled for this account")
    if not verify_totp(current_user.mfa_secret, body.totp_code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")
    return {"verified": True}


# ─── MFA Setup ────────────────────────────────────────────────────────────────
@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new TOTP secret and return the URI for QR code generation."""
    secret = generate_totp_secret()
    current_user.mfa_secret = secret
    current_user.mfa_enabled = True
    await db.commit()
    uri = get_totp_uri(secret, current_user.email)
    return MFASetupResponse(secret=secret, uri=uri)
