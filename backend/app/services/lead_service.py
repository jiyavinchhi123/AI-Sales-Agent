"""Lead Management and Pipeline Service"""

from typing import List, Optional
import uuid
import datetime
from app.schemas.lead import Lead, LeadCreate, LeadContact, OfferingMatch, IntentScore
from app.schemas.signal import BuyingSignal
from app.services.mock_data_generator import get_default_leads
from app.services.business_service import business_service
from app.services.matching_service import matching_service
from app.services.scoring_service import scoring_service
from app.services.discovery_service import discovery_service


class LeadService:
    def __init__(self):
        self._leads: List[Lead] = get_default_leads()

    def get_leads(
        self,
        status: Optional[str] = None,
        grade: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Lead]:
        results = self._leads
        if status:
            results = [l for l in results if l.status.lower() == status.lower()]
        if grade:
            results = [l for l in results if l.intent and l.intent.grade.upper() == grade.upper()]
        if search:
            s = search.lower()
            results = [
                l for l in results
                if s in l.company_name.lower() or s in l.domain.lower() or s in l.industry.lower()
            ]
        return results

    def get_lead_by_id(self, lead_id: str) -> Optional[Lead]:
        for l in self._leads:
            if l.id == lead_id:
                return l
        return None

    def create_lead_from_signal(self, signal: BuyingSignal) -> Lead:
        lead_id = f"lead-{uuid.uuid4().hex[:6]}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Enriched contact
        contact = LeadContact(
            name="Alex Morales",
            title="VP of Infrastructure & Platform Security",
            role_level="VP",
            email=f"a.morales@{signal.domain}",
            phone="+1 (555) 301-4492",
            linkedin_url=f"https://linkedin.com/in/alex-morales-{signal.domain.split('.')[0]}",
            decision_authority="Primary"
        )

        new_lead = Lead(
            id=lead_id,
            company_name=signal.company_name,
            domain=signal.domain,
            industry="Autonomous Systems & Robotics",
            employee_count="120",
            estimated_revenue="$18M ARR",
            location="Denver, CO",
            tech_stack=["AWS", "Kubernetes", "ROS", "Docker", "Terraform"],
            signals_count=1,
            signals_summary=[signal.title],
            contacts=[contact],
            primary_contact=contact,
            match=None,
            intent=None,
            status="Enriched",
            created_at=now_iso,
            updated_at=now_iso,
            notes=f"Auto-generated from buying signal: {signal.title}"
        )

        # Run semantic matching & scoring
        biz_profile = business_service.get_profile()
        new_lead.match = matching_service.match_lead_to_offerings(new_lead, biz_profile.products)
        new_lead.intent = scoring_service.calculate_intent_score(new_lead, [signal])
        new_lead.status = "Matched"

        self._leads.insert(0, new_lead)
        discovery_service.mark_processed(signal.id, lead_id)
        return new_lead

    def update_status(self, lead_id: str, new_status: str) -> Optional[Lead]:
        lead = self.get_lead_by_id(lead_id)
        if lead:
            lead.status = new_status
            lead.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            return lead
        return None


lead_service = LeadService()
