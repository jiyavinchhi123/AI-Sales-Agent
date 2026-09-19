import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.models.lead import Lead as DBLead
from app.models.opportunity import Opportunity as DBOpportunity
from app.models.call import CallSession as DBCallSession
from app.models.business import CompanyProfile
from app.services.lead_service import lead_service

router = APIRouter()


def _get_user_id(current_user: Optional[User], db: Session) -> str:
    if current_user:
        return current_user.id
    first_user = db.query(User).first()
    if first_user:
        return first_user.id
    guest = User(
        email="user@salesagent.ai",
        hashed_password="",
        full_name="Sales Leader",
        company_name="My Company",
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest.id


@router.get("/overview")
def get_dashboard_overview(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Simplified, 100% database-driven analytics overview.
    Answers strictly:
    'How many buying signals did AI find, how many became leads, how many were contacted, and how many became opportunities?'
    Zero fake metrics, zero hardcoded scores, zero fabricated pipeline values.
    """
    user_id = _get_user_id(current_user, db)

    # 1. Fetch genuine database entities
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user_id).first()
    monitored_profile_signals = profile.buying_signals if profile and profile.buying_signals else []

    db_leads = db.query(DBLead).filter(DBLead.user_id == user_id).all()
    opportunities = db.query(DBOpportunity).filter(DBOpportunity.user_id == user_id).all()
    calls_count = db.query(DBCallSession).filter(DBCallSession.user_id == user_id).count()

    # 2. Dynamic counts directly from SQLite
    # Buying Signals = leads with detected requirements + active monitored keyword signals
    leads_count = len(db_leads)
    signals_count = leads_count + len(monitored_profile_signals)

    # Qualified Leads = total enriched leads in database
    qualified_leads_count = leads_count

    # AI Outreach = leads that have actually been contacted via email or voice call
    contacted_leads = [
        l for l in db_leads
        if l.status in ["Email_Sent", "Contacted", "Meeting_Booked", "Interested", "Opportunity", "Opportunity_Created", "Closed"]
    ]
    ai_outreach_count = len(contacted_leads)

    # Opportunities = total active sales pipeline opportunities in database
    opportunities_count = len(opportunities)

    # 3. Dynamic Conversion Rates (calculated purely from real DB data)
    signal_to_lead_rate = round((qualified_leads_count / signals_count) * 100, 1) if signals_count > 0 else 0.0
    lead_to_opportunity_rate = round((opportunities_count / qualified_leads_count) * 100, 1) if qualified_leads_count > 0 else 0.0
    overall_conversion_rate = round((opportunities_count / signals_count) * 100, 1) if signals_count > 0 else 0.0

    # 4. Conversion Funnel (4 core stages)
    funnel = [
        {
            "stage": "Buying Signals",
            "label": "Signals",
            "count": signals_count,
            "percentage": 100 if signals_count > 0 else 0,
            "dropoff_percentage": max(0.0, round(100.0 - signal_to_lead_rate, 1)),
            "description": "Monitored market buying signals & buyer requirements identified by AI",
        },
        {
            "stage": "Qualified Leads",
            "label": "Leads",
            "count": qualified_leads_count,
            "percentage": signal_to_lead_rate,
            "dropoff_percentage": max(0.0, round(100.0 - (ai_outreach_count / max(1, qualified_leads_count) * 100), 1)) if qualified_leads_count > 0 else 0.0,
            "description": "Signals matched, enriched, and qualified into actionable buyer accounts",
        },
        {
            "stage": "AI Outreach",
            "label": "Outreach",
            "count": ai_outreach_count,
            "percentage": round((ai_outreach_count / qualified_leads_count) * 100, 1) if qualified_leads_count > 0 else 0.0,
            "dropoff_percentage": max(0.0, round(100.0 - lead_to_opportunity_rate, 1)),
            "description": "Leads engaged through AI personalized email or autonomous voice calls",
        },
        {
            "stage": "Opportunities",
            "label": "Opportunities",
            "count": opportunities_count,
            "percentage": lead_to_opportunity_rate,
            "dropoff_percentage": 0.0,
            "description": "High-intent buyer opportunities advancing through your sales pipeline",
        },
    ]

    # 5. Buying Signal Breakdown (real records only)
    buying_signals_list = []
    for lead in db_leads:
        req_title = lead.requirement_title or f"Active demand for {lead.matched_offering or 'offerings'}"
        req_lower = req_title.lower()
        if "procurement" in req_lower or "bulk" in req_lower or "rfp" in req_lower or "tender" in req_lower:
            category = "Procurement & RFPs"
        elif "cloud" in req_lower or "migration" in req_lower or "tech" in req_lower or "software" in req_lower:
            category = "Tech & Infrastructure"
        elif "wholesale" in req_lower or "manufacturer" in req_lower or "supply" in req_lower:
            category = "Wholesale & Supply"
        else:
            category = "Commercial Sourcing"

        created_str = lead.created_at.isoformat() if hasattr(lead.created_at, "isoformat") else str(lead.created_at)

        buying_signals_list.append({
            "id": f"sig-lead-{lead.id}",
            "company_name": lead.company_name,
            "source": lead.source_platform or "Direct Discovery",
            "category": category,
            "requirement": req_title,
            "product": lead.matched_offering,
            "intent_level": lead.intent_level if lead.intent_level else None,
            "status": "Converted to Lead",
            "lead_id": lead.id,
            "detected_at": created_str,
        })

    for idx, sig_text in enumerate(monitored_profile_signals):
        buying_signals_list.append({
            "id": f"sig-profile-{idx}",
            "company_name": profile.company_name if profile else "Active Market Profile",
            "source": "Monitored Business Profile",
            "category": "Monitored Intent Keyword",
            "requirement": sig_text,
            "product": None,
            "intent_level": None,
            "status": "Active Monitor",
            "lead_id": None,
            "detected_at": None,
        })

    # 6. Opportunity Summary (real records & genuine pipeline value only)
    real_deal_values = [o.deal_value for o in opportunities if o.deal_value is not None and o.deal_value > 0]
    has_real_deal_values = len(real_deal_values) > 0
    total_pipeline_val = sum(real_deal_values) if has_real_deal_values else None
    uses_inr = any("₹" in (o.deal_value_estimate or "") for o in opportunities)
    currency_prefix = "₹" if uses_inr else "$"
    formatted_pipeline_val = f"{currency_prefix}{int(total_pipeline_val):,}" if total_pipeline_val is not None else "Not available"

    stage_counts: Dict[str, int] = {}
    for o in opportunities:
        st = o.stage if (o.stage and o.stage.lower() != "not available") else "Not available"
        stage_counts[st] = stage_counts.get(st, 0) + 1

    stage_breakdown = [
        {"stage": st, "count": count}
        for st, count in stage_counts.items()
    ]

    opportunity_records = []
    for o in opportunities:
        val = o.deal_value if (o.deal_value is not None and o.deal_value > 0) else None
        if o.deal_value_estimate and o.deal_value_estimate != "Not available":
            formatted_val = o.deal_value_estimate
        elif val is not None:
            formatted_val = f"{currency_prefix}{int(val):,}"
        else:
            formatted_val = "Not available"
        stage_val = o.stage if (o.stage and o.stage.lower() != "not available") else "Not available"
        action_val = o.next_action_title if (o.next_action_title and o.next_action_title.lower() != "not available") else "Not available"
        priority_val = o.next_action_priority if (o.next_action_priority and o.next_action_priority.lower() != "not available") else "Not available"
        created_str = o.created_at.isoformat() if hasattr(o.created_at, "isoformat") else str(o.created_at)

        opportunity_records.append({
            "id": o.id,
            "company_name": o.company_name,
            "stage": stage_val,
            "deal_value": val,
            "formatted_deal_value": formatted_val,
            "assigned_rep": o.assigned_rep or "Not assigned",
            "next_action_title": action_val,
            "next_action_priority": priority_val,
            "crm_synced": o.crm_synced,
            "crm_target": o.crm_target,
            "created_at": created_str,
        })

    high_intent_count = len([l for l in db_leads if l.intent_level == "High"])

    return {
        "conversion_rates": {
            "signal_to_lead": signal_to_lead_rate,
            "lead_to_opportunity": lead_to_opportunity_rate,
            "overall_conversion": overall_conversion_rate,
            "counts": {
                "signals": signals_count,
                "leads": qualified_leads_count,
                "outreach": ai_outreach_count,
                "opportunities": opportunities_count,
            },
        },
        "funnel": funnel,
        "buying_signals_summary": {
            "total_active_signals": len(buying_signals_list),
            "signals": buying_signals_list,
        },
        "opportunity_summary": {
            "total_count": opportunities_count,
            "has_real_values": has_real_deal_values,
            "pipeline_value": total_pipeline_val,
            "formatted_pipeline_value": formatted_pipeline_val if has_real_deal_values else "Not available",
            "stage_breakdown": stage_breakdown,
            "opportunities": opportunity_records,
        },
        # Backwards compatibility fields for DashboardPage on /
        "kpis": {
            "active_buying_signals": signals_count,
            "high_urgency_signals": high_intent_count,
            "total_leads": leads_count,
            "grade_a_leads": high_intent_count,
            "ai_calls_conducted": calls_count,
            "meetings_secured": len([l for l in db_leads if l.status == "Meeting_Booked"]),
            "qualified_opportunities": opportunities_count,
            "pipeline_value_estimate": formatted_pipeline_val if has_real_deal_values else "Not available",
            "average_response_rate": f"{round((ai_outreach_count / max(1, leads_count)) * 100)}%" if leads_count > 0 else "0%",
            "ai_qualification_rate": f"{round((opportunities_count / max(1, leads_count)) * 100)}%" if leads_count > 0 else "0%",
        },
        "top_buying_signals": [
            {
                "id": s["id"],
                "company_name": s["company_name"],
                "title": s["requirement"],
                "source": s["source"],
                "urgency_level": s["intent_level"] or "Normal",
                "lead_id": s["lead_id"],
            }
            for s in buying_signals_list
        ],
        "recent_opportunities": opportunity_records,
    }
