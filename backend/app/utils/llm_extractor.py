"""
LLM Extraction Utility
Extracts structured business profiles using LLMs (OpenAI, Gemini) with
intelligent heuristic fallback for offline / demo mode.
"""

import os
import json
import httpx
from typing import Dict, Any, List
from app.core.config import settings
from app.schemas.business import StructuredBusinessProfile


SYSTEM_PROMPT = """You are an expert enterprise B2B sales strategist and product analyst.
Your task is to analyze the provided business details and collateral text, then extract a structured business intelligence profile.

Return ONLY a valid JSON object matching this exact schema:
{
  "company_summary": "A concise 2-3 sentence summary of what the company does and its core value proposition.",
  "products_services": ["List of distinct products or services offered"],
  "target_customers": ["Specific target buyer titles and personas, e.g., CISO, VP of Engineering"],
  "target_industries": ["Industries served, e.g., FinTech, Healthcare, Enterprise SaaS"],
  "target_locations": ["Geographies served, e.g., North America, Europe, Global"],
  "ideal_customer_profile": "A crisp definition of the ideal account: headcount, revenue, cloud stack, maturity level.",
  "keywords": ["High-intent search terms and technical keywords associated with their offering"],
  "buying_signals": ["Market trigger events that indicate high buying intent for this company, e.g., Series B funding, SOC 2 audit deadline, hiring security team"]
}
"""


def _clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Helper to clean markdown fences if present."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


async def extract_business_profile_with_llm(
    company_name: str,
    company_website: str,
    business_description: str,
    products_services: str,
    target_industries: str,
    target_locations: str,
    ideal_customer_profile: str,
    document_text: str,
    source_files: List[str]
) -> StructuredBusinessProfile:
    """
    Attempts to call live LLM (OpenAI or Gemini) if API key is configured.
    Falls back gracefully to intelligent domain synthesis if offline or key missing.
    """
    user_content = f"""
Company Name: {company_name}
Company Website: {company_website}
Business Description: {business_description}
Products / Services: {products_services}
Target Industries: {target_industries}
Target Locations: {target_locations}
Ideal Customer Profile: {ideal_customer_profile}

Attached Document Content:
{document_text[:6000]}
"""

    # 1. Try OpenAI if key is set
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.startswith("sk-"):
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_content}
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.2
                    }
                )
                if res.status_code == 200:
                    data = res.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(data)
                    return StructuredBusinessProfile(
                        company_name=company_name,
                        company_website=company_website,
                        company_summary=parsed.get("company_summary", business_description),
                        products_services=parsed.get("products_services", []),
                        target_customers=parsed.get("target_customers", []),
                        target_industries=parsed.get("target_industries", []),
                        target_locations=parsed.get("target_locations", []),
                        ideal_customer_profile=parsed.get("ideal_customer_profile", ideal_customer_profile),
                        keywords=parsed.get("keywords", []),
                        buying_signals=parsed.get("buying_signals", []),
                        is_demo_mode=False,
                        source_files=source_files
                    )
        except Exception as e:
            print(f"[LLM Extractor] OpenAI call failed: {e}. Falling back to demo extractor.")

    # 2. Try Gemini if key is set
    if settings.GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"{SYSTEM_PROMPT}\n\n{user_content}"
                res = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]}
                )
                if res.status_code == 200:
                    text_out = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = _clean_json_response(text_out)
                    return StructuredBusinessProfile(
                        company_name=company_name,
                        company_website=company_website,
                        company_summary=parsed.get("company_summary", business_description),
                        products_services=parsed.get("products_services", []),
                        target_customers=parsed.get("target_customers", []),
                        target_industries=parsed.get("target_industries", []),
                        target_locations=parsed.get("target_locations", []),
                        ideal_customer_profile=parsed.get("ideal_customer_profile", ideal_customer_profile),
                        keywords=parsed.get("keywords", []),
                        buying_signals=parsed.get("buying_signals", []),
                        is_demo_mode=False,
                        source_files=source_files
                    )
        except Exception as e:
            print(f"[LLM Extractor] Gemini call failed: {e}. Falling back to demo extractor.")

    # 3. Context-Aware Demo Extractor (Adaptive to any domain: Fintech, Healthcare, Cloud, AI)
    return _synthesize_demo_profile(
        company_name=company_name,
        company_website=company_website,
        business_description=business_description,
        products_services=products_services,
        target_industries=target_industries,
        target_locations=target_locations,
        ideal_customer_profile=ideal_customer_profile,
        document_text=document_text,
        source_files=source_files
    )


def _synthesize_demo_profile(
    company_name: str,
    company_website: str,
    business_description: str,
    products_services: str,
    target_industries: str,
    target_locations: str,
    ideal_customer_profile: str,
    document_text: str,
    source_files: List[str]
) -> StructuredBusinessProfile:
    """
    Context-aware synthesis that dynamically adapts keywords, buying signals,
    and buyer personas to the specific domain entered by the user.
    """
    def split_items(raw: str, default_list: List[str]) -> List[str]:
        if not raw:
            return default_list
        items = [i.strip() for i in raw.replace('\n', ',').split(',') if i.strip()]
        return items if items else default_list

    # Products & Services
    prods = split_items(
        products_services,
        [f"{company_name} Platform", f"{company_name} Enterprise Suite", "API Engine"]
    )

    # Industries
    industries = split_items(
        target_industries,
        ["B2B SaaS", "Enterprise Technology", "Global Organizations"]
    )

    # Locations
    locations = split_items(
        target_locations,
        ["North America", "Western Europe", "Global Remote"]
    )

    combined_text = f"{company_name} {business_description} {products_services} {target_industries} {document_text}".lower()

    # Domain 1: Fintech / AML / Fraud / Banking
    if any(k in combined_text for k in ["fintech", "aml", "fraud", "ledger", "banking", "payment", "crypto", "dispute", "transaction"]):
        personas = [
            "Chief Risk & Compliance Officer (CRCO)",
            "Head of Anti-Money Laundering (AML)",
            "VP of Fraud Operations & Risk",
            "Head of Financial Infrastructure / Core Banking"
        ]
        keywords = [
            "real-time AML monitoring",
            "synthetic identity fraud detection",
            "dispute & chargeback automation",
            "core banking ledger intelligence",
            "transaction risk scoring",
            "FINRA / FCA compliance audit",
            "cross-border payment monitoring"
        ]
        signals = [
            "Monthly payment or ledger transaction volume exceeding $20M",
            "Recent Series A/B/C funding round announced (> $15M raised)",
            "Spike in fraudulent dispute chargebacks or KYC account takeover",
            "Regulatory compliance audit or new banking partner licensing requirement",
            "Expansion into new cross-border payment rails or digital currencies"
        ]
        summary = (
            f"{company_name} provides an intelligent financial intelligence platform that {business_description.strip().rstrip('.')}. "
            f"By integrating directly with core banking and payment rails, {company_name} automates real-time anomaly detection, "
            f"slashes false-positive investigation times, and streamlines regulatory compliance for high-volume transactions."
        )

    # Domain 2: Healthcare / MedTech / HIPAA
    elif any(k in combined_text for k in ["health", "med", "clinic", "hipaa", "patient", "telehealth", "doctor"]):
        personas = [
            "Chief Medical Officer / VP Clinical Ops",
            "Chief Information Security Officer (CISO - Health)",
            "Director of Healthcare Compliance & Privacy",
            "VP of Digital Health Engineering"
        ]
        keywords = [
            "HIPAA compliance automation",
            "protected health information (PHI) governance",
            "telehealth EHR integration",
            "clinical workflow automation",
            "cross-border medical data residency",
            "patient data security"
        ]
        signals = [
            "Launch of telehealth services in new regulated state or country",
            "Upcoming HIPAA or HITRUST annual recertification deadline",
            "Recent healthcare venture funding round ($10M+)",
            "Hiring surge for Clinical Operations and Security roles"
        ]
        summary = (
            f"{company_name} delivers an enterprise digital health platform that {business_description.strip().rstrip('.')}. "
            f"Designed specifically for modern healthcare workflows, it ensures rigorous PHI privacy, automated audit logging, "
            f"and compliant care delivery at scale."
        )

    # Domain 3: Cloud Infrastructure / Cybersecurity
    elif any(k in combined_text for k in ["security", "cloud", "soc 2", "iso 27001", "iam", "kubernetes", "aws", "posture"]):
        personas = [
            "VP of Information Security / CISO",
            "CTO & VP of Engineering",
            "Head of Infrastructure & Cloud Platform",
            "Director of DevSecOps & Governance"
        ]
        keywords = [
            "cloud security posture",
            "continuous SOC 2 compliance",
            "agentic remediation",
            "multi-cloud governance",
            "least-privilege IAM",
            "Terraform automation",
            "enterprise audit acceleration"
        ]
        signals = [
            "Recent Series A/B/C funding round announced (> $15M raised)",
            "Active hiring surge for Head of Security or Senior DevOps engineers",
            "Enterprise deals blocked pending SOC 2 / ISO audit certification",
            "European geographic expansion requiring GDPR & ISO compliance",
            "Cloud migration to AWS / GCP multi-account architecture"
        ]
        summary = (
            f"{company_name} provides an autonomous cloud security and continuous compliance platform that {business_description.strip().rstrip('.')}. "
            f"By connecting directly via native cloud APIs, {company_name} eliminates manual reviews, enforces least-privilege policies, "
            f"and streamlines auditor evidence gathering into a unified workflow."
        )

    # Domain 4: General B2B Enterprise SaaS / AI
    else:
        personas = [
            "VP of Product / Head of Engineering",
            "Chief Operating Officer (COO)",
            "VP of Sales / Revenue Operations",
            "Enterprise Architecture Director"
        ]
        keywords = [
            f"{company_name.lower()} enterprise solution",
            "workflow automation",
            "high-velocity execution",
            "enterprise scalability",
            "modern tech stack integration",
            "ROI optimization"
        ]
        signals = [
            "Rapid team expansion or headcount growth > 25%",
            "New funding round or strategic investment announced",
            "Adoption of modern cloud-native software stack",
            "Entering new commercial markets or international geographies"
        ]
        summary = (
            f"{company_name} provides an innovative software platform that {business_description.strip().rstrip('.')}. "
            f"It empowers high-growth teams to streamline mission-critical operations, reduce friction, "
            f"and drive measurable business ROI."
        )

    # ICP fallback if empty
    icp = ideal_customer_profile.strip() if ideal_customer_profile else (
        f"High-growth {industries[0]} companies with 50-1,000 employees operating in {locations[0]}, "
        f"actively modernizing operations and scaling transaction volume."
    )

    return StructuredBusinessProfile(
        company_name=company_name,
        company_website=company_website,
        company_summary=summary,
        products_services=prods,
        target_customers=personas,
        target_industries=industries,
        target_locations=locations,
        ideal_customer_profile=icp,
        keywords=keywords,
        buying_signals=signals,
        is_demo_mode=True,
        source_files=source_files
    )
