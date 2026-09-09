"""
Domain models for Step 3: Lead Discovery
Represents companies, verified buying requirements, public sources, and ranked opportunities.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class Company(BaseModel):
    name: str
    domain: str
    industry: str
    location: str
    employee_count: str = "50-500"
    revenue_estimate: Optional[str] = None


class Requirement(BaseModel):
    title: str
    description: str
    requirement_type: str  # e.g., "Cloud Migration", "Compliance & Audit", "AML & Fraud", "Infrastructure Support"
    urgency: str = "High"  # "High", "Medium", "Low"
    budget_hint: Optional[str] = None


class Source(BaseModel):
    platform: str  # e.g., "Public Requirement Source", "Open RFP Portal", "Regulatory Filing"
    original_url: str
    verified_public: bool = True
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0)


class DiscoveredOpportunity(BaseModel):
    id: str
    company: Company
    requirement: Requirement
    source: Source
    detected_date: str
    intent_level: str  # "High", "Medium", "Low"
    match_score: int = Field(..., ge=0, le=100)
    matched_offering: str
    match_rationale: str
    status: str = "New"  # "New", "Saved", "Converted"


class DiscoveryFilters(BaseModel):
    location: Optional[str] = None
    industry: Optional[str] = None
    requirement_type: Optional[str] = None
    recency: Optional[str] = None  # "Today", "Last 7 Days", "Last 30 Days", "All"
    intent_level: Optional[str] = None  # "High", "Medium", "Low", "All"
    search: Optional[str] = None
