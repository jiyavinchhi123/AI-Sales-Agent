import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON
from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_criteria = Column(String(255), default="High-Intent Verified Leads")
    status = Column(String(50), default="Active")  # Active, Draft, Running, Paused, Completed
    channels = Column(JSON, default=lambda: ["Personalized Email", "AI Voice Call"])
    tone = Column(String(100), default="Consultative & Solution-Focused")
    cadence_steps = Column(JSON, default=list)
    total_leads = Column(Integer, default=0)
    contacted_count = Column(Integer, default=0)
    interested_count = Column(Integer, default=0)
    scheduled_meetings = Column(Integer, default=0)
    response_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
