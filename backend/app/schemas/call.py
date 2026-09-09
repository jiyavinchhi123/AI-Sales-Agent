from typing import List, Optional
from pydantic import BaseModel, Field


class CallTurn(BaseModel):
    id: str
    speaker: str  # "ai" or "prospect"
    text: str
    timestamp_offset_seconds: int
    sentiment: Optional[str] = "neutral"  # positive, neutral, skeptical, negative
    objection_detected: Optional[str] = None


class ObjectionBattlecard(BaseModel):
    category: str  # "budget", "timing", "competitor", "authority", "security_review"
    objection: str
    recommended_pivot: str
    proof_point: str


class CallInsights(BaseModel):
    summary: str
    sentiment_overall: str  # Positive, Enthusiastic, Skeptical, Guarded, Disinterested
    interest_level: str  # High, Medium, Low
    urgency: str  # High, Moderate, Low
    budget_indicator: Optional[str] = None
    timeline_indicator: Optional[str] = None
    extracted_pain_points: List[str] = Field(default_factory=list)
    objections_handled: List[str] = Field(default_factory=list)
    qualification_verdict: str  # Qualified_Interested, Needs_Followup, Disqualified


class CallSession(BaseModel):
    id: str
    lead_id: str
    company_name: str
    contact_name: str
    contact_title: str
    campaign_id: Optional[str] = None
    status: str = "Completed"  # In_Progress, Completed, Failed, Scheduled
    duration_seconds: int
    started_at: str
    turns: List[CallTurn] = Field(default_factory=list)
    insights: Optional[CallInsights] = None
    battlecards_used: List[ObjectionBattlecard] = Field(default_factory=list)


class StartCallRequest(BaseModel):
    lead_id: str
    voice_tone: Optional[str] = "Consultative & Empathetic"  # Assertive, Consultative, Direct, Friendly
    focus_offering_id: Optional[str] = None


class CallDialogueStepRequest(BaseModel):
    call_id: str
    prospect_response: str
    voice_tone: Optional[str] = "Consultative & Empathetic"
