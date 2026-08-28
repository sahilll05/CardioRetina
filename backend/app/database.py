"""
Async SQLAlchemy 2.0 Database Engine — CardioRetina AI
Uses asyncpg for non-blocking PostgreSQL I/O under Uvicorn's ASGI event loop.

Two sessions are provided:
- AsyncSession:  used by FastAPI route handlers (async endpoints)
- SessionLocal:  sync fallback used by Celery tasks (which run outside the ASGI loop)
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# ─── Async engine (primary — used by all FastAPI routes) ─────────────────────
# Converts postgresql:// → postgresql+asyncpg://
_async_url = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
).replace(
    "postgresql+psycopg2://", "postgresql+asyncpg://"
)

async_engine = create_async_engine(
    _async_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# ─── Sync engine (fallback — used only by Celery tasks) ──────────────────────
_sync_url = settings.DATABASE_URL
sync_engine = create_engine(
    _sync_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# ─── Shared Base ─────────────────────────────────────────────────────────────
Base = declarative_base()


# ─── FastAPI dependency (async) ───────────────────────────────────────────────
async def get_db(org_id: int = None) -> AsyncSession:
    """Async session dependency for FastAPI route handlers with RLS tenant context."""
    async with AsyncSessionLocal() as session:
        try:
            if org_id is not None:
                from sqlalchemy import text
                await session.execute(text(f"SET LOCAL app.current_org_id = '{org_id}'"))
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Sync dependency (for Celery tasks only) ──────────────────────────────────
def get_sync_db():
    """Sync session for Celery task context (outside ASGI loop)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()