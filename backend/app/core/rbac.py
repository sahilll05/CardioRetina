"""
RBAC (Role-Based Access Control) — CardioRetina AI
FastAPI dependency factories for protecting routes by role.
"""
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and verify the current user from the Bearer token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Async DB lookup
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_role(allowed_roles: List[str]):
    """
    Dependency factory: require the current user to have one of the specified roles.

    Usage:
        @router.get("/admin-only")
        async def admin_route(user: User = Depends(require_role(["ADMIN"]))):
            ...
    """
    async def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted. "
                       f"Required: {allowed_roles}",
            )
        return current_user
    return _check_role


def require_org(org_id: int):
    """
    Dependency factory: require current user to belong to a specific organization.
    Admins bypass this check (they may manage multiple orgs).
    """
    async def _check_org(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != UserRole.ADMIN and current_user.org_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: cross-organization access not permitted.",
            )
        return current_user
    return _check_org
