from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.call import (
    CallSession, StartCallRequest, CallDialogueStepRequest
)
from app.services.call_agent_service import call_agent_service
from app.services.lead_service import lead_service

router = APIRouter()


@router.get("/sessions", response_model=List[CallSession])
def get_call_sessions():
    """Retrieve all simulated and active AI sales call sessions."""
    return call_agent_service.get_all_calls()


@router.get("/sessions/{call_id}", response_model=CallSession)
def get_call_session(call_id: str):
    """Get full call details, turns, transcript, insights, and battlecards."""
    call = call_agent_service.get_call_by_id(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call session not found")
    return call


@router.post("/start", response_model=CallSession)
def start_call_session(req: StartCallRequest):
    """Initiate an AI voice outreach call simulation to a lead prospect."""
    lead = lead_service.get_lead_by_id(req.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    contact_name = lead.primary_contact.name if lead.primary_contact else "Engineering Leader"
    contact_title = lead.primary_contact.title if lead.primary_contact else "VP of Engineering"

    session = call_agent_service.start_call(
        req=req,
        lead_company=lead.company_name,
        contact_name=contact_name,
        contact_title=contact_title
    )
    lead_service.update_status(req.lead_id, "Contacted")
    return session


@router.post("/step", response_model=CallSession)
def execute_dialogue_step(req: CallDialogueStepRequest):
    """
    Simulate prospect speaking a response and receive real-time AI rebuttal,
    objection detection, and battlecard updates.
    """
    try:
        updated_call = call_agent_service.process_dialogue_step(req)
        return updated_call
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
