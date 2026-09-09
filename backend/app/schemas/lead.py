from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LeadContact(BaseModel):
    name: str
    title: str
    role_level: str  # C-Level, VP, Director, Lead
    email: str
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    decision_authority: str  # Primary, Influencer, Champion, Gatekeeper


class OfferingMatch(BaseModel):
    product_id: str
    product_name: str
    fit_score: int = Field(..., ge=0, le=100)
    match_tier: str  # Strong, Moderate, Low
    reasoning: str
    aligned_features: List[str] = Field(default_factory=list)
    suggested_pitch: str


class IntentScore(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    grade: str  # A, B, C, D
    urgency_component: int
    fit_component: int
    authority_component: int
    timing_component: int
    buying_readiness: str  # Immediate (0-30 days), High (30-60 days), Exploring (60-90 days), Low
    key_drivers: List[str] = Field(default_factory=list)


class Lead(BaseModel):
    id: str
    company_name: str
    domain: str
    industry: str
    employee_count: str
    estimated_revenue: str
    location: str
    tech_stack: List[str] = Field(default_factory=list)
    signals_count: int = 0
    signals_summary: List[str] = Field(default_factory=list)
    contacts: List[LeadContact] = Field(default_factory=list)
    primary_contact: Optional[LeadContact] = None
    match: Optional[OfferingMatch] = None
    intent: Optional[IntentScore] = None
    status: str = "New"  # New, Enriched, Matched, Outreach_Ready, Contacted, Interested, Disqualified, Opportunity_Created
    created_at: str
    updated_at: str
    notes: Optional[str] = None


class LeadCreate(BaseModel):
    company_name: str
    domain: str
    industry: str
    notes: Optional[str] = None


class LeadFilter(BaseModel):
    industry: Optional[str] = None
    min_intent_score: Optional[int] = None
    grade: Optional[str] = None
    status: Optional[str] = None
    search: Optional[str] = None
