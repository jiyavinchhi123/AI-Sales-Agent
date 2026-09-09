import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from app.core.database import Base


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    company_website = Column(String(500), nullable=True)
    company_summary = Column(Text, nullable=True)
    products_services = Column(JSON, default=list)
    target_customers = Column(JSON, default=list)
    target_industries = Column(JSON, default=list)
    target_locations = Column(JSON, default=list)
    ideal_customer_profile = Column(Text, nullable=True)
    keywords = Column(JSON, default=list)
    buying_signals = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
