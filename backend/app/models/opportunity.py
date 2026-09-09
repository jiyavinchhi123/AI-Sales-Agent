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
    deal_value = Column(Float, default=0.0)
    stage = Column(String(100), default="Discovery")
    win_probability = Column(Integer, default=50)
    assigned_rep = Column(String(255), nullable=True)
    next_action_title = Column(String(255), nullable=True)
    next_action_priority = Column(String(50), default="Medium")
    crm_synced = Column(Boolean, default=False)
    crm_target = Column(String(100), default="HubSpot")
    created_at = Column(DateTime, default=datetime.utcnow)
