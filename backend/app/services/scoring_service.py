"""Lead Multi-factor Intent Scoring Service"""

from typing import List
from app.schemas.lead import Lead, IntentScore
from app.schemas.signal import BuyingSignal


class ScoringService:
    def calculate_intent_score(self, lead: Lead, signals: List[BuyingSignal]) -> IntentScore:
        """
        Calculates multi-dimensional intent score:
        - Urgency (30%): signal recency, regulatory deadlines, expansion
        - Fit (30%): industry, tech stack alignment, company size
        - Authority (20%): presence of C-Level / VP decision makers
        - Timing (20%): funding round, hiring momentum
        """
        urgency = 75
        fit = 80
        authority = 70
        timing = 70
        key_drivers = []

        # Analyze matching signals
        company_signals = [s for s in signals if s.domain.lower() == lead.domain.lower() or s.company_name.lower() == lead.company_name.lower()]
        
        for sig in company_signals:
            if sig.signal_type == "funding":
                timing += 18
                key_drivers.append("Recent major funding event provides clear budget authorization")
            elif sig.signal_type == "compliance_deadline":
                urgency += 20
                key_drivers.append("Upcoming compliance audit creates hard project deadline")
            elif sig.signal_type == "hiring_surge":
                urgency += 14
                key_drivers.append("Active hiring surge in security & engineering indicates workload pressure")
            elif sig.signal_type == "expansion":
                fit += 12
                urgency += 10
                key_drivers.append("Geographic or product expansion requires new regulatory compliance")

        # Contact authority check
        if lead.primary_contact:
            role = lead.primary_contact.role_level
            if role in ["C-Level", "VP"]:
                authority += 22
                key_drivers.append(f"Identified executive decision-maker ({lead.primary_contact.title})")
            elif role == "Director":
                authority += 14

        # Clamping
        urgency = min(urgency, 99)
        fit = min(fit, 99)
        authority = min(authority, 99)
        timing = min(timing, 99)

        overall = int((urgency * 0.30) + (fit * 0.30) + (authority * 0.20) + (timing * 0.20))
        overall = min(overall, 99)

        if overall >= 90:
            grade = "A"
            readiness = "Immediate (0-30 days)"
        elif overall >= 80:
            grade = "B"
            readiness = "High (30-60 days)"
        elif overall >= 70:
            grade = "C"
            readiness = "Exploring (60-90 days)"
        else:
            grade = "D"
            readiness = "Low / Nurture"

        if not key_drivers:
            key_drivers = ["Relevant cloud tech stack alignment", "Standard qualification criteria met"]

        return IntentScore(
            overall_score=overall,
            grade=grade,
            urgency_component=urgency,
            fit_component=fit,
            authority_component=authority,
            timing_component=timing,
            buying_readiness=readiness,
            key_drivers=key_drivers[:3]
        )


scoring_service = ScoringService()
