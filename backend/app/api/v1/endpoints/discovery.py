from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.schemas.lead import Lead
from app.schemas.discovery import DiscoveredOpportunity, DiscoveryFilters
from app.services.discovery.engine import discovery_engine

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


@router.get("/discover", response_model=List[DiscoveredOpportunity])
async def discover_leads(
    location: Optional[str] = Query(None, description="Filter by location"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    requirement_type: Optional[str] = Query(None, description="Filter by requirement type"),
    recency: Optional[str] = Query(None, description="Filter by recency: Today, Last 7 Days, Last 30 Days, All"),
    intent_level: Optional[str] = Query(None, description="Filter by intent level: High, Medium, Low, All"),
    search: Optional[str] = Query(None, description="Search company, requirement, or keywords"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Step 3: Discover buying requirements relevant to the seller's active business profile.
    Uses extensible DiscoveryProvider abstraction with ranked match scores.
    """
    user_id = _get_user_id(current_user, db)
    filters = DiscoveryFilters(
        location=location,
        industry=industry,
        requirement_type=requirement_type,
        recency=recency,
        intent_level=intent_level,
        search=search,
    )
    return await discovery_engine.discover(filters, user_id=user_id, db=db)


@router.post("/convert-discovered/{opportunity_id}", response_model=Lead)
def convert_discovered_opportunity(
    opportunity_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Convert a discovered buying requirement opportunity into an active lead in SQLite."""
    user_id = _get_user_id(current_user, db)
    lead = discovery_engine.convert_to_lead(opportunity_id, user_id=user_id, db=db)
    if not lead:
        raise HTTPException(status_code=404, detail="Discovered opportunity not found")
    return lead
