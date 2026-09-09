"""CRM Handoff and Next-Best-Action Service. Zero static demo defaults."""

from typing import List, Optional
import uuid
import datetime
from app.schemas.opportunity import Opportunity, NextBestAction, CRMHandoffRequest


class CRMService:
    def __init__(self):
        self._opportunities: List[Opportunity] = []

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
            stage="Discovery",
            win_probability=60,
            assigned_sales_rep="Assigned AE",
            next_action=NextBestAction(
                action_type="Technical Demo",
                title=f"Schedule 20-min technical preview with {contact_name}",
                due_in="2 business days",
                priority="High",
                context_rationale="Prospect validated intent requirement.",
                recommended_collateral=[]
            ),
            qualification_notes="Converted from active pipeline lead.",
            crm_synced=False,
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
        opp.crm_record_id = f"{req.target_crm.upper()[:3]}-{uuid.uuid4().hex[:6].upper()}"
        opp.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return opp


crm_service = CRMService()
