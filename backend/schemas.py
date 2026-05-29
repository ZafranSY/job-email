from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator

VALID_STATUSES = {"Applied", "Interviewing", "Rejected", "Offer"}

# Normalization map: accept common user variants and map them to our enum values
STATUS_ALIAS_MAP = {
    "applied": "Applied",
    "application viewed": "Applied",
    "viewed": "Applied",
    "resume downloaded": "Applied",
    
    "interviewing": "Interviewing",
    "interview": "Interviewing",
    
    "rejected": "Rejected",
    "reject": "Rejected",
    "not selected by employer": "Rejected",
    "not selected": "Rejected",
    "declined": "Rejected",
    
    "offer": "Offer",
    "hired": "Offer",
    "accepted": "Offer",
    "offered": "Offer",
}

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

class BulkImportItem(BaseModel):
    company_name: str
    role_title: Optional[str] = None
    status: Optional[str] = "Applied"
    job_url: Optional[str] = None
    created_at: Optional[datetime] = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return "Applied"
        normalized = STATUS_ALIAS_MAP.get(str(v).strip().lower())
        if normalized is None:
            # Try a title-case match directly
            titled = str(v).strip().title()
            if titled in VALID_STATUSES:
                return titled
            raise ValueError(
                f"Invalid status '{v}'. Must be one of: {', '.join(VALID_STATUSES)} "
                f"(or common aliases like 'hired', 'interview', 'reject')."
            )
        return normalized

class BulkImportResponse(BaseModel):
    imported: int
    skipped: int
    message: str

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

