"""Business Profile and Product Offering Service"""

from typing import Optional
from app.schemas.business import BusinessProfile, BusinessProfileUpdate, ProductOffering, TargetPersona
from app.services.mock_data_generator import get_default_business_profile


class BusinessService:
    def __init__(self):
        self._profile: BusinessProfile = get_default_business_profile()

    def get_profile(self) -> BusinessProfile:
        return self._profile

    def update_profile(self, update_data: BusinessProfileUpdate) -> BusinessProfile:
        current_data = self._profile.model_dump()
        update_dict = update_data.model_dump(exclude_unset=True)
        current_data.update(update_dict)
        self._profile = BusinessProfile(**current_data)
        return self._profile

    def add_product(self, product: ProductOffering) -> BusinessProfile:
        self._profile.products.append(product)
        return self._profile

    def get_product(self, product_id: str) -> Optional[ProductOffering]:
        for prod in self._profile.products:
            if prod.id == product_id:
                return prod
        return None

    def reset_to_default(self) -> BusinessProfile:
        self._profile = get_default_business_profile()
        return self._profile


business_service = BusinessService()
