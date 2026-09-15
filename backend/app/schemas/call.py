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
    sentiment_overall: str = "Positive"  # Positive, Enthusiastic, Skeptical, Guarded, Disinterested
    interest_level: str = "High"  # High, Medium, Low
    urgency: str = "High"  # High, Moderate, Low
    need: Optional[str] = "Not available"
    scope_users: Optional[str] = "Not available"
    timeline: Optional[str] = "Not available"
    budget: Optional[str] = "Not disclosed"
    authority: Optional[str] = "Not available"
    target_location: Optional[str] = None
    delivery_location: Optional[str] = None
    intent_score: int = Field(default=90, ge=0, le=100)
    next_best_action: str = "Schedule technical discussion"
    extracted_pain_points: List[str] = Field(default_factory=list)
    objections_handled: List[str] = Field(default_factory=list)
    qualification_verdict: str = "Interested"  # Interested, Neutral, Disqualified


class CallSession(BaseModel):
    id: str
    lead_id: str
    company_name: str
    contact_name: str
    contact_title: str
    campaign_id: Optional[str] = None
    status: str = "In_Progress"  # In_Progress, Completed, Failed, Scheduled
    stage: str = "greeting"  # greeting, need, scope, timeline, closing, completed
    duration_seconds: int = 0
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
