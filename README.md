# Job Application AI Tool

AI-powered suite that generates tailored job application emails and optimizes resumes using the Gemini API. Supports text input, PDFs, images (with OCR), and URLs.

## Stack
- **Backend**: Python + FastAPI
- **Frontend**: React.js
- **AI**: Google Gemini 2.5 Flash (text generation & OCR)

## Features
- ✉️ **Tailored Emails**: Generate high-conversion application emails based on specific job requirements.
- 📄 **Resume Optimization**: Rewrite and align your resume to pass ATS filters for specific job descriptions.
- 📝 **Text Input**: Paste job descriptions and resumes directly
- 📄 **PDF Support**: Extract text from PDF files
- 🖼️ **Image OCR**: Extract text from images using Gemini vision
- 🌐 **URL Support**: Fetch job descriptions directly from LinkedIn, Indeed, or company career pages.
- ⚙️ **Customization**: Choose tone (professional, enthusiastic, formal, etc.), length, and focus strategy
- 💾 **Smart Matching**: Get relevance scores and actionable tips

## Project Structure

```
job-email-tool/
├── backend/
│   ├── main.py             # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── start.sh                # Start both servers (Mac/Linux)
└── README.md
```

## Setup & Run

### Prerequisites
- Python 3.9+
- Node.js 18+
- A free Gemini API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### No external dependencies!
Unlike traditional OCR tools, this app uses Google Gemini's vision capabilities, so there's no need to install Tesseract or other system-level OCR software.

---

### Option 1: One-command start (Mac/Linux)

```bash
chmod +x start.sh
./start.sh
```

---

### Option 2: Manual start

#### Backend
```bash
cd backend

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Install dependencies and run
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend (new terminal)
```bash
cd frontend
npm install
npm start
```

Then open: http://localhost:3000

---

## Usage

1. Get your free Gemini API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Add it to `backend/.env`
3. Start both backend and frontend servers
4. In the web interface, provide the job description and your resume using one of these methods:
   - **Text**: Paste directly
   - **PDF**: Upload a PDF file (text extracted automatically)
   - **Image**: Upload an image file (OCR via Gemini vision)
   - **URL**: Paste a web link
5. Choose tone, length, and focus strategy
6. Click **Generate tailored email** or **Tailor my resume**
7. Copy the result or customize further

## API Endpoint

```
POST /generate
Content-Type: multipart/form-data

Parameters:
- job_description_text: string (optional)
- job_description_url: string (optional)
- job_description_file: file (optional, PDF or image)
- resume_text: string (optional)
- resume_url: string (optional)
- resume_file: file (optional, PDF or image)
- tone: string (professional | enthusiastic | concise | conversational | formal)
- length: string (short | medium | long)
- focus: string (balanced | skills | achievements | culture)

Provide ONE of (text, url, or file) for each section (job description and resume).
```

Response:
```json
{
  "subject": "Compelling subject line",
  "body": "Full email body with specific details and call to action",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "match_score": 85,
  "tips": [
    {"icon": "clock", "text": "Send on Tuesday-Thursday morning for best open rates"},
    {"icon": "paperclip", "text": "Attach your resume as PDF named Firstname_Lastname_Resume.pdf"},
    {"icon": "search", "text": "Research the hiring manager on LinkedIn before sending"}
  ]
}
```

```
POST /tailor-resume
Content-Type: multipart/form-data

Parameters:
- job_description_text: string (optional)
- job_description_url: string (optional)
- job_description_file: file (optional, PDF or image)
- resume_text: string (optional)
- resume_url: string (optional)
- resume_file: file (optional, PDF or image)
- tone: string (professional | enthusiastic | concise | conversational | formal)
- length: string (short | medium | long)
- focus: string (balanced | skills | achievements | culture)

Provide ONE of (text, url, or file) for each section (job description and resume).
```

Response:
```json
{
  "header": "Aligned Contact/Profile Info",
  "summary": "Tailored professional summary with relevant keywords",
  "experience": "Optimized bullet points highlighting relevant achievements",
  "keywords": ["React", "FastAPI", "Cloud Deployment"],
  "match_score": 92
}
```

## Environment Variables

Create a `backend/.env` file:
```
GEMINI_API_KEY=AIza...your_api_key...
```

**Do NOT commit this file to git** (it's already in `.gitignore`)

---

## 📊 Evolved Features: Pipeline & Triage Dashboard

The tool has been upgraded from a simple generator into a full **Career Operating System** to persist, manage, and triage job applications over time.

### 1. View Modes
- 📋 **Pipeline Board (Kanban)**: Track job statuses across visual lanes: `Applied`, `Interviewing`, `Rejected`, and `Offer`. Transition stages instantly.
- 🗂️ **List View (Dense Table)**: High-density, sortable table designed for managing high volumes of jobs (>20). Filters applications by stage count badges and offers instant alphabetical sorting by role or company.
- 🔍 **Glassmorphic Floating Drawer**: Opens application details, generated letter histories, logs, and job links in a premium right-aligned floating modal without disrupting view layout.

### 2. Manual Logging (+ Quick Add)
Quickly log jobs manually directly from the dashboard header, inputting the company name, role title, initial stage, and job URL.

---

## 🗄️ Database Setup & Postgres Migration

By default, the application runs on a local SQLite database (`backend/career_os.db`). For scaling, you can easily migrate the SQLAlchemy backend to PostgreSQL.

### 1. Setting Up PostgreSQL (Docker Setup)
To run a Postgres container locally:
```bash
docker run --name career-os-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=career_os \
  -p 5432:5432 \
  -d postgres
```

### 2. Changing the SQLAlchemy Connection String
In `backend/database.py`, modify line 4 to target Postgres:
```python
# SQLite (Default)
# SQLALCHEMY_DATABASE_URL = "sqlite:///./career_os.db"

# PostgreSQL (Production/Scaling)
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:mysecretpassword@localhost:5432/career_os"
```

*Note: You must install the psycopg2 engine binary (`pip install psycopg2-binary`) in your backend virtual environment when switching to PostgreSQL.*

### 3. Running & Inspecting SQL Data
To query the database table directly:
* **For SQLite**:
  ```bash
  sqlite3 backend/career_os.db
  sqlite> SELECT * FROM applications;
  ```
* **For PostgreSQL**:
  ```bash
  docker exec -it career-os-postgres psql -U postgres -d career_os
  career_os=# SELECT * FROM applications;
  ```

---

## ⬆ Bulk JSON Ingestion Pipeline

To import past job applications in bulk, click **Import JSON** in the dashboard and upload a valid JSON file.

### Accepted JSON Schema Format:
The upload expects an array of objects matching the following layout:
```json
[
  {
    "company_name": "Involve Asia",
    "role_title": "Software Engineer",
    "status": "Applied",
    "job_url": "https://involve.asia/careers/software-engineer",
    "generated_text": "Cover letter context here..."
  },
  {
    "company_name": "Google DeepMind",
    "role_title": "Research Engineer",
    "status": "Interviewing",
    "job_url": "https://deepmind.google/careers",
    "generated_text": "Draft letter context here..."
  }
]
```

### Field Definitions:
- `company_name` (String, **Required**): The name of the organization.
- `role_title` (String, Optional): The position title.
- `status` (String, Optional): Stage of application. Allowed values: `Applied` | `Interviewing` | `Rejected` | `Offer` (Defaults to `Applied`).
- `job_url` (String, Optional): Web address to the job post.
- `generated_text` (String, Optional): Past tailored letter draft body.

