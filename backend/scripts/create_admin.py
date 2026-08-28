import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import AsyncSessionLocal
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.core.security import hash_password

async def create_admin():
    async with AsyncSessionLocal() as session:
        from sqlalchemy.future import select
        # Fetch or Create a default organization
        result = await session.execute(select(Organization).where(Organization.code == "DEFAULT"))
        org = result.scalar_one_or_none()
        if not org:
            org = Organization(name="CardioRetina Default Org", code="DEFAULT", license_key="TRIAL-123")
            session.add(org)
            await session.commit()
            await session.refresh(org)
        await session.refresh(org)

        # Create a default admin user
        admin = User(
            email="admin@cardioretina.ai",
            hashed_password=hash_password("password123"),
            full_name="System Admin",
            role=UserRole.ADMIN,
            org_id=org.id,
            is_active=True
        )
        session.add(admin)
        await session.commit()
        
        print("✅ Successfully created default admin user!")
        print("Email: admin@cardioretina.ai")
        print("Password: password123")

if __name__ == "__main__":
    asyncio.run(create_admin())
