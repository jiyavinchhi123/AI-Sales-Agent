"""
Opportunities & CRM Handoff API Endpoints with SQLite Database Persistence.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.models.call import CallSession as DBCallSession
from app.schemas.opportunity import Opportunity, CRMHandoffRequest
from app.services.crm_service import crm_service
from app.services.lead_service import lead_service
from app.services.business_service import business_service
from app.services.call_agent_service import call_agent_service

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


@router.get("", response_model=List[Opportunity])
def list_opportunities(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """List all qualified sales opportunities and their current deal stages from SQLite."""
    user_id = _get_user_id(current_user, db)
    return crm_service.get_opportunities(db, user_id)


@router.get("/{opp_id}", response_model=Opportunity)
def get_opportunity(
    opp_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Get single opportunity with its recommended next best action from SQLite."""
    user_id = _get_user_id(current_user, db)
    opp = crm_service.get_opportunity_by_id(db, user_id, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp


@router.post("/create-from-lead/{lead_id}", response_model=Opportunity)
def create_opportunity_from_lead(
    lead_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Convert an interested / qualified lead into an active sales opportunity in SQLite."""
    user_id = _get_user_id(current_user, db)
    lead = lead_service.get_lead_by_id(db, user_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    seller_profile = business_service.get_profile_by_user(user_id, db)

    # Check if lead has an associated call session to pull verified deal amount and next action
    call_row = db.query(DBCallSession).filter(
        DBCallSession.lead_id == lead_id,
        DBCallSession.user_id == user_id
    ).order_by(DBCallSession.created_at.desc()).first()

    deal_value = "Not available"
    stage = "Qualified"
    next_action_title = None

    if call_row and call_row.qualification_data:
        q_data = call_row.qualification_data
        if q_data.get("deal_amount") and q_data.get("deal_amount") != "Not available":
            deal_value = q_data.get("deal_amount")
        if q_data.get("next_best_action") and q_data.get("next_best_action") != "Not available":
            next_action_title = q_data.get("next_best_action")
        if q_data.get("qualification_verdict") == "Interested":
            stage = "Qualified"

    contact_name = lead.primary_contact.name if lead.primary_contact else "Procurement Lead"
    contact_email = lead.primary_contact.email if lead.primary_contact else f"info@{lead.domain}"

    default_offering = (
        lead.matched_offering
        or (lead.match.product_name if lead.match else None)
        or (seller_profile.products_services[0] if seller_profile and seller_profile.products_services else "Commercial Supply")
    )

    opp = crm_service.create_opportunity(
        db=db,
        user_id=user_id,
        lead_id=lead_id,
        company_name=lead.company_name,
        domain=lead.domain,
        contact_name=contact_name,
        contact_email=contact_email,
        matched_offering=default_offering,
        deal_value=deal_value,
        stage=stage,
        next_action_title=next_action_title or f"Send formal quotation to {contact_email}",
        next_action_priority="High",
        assigned_rep=(seller_profile.sender_name if seller_profile else None) or (current_user.full_name if current_user else "Account Executive"),
    )

    lead_service.update_status(db, user_id, lead_id, "Opportunity_Created")
    return opp


@router.post("/create-from-call/{call_id}", response_model=Opportunity)
def create_opportunity_from_call(
    call_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Promotes a qualified AI call directly into an active sales opportunity in SQLite."""
    user_id = _get_user_id(current_user, db)
    call = call_agent_service.get_call_by_id(call_id, db=db, user_id=user_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call session not found")

    lead = lead_service.get_lead_by_id(db, user_id, call.lead_id) if call.lead_id else None
    seller_profile = business_service.get_profile_by_user(user_id, db)

    deal_value = "Not available"
    next_action_title = None
    stage = "Qualified"

    if call.insights:
        if call.insights.deal_amount and call.insights.deal_amount != "Not available":
            deal_value = call.insights.deal_amount
        if call.insights.next_best_action and call.insights.next_best_action != "Not available":
            next_action_title = call.insights.next_best_action
        if call.insights.qualification_verdict == "Interested":
            stage = "Qualified"

    matched_offering = (
        (call.insights.product_service if call.insights and call.insights.product_service != "Not available" else None)
        or (lead.matched_offering if lead else None)
        or (seller_profile.products_services[0] if seller_profile and seller_profile.products_services else "Wholesale Supply")
    )

    contact_name = call.contact_name or (lead.primary_contact.name if lead and lead.primary_contact else "Decision Maker")
    contact_email = (lead.primary_contact.email if lead and lead.primary_contact else "") or f"buyer@{call.company_name.lower().replace(' ', '')}.com"
    domain = lead.domain if lead else f"{call.company_name.lower().replace(' ', '')}.com"

    opp = crm_service.create_opportunity(
        db=db,
        user_id=user_id,
        lead_id=call.lead_id or f"lead-{call_id[:6]}",
        company_name=call.company_name,
        domain=domain,
        contact_name=contact_name,
        contact_email=contact_email,
        matched_offering=matched_offering,
        deal_value=deal_value,
        stage=stage,
        next_action_title=next_action_title or f"Email catalog and wholesale price list to {contact_email}",
        next_action_priority="High",
        assigned_rep=(seller_profile.sender_name if seller_profile else None) or (current_user.full_name if current_user else "Account Executive"),
    )

    if call.lead_id:
        try:
            lead_service.update_status(db, user_id, call.lead_id, "Opportunity_Created")
        except Exception:
            pass

    return opp


@router.post("/crm-export", response_model=Opportunity)
def export_opportunity_to_crm(
    req: CRMHandoffRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """1-Click CRM Handoff: Sync opportunity deal card and insights to HubSpot / Salesforce / Webhook in SQLite."""
    user_id = _get_user_id(current_user, db)
    try:
        updated = crm_service.export_to_crm(db, user_id, req)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
