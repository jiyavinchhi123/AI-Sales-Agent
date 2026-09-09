from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BuyingSignal(BaseModel):
    id: str
    company_name: str
    domain: str
    signal_type: str  # funding, hiring_surge, leadership_hire, tech_stack_change, expansion, compliance_deadline, pain_point
    title: str
    summary: str
    source: str  # e.g., "TechCrunch", "LinkedIn Hiring", "GitHub Tech Stack", "Press Release", "Job Board"
    detected_at: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    urgency_level: str  # High, Medium, Low
    urgency_score: int = Field(..., ge=0, le=100)
    raw_data: Optional[Dict[str, Any]] = None
    processed: bool = False
    lead_id: Optional[str] = None


class SignalScanRequest(BaseModel):
    industry: Optional[str] = None
    signal_types: Optional[List[str]] = None
    min_confidence: Optional[float] = 0.7
