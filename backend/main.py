from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json
import re
import os
import pdfplumber
import httpx
from PIL import Image
import io
import base64
from typing import Optional
from sqlalchemy.orm import Session

from database import engine, get_db
import models
import schemas

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Autocreate database tables on startup (as a fallback safety)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Application Email Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ===== Helper Functions =====

async def extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from PDF file."""
    content = await file.read()
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")


async def extract_text_from_image(file: UploadFile) -> str:
    """Extract text from image using Gemini vision via ChatPromptTemplate."""
    try:
        # 1. Reset file pointer and read content
        await file.seek(0)
        content = await file.read()
        
        # 2. Determine Media Type
        media_type = file.content_type or "image/jpeg"
        image_base64 = base64.b64encode(content).decode("utf-8")

        # 3. Initialize Model with correct key parameter
        model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            api_key=GEMINI_API_KEY
        )

        # 4. Use ChatPromptTemplate for Multi-modal input
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an OCR specialist. Your task is to extract text from images accurately."),
            ("human", [
                {"type": "text", "text": "Extract all text from this image. Return only the extracted text, nothing else."},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{media_type};base64,{image_base64}"}
                }
            ])
        ])

        chain = prompt | model
        response = await chain.ainvoke({})
        return str(response.content).strip()

    except Exception as e:
        if "API_KEY_INVALID" in str(e):
            raise HTTPException(status_code=401, detail="Invalid Gemini API key inside image extraction.")
        raise HTTPException(status_code=400, detail=f"Error reading image: {str(e)}")

async def fetch_text_from_url(url: str) -> str:
    """Fetch and extract text from URL (HTML)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
        
        # Simple HTML to text extraction
        html_content = response.text
        # Remove script and style tags
        html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL)
        html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL)
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', html_content)
        # Clean whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:5000]  # Limit to 5000 chars
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")


async def process_input(
    text: Optional[str] = None,
    file: Optional[UploadFile] = None,
    url: Optional[str] = None,
    field_name: str = "input"
) -> str:
    """Process input from text, file, or URL."""
    # Priority: text > file > url
    if text and text.strip():
        return text.strip()
    
    if file:
        filename = file.filename.lower() if file.filename else ""
        if filename.endswith(".pdf"):
            return await extract_text_from_pdf(file)
        elif filename.endswith((".png", ".jpg", ".jpeg", ".gif", ".bmp")):
            return await extract_text_from_image(file)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type. Use PDF or image files for {field_name}.")
    
    if url and url.strip():
        return await fetch_text_from_url(url.strip())
    
    raise HTTPException(status_code=400, detail=f"Either text, file, or URL must be provided for {field_name}.")


class EmailResponse(BaseModel):
    subject: str
    body: str
    keywords: list[str]
    match_score: int
    tips: list[dict]


def build_prompt(job_description: str, resume: str, tone: str, length: str, focus: str) -> str:
    length_guide = {
        "short": "2-3 short paragraphs",
        "medium": "3-4 paragraphs",
        "long": "5-6 detailed paragraphs",
    }.get(length, "3-4 paragraphs")

    focus_guide = {
        "balanced": "Balance skills, experience, and motivation equally.",
        "skills": "Lead with and emphasise technical and soft skills relevant to the role.",
        "achievements": "Lead with quantified achievements and results from past roles.",
        "culture": "Emphasise cultural alignment, values, and enthusiasm for the company.",
    }.get(focus, "Balance skills, experience, and motivation equally.")

    return f"""You are a senior career coach and professional email writer. Given the job description and the candidate's resume below, generate a highly tailored job application email.

REQUIREMENTS:
- Tone: {tone}
- Length: {length_guide}
- Focus strategy: {focus_guide}
- Do NOT use generic phrases like "I am writing to apply" or "I believe I am a great fit"
- Reference specific details from BOTH the job description and resume
- Show genuine enthusiasm without being sycophantic
- End with a clear, confident call to action
- Include a compelling email subject line

OUTPUT FORMAT (respond in JSON only, no markdown fences, no extra text):
{{
  "subject": "Email subject line here",
  "body": "Full email body here. Use actual newlines.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "match_score": 85,
  "tips": [
    {{"icon": "clock", "text": "Send on Tuesday-Thursday morning for best open rates"}},
    {{"icon": "paperclip", "text": "Attach your resume as PDF named Firstname_Lastname_Resume.pdf"}},
    {{"icon": "search", "text": "Research the hiring manager on LinkedIn before sending"}},
    {{"icon": "edit", "text": "Personalise the subject line further with the exact role title"}}
  ]
}}

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME:
{resume}"""


class ResumeResponse(BaseModel):
    header: str
    summary: str
    experience: str 
    keywords: list[str]  # Change this from skills_added to keywords
    match_score: int


