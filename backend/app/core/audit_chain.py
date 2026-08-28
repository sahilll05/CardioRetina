"""
Hash-Chained Audit Log Writer — CardioRetina AI
ALL audit log writes MUST go through this module.
Direct INSERT into audit_log is forbidden — it would break the hash chain.
"""
import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.core.security import compute_row_hash, GENESIS_PREV_HASH


def _build_payload(
    user_id: int | None,
    org_id: int | None,
    action: str,
    resource: str | None,
    ip_address: str | None,
    details_str: str | None,
    timestamp: datetime,
) -> str:
    """
    Build the deterministic string payload for hashing.
    details_str must already be a JSON-serialized string (or None).
    This function is used identically during write AND verify — both must
    produce the same string from the same stored field values.
    """
    return json.dumps(
        {
            "user_id": user_id,
            "org_id": org_id,
            "action": action,
            "resource": resource,
            "ip_address": ip_address,
            "details": details_str,
            "timestamp": timestamp.isoformat(),
        },
        sort_keys=True,
    )


def _get_last_hash_sync(db: Session) -> str:
    """Get the row_hash of the most recent audit log entry (sync version)."""
    last = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    return last.row_hash if last else GENESIS_PREV_HASH


async def _get_last_hash_async(db: AsyncSession) -> str:
    """Get the row_hash of the most recent audit log entry (async version)."""
    from sqlalchemy import select
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
    )
    last = result.scalar_one_or_none()
    return last.row_hash if last else GENESIS_PREV_HASH


def write_audit_log_sync(
    db: Session,
    action: str,
    user_id: int | None = None,
    org_id: int | None = None,
    resource: str | None = None,
    ip_address: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    """
    Write a single audit log entry (sync — for Celery tasks).
    Computes hash chain automatically.
    `details` should be a plain dict — it is serialized to JSON here.
    """
    timestamp = datetime.utcnow()
    # Serialize dict → JSON string once. This exact string is stored in DB
    # and used identically during verification.
    details_str = json.dumps(details, sort_keys=True) if details else None

    prev_hash = _get_last_hash_sync(db)
    payload = _build_payload(user_id, org_id, action, resource, ip_address, details_str, timestamp)
    row_hash = compute_row_hash(prev_hash, payload)

    entry = AuditLog(
        user_id=user_id,
        org_id=org_id,
        action=action,
        resource=resource,
        ip_address=ip_address,
        details=details_str,
        timestamp=timestamp,
        prev_hash=prev_hash,
        row_hash=row_hash,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


async def write_audit_log(
    db: AsyncSession,
    action: str,
    user_id: int | None = None,
    org_id: int | None = None,
    resource: str | None = None,
    ip_address: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    """
    Write a single audit log entry (async — for FastAPI route handlers).
    Computes hash chain automatically.
    `details` should be a plain dict — it is serialized to JSON here.
    """
    timestamp = datetime.utcnow()
    # Serialize dict → JSON string once. This exact string is stored in DB
    # and used identically during verification.
    details_str = json.dumps(details, sort_keys=True) if details else None

    prev_hash = await _get_last_hash_async(db)
    payload = _build_payload(user_id, org_id, action, resource, ip_address, details_str, timestamp)
    row_hash = compute_row_hash(prev_hash, payload)

    entry = AuditLog(
        user_id=user_id,
        org_id=org_id,
        action=action,
        resource=resource,
        ip_address=ip_address,
        details=details_str,
        timestamp=timestamp,
        prev_hash=prev_hash,
        row_hash=row_hash,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


def verify_audit_chain_sync(db: Session) -> tuple[bool, str]:
    """
    Verify the full hash chain integrity (sync).
    Returns (is_valid: bool, message: str).
    """
    entries = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not entries:
        return True, "Audit log is empty — chain is trivially valid."

    expected_prev = GENESIS_PREV_HASH
    for entry in entries:
        if entry.prev_hash != expected_prev:
            return False, f"Chain broken at audit_log.id={entry.id}: prev_hash mismatch."

        payload = _build_payload(
            entry.user_id, entry.org_id, entry.action,
            entry.resource, entry.ip_address, entry.details,
            entry.timestamp,
        )
        expected_hash = compute_row_hash(entry.prev_hash, payload)
        if entry.row_hash != expected_hash:
            return False, f"Chain broken at audit_log.id={entry.id}: row_hash mismatch (data tampered)."

        expected_prev = entry.row_hash

    return True, f"Audit chain valid ({len(entries)} entries verified)."
