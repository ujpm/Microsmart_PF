import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db.database import AsyncSessionLocal
from src.db.crud import get_or_create_default_org_and_user

async def seed():
    print("Connecting to Supabase...")
    async with AsyncSessionLocal() as db:
        user = await get_or_create_default_org_and_user(db)
        print(f"\n✅ Successfully seeded database!")
        print(f"Organization: Kigali Central Lab (Test)")
        print(f"Test User ID: {user.id}")
        print(f"Test Facility ID: {user.facility_id}\n")

if __name__ == "__main__":
    asyncio.run(seed())
