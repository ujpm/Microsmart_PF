from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import update
import uuid
from src.models.domain import (
    Organization, Facility, User, DiagnosticSession, SlideInference,
    RoleEnum, SampleTypeEnum, SessionStatusEnum
)

async def get_or_create_default_org_and_user(db: AsyncSession):
    result = await db.execute(select(User).limit(1))
    user = result.scalars().first()
    if user: return user
        
    org = Organization(name="Kigali Central Lab (Test)")
    db.add(org)
    await db.flush() 
    
    fac = Facility(organization_id=org.id, name="Microscopy Dept A")
    db.add(fac)
    await db.flush()
    
    user = User(facility_id=fac.id, email="tech@kigalilab.test", role=RoleEnum.LAB_TECH)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def create_session(db: AsyncSession, user_id: uuid.UUID, facility_id: uuid.UUID, sample_type: SampleTypeEnum) -> DiagnosticSession:
    db_session = DiagnosticSession(user_id=user_id, facility_id=facility_id, sample_type=sample_type, status=SessionStatusEnum.PENDING)
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

async def save_inference_result(db: AsyncSession, session_id: uuid.UUID, image_url: str, vision_metrics: dict, clinical_report: str = None):
    inference = SlideInference(session_id=session_id, image_url=image_url, vision_metrics=vision_metrics, clinical_report=clinical_report)
    db.add(inference)
    await db.execute(update(DiagnosticSession).where(DiagnosticSession.id == session_id).values(status=SessionStatusEnum.COMPLETED))
    await db.commit()

async def get_session_with_results(db: AsyncSession, session_id: uuid.UUID):
    """Fetches a session and its attached ML inferences (if completed)."""
    result = await db.execute(
        select(DiagnosticSession)
        .options(selectinload(DiagnosticSession.inferences))
        .where(DiagnosticSession.id == session_id)
    )
    return result.scalars().first()
