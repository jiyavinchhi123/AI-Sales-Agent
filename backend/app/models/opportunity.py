import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from app.core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    lead_id = Column(String(36), nullable=True)
    company_name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True)
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    matched_offering = Column(String(255), nullable=True)
    deal_value = Column(Float, nullable=True, default=None)
    deal_value_estimate = Column(String(100), nullable=True, default="Not available")
    stage = Column(String(100), default="Not available")
    win_probability = Column(Integer, nullable=True, default=None)
    assigned_rep = Column(String(255), nullable=True)
    next_action_title = Column(String(255), nullable=True)
    next_action_priority = Column(String(50), default="Not available")
    crm_synced = Column(Boolean, default=False)
    crm_target = Column(String(100), default="HubSpot")
    crm_record_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
