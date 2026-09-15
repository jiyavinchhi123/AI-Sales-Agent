from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.schemas.campaign import Campaign, CampaignCreate, CampaignLaunchResponse
from app.services.campaign_service import campaign_service

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


@router.get("", response_model=List[Campaign])
def list_campaigns(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """List all outbound multi-channel AI campaigns for the active user."""
    user_id = _get_user_id(current_user, db)
    return campaign_service.get_campaigns(db, user_id)


@router.post("", response_model=Campaign, status_code=status.HTTP_201_CREATED)
def create_campaign(
    req: CampaignCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Create a new outbound campaign targeting high-intent signals."""
    user_id = _get_user_id(current_user, db)
    return campaign_service.create_campaign(db, user_id, req)


@router.post("/{campaign_id}/launch", response_model=CampaignLaunchResponse)
def launch_campaign(
    campaign_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Launch the multi-channel AI campaign cadence across matching leads."""
    user_id = _get_user_id(current_user, db)
    try:
        return campaign_service.launch_campaign(db, user_id, campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to launch campaign: {str(e)}")


@router.post("/{campaign_id}/toggle", response_model=Campaign)
def toggle_campaign_status(
    campaign_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Pause or activate an outbound AI campaign."""
    user_id = _get_user_id(current_user, db)
    try:
        return campaign_service.toggle_status(db, user_id, campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
def delete_campaign(
    campaign_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Delete a campaign."""
    user_id = _get_user_id(current_user, db)
    success = campaign_service.delete_campaign(db, user_id, campaign_id)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted successfully", "campaign_id": campaign_id}
