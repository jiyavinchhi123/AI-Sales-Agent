from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.opportunity import Opportunity, CRMHandoffRequest
from app.services.crm_service import crm_service
from app.services.lead_service import lead_service

router = APIRouter()


@router.get("", response_model=List[Opportunity])
def list_opportunities():
    """List all qualified sales opportunities and their current deal stages."""
    return crm_service.get_opportunities()


@router.get("/{opp_id}", response_model=Opportunity)
def get_opportunity(opp_id: str):
    """Get single opportunity with its recommended next best action."""
    opp = crm_service.get_opportunity_by_id(opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp


@router.post("/create-from-lead/{lead_id}", response_model=Opportunity)
def create_opportunity_from_lead(lead_id: str):
    """Convert an interested / qualified lead into an active sales opportunity."""
    lead = lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    contact_name = lead.primary_contact.name if lead.primary_contact else "Buyer Champion"
    contact_email = lead.primary_contact.email if lead.primary_contact else f"info@{lead.domain}"
    offering_name = lead.match.product_name if lead.match else "Cloud Security Suite"

    opp = crm_service.create_opportunity(
        lead_id=lead_id,
        company_name=lead.company_name,
        domain=lead.domain,
        contact_name=contact_name,
        contact_email=contact_email,
        matched_offering=offering_name,
        deal_value="$35,000 ARR"
    )
    lead_service.update_status(lead_id, "Opportunity_Created")
    return opp


@router.post("/crm-export", response_model=Opportunity)
def export_opportunity_to_crm(req: CRMHandoffRequest):
    """1-Click CRM Handoff: Sync opportunity deal card and insights to HubSpot / Salesforce / Webhook."""
    try:
        updated = crm_service.export_to_crm(req)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
