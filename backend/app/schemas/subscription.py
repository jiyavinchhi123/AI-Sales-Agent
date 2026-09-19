from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class TierFeature(BaseModel):
    name: str
    included: bool
    highlight: bool = False


class PlanTierDefinition(BaseModel):
    id: str  # "Starter" | "Growth" | "Enterprise"
    name: str
    tagline: str
    price_monthly: int
    price_yearly: int
    currency: str = "USD"
    currency_symbol: str = "$"
    price_inr_monthly: int
    price_inr_yearly: int
    voice_minutes: int
    leads_count: int
    seats: int
    is_popular: bool = False
    badge: Optional[str] = None
    features: List[str]


class SubscriptionResponse(BaseModel):
    id: str
    plan_tier: str  # "Starter" | "Growth" | "Enterprise"
    status: str     # "active" | "trial"
    billing_cycle: str  # "monthly" | "yearly"
    voice_minutes_used: int
    voice_minutes_limit: int
    voice_minutes_percentage: float
    leads_used: int
    leads_limit: int
    leads_percentage: float
    seats_used: int
    seats_limit: int
    available_tiers: List[PlanTierDefinition]


class UpgradePlanRequest(BaseModel):
    plan_tier: str  # "Starter" | "Growth" | "Enterprise"
    billing_cycle: str = "monthly"  # "monthly" | "yearly"
