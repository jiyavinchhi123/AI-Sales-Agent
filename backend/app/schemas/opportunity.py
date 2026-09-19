from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class NextBestAction(BaseModel):
    id: str
    lead_id: str
    action_type: str  # "schedule_demo", "send_roi_calculator", "case_study_share", "executive_briefing"
    title: str
    rationale: str
    priority: str  # Urgent, High, Medium
    suggested_email_or_script: str
    completed: bool = False


class Opportunity(BaseModel):
    id: str
    lead_id: str
    company_name: str
    domain: str
    contact_name: str
    contact_email: str
    matched_offering: str
    deal_value: Optional[float] = None
    deal_value_estimate: Optional[str] = "Not available"
    stage: Optional[str] = "Not available"
    win_probability: Optional[int] = None
    assigned_rep: Optional[str] = "Not assigned"
    next_action: Optional[NextBestAction] = None
    crm_synced: bool = False
    crm_target: Optional[str] = None  # "HubSpot", "Salesforce", "Webhook"
    crm_record_id: Optional[str] = None
    created_at: str
    updated_at: str


class CRMHandoffRequest(BaseModel):
    opportunity_id: str
    target_crm: str = "HubSpot"  # "HubSpot", "Salesforce", "Pipedrive", "Custom_Webhook"
    rep_notes: Optional[str] = None
    include_call_transcript: bool = True
