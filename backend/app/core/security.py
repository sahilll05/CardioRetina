"""
Security Core — CardioRetina AI
Password hashing (bcrypt), JWT token creation/verification, and TOTP MFA support.
"""
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# ─── Password Hashing ─────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ─── JWT Tokens ───────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a longer-lived refresh token (7 days)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token. Raises JWTError on failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# ─── MFA (TOTP) ───────────────────────────────────────────────────────────────
def generate_totp_secret() -> str:
    """Generate a new TOTP secret (base32 encoded)."""
    try:
        import pyotp
        return pyotp.random_base32()
    except ImportError:
        # pyotp not yet installed — return a placeholder
        import secrets, base64
        raw = secrets.token_bytes(20)
        return base64.b32encode(raw).decode("utf-8")


def verify_totp(secret: str, token: str) -> bool:
    """Verify a 6-digit TOTP token against a secret."""
    try:
        import pyotp
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    except ImportError:
        # pyotp not installed — MFA verification not functional yet
        return False


def get_totp_uri(secret: str, email: str, issuer: str = "CardioRetina AI") -> str:
    """Return the otpauth:// URI for QR code generation."""
    try:
        import pyotp
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name=issuer)
    except ImportError:
        return ""


# ─── Audit Hash Chain ─────────────────────────────────────────────────────────
def compute_row_hash(prev_hash: str, payload: str) -> str:
    """
    Compute SHA-256 hash for an audit log row.
    payload = concatenation of non-hash fields (deterministic string representation).
    """
    data = (prev_hash + payload).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


GENESIS_PREV_HASH = hashlib.sha256(b"cardioretina-genesis-block").hexdigest()
