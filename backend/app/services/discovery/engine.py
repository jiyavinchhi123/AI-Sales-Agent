"""
Discovery Engine Orchestrator
Coordinates DiscoveryProvider instances, connects with active seller profile from SQLite,
and persists converted opportunities into the database as active pipeline leads.
"""

from typing import List, Optional
import uuid
import datetime
from sqlalchemy.orm import Session

from app.schemas.discovery import DiscoveredOpportunity, DiscoveryFilters
from app.services.discovery.base import DiscoveryProvider
from app.services.discovery.live_provider import LiveRealtimeDiscoveryProvider
from app.services.business_service import business_service
from app.services.lead_service import lead_service
from app.schemas.lead import Lead


class DiscoveryEngine:
    def __init__(self, provider: Optional[DiscoveryProvider] = None):
        self._provider: DiscoveryProvider = provider or LiveRealtimeDiscoveryProvider()
        self._saved_opportunities: List[DiscoveredOpportunity] = []

    def set_provider(self, provider: DiscoveryProvider):
        self._provider = provider

    async def discover(
        self,
        filters: DiscoveryFilters,
        user_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> List[DiscoveredOpportunity]:
        """
        Executes discovery using the active provider, matching against
        the seller's active profile from SQLite.
        """
        seller_profile = None
        if user_id and db:
            seller_profile = business_service.get_profile_by_user(user_id, db)

        results = await self._provider.discover_requirements(filters, seller_profile)
        self._saved_opportunities = results
        return results

    def convert_to_lead(
        self,
        opportunity_id: str,
        user_id: str,
        db: Session,
    ) -> Optional[Lead]:
        """Converts a discovered buying requirement into a persistent lead in SQLite."""
        target_opp = None
        for opp in self._saved_opportunities:
            if opp.id == opportunity_id:
                target_opp = opp
                break

        if not target_opp:
            from app.services.discovery.mock_provider import get_base_mock_dataset
            for opp in get_base_mock_dataset():
                if opp.id == opportunity_id:
                    target_opp = opp
                    break

        if not target_opp:
            return None

        # Check if lead already exists in DB for this user
        existing_leads = lead_service.get_leads(db, user_id=user_id, search=target_opp.company.domain)
        if existing_leads:
            existing = existing_leads[0]
            lead_service.update_status(db, user_id, existing.id, "Outreach_Ready")
            target_opp.status = "Converted"
            return existing

        created = lead_service.create_lead(
            db=db,
            user_id=user_id,
            company_name=target_opp.company.name,
            domain=target_opp.company.domain,
            industry=target_opp.company.industry,
            location=target_opp.company.location,
            employee_count=target_opp.company.employee_count,
            revenue_estimate=target_opp.company.revenue_estimate or "$20M ARR",
            requirement_title=target_opp.requirement.title,
            requirement_description=target_opp.requirement.description,
            source_platform=target_opp.source.platform,
            source_url=target_opp.source.original_url,
            intent_level=target_opp.intent_level,
            match_score=target_opp.match_score,
            matched_offering=target_opp.matched_offering,
            status="Outreach_Ready",
            notes=f"Discovered via {target_opp.source.platform}. Original URL: {target_opp.source.original_url}",
        )

        target_opp.status = "Converted"
        return created


discovery_engine = DiscoveryEngine()
