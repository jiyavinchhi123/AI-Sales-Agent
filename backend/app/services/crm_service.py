"""CRM Handoff and Next-Best-Action Service"""

from typing import List, Optional
import uuid
import datetime
from app.schemas.opportunity import Opportunity, NextBestAction, CRMHandoffRequest
from app.services.mock_data_generator import get_default_opportunities


class CRMService:
    def __init__(self):
        self._opportunities: List[Opportunity] = get_default_opportunities()

    def get_opportunities(self) -> List[Opportunity]:
        return self._opportunities

    def get_opportunity_by_id(self, opp_id: str) -> Optional[Opportunity]:
        for opp in self._opportunities:
            if opp.id == opp_id:
                return opp
        return None

    def create_opportunity(
        self,
        lead_id: str,
        company_name: str,
        domain: str,
        contact_name: str,
        contact_email: str,
        matched_offering: str,
        deal_value: str = "$30,000 ARR"
    ) -> Opportunity:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        new_opp = Opportunity(
            id=f"opp-{uuid.uuid4().hex[:6]}",
            lead_id=lead_id,
            company_name=company_name,
            domain=domain,
            contact_name=contact_name,
            contact_email=contact_email,
            matched_offering=matched_offering,
            deal_value_estimate=deal_value,
            stage="Qualified_Lead",
            win_probability=70,
            assigned_rep="David Miller (Senior Enterprise AE)",
            next_action=NextBestAction(
                id=f"act-{uuid.uuid4().hex[:4]}",
                lead_id=lead_id,
                action_type="schedule_demo",
                title="Send Calendar Invitation for Solutions Architecture Walkthrough",
                rationale="Lead verified high intent following AI call qualification.",
                priority="Urgent",
                suggested_email_or_script=f"Hi {contact_name},\n\nLooking forward to demonstrating how our solution integrates with your environment.\n\nBest,\nDavid",
                completed=False
            ),
            crm_synced=False,
            crm_target="HubSpot",
            crm_record_id=None,
            created_at=now_iso,
            updated_at=now_iso
        )
        self._opportunities.insert(0, new_opp)
        return new_opp

    def export_to_crm(self, req: CRMHandoffRequest) -> Opportunity:
        opp = self.get_opportunity_by_id(req.opportunity_id)
        if not opp:
            raise ValueError(f"Opportunity {req.opportunity_id} not found")

        opp.crm_synced = True
        opp.crm_target = req.target_crm
        opp.crm_record_id = f"{req.target_crm[:2].upper()}-{uuid.uuid4().hex[:6].upper()}"
        opp.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return opp


crm_service = CRMService()
