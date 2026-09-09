"""Business Profile and Product Offering Service with Step 2 LLM Extraction"""

import datetime
from typing import Optional, List, Tuple
from app.schemas.business import (
    BusinessProfile, BusinessProfileUpdate, ProductOffering,
    BusinessAnalyzeInput, StructuredBusinessProfile
)
from app.services.mock_data_generator import get_default_business_profile
from app.utils.document_parser import extract_text_from_file
from app.utils.llm_extractor import extract_business_profile_with_llm


def get_default_structured_profile() -> StructuredBusinessProfile:
    return StructuredBusinessProfile(
        company_name="CloudArmor AI",
        company_website="https://cloudarmor.ai",
        company_summary=(
            "CloudArmor AI delivers an autonomous cloud security and continuous compliance platform "
            "that monitors AWS, GCP, and Kubernetes for misconfigurations, detects least-privilege IAM risks, "
            "and automates 90% of SOC 2, ISO 27001, and HIPAA audit evidence gathering."
        ),
        products_services=[
            "CloudArmor Posture Guard (CSPM)",
            "AuditBot 360 (Automated Compliance)",
            "Zero-Trust Identity Sentinel (CIEM)"
        ],
        target_customers=[
            "VP of Information Security / CISO",
            "CTO & VP of Engineering",
            "Head of Infrastructure & SecOps",
            "DevSecOps / Compliance Leads"
        ],
        target_industries=[
            "Fintech & RegTech",
            "Healthcare & Telemedicine",
            "B2B Enterprise SaaS",
            "AI & Autonomous Systems"
        ],
        target_locations=[
            "North America (US, Canada)",
            "European Union (UK, Germany, France)",
            "Global Remote-First Organizations"
        ],
        ideal_customer_profile=(
            "Series A to Pre-IPO tech scaleups with 40-1,000 employees running multi-account cloud environments, "
            "facing upcoming enterprise audits, and seeking to unblock revenue stalled on compliance reviews."
        ),
        keywords=[
            "cloud posture management",
            "automated SOC 2 evidence",
            "agentic terraform PRs",
            "least privilege IAM",
            "HIPAA audit acceleration",
            "continuous cloud compliance"
        ],
        buying_signals=[
            "Series A/B/C funding round announced (> $15M raised)",
            "Active hiring for Head of Security or DevOps engineers",
            "Enterprise deals blocked pending SOC 2 / ISO audit certification",
            "European geographic expansion requiring GDPR & ISO compliance",
            "Cloud migration or multi-account infrastructure restructuring"
        ],
        is_demo_mode=True,
        source_files=["CloudArmor_Architecture_Whitepaper_2026.pdf"],
        updated_at="2026-03-08T12:00:00Z"
    )


class BusinessService:
    def __init__(self):
        self._profile: BusinessProfile = get_default_business_profile()
        self._structured_profile: StructuredBusinessProfile = get_default_structured_profile()

    def get_profile(self) -> BusinessProfile:
        return self._profile

    def get_structured_profile(self) -> StructuredBusinessProfile:
        return self._structured_profile

    def update_structured_profile(self, updated: StructuredBusinessProfile) -> StructuredBusinessProfile:
        updated.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self._structured_profile = updated
        
        # Also sync company name and website to base profile
        self._profile.company_name = updated.company_name
        self._profile.domain = updated.company_website.replace("https://", "").replace("http://", "").split("/")[0]
        self._profile.headline = updated.company_summary[:120] + "..." if len(updated.company_summary) > 120 else updated.company_summary
        self._profile.description = updated.company_summary
        return self._structured_profile

    async def analyze_business(
        self,
        input_data: BusinessAnalyzeInput,
        uploaded_files: Optional[List[Tuple[str, bytes]]] = None
    ) -> StructuredBusinessProfile:
        """
        Parses text from any uploaded files (PDF, DOCX, TXT), feeds inputs
        into LLM extractor (with demo mode fallback), and saves the structured profile.
        """
        combined_doc_text = ""
        source_files_names = []

        if uploaded_files:
            for fname, fbytes in uploaded_files:
                text, _ = extract_text_from_file(fname, fbytes)
                if text:
                    combined_doc_text += f"\n--- File: {fname} ---\n{text}\n"
                    source_files_names.append(fname)

        extracted = await extract_business_profile_with_llm(
            company_name=input_data.company_name,
            company_website=input_data.company_website,
            business_description=input_data.business_description,
            products_services=input_data.products_services or "",
            target_industries=input_data.target_industries or "",
            target_locations=input_data.target_locations or "",
            ideal_customer_profile=input_data.ideal_customer_profile or "",
            document_text=combined_doc_text,
            source_files=source_files_names
        )

        extracted.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self._structured_profile = extracted
        
        # Sync to base profile
        self._profile.company_name = extracted.company_name
        self._profile.domain = extracted.company_website.replace("https://", "").replace("http://", "").split("/")[0]
        self._profile.description = extracted.company_summary
        
        return self._structured_profile

    def update_profile(self, update_data: BusinessProfileUpdate) -> BusinessProfile:
        current_data = self._profile.model_dump()
        update_dict = update_data.model_dump(exclude_unset=True)
        current_data.update(update_dict)
        self._profile = BusinessProfile(**current_data)
        return self._profile

    def add_product(self, product: ProductOffering) -> BusinessProfile:
        self._profile.products.append(product)
        return self._profile

    def get_product(self, product_id: str) -> Optional[ProductOffering]:
        for prod in self._profile.products:
            if prod.id == product_id:
                return prod
        return None

    def reset_to_default(self) -> BusinessProfile:
        self._profile = get_default_business_profile()
        self._structured_profile = get_default_structured_profile()
        return self._profile


business_service = BusinessService()
