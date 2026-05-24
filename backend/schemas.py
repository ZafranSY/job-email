from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ApplicationCreate(BaseModel):
    company_name: str
    role_title: Optional[str] = None
    status: Optional[str] = "Applied"
    resume_used: Optional[str] = None
    generated_text: Optional[str] = None

class ApplicationManualCreate(BaseModel):
    company_name: str
    role_title: Optional[str] = "Software Engineer"
    status: Optional[str] = "Applied"
    job_url: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class ApplicationResponse(BaseModel):
    id: int
    company_name: str
    role_title: Optional[str] = None
    status: str
    resume_used: Optional[str] = None
    generated_text: Optional[str] = None
    job_url: Optional[str] = None
    source: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
