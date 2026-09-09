import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from app.schemas.business import (
    BusinessProfile, BusinessProfileUpdate, ProductOffering,
    BusinessAnalyzeInput, StructuredBusinessProfile
)
from app.services.business_service import business_service

router = APIRouter()


@router.get("/profile", response_model=StructuredBusinessProfile)
def get_structured_business_profile():
    """Retrieve the AI-extracted structured business profile."""
    return business_service.get_structured_profile()


@router.put("/profile", response_model=StructuredBusinessProfile)
def update_structured_business_profile(profile: StructuredBusinessProfile):
    """Update and persist edits to the structured business profile."""
    return business_service.update_structured_profile(profile)


@router.post("/analyze", response_model=StructuredBusinessProfile)
async def analyze_business(
    company_name: str = Form(...),
    company_website: str = Form(...),
    business_description: str = Form(...),
    products_services: Optional[str] = Form(""),
    target_industries: Optional[str] = Form(""),
    target_locations: Optional[str] = Form(""),
    ideal_customer_profile: Optional[str] = Form(""),
    files: Optional[List[UploadFile]] = File(None)
):
    """
    Analyzes company info and uploaded collateral (PDF, DOCX, TXT)
    using LLM extraction with realistic demo mode fallback.
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

    result = await business_service.analyze_business(input_data, uploaded_files_data)
    return result


@router.post("/analyze-json", response_model=StructuredBusinessProfile)
async def analyze_business_json(input_data: BusinessAnalyzeInput):
    """JSON alternative for analyzing business info without file attachments."""
    return await business_service.analyze_business(input_data, [])


# Legacy / Catalog routes
@router.get("/catalog", response_model=BusinessProfile)
def get_business_catalog():
    """Retrieve raw product catalog and target personas."""
    return business_service.get_profile()


@router.post("/products", response_model=BusinessProfile)
def add_product(product: ProductOffering):
    """Add a new product offering to the seller catalog."""
    return business_service.add_product(product)


@router.post("/reset", response_model=StructuredBusinessProfile)
def reset_to_demo_profile():
    """Reset the business profile to the default CloudArmor AI demo dataset."""
    business_service.reset_to_default()
    return business_service.get_structured_profile()
