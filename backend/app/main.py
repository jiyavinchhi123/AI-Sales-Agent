"""
AI Sales Agent — Signal to Opportunity
FastAPI Backend Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints import business

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="End-to-End AI Sales Platform: Signal Detection, Lead Enrichment, Matching, Intent Scoring, AI Calling, and CRM Handoff.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Also mount /api/business directly for user prompt specification:
# POST /api/business/analyze
# GET /api/business/profile
# PUT /api/business/profile
app.include_router(business.router, prefix="/api/business", tags=["Business Understanding Direct"])


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "mode": "Demo / Active" if settings.DEMO_MODE else "Production",
        "version": "1.0.0"
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AI Sales Agent — Signal to Opportunity API",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
