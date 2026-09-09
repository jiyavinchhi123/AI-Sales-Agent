from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.lead import Lead, LeadFilter, OfferingMatch, IntentScore
from app.services.lead_service import lead_service
from app.services.matching_service import matching_service
from app.services.scoring_service import scoring_service
from app.services.business_service import business_service
from app.services.discovery_service import discovery_service

router = APIRouter()


@router.get("", response_model=List[Lead])
def get_leads(
    status: Optional[str] = None,
    grade: Optional[str] = None,
    search: Optional[str] = None
):
    """List enriched leads with scores, offering matches, and filters."""
    return lead_service.get_leads(status=status, grade=grade, search=search)


@router.get("/{lead_id}", response_model=Lead)
def get_lead(lead_id: str):
    """Get complete lead dossier including contacts, tech stack, and intent breakdown."""
    lead = lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/{lead_id}/match", response_model=OfferingMatch)
def match_lead(lead_id: str):
    """Re-evaluate semantic offering match for a lead against the product catalog."""
    lead = lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    biz = business_service.get_profile()
    match_result = matching_service.match_lead_to_offerings(lead, biz.products)
    lead.match = match_result
    lead_service.update_status(lead_id, "Matched")
    return match_result


@router.post("/{lead_id}/score", response_model=IntentScore)
def score_lead(lead_id: str):
    """Recalculate dynamic multi-factor intent score."""
    lead = lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    signals = discovery_service.get_signals()
    score_result = scoring_service.calculate_intent_score(lead, signals)
    lead.intent = score_result
    return score_result


@router.put("/{lead_id}/status", response_model=Lead)
def update_lead_status(lead_id: str, status: str = Query(...)):
    """Update lead qualification status."""
    lead = lead_service.update_status(lead_id, status)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead
