"""
Rich Mock Dataset & Domain Engine for 'AI Sales Agent — Signal to Opportunity'
Provides a complete B2B Cybersecurity SaaS demonstration scenario:
Seller: 'CloudArmor AI' selling to scaleup prospects with detected buying signals.
"""

from typing import Dict, List, Any
import datetime
from app.schemas.business import BusinessProfile, ProductOffering, TargetPersona
from app.schemas.signal import BuyingSignal
from app.schemas.lead import Lead, LeadContact, OfferingMatch, IntentScore
from app.schemas.call import CallSession, CallTurn, CallInsights, ObjectionBattlecard
from app.schemas.campaign import Campaign
from app.schemas.opportunity import Opportunity, NextBestAction


def get_default_business_profile() -> BusinessProfile:
    return BusinessProfile(
        id="biz-cloudarmor",
        company_name="CloudArmor AI",
        domain="cloudarmor.ai",
        industry="Cybersecurity & Cloud Infrastructure",
        headline="Autonomous Cloud Security & Continuous Compliance for High-Growth Scaleups",
        description=(
            "CloudArmor AI delivers an agentic cloud security platform that continuously monitors "
            "AWS, GCP, and Kubernetes for configuration drift, enforces zero-trust identity policies, "
            "and automates 90% of SOC 2, ISO 27001, and HIPAA compliance audit evidence."
        ),
        value_propositions=[
            "Cut compliance audit preparation time from 4 months to under 10 days.",
            "Autonomous remediation of cloud posture risks before auditors or attackers notice.",
            "Unified agentless visibility across multi-cloud environments in 15 minutes.",
            "Eliminate redundant legacy security tooling with an all-in-one platform."
        ],
        differentiators=[
            "Agentic Remediation: Generates verified Infrastructure-as-Code (Terraform) PRs to fix security issues.",
            "Native LLM Copilot: Translates complex IAM permissions and compliance clauses into human explanations.",
            "Fastest Time-to-Value: Zero-agent API integration with AWS/GCP/Kubernetes in under 15 minutes."
        ],
        products=[
            ProductOffering(
                id="prod-cspm",
                name="CloudArmor Posture Guard",
                category="Cloud Security Posture Management (CSPM)",
                tagline="Agentless multi-cloud visibility and automated drift remediation",
                description="Continuously audits multi-cloud assets against 400+ CIS benchmarks and security standards with 1-click auto-remediation.",
                key_features=[
                    "Multi-cloud agentless asset inventory",
                    "Continuous CIS Benchmark scanning",
                    "Automated Terraform pull request generation",
                    "Real-time misconfiguration alerts"
                ],
                target_pain_points=[
                    "Manual security reviews slowing down deployments",
                    "Blind spots in sprawling cloud resources",
                    "Engineers overwhelmed by false-positive security alerts"
                ],
                pricing_tier="Starting at $18,000 / year",
                ideal_customer_size="50 - 1,000 employees",
                proof_point="Reduced cloud vulnerability backlog by 74% in 30 days for Series B Fintechs."
            ),
            ProductOffering(
                id="prod-auditbot",
                name="AuditBot 360",
                category="Continuous Compliance & Audit Automation",
                tagline="Automate 90% of SOC 2, ISO 27001, and HIPAA evidence gathering",
                description="AI compliance copilot that links cloud infrastructure, HRIS, and developer tools to automatically gather auditor-grade evidence 24/7.",
                key_features=[
                    "Instant evidence generation for SOC 2 Type II and ISO 27001",
                    "Continuous vendor risk and employee device monitoring",
                    "Pre-built auditor portal with read-only verification logs",
                    "Custom policy template generation using AI"
                ],
                target_pain_points=[
                    "Engineering teams wasting hundreds of hours on manual audit screenshots",
                    "Deal slippage caused by slow security questionnaire responses",
                    "Upcoming enterprise customer security reviews"
                ],
                pricing_tier="Starting at $24,000 / year",
                ideal_customer_size="40 - 500 employees",
                proof_point="Helped 120+ SaaS startups achieve clean SOC 2 Type II reports in 14 days."
            ),
            ProductOffering(
                id="prod-ciem",
                name="Zero-Trust Identity Sentinel",
                category="Cloud Identity & Entitlement Management (CIEM)",
                tagline="Least-privilege cloud IAM enforcement without breaking prod",
                description="AI-driven identity analytics that discovers dormant permissions, toxic combinations, and over-privileged service accounts across cloud roles.",
                key_features=[
                    "Toxic permission combination mapping",
                    "Automated least-privilege role right-sizing",
                    "Just-in-time (JIT) temporary privilege escalation",
                    "Machine identity and API key governance"
                ],
                target_pain_points=[
                    "Over-privileged IAM roles creating blast-radius risks",
                    "Dormant contractor and former employee credentials",
                    "Complex Kubernetes RBAC and cross-account access"
                ],
                pricing_tier="Starting at $32,000 / year",
                ideal_customer_size="100 - 2,500 employees",
                proof_point="Prevented credential blast radius escalation in 45 enterprise Kubernetes clusters."
            )
        ],
        target_personas=[
            TargetPersona(
                id="per-ciso",
                title="VP of Information Security / CISO",
                seniority="Executive",
                department="Security & Governance",
                key_priorities=[
                    "Passing upcoming enterprise audit deadlines without drama",
                    "Consolidating security vendors to reduce operational overhead",
                    "Proving cybersecurity ROI to the Board of Directors"
                ],
                common_objections=[
                    "We already use AWS native tools like Security Hub and GuardDuty",
                    "We don't have engineering cycles to install and maintain another agent",
                    "Budget is frozen until next fiscal quarter"
                ]
            ),
            TargetPersona(
                id="per-cto",
                title="CTO / VP of Engineering",
                seniority="Executive",
                department="Engineering",
                key_priorities=[
                    "Preventing security bottlenecks from slowing sprint velocity",
                    "Closing enterprise enterprise deals that require SOC 2 / ISO compliance",
                    "Retaining developer autonomy while safeguarding cloud credentials"
                ],
                common_objections=[
                    "My developers hate security tools that generate noise and Jira ticket spam",
                    "Is it going to break our CI/CD deployment pipeline?",
                    "We can build an internal script to check compliance"
                ]
            )
        ],
        collateral_docs=[
            "CloudArmor_Architecture_Whitepaper_2026.pdf",
            "SOC2_Acceleration_CaseStudy_FinTrack.pdf",
            "Enterprise_Security_FAQ_and_Battlecard.pdf"
        ]
    )


def get_default_signals() -> List[BuyingSignal]:
    return [
        BuyingSignal(
            id="sig-001",
            company_name="FinTrack Analytics",
            domain="fintrack.io",
            signal_type="funding",
            title="Closed $38M Series B Funding Round led by Bessemer",
            summary="FinTrack raised $38M to scale their real-time financial ledger API and expand into Tier 1 banking clients.",
            source="TechCrunch & Crunchbase",
            detected_at="2026-03-01T10:15:00Z",
            confidence_score=0.96,
            urgency_level="High",
            urgency_score=94,
            raw_data={"round": "Series B", "amount": "$38,000,000", "lead_investor": "Bessemer Venture Partners"},
            processed=True,
            lead_id="lead-001"
        ),
        BuyingSignal(
            id="sig-002",
            company_name="FinTrack Analytics",
            domain="fintrack.io",
            signal_type="hiring_surge",
            title="Actively hiring Head of Information Security & 4 Senior DevOps Engineers",
            summary="FinTrack posted job openings specifically requiring SOC 2 Type II experience and AWS multi-account governance.",
            source="LinkedIn Talent Insights",
            detected_at="2026-03-03T14:20:00Z",
            confidence_score=0.92,
            urgency_level="High",
            urgency_score=91,
            raw_data={"openings_count": 5, "departments": ["Security", "DevOps", "Infrastructure"]},
            processed=True,
            lead_id="lead-001"
        ),
        BuyingSignal(
            id="sig-003",
            company_name="HealthBridge Care",
            domain="healthbridge.co",
            signal_type="expansion",
            title="Announced EU Expansion & Telehealth Clinic Rollout",
            summary="HealthBridge is launching telehealth services in Germany and France, requiring immediate GDPR and ISO 27001 certification.",
            source="Press Release & Regulatory Filing",
            detected_at="2026-03-04T09:00:00Z",
            confidence_score=0.89,
            urgency_level="High",
            urgency_score=88,
            raw_data={"territories": ["Germany", "France", "UK"], "frameworks_needed": ["GDPR", "ISO 27001", "HIPAA"]},
            processed=True,
            lead_id="lead-002"
        ),
        BuyingSignal(
            id="sig-004",
            company_name="DataSpire Systems",
            domain="dataspire.com",
            signal_type="tech_stack_change",
            title="Migrated Core Data Warehouse from On-Premises to AWS Multi-Account",
            summary="CTO published a technical engineering blog discussing complex cloud IAM role explosion during AWS migration.",
            source="Engineering Blog & GitHub",
            detected_at="2026-03-05T16:45:00Z",
            confidence_score=0.85,
            urgency_level="Medium",
            urgency_score=76,
            raw_data={"cloud_providers": ["AWS"], "architecture": "Multi-Account Organizations", "pain": "IAM Explosion"},
            processed=True,
            lead_id="lead-003"
        ),
        BuyingSignal(
            id="sig-005",
            company_name="PayMatrix Global",
            domain="paymatrix.net",
            signal_type="leadership_hire",
            title="Appointed New Chief Risk & Security Officer from Goldman Sachs",
            summary="New CRSO Elena Rostova tasked with modernizing cloud posture and enterprise vendor risk controls.",
            source="PR Newswire",
            detected_at="2026-03-06T11:30:00Z",
            confidence_score=0.91,
            urgency_level="Medium",
            urgency_score=82,
            raw_data={"executive": "Elena Rostova", "role": "CRSO", "mandate": "Zero Trust Modernization"},
            processed=True,
            lead_id="lead-004"
        ),
        BuyingSignal(
            id="sig-006",
            company_name="RetailPulse AI",
            domain="retailpulse.io",
            signal_type="compliance_deadline",
            title="Auditors Flagged 4 Critical Cloud Access Gaps Ahead of Q4 IPO",
            summary="RetailPulse board audit committee mandated 60-day remediation for cloud credential access and SOC 2 recertification.",
            source="Industry Tech Forum / RFP Leak",
            detected_at="2026-03-07T08:15:00Z",
            confidence_score=0.87,
            urgency_level="High",
            urgency_score=97,
            raw_data={"audit_deadline": "60 days", "target": "IPO Readiness"},
            processed=False,
            lead_id=None
        )
    ]


def get_default_leads() -> List[Lead]:
    return [
        Lead(
            id="lead-001",
            company_name="FinTrack Analytics",
            domain="fintrack.io",
            industry="Fintech / Financial Data",
            employee_count="180",
            estimated_revenue="$28M ARR",
            location="San Francisco, CA & Remote",
            tech_stack=["AWS", "Kubernetes", "PostgreSQL", "Terraform", "GitHub Actions"],
            signals_count=2,
            signals_summary=[
                "Series B $38M funding led by Bessemer (High Urgency)",
                "Urgent hiring for Head of Security & DevOps with SOC 2 mandate"
            ],
            contacts=[
                LeadContact(
                    name="Marcus Vance",
                    title="VP of Engineering & Acting Head of Security",
                    role_level="VP",
                    email="m.vance@fintrack.io",
                    phone="+1 (415) 890-3412",
                    linkedin_url="https://linkedin.com/in/marcus-vance-fintrack",
                    decision_authority="Primary"
                ),
                LeadContact(
                    name="Sarah Lin",
                    title="Staff DevOps Architect",
                    role_level="Lead",
                    email="s.lin@fintrack.io",
                    decision_authority="Champion"
                )
            ],
            primary_contact=LeadContact(
                name="Marcus Vance",
                title="VP of Engineering & Acting Head of Security",
                role_level="VP",
                email="m.vance@fintrack.io",
                phone="+1 (415) 890-3412",
                linkedin_url="https://linkedin.com/in/marcus-vance-fintrack",
                decision_authority="Primary"
            ),
            match=OfferingMatch(
                product_id="prod-auditbot",
                product_name="AuditBot 360",
                fit_score=96,
                match_tier="Strong",
                reasoning=(
                    "FinTrack's recent $38M round and enterprise banking expansion require fast SOC 2 Type II "
                    "certification. Marcus is acting security lead and lacks bandwidth; AuditBot automates evidence "
                    "in 14 days."
                ),
                aligned_features=[
                    "Automated SOC 2 Type II evidence gathering",
                    "Continuous AWS multi-account scanning",
                    "Direct auditor portal integration"
                ],
                suggested_pitch="Help FinTrack secure Tier 1 banking contracts without taking 4 months of engineering time to pass SOC 2 Type II."
            ),
            intent=IntentScore(
                overall_score=94,
                grade="A",
                urgency_component=95,
                fit_component=98,
                authority_component=90,
                timing_component=92,
                buying_readiness="Immediate (0-30 days)",
                key_drivers=[
                    "Fresh capital deployment ($38M Series B)",
                    "Active job req for security leadership with immediate audit deliverables",
                    "Enterprise customers blocking deals pending SOC 2 report"
                ]
            ),
            status="Interested",
            created_at="2026-03-01T12:00:00Z",
            updated_at="2026-03-08T09:30:00Z",
            notes="Engaged with AI Sales Agent on 2026-03-07. Very receptive to automated Terraform PRs."
        ),
        Lead(
            id="lead-002",
            company_name="HealthBridge Care",
            domain="healthbridge.co",
            industry="Healthcare / Telemedicine",
            employee_count="320",
            estimated_revenue="$45M ARR",
            location="Boston, MA",
            tech_stack=["GCP", "Kubernetes", "React Native", "BigQuery", "Terraform"],
            signals_count=1,
            signals_summary=[
                "Announced EU expansion needing ISO 27001 and GDPR compliance"
            ],
            contacts=[
                LeadContact(
                    name="Dr. Aris Thorne",
                    title="Chief Technology Officer",
                    role_level="C-Level",
                    email="aris.thorne@healthbridge.co",
                    phone="+1 (617) 555-0192",
                    linkedin_url="https://linkedin.com/in/aris-thorne",
                    decision_authority="Primary"
                )
            ],
            primary_contact=LeadContact(
                name="Dr. Aris Thorne",
                title="Chief Technology Officer",
                role_level="C-Level",
                email="aris.thorne@healthbridge.co",
                phone="+1 (617) 555-0192",
                linkedin_url="https://linkedin.com/in/aris-thorne",
                decision_authority="Primary"
            ),
            match=OfferingMatch(
                product_id="prod-auditbot",
                product_name="AuditBot 360",
                fit_score=91,
                match_tier="Strong",
                reasoning="Expanding into European telehealth requires ISO 27001 & GDPR audit compliance within 90 days.",
                aligned_features=["ISO 27001 automation", "GDPR data residency monitoring", "HIPAA cross-walk"],
                suggested_pitch="Fast-track HealthBridge's European clinic launch with pre-certified ISO 27001 auditor packages."
            ),
            intent=IntentScore(
                overall_score=88,
                grade="A",
                urgency_component=90,
                fit_component=92,
                authority_component=88,
                timing_component=84,
                buying_readiness="High (30-60 days)",
                key_drivers=[
                    "Strict regulatory deadline for German & French clinic operations",
                    "High sensitivity to healthcare data breaches"
                ]
            ),
            status="Outreach_Ready",
            created_at="2026-03-04T10:00:00Z",
            updated_at="2026-03-07T14:15:00Z",
            notes="Queued for AI Calling Agent campaign: Q1 Healthcare Expansion."
        ),
        Lead(
            id="lead-003",
            company_name="DataSpire Systems",
            domain="dataspire.com",
            industry="Enterprise Data / Analytics",
            employee_count="540",
            estimated_revenue="$80M ARR",
            location="Austin, TX",
            tech_stack=["AWS", "Snowflake", "Databricks", "Kubernetes", "Okta"],
            signals_count=1,
            signals_summary=[
                "Migrated to AWS multi-account; blogged about cloud IAM permission explosion"
            ],
            contacts=[
                LeadContact(
                    name="Kavita Raman",
                    title="Head of Cloud Infrastructure & SecOps",
                    role_level="Director",
                    email="k.raman@dataspire.com",
                    phone="+1 (512) 441-9081",
                    linkedin_url="https://linkedin.com/in/kavita-raman",
                    decision_authority="Influencer"
                )
            ],
            primary_contact=LeadContact(
                name="Kavita Raman",
                title="Head of Cloud Infrastructure & SecOps",
                role_level="Director",
                email="k.raman@dataspire.com",
                phone="+1 (512) 441-9081",
                linkedin_url="https://linkedin.com/in/kavita-raman",
                decision_authority="Influencer"
            ),
            match=OfferingMatch(
                product_id="prod-ciem",
                product_name="Zero-Trust Identity Sentinel",
                fit_score=94,
                match_tier="Strong",
                reasoning="DataSpire explicitly mentioned IAM role explosion and toxic privilege paths in their AWS multi-account environment.",
                aligned_features=["Toxic permission mapping", "Least-privilege role right-sizing", "Okta-to-AWS role sync"],
                suggested_pitch="Automatically prune dormant permissions and enforce least-privilege IAM across AWS multi-account organizations without breaking production."
            ),
            intent=IntentScore(
                overall_score=84,
                grade="B",
                urgency_component=80,
                fit_component=95,
                authority_component=82,
                timing_component=78,
                buying_readiness="High (30-60 days)",
                key_drivers=[
                    "Publicly acknowledged operational bottleneck around cloud IAM",
                    "High security posture requirement handling enterprise client telemetry"
                ]
            ),
            status="Matched",
            created_at="2026-03-05T17:00:00Z",
            updated_at="2026-03-06T11:00:00Z"
        ),
        Lead(
            id="lead-004",
            company_name="PayMatrix Global",
            domain="paymatrix.net",
            industry="Payments / RegTech",
            employee_count="850",
            estimated_revenue="$140M ARR",
            location="New York, NY",
            tech_stack=["AWS", "Azure", "Kubernetes", "Kafka", "Datadog"],
            signals_count=1,
            signals_summary=[
                "Appointed new CRSO tasked with Zero Trust modernization and hybrid posture"
            ],
            contacts=[
                LeadContact(
                    name="Elena Rostova",
                    title="Chief Risk & Security Officer",
                    role_level="C-Level",
                    email="elena.rostova@paymatrix.net",
                    phone="+1 (212) 779-1102",
                    linkedin_url="https://linkedin.com/in/elena-rostova-sec",
                    decision_authority="Primary"
                )
            ],
            primary_contact=LeadContact(
                name="Elena Rostova",
                title="Chief Risk & Security Officer",
                role_level="C-Level",
                email="elena.rostova@paymatrix.net",
                phone="+1 (212) 779-1102",
                linkedin_url="https://linkedin.com/in/elena-rostova-sec",
                decision_authority="Primary"
            ),
            match=OfferingMatch(
                product_id="prod-cspm",
                product_name="CloudArmor Posture Guard",
                fit_score=87,
                match_tier="Strong",
                reasoning="New CRSO Elena is revamping vendor risk and hybrid cloud visibility following recent corporate acquisition.",
                aligned_features=["Unified AWS and Azure security posture", "Agentic Terraform remediation", "Executive board reporting"],
                suggested_pitch="Give the executive board 100% real-time posture visibility across newly merged AWS & Azure accounts."
            ),
            intent=IntentScore(
                overall_score=81,
                grade="B",
                urgency_component=82,
                fit_component=88,
                authority_component=92,
                timing_component=72,
                buying_readiness="Exploring (60-90 days)",
                key_drivers=[
                    "First 90-day executive mandate to review security toolchain",
                    "Large enterprise budget availability"
                ]
            ),
            status="Enriched",
            created_at="2026-03-06T12:00:00Z",
            updated_at="2026-03-07T16:00:00Z"
        )
    ]


def get_default_call_sessions() -> List[CallSession]:
    return [
        CallSession(
            id="call-001",
            lead_id="lead-001",
            company_name="FinTrack Analytics",
            contact_name="Marcus Vance",
            contact_title="VP of Engineering & Acting Head of Security",
            campaign_id="camp-001",
            status="Completed",
            duration_seconds=214,
            started_at="2026-03-07T15:30:00Z",
            turns=[
                CallTurn(
                    id="t-1",
                    speaker="ai",
                    text="Hi Marcus, this is Alex from CloudArmor AI. I saw FinTrack's recent Series B announcement—congrats! Noticed you are scaling up engineering and hiring for security roles to prepare for banking clients. Are you currently leading that compliance prep yourself?",
                    timestamp_offset_seconds=0,
                    sentiment="positive"
                ),
                CallTurn(
                    id="t-2",
                    speaker="prospect",
                    text="Thanks Alex. Yeah, I'm wearing the security hat right now while we recruit a Head of InfoSec. Honestly, our enterprise sales team has two tier-one banks waiting on our SOC 2 Type II report, and it's consuming half my engineering sprint cycles just pulling screenshots.",
                    timestamp_offset_seconds=18,
                    sentiment="neutral",
                    objection_detected=None
                ),
                CallTurn(
                    id="t-3",
                    speaker="ai",
                    text="That is the exact story we hear from Series B VPs of Engineering. You shouldn't have to pull senior engineers off shipping revenue features to take AWS audit screenshots. CloudArmor connects via read-only API in 15 minutes and automates 90% of evidence collection directly into the auditor's portal.",
                    timestamp_offset_seconds=36,
                    sentiment="positive"
                ),
                CallTurn(
                    id="t-4",
                    speaker="prospect",
                    text="Look, that sounds great in theory, but we already have AWS Security Hub turned on. What do you do that native AWS tooling doesn't?",
                    timestamp_offset_seconds=54,
                    sentiment="skeptical",
                    objection_detected="competitor_or_native"
                ),
                CallTurn(
                    id="t-5",
                    speaker="ai",
                    text="Great question. Security Hub tells you what is broken with 2,000 raw alert notifications, but it doesn't fix anything, and it certainly doesn't generate auditor-ready evidence for your CPAs. CloudArmor does two things differently: first, it automatically submits a tested Terraform PR to fix the misconfiguration, and second, it links evidence directly to SOC 2 trust principles so your auditor signs off without emailing you every week.",
                    timestamp_offset_seconds=75,
                    sentiment="positive"
                ),
                CallTurn(
                    id="t-6",
                    speaker="prospect",
                    text="Wait, it actually opens a Terraform PR for our team to review? That would save us at least 15 hours a week. How fast could we realistically get the audit evidence ready?",
                    timestamp_offset_seconds=98,
                    sentiment="positive"
                ),
                CallTurn(
                    id="t-7",
                    speaker="ai",
                    text="Most teams have their initial baseline evidence package ready in under 10 business days. We can even invite your external auditor directly so they can self-serve evidence.",
                    timestamp_offset_seconds=115,
                    sentiment="positive"
                ),
                CallTurn(
                    id="t-8",
                    speaker="prospect",
                    text="Okay, I'm definitely interested. Can we do a 25-minute technical walkthrough this Thursday at 2 PM PT? I want my DevOps lead Sarah to join as well.",
                    timestamp_offset_seconds=132,
                    sentiment="enthusiastic"
                ),
                CallTurn(
                    id="t-9",
                    speaker="ai",
                    text="Thursday at 2 PM PT works great. I'll send a calendar invite to m.vance@fintrack.io and include Sarah. I'll also attach our FinTech SOC 2 case study so you can review beforehand. Really looking forward to speaking, Marcus!",
                    timestamp_offset_seconds=145,
                    sentiment="positive"
                )
            ],
            insights=CallInsights(
                summary="Marcus is acting as interim Head of Security while hiring. Two tier-1 banking deals are stalled awaiting SOC 2 Type II evidence. Highly engaged once learning CloudArmor auto-submits Terraform PRs rather than just generating alerts. Scheduled technical walkthrough for Thursday 2 PM PT with DevOps lead.",
                sentiment_overall="Enthusiastic",
                interest_level="High",
                urgency="High",
                budget_indicator="Budget confirmed via fresh $38M Series B; active hiring",
                timeline_indicator="Targeting SOC 2 Type II completion within 30 days to unblock banking contracts",
                extracted_pain_points=[
                    "Pulling senior engineers off sprints to collect manual audit screenshots",
                    "Tier 1 banking deals blocked pending SOC 2 compliance",
                    "AWS Security Hub produces alert noise without automated remediation"
                ],
                objections_handled=[
                    "Already using AWS native Security Hub: Addressed by highlighting automated Terraform PR remediation and automated auditor evidence mapping."
                ],
                qualification_verdict="Qualified_Interested"
            ),
            battlecards_used=[
                ObjectionBattlecard(
                    category="competitor",
                    objection="We already use AWS Security Hub",
                    recommended_pivot="Highlight that Security Hub only flags alerts, while CloudArmor writes tested Terraform remediation PRs and compiles auditor packages.",
                    proof_point="Saved fintech customers an average of 60 engineering hours per audit cycle."
                )
            ]
        )
    ]


def get_default_campaigns() -> List[Campaign]:
    return [
        Campaign(
            id="camp-001",
            name="Q1 Scaleup Compliance & Audit Acceleration",
            description="Outreach targeting recently funded Series A/B SaaS companies preparing for enterprise audits.",
            target_criteria="Series A/B funding within 60 days, hiring DevOps/Security, 50-300 employees",
            status="Active",
            channels=["AI Voice Call", "Personalized Email"],
            total_leads=18,
            contacted_count=14,
            interested_count=6,
            scheduled_meetings=4,
            response_rate=42.8,
            created_at="2026-03-01T09:00:00Z"
        ),
        Campaign(
            id="camp-002",
            name="Healthcare & MedTech ISO/HIPAA Expansion",
            description="Targeting European and US digital health providers undergoing cross-border health data expansion.",
            target_criteria="Healthcare SaaS, multi-region expansion signal, headcount > 100",
            status="Active",
            channels=["AI Voice Call", "Personalized Email"],
            total_leads=12,
            contacted_count=8,
            interested_count=3,
            scheduled_meetings=2,
            response_rate=37.5,
            created_at="2026-03-03T11:00:00Z"
        )
    ]


def get_default_opportunities() -> List[Opportunity]:
    return [
        Opportunity(
            id="opp-001",
            lead_id="lead-001",
            company_name="FinTrack Analytics",
            domain="fintrack.io",
            contact_name="Marcus Vance",
            contact_email="m.vance@fintrack.io",
            matched_offering="AuditBot 360 + Posture Guard Bundle",
            deal_value_estimate="$38,500 ARR",
            stage="Qualified_Lead",
            win_probability=75,
            assigned_rep="David Miller (Senior Enterprise AE)",
            next_action=NextBestAction(
                id="act-001",
                lead_id="lead-001",
                action_type="schedule_demo",
                title="Conduct 25-min Technical Deep Dive on Terraform Auto-PRs",
                rationale="Marcus confirmed two tier-1 banking deals pending SOC 2. He requested a demo for Thursday 2 PM PT with DevOps lead Sarah Lin.",
                priority="Urgent",
                suggested_email_or_script=(
                    "Hi Marcus,\n\nConfirming our session for Thursday at 2:00 PM PT. "
                    "I've invited Sarah Lin as well. We will focus specifically on how CloudArmor "
                    "connects to your AWS environment via read-only IAM and outputs pull requests "
                    "for your infrastructure repo.\n\nLooking forward to it!\nDavid Miller"
                ),
                completed=False
            ),
            crm_synced=False,
            crm_target="HubSpot",
            crm_record_id=None,
            created_at="2026-03-07T16:00:00Z",
            updated_at="2026-03-08T09:00:00Z"
        ),
        Opportunity(
            id="opp-002",
            lead_id="lead-002",
            company_name="HealthBridge Care",
            domain="healthbridge.co",
            contact_name="Dr. Aris Thorne",
            contact_email="aris.thorne@healthbridge.co",
            matched_offering="AuditBot 360 (Healthcare/ISO Edition)",
            deal_value_estimate="$29,000 ARR",
            stage="Discovery",
            win_probability=60,
            assigned_rep="Jessica Hayes (Healthcare Account Director)",
            next_action=NextBestAction(
                id="act-002",
                lead_id="lead-002",
                action_type="case_study_share",
                title="Send Telehealth ISO 27001 & GDPR Regulatory Blueprint",
                rationale="CTO Aris Thorne is evaluating timeline constraints for European clinic rollout in Q2.",
                priority="High",
                suggested_email_or_script=(
                    "Dr. Thorne,\n\nFollowing HealthBridge's announcement regarding European telehealth expansion, "
                    "here is our 7-step blueprint on how European digital health providers automate ISO 27001 "
                    "audits and cross-border GDPR compliance in under 3 weeks.\n\nBest,\nJessica Hayes"
                ),
                completed=False
            ),
            crm_synced=True,
            crm_target="Salesforce",
            crm_record_id="SF-098234",
            created_at="2026-03-06T10:00:00Z",
            updated_at="2026-03-07T11:00:00Z"
        )
    ]
