import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from src.db.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    PATHOLOGIST = "PATHOLOGIST"
    LAB_TECH = "LAB_TECH"

class SampleTypeEnum(str, enum.Enum):
    MALARIA = "MALARIA"
    OVA_AND_PARASITES = "OVA_AND_PARASITES"

class SessionStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    facilities = relationship("Facility", back_populates="organization", cascade="all, delete-orphan")

class Facility(Base):
    __tablename__ = "facilities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="facilities")
    users = relationship("User", back_populates="facility")
    sessions = relationship("DiagnosticSession", back_populates="facility")

class User(Base):
    """
    Users map to Supabase Auth IDs. We store metadata here.
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) # Will map exactly to Supabase Auth UUID
    facility_id = Column(UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.LAB_TECH)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    facility = relationship("Facility", back_populates="users")
    sessions = relationship("DiagnosticSession", back_populates="user")

class DiagnosticSession(Base):
    """
    Represents an entire patient sample or batch upload.
    """
    __tablename__ = "diagnostic_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=False)
    
    sample_type = Column(Enum(SampleTypeEnum), nullable=False)
    status = Column(Enum(SessionStatusEnum), default=SessionStatusEnum.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")
    facility = relationship("Facility", back_populates="sessions")
    inferences = relationship("SlideInference", back_populates="session", cascade="all, delete-orphan")

class SlideInference(Base):
    """
    Stores individual slide results. Uses JSONB for abstract ML outputs.
    """
    __tablename__ = "slide_inferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("diagnostic_sessions.id"), nullable=False)
    
    image_url = Column(String(500), nullable=False) # Points to S3/Supabase Storage bucket
    vision_metrics = Column(JSONB, nullable=True)   # Flexible sandbox for any Agent's raw output
    clinical_report = Column(String, nullable=True) # Final LLM Markdown
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("DiagnosticSession", back_populates="inferences")
