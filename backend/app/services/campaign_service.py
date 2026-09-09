"""Campaign Management Service"""

from typing import List, Optional
import uuid
import datetime
from app.schemas.campaign import Campaign, CampaignCreate
from app.services.mock_data_generator import get_default_campaigns


class CampaignService:
    def __init__(self):
        self._campaigns: List[Campaign] = get_default_campaigns()

    def get_campaigns(self) -> List[Campaign]:
        return self._campaigns

    def create_campaign(self, req: CampaignCreate) -> Campaign:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        campaign = Campaign(
            id=f"camp-{uuid.uuid4().hex[:4]}",
            name=req.name,
            description=req.description,
            target_criteria=req.target_criteria,
            status="Active",
            channels=req.channels,
            total_leads=0,
            contacted_count=0,
            interested_count=0,
            scheduled_meetings=0,
            response_rate=0.0,
            created_at=now_iso
        )
        self._campaigns.insert(0, campaign)
        return campaign


campaign_service = CampaignService()
