from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    business,
    discovery,
    leads,
    calling,
    opportunities,
    analytics,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(business.router, prefix="/business", tags=["Business Profile & Offerings"])
api_router.include_router(discovery.router, prefix="/discovery", tags=["Signals & Discovery"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads, Matching & Scoring"])
api_router.include_router(calling.router, prefix="/calling", tags=["AI Calling & Dialogue"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["Opportunities & CRM Handoff"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Dashboard & Analytics"])

