from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.subscription import Subscription
from app.models.lead import Lead
from app.models.call import CallSession
from app.schemas.subscription import (
    SubscriptionResponse,
    PlanTierDefinition,
    UpgradePlanRequest,
)

router = APIRouter()

# Fixed canonical tier configurations
TIER_CONFIGS = {
    "Starter": PlanTierDefinition(
        id="Starter",
        name="Starter",
        tagline="For solo founders & early validation",
        price_monthly=49,
        price_yearly=39,
        price_inr_monthly=3999,
        price_inr_yearly=3199,
        currency="USD",
        currency_symbol="$",
        voice_minutes=60,
        leads_count=100,
        seats=1,
        is_popular=False,
        features=[
            "100 Enriched Leads / month",
            "60 AI Voice Calling Minutes",
            "1 Sales Seat",
            "Public Web & Directory Signals",
            "AI Product & ICP Matcher",
            "Direct Email Dispatch",
            "Standard Community Support",
        ],
    ),
    "Growth": PlanTierDefinition(
        id="Growth",
        name="Growth",
        tagline="For scaling B2B sales teams",
        price_monthly=149,
        price_yearly=119,
        price_inr_monthly=11999,
        price_inr_yearly=9599,
        currency="USD",
        currency_symbol="$",
        voice_minutes=300,
        leads_count=500,
        seats=5,
        is_popular=True,
        badge="Most Popular",
        features=[
            "500 Enriched Leads / month",
            "300 AI Voice Calling Minutes",
            "5 Sales Seats & Team Workspace",
            "High-Priority Signals (LinkedIn, X, Web)",
            "Autonomous Voice Qualification & Transcripts",
            "HubSpot & Salesforce CRM Sync",
            "Automated Next-Best Action Engine",
            "Priority Email & Phone SLA Support",
        ],
    ),
    "Enterprise": PlanTierDefinition(
        id="Enterprise",
        name="Enterprise",
        tagline="For high-velocity revenue operations",
        price_monthly=399,
        price_yearly=319,
        price_inr_monthly=31999,
        price_inr_yearly=25599,
        currency="USD",
        currency_symbol="$",
        voice_minutes=1500,
        leads_count=5000,
        seats=25,
        is_popular=False,
        badge="Maximum Power",
        features=[
            "5,000 Enriched Leads / month",
            "1,500 AI Voice Calling Minutes",
            "Unlimited Sales Seats",
            "Custom Multilingual Voice Persona & Accent",
            "Two-Way CRM Webhooks & Custom Pipelines",
            "Dedicated Account Executive & SLA",
            "Custom Lead Scrapers & Data Verification",
            "Enterprise Role-Based Access Control (RBAC)",
        ],
    ),
}


def _get_or_create_subscription(db: Session) -> Subscription:
    sub = db.query(Subscription).first()
    if not sub:
        sub = Subscription(
            plan_tier="Growth",
            status="active",
            billing_cycle="monthly",
            voice_minutes_limit=300,
            voice_minutes_used=0,
            leads_limit=500,
            leads_used=0,
            seats_limit=5,
            seats_used=1,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


@router.get("", response_model=SubscriptionResponse)
def get_subscription(db: Session = Depends(get_db)):
    """
    Returns current active subscription, real-time usage metrics from SQLite,
    and tier configurations.
    """
    sub = _get_or_create_subscription(db)

    # Real-time usage calculation from SQLite database
    real_leads_count = db.query(Lead).count()

    # Calculate real voice minutes used from calls table
    total_seconds = db.query(func.coalesce(func.sum(CallSession.duration_seconds), 0)).scalar()
    # Default each call to min 1 minute if duration is 0
    total_calls = db.query(CallSession).count()
    real_minutes = max(int(total_seconds // 60), total_calls) if total_calls > 0 else 0

    # Ensure limits match tier
    tier_config = TIER_CONFIGS.get(sub.plan_tier, TIER_CONFIGS["Growth"])
    sub.leads_limit = tier_config.leads_count
    sub.voice_minutes_limit = tier_config.voice_minutes
    sub.seats_limit = tier_config.seats

    sub.leads_used = real_leads_count
    sub.voice_minutes_used = real_minutes
    db.commit()

    voice_pct = round((real_minutes / max(sub.voice_minutes_limit, 1)) * 100, 1)
    leads_pct = round((real_leads_count / max(sub.leads_limit, 1)) * 100, 1)

    return SubscriptionResponse(
        id=sub.id,
        plan_tier=sub.plan_tier,
        status=sub.status,
        billing_cycle=sub.billing_cycle,
        voice_minutes_used=real_minutes,
        voice_minutes_limit=sub.voice_minutes_limit,
        voice_minutes_percentage=voice_pct,
        leads_used=real_leads_count,
        leads_limit=sub.leads_limit,
        leads_percentage=leads_pct,
        seats_used=sub.seats_used,
        seats_limit=sub.seats_limit,
        available_tiers=list(TIER_CONFIGS.values()),
    )


@router.post("/upgrade", response_model=SubscriptionResponse)
def upgrade_subscription(payload: UpgradePlanRequest, db: Session = Depends(get_db)):
    """
    Upgrade or switch active SaaS subscription tier (Starter, Growth, Enterprise).
    """
    tier = payload.plan_tier.strip().capitalize()
    if tier not in TIER_CONFIGS:
        raise HTTPException(status_code=400, detail=f"Invalid plan tier: {payload.plan_tier}. Choose from Starter, Growth, Enterprise.")

    sub = _get_or_create_subscription(db)
    tier_config = TIER_CONFIGS[tier]

    sub.plan_tier = tier
    sub.billing_cycle = payload.billing_cycle
    sub.voice_minutes_limit = tier_config.voice_minutes
    sub.leads_limit = tier_config.leads_count
    sub.seats_limit = tier_config.seats
    sub.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(sub)

    return get_subscription(db)
