from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    role_title = Column(String, nullable=True)
    status = Column(String, default="Applied", nullable=False)  # "Applied", "Interviewing", "Rejected", "Offer"
    resume_used = Column(Text, nullable=True)
    generated_text = Column(Text, nullable=True)
    job_url = Column(String, nullable=True)
    source = Column(String, default="ai_generated", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
