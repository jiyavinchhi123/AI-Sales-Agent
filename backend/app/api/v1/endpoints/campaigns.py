from typing import List
from fastapi import APIRouter
from app.schemas.campaign import Campaign, CampaignCreate
from app.services.campaign_service import campaign_service

router = APIRouter()


@router.get("", response_model=List[Campaign])
def list_campaigns():
    """List all outbound multi-channel AI campaigns."""
    return campaign_service.get_campaigns()


@router.post("", response_model=Campaign)
def create_campaign(req: CampaignCreate):
    """Create a new outbound campaign targeting high-intent signals."""
    return campaign_service.create_campaign(req)
