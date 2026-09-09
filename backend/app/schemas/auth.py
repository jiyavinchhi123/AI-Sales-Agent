from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    company_name: Optional[str] = Field(None, max_length=100)


class UserLogin(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    company_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

