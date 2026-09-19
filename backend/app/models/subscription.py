import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from app.core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True, index=True)
    plan_tier = Column(String(50), default="Growth", nullable=False)  # Starter | Growth | Enterprise
    status = Column(String(50), default="active", nullable=False)     # active | trial | past_due
    billing_cycle = Column(String(20), default="monthly", nullable=False)  # monthly | yearly
    voice_minutes_limit = Column(Integer, default=300, nullable=False)
    voice_minutes_used = Column(Integer, default=0, nullable=False)
    leads_limit = Column(Integer, default=500, nullable=False)
    leads_used = Column(Integer, default=0, nullable=False)
    seats_limit = Column(Integer, default=5, nullable=False)
    seats_used = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
