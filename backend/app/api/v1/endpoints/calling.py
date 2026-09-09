from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.call import (
    CallSession, StartCallRequest, CallDialogueStepRequest
)
from app.models.user import User
from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.services.call_agent_service import call_agent_service
from app.services.lead_service import lead_service
from app.services.business_service import business_service

router = APIRouter()


def _get_user_id(current_user: Optional[User], db: Session) -> str:
    if current_user:
        return current_user.id
    guest = db.query(User).first()
    if not guest:
        guest = User(
            email="demo@enterprise.com",
            hashed_password="demo",
            full_name="Demo User",
            company_name="Enterprise IT Services",
        )
        db.add(guest)
        db.commit()
        db.refresh(guest)
    return guest.id


@router.get("/sessions", response_model=List[CallSession])
def get_call_sessions(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all simulated and active AI sales call sessions for the user."""
    user_id = _get_user_id(current_user, db)
    return call_agent_service.get_all_calls(db, user_id)


@router.get("/sessions/{call_id}", response_model=CallSession)
def get_call_session(
    call_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Get full call details, turns, transcript, insights, and battlecards."""
    user_id = _get_user_id(current_user, db)
    call = call_agent_service.get_call_by_id(call_id, db=db, user_id=user_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call session not found")
    return call


@router.post("/start", response_model=CallSession)
def start_call_session(
    req: StartCallRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Initiate an AI voice outreach call to a lead prospect."""
    user_id = _get_user_id(current_user, db)
    lead = lead_service.get_lead_by_id(db, user_id, req.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    seller_profile = business_service.get_profile_by_user(user_id, db)

    session = call_agent_service.start_call(
        req=req,
        lead=lead,
        seller_profile=seller_profile,
        user_id=user_id,
        db=db
    )
    return session


@router.post("/step", response_model=CallSession)
def execute_dialogue_step(
    req: CallDialogueStepRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Process prospect speaking a response and receive real-time AI reply,
    objection handling, and qualification stage advancement.
    """
    user_id = _get_user_id(current_user, db)
    try:
        updated_call = call_agent_service.process_dialogue_step(req, user_id=user_id, db=db)
        return updated_call
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/end/{call_id}", response_model=CallSession)
def end_call_session(
    call_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Wrap up call immediately and commit finalized BANT qualification."""
    user_id = _get_user_id(current_user, db)
    try:
        finalized_call = call_agent_service.end_call(call_id, user_id=user_id, db=db)
        return finalized_call
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
