from typing import List, Optional
from pydantic import BaseModel, Field


class Campaign(BaseModel):
    id: str
    name: str
    description: str
    target_criteria: str
    status: str  # Active, Draft, Paused, Completed
    channels: List[str] = Field(default_factory=lambda: ["AI Voice Call", "Personalized Email"])
    total_leads: int = 0
    contacted_count: int = 0
    interested_count: int = 0
    scheduled_meetings: int = 0
    response_rate: float = 0.0
    created_at: str


class CampaignCreate(BaseModel):
    name: str
    description: str
    target_criteria: str
    channels: List[str] = Field(default_factory=lambda: ["AI Voice Call"])
