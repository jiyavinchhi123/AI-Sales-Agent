"""Lead-to-Product Semantic Matching Service"""

from typing import List
from app.schemas.business import ProductOffering
from app.schemas.lead import Lead, OfferingMatch
from app.services.business_service import business_service


class MatchingService:
    def match_lead_to_offerings(self, lead: Lead, products: List[ProductOffering]) -> OfferingMatch:
        """
        Calculates semantic alignment between lead signals, tech stack, industry,
        and product offerings. Returns the highest-scoring product match.
        """
        best_product = products[0] if products else None
        highest_score = 70
        matched_features = []
        reasoning = ""
        suggested_pitch = ""

        lead_text = f"{lead.industry} {' '.join(lead.signals_summary)} {' '.join(lead.tech_stack)}".lower()

        # Rule & Semantic Evaluation
        for product in products:
            score = 65
            features = []

            # Match signals
            if "compliance" in lead_text or "soc 2" in lead_text or "iso" in lead_text or "audit" in lead_text:
                if product.id == "prod-auditbot":
                    score += 28
                    features.extend(["Automated SOC 2 & ISO 27001 evidence", "Auditor portal sync"])
            
            if "iam" in lead_text or "permission" in lead_text or "identity" in lead_text or "zero-trust" in lead_text:
                if product.id == "prod-ciem":
                    score += 27
                    features.extend(["Least-privilege role right-sizing", "Toxic permission combination mapping"])
            
            if "aws" in lead_text or "cloud" in lead_text or "kubernetes" in lead_text or "drift" in lead_text:
                if product.id == "prod-cspm":
                    score += 24
                    features.extend(["Agentless multi-cloud posture", "Automated Terraform PR remediation"])

            if score > highest_score:
                highest_score = min(score, 98)
                best_product = product
                matched_features = features or product.key_features[:2]

        if best_product:
            reasoning = f"Matched {lead.company_name} with {best_product.name} based on active compliance & infrastructure signals."
            suggested_pitch = f"Accelerate {lead.company_name}'s security posture with automated {best_product.category}."
            match_tier = "Strong" if highest_score >= 85 else "Moderate"
            return OfferingMatch(
                product_id=best_product.id,
                product_name=best_product.name,
                fit_score=highest_score,
                match_tier=match_tier,
                reasoning=reasoning,
                aligned_features=matched_features,
                suggested_pitch=suggested_pitch
            )
        
        return OfferingMatch(
            product_id="prod-cspm",
            product_name="CloudArmor Posture Guard",
            fit_score=75,
            match_tier="Moderate",
            reasoning="General cloud security posture alignment.",
            aligned_features=["Agentless inventory", "Misconfiguration alerts"],
            suggested_pitch="Streamline cloud security reviews for engineering teams."
        )


matching_service = MatchingService()
