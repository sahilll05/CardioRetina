import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.analysis import Analysis

async def get_latest():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Analysis).order_by(Analysis.created_at.desc()))
        a = res.scalars().first()
        if a:
            print(f"Job ID: {a.job_id}")
            print(f"Status: {a.status}")
            print(f"Error: {a.error_message}")
        else:
            print("No analysis found.")

if __name__ == '__main__':
    asyncio.run(get_latest())
