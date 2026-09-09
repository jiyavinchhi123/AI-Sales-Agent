from typing import List, Optional
from pydantic import BaseModel, Field


class ProductOffering(BaseModel):
    id: str
    name: str
    category: str
    tagline: str
    description: str
    key_features: List[str] = Field(default_factory=list)
    target_pain_points: List[str] = Field(default_factory=list)
    pricing_tier: str
    ideal_customer_size: str
    proof_point: Optional[str] = None


class TargetPersona(BaseModel):
    id: str
    title: str
    seniority: str
    department: str
    key_priorities: List[str] = Field(default_factory=list)
    common_objections: List[str] = Field(default_factory=list)


class BusinessProfile(BaseModel):
    id: str
    company_name: str
    domain: str
    industry: str
    headline: str
    description: str
    value_propositions: List[str] = Field(default_factory=list)
    differentiators: List[str] = Field(default_factory=list)
    products: List[ProductOffering] = Field(default_factory=list)
    target_personas: List[TargetPersona] = Field(default_factory=list)
    collateral_docs: List[str] = Field(default_factory=list)


class BusinessProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    headline: Optional[str] = None
    description: Optional[str] = None
    value_propositions: Optional[List[str]] = None
    differentiators: Optional[List[str]] = None
