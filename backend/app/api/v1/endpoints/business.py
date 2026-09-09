import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.schemas.business import (
    BusinessAnalyzeInput, StructuredBusinessProfile
)
from app.services.business_service import business_service

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
        company_name="My Company"
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest.id


@router.get("/profile", response_model=Optional[StructuredBusinessProfile])
def get_structured_business_profile(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the AI-extracted structured business profile for the user."""
    user_id = _get_user_id(current_user, db)
    return business_service.get_profile_by_user(user_id, db)


@router.put("/profile", response_model=StructuredBusinessProfile)
def update_structured_business_profile(
    profile: StructuredBusinessProfile,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Update and persist edits to the structured business profile in SQLite."""
    user_id = _get_user_id(current_user, db)
    return business_service.save_or_update_profile(user_id, profile, db)


@router.post("/analyze", response_model=StructuredBusinessProfile)
async def analyze_business(
    company_name: str = Form(...),
    company_website: str = Form(...),
    business_description: str = Form(...),
    products_services: Optional[str] = Form(""),
    target_industries: Optional[str] = Form(""),
    target_locations: Optional[str] = Form(""),
    ideal_customer_profile: Optional[str] = Form(""),
    files: Optional[List[UploadFile]] = File(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyzes company info and uploaded collateral (PDF, DOCX, TXT)
    using LLM extraction and saves dynamic profile to user DB.
    """
    if not company_name.strip():
        raise HTTPException(status_code=400, detail="Company Name is required.")
    if not business_description.strip():
        raise HTTPException(status_code=400, detail="Business Description is required.")

    uploaded_files_data = []
    if files:
        for f in files:
            if f.filename:
                content = await f.read()
                uploaded_files_data.append((f.filename, content))

    input_data = BusinessAnalyzeInput(
        company_name=company_name,
        company_website=company_website,
        business_description=business_description,
        products_services=products_services or "",
        target_industries=target_industries or "",
        target_locations=target_locations or "",
        ideal_customer_profile=ideal_customer_profile or ""
    )

    user_id = _get_user_id(current_user, db)
    return await business_service.analyze_and_save_business(
        input_data, user_id, db, uploaded_files_data
    )


@router.post("/analyze-json", response_model=StructuredBusinessProfile)
async def analyze_business_json(
    input_data: BusinessAnalyzeInput,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """JSON alternative for analyzing business info without file attachments."""
    user_id = _get_user_id(current_user, db)
    return await business_service.analyze_and_save_business(input_data, user_id, db, [])
