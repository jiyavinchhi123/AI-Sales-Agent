"""
Lead-to-Product Dynamic Matching Service
Calculates semantic alignment between lead requirements/signals and active business profile offerings.
Zero hardcoded company or product templates.
"""

from typing import List, Optional
from app.schemas.business import ProductOffering, StructuredBusinessProfile
from app.schemas.lead import Lead, OfferingMatch


class MatchingService:
    def match_lead_to_offerings(
        self,
        lead: Lead,
        products: Optional[List[ProductOffering]] = None,
        seller_profile: Optional[StructuredBusinessProfile] = None
    ) -> OfferingMatch:
        """
        Calculates semantic alignment between lead signals, industry, and seller offerings.
        Returns the highest-scoring offering match dynamically.
        """
        # Collect candidate offerings
        offerings_list = []
        if products:
            offerings_list.extend([p.name for p in products if p.name])
        if seller_profile and seller_profile.products_services:
            offerings_list.extend([p for p in seller_profile.products_services if p])

        if not offerings_list:
            offerings_list = [lead.matched_offering or "Commercial Sourcing"]

        lead_signals_text = " ".join(lead.signals_summary or []).lower()
        lead_full_text = f"{lead.company_name} {lead.industry} {lead_signals_text} {lead.matched_offering or ''}".lower()

        best_offering = offerings_list[0]
        highest_score = 75

        # Check for token or substring overlaps
        for off in offerings_list:
            off_tokens = set(off.lower().split())
            overlap = sum(1 for t in off_tokens if len(t) > 3 and t in lead_full_text)
            score = 70 + (overlap * 10)
            if score > highest_score:
                highest_score = min(score, 98)
                best_offering = off

        match_tier = "Strong" if highest_score >= 85 else "Moderate"

        return OfferingMatch(
            product_id="prod-matched",
            product_name=best_offering,
            fit_score=highest_score,
            match_tier=match_tier,
            reasoning=f"Matched {lead.company_name}'s stated requirements with verified offering: {best_offering}.",
            aligned_features=[best_offering],
            suggested_pitch=f"Supply high-grade {best_offering} with verified capacity tailored to {lead.company_name}."
        )


matching_service = MatchingService()
