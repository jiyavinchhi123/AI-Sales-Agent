from fastapi import APIRouter, HTTPException
from app.schemas.business import BusinessProfile, BusinessProfileUpdate, ProductOffering
from app.services.business_service import business_service

router = APIRouter()


@router.get("/profile", response_model=BusinessProfile)
def get_business_profile():
    """Retrieve the business profile, product catalog, and target personas."""
    return business_service.get_profile()


@router.put("/profile", response_model=BusinessProfile)
def update_business_profile(update_data: BusinessProfileUpdate):
    """Update company value propositions, headline, or details."""
    return business_service.update_profile(update_data)


@router.post("/products", response_model=BusinessProfile)
def add_product(product: ProductOffering):
    """Add a new product offering to the seller catalog."""
    return business_service.add_product(product)


@router.post("/reset", response_model=BusinessProfile)
def reset_to_demo_profile():
    """Reset the business profile to the default CloudArmor AI demo dataset."""
    return business_service.reset_to_default()
