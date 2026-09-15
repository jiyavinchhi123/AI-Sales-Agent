from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Campaign(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    target_criteria: str = "High-Intent Verified Leads"
    status: str = "Active"  # Active, Draft, Running, Paused, Completed
    channels: List[str] = Field(default_factory=lambda: ["Personalized Email", "AI Voice Call"])
    tone: Optional[str] = "Consultative & Solution-Focused"
    cadence_steps: List[Dict[str, Any]] = Field(default_factory=list)
    total_leads: int = 0
    contacted_count: int = 0
    interested_count: int = 0
    scheduled_meetings: int = 0
    response_rate: float = 0.0
    created_at: str
    updated_at: Optional[str] = None


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    target_criteria: Optional[str] = "High-Intent Verified Leads"
    channels: List[str] = Field(default_factory=lambda: ["Personalized Email", "AI Voice Call"])
    tone: Optional[str] = "Consultative & Solution-Focused"
    target_intent: Optional[str] = "All"


class CampaignLaunchResponse(BaseModel):
    success: bool
    campaign_id: str
    campaign_name: str
    status: str
    leads_enrolled: int
    emails_dispatched: int
    calls_initiated: int
    message: str

