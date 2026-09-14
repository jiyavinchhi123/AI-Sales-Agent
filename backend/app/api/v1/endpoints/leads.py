from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.schemas.lead import (
    Lead, OfferingMatch, IntentScore,
    EmailDraftRequest, EmailDraftResponse,
    SendEmailRequest, SendEmailResponse
)
from app.services.lead_service import lead_service

router = APIRouter()


def _get_user_id(current_user: Optional[User], db: Session) -> str:
    if current_user:
        return current_user.id
    first_user = db.query(User).first()
    if first_user:
        return first_user.id
    guest = User(
        email="user@salesagent.ai",
        hashed_password="",
        full_name="Sales Leader",
        company_name="My Company",
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest.id


@router.get("", response_model=List[Lead])
def get_leads(
    status: Optional[str] = None,
    grade: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """List enriched dynamic leads from SQLite database."""
    user_id = _get_user_id(current_user, db)
    return lead_service.get_leads(db, user_id, status=status, grade=grade, search=search)


@router.get("/{lead_id}", response_model=Lead)
def get_lead(
    lead_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Get complete lead dossier from SQLite database."""
    user_id = _get_user_id(current_user, db)
    lead = lead_service.get_lead_by_id(db, user_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}/status", response_model=Lead)
def update_lead_status(
    lead_id: str,
    status: str = Query(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Update lead qualification status."""
    user_id = _get_user_id(current_user, db)
    lead = lead_service.update_status(db, user_id, lead_id, status)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/{lead_id}/email-draft", response_model=EmailDraftResponse)
def generate_email_draft(
    lead_id: str,
    req: EmailDraftRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Generate hyper-personalized AI cold outreach email draft."""
    user_id = _get_user_id(current_user, db)
    try:
        draft = lead_service.generate_email_draft(
            db=db,
            user_id=user_id,
            lead_id=lead_id,
            tone=req.tone or "direct",
            custom_instructions=req.custom_instructions,
        )
        return draft
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate email draft: {str(e)}")


@router.post("/{lead_id}/send-email", response_model=SendEmailResponse)
def send_email(
    lead_id: str,
    req: SendEmailRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Dispatch or simulate AI cold email and record activity in lead dossier."""
    user_id = _get_user_id(current_user, db)
    try:
        result = lead_service.record_email_sent(
            db=db,
            user_id=user_id,
            lead_id=lead_id,
            recipient_email=req.recipient_email,
            subject=req.subject,
            body=req.body,
            method=req.method or "simulation",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