@app.post("/generate", response_model=EmailResponse)
async def generate_email(
    company_name: str = Form(...),
    role_title: Optional[str] = Form(None),
    job_description_text: Optional[str] = Form(None),
    job_description_url: Optional[str] = Form(None),
    job_description_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    resume_url: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    tone: str = Form("professional"),
    length: str = Form("medium"),
    focus: str = Form("balanced"),
    db: Session = Depends(get_db),
):
    """
    Generate a job application email.
    
    For job_description: provide one of (text, url, or file)
    For resume: provide one of (text, url, or file)
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not set. Add it to backend/.env file."
        )

    try:
        # Process job description from text, file, or URL
        job_description = await process_input(
            text=job_description_text,
            file=job_description_file,
            url=job_description_url,
            field_name="job_description"
        )

        # Process resume from text, file, or URL
        resume = await process_input(
            text=resume_text,
            file=resume_file,
            url=resume_url,
            field_name="resume"
        )

        model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            api_key=GEMINI_API_KEY
        )

        prompt = build_prompt(job_description, resume, tone, length, focus)
        response = model.invoke(prompt)

        raw = response.content.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)

        # Autonomously persist new Application record representing this event
        app_model = models.Application(
            company_name=company_name,
            role_title=role_title or "Software Engineer",
            status="Applied",
            resume_used=resume[:1000] if resume else None,
            generated_text=f"Subject: {data.get('subject', '')}\n\n{data.get('body', '')}",
            source="ai_generated"
        )
        db.add(app_model)
        db.commit()
        db.refresh(app_model)

        return EmailResponse(
            subject=data.get("subject", ""),
            body=data.get("body", ""),
            keywords=data.get("keywords", []),
            match_score=int(data.get("match_score", 0)),
            tips=data.get("tips", []),
        )


    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")
    except Exception as e:
        err = str(e)
        if "API_KEY_INVALID" in err or "invalid" in err.lower():
            raise HTTPException(status_code=401, detail="Invalid Gemini API key.")
        raise HTTPException(status_code=500, detail=f"Error: {err}")


@app.post("/tailor-resume", response_model=ResumeResponse)
async def tailor_resume(
    job_description_text: Optional[str] = Form(None),
    job_description_url: Optional[str] = Form(None),
    job_description_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    resume_url: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
):
    # Fix the field_name to match your process_input requirements
    job_content = await process_input(
        text=job_description_text, 
        file=job_description_file, 
        url=job_description_url, 
        field_name="job_description"
    )
    resume_content = await process_input(
        text=resume_text, 
        file=resume_file, 
        url=resume_url, 
        field_name="resume"
    )

    prompt = f"""
    You are an ATS optimization expert. Rewrite the resume to match the job description.
    
    OUTPUT FORMAT (respond in JSON only, no markdown):
    {{
      "header": "Professional Profile / Contact Info Alignment",
      "summary": "Tailored professional summary...",
      "experience": "Detailed Experience section with optimized bullets...",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "match_score": 95
    }}

    JOB DESCRIPTION:
    {job_content}

    RESUME:
    {resume_content}
    """

    # Ensure you are using the same model as the working email endpoint
    model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=GEMINI_API_KEY)
    response = model.invoke(prompt)
    
    raw = response.content.strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    
    try:
        data = json.loads(raw)
        return ResumeResponse(**data) # Explicitly validate against the model
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")


@app.post("/applications", response_model=schemas.ApplicationResponse)
def create_manual_application(app_in: schemas.ApplicationManualCreate, db: Session = Depends(get_db)):
    app_record = models.Application(
        company_name=app_in.company_name,
        role_title=app_in.role_title or "Software Engineer",
        status=app_in.status or "Applied",
        job_url=app_in.job_url,
        source="manual"
    )
    db.add(app_record)
    db.commit()
    db.refresh(app_record)
    return app_record


@app.post("/applications/bulk", response_model=schemas.BulkImportResponse)
def bulk_import_applications(items: list[schemas.BulkImportItem], db: Session = Depends(get_db)):
    if not items:
        raise HTTPException(status_code=400, detail="Payload is empty. Send at least one application.")
    if len(items) > 500:
        raise HTTPException(status_code=400, detail="Batch size exceeds limit of 500 records per request.")

    # Build a dedup key set from existing records to skip exact duplicates
    existing = db.query(
        models.Application.company_name,
        models.Application.role_title,
    ).all()
    existing_set = {(row.company_name.lower(), (row.role_title or "").lower()) for row in existing}

    to_insert = []
    skipped = 0

    for idx, item in enumerate(items):
        dedup_key = (item.company_name.lower(), (item.role_title or "").lower())
        if dedup_key in existing_set:
            skipped += 1
            continue

        to_insert.append(models.Application(
            company_name=item.company_name,
            role_title=item.role_title,
            status=item.status or "Applied",
            job_url=item.job_url,
            source="bulk_import",
            created_at=item.created_at,
        ))
        existing_set.add(dedup_key)  # prevent intra-batch duplicates too

    if not to_insert:
        return schemas.BulkImportResponse(
            imported=0,
            skipped=skipped,
            message=f"All {skipped} record(s) already exist in the database. Nothing new was added."
        )

    db.add_all(to_insert)
    db.commit()

    return schemas.BulkImportResponse(
        imported=len(to_insert),
        skipped=skipped,
        message=f"Successfully imported {len(to_insert)} application(s). Skipped {skipped} duplicate(s)."
    )


@app.get("/applications", response_model=list[schemas.ApplicationResponse])
def get_applications(db: Session = Depends(get_db)):
    return db.query(models.Application).order_by(models.Application.created_at.desc()).all()

@app.patch("/applications/{id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(id: int, status_update: schemas.StatusUpdate, db: Session = Depends(get_db)):
    app_record = db.query(models.Application).filter(models.Application.id == id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    # Clean the input status (capitalize first letter to match Kanban header e.g. "Applied")
    cleaned_status = status_update.status.strip().title()
    app_record.status = cleaned_status
    db.commit()
    db.refresh(app_record)
    return app_record

@app.delete("/applications/{id}")
def delete_application(id: int, db: Session = Depends(get_db)):
    app_record = db.query(models.Application).filter(models.Application.id == id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_record)
    db.commit()
    return {"status": "success", "message": f"Deleted application {id}"}


@app.get("/health")
def health():
    return {"status": "ok", "api_key_set": bool(GEMINI_API_KEY)}

