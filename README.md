# Career Operating System & Job Application AI Suite

An enterprise-grade, stateful platform to generate tailored application resources, manage job pipelines, and organize high-volume job applications.

---

## 🛠️ Tech Stack

* **Backend**: Python + FastAPI
* **Database & Migrations**: SQLite (default) / PostgreSQL support + SQLAlchemy 2.0 + Alembic
* **Frontend**: React.js + Vanilla CSS (Royal Gold Dark Mode theme)
* **AI Engine**: Google Gemini 2.5 Flash (for tailing cover letters, resume rewrite, and OCR vision)

---

## 📋 Features

### ✉️ Tailored AI Generator
* **Resource Synthesis**: Tailor application emails/letters and rewrite resumes using the Gemini API.
* **Omni-Channel Uploads**: Supports copy-pasted text, dynamic web job URLs (LinkedIn, Indeed, glassdoor), PDF documents, or screenshot images (OCR via Gemini Vision).
* **Strategic Customization**: Adjust generation parameters including Tone (professional, enthusiastic, conversational), Length (short, medium, long), and Focus (balanced, skills, achievements, culture).

### 🗂️ Triage Pipeline Dashboard
* **Dual View-Modes**: Toggle seamlessly between:
  * 🖥️ **Board (Kanban) View**: Drag/transition cards representing job statuses.
  * 📊 **List (Dense Grid) View**: A compact, sortable, and filterable data grid designed for tracking hundreds of applications.
* **Auto-Triage Scaling**: Automatically switches from Kanban to List View when total applications exceed 20 to preserve layout readability.
* **Fixed Glassmorphic Details Drawer**: Click any card or row to slide out a details panel with `backdrop-filter: blur(20px)`, showing original job URLs, ingested sources, and generated covers. Includes backdrop clicks to dismiss.
* **🔌 Direct CRUD Interactions**: Manually add applications using **"+ Quick Add Job"**, update stages inline, or delete records via custom styled alert modals.

---

## 💾 Database Setup (SQLite & PostgreSQL)

The Career Operating System defaults to a local **SQLite** database, but is fully ready to transition to **PostgreSQL** for production environments.

### Option A: Using SQLite (Default)
No extra installation is required. Running `./start.sh` or launching the backend automatically initializes `backend/career_os.db`.

### Option B: Setting Up PostgreSQL
To migrate the backend to PostgreSQL:

1. **Start the PostgreSQL Service**
   * **Using Docker (Recommended)**:
     ```bash
     docker run --name career-postgres -e POSTGRES_DB=career_os -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=securepassword -p 5432:5432 -d postgres
     ```
   * **Using Native System Packages (Linux/Ubuntu)**:
     ```bash
     sudo apt update && sudo apt install postgresql postgresql-contrib
     sudo systemctl start postgresql
     ```

2. **Configure Environment Variables**
   Update/create `backend/.env` with your PostgreSQL database URL connection string:
   ```env
   GEMINI_API_KEY=AIzaSy...
   DATABASE_URL=postgresql://postgres:securepassword@localhost:5432/career_os
   ```

3. **Install PostgreSQL Adaptor**
   Ensure `psycopg2-binary` is installed in your python environment:
   ```bash
   pip install psycopg2-binary
   ```

4. **Run alembic migrations**
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## ⬆️ Bulk Ingestion Pipeline (JSON Format)

The dashboard supports bulk JSON uploads to import historical applications (e.g. migrating from Huntr, Teal, or Excel spreadsheets).

### Accepted JSON Format
Uploads must be structured as a JSON array of objects. Each application object accepts the following fields:

| Field | Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `company_name` | String | **Yes** | Name of the target employer. |
| `role_title` | String | No | Position title (e.g. `Software Engineer`). |
| `status` | String | No | Pipeline status: `Applied`, `Interviewing`, `Rejected`, or `Offer` (case-insensitive, defaults to `Applied`). |
| `job_url` | String | No | Original job posting link. |
| `generated_text`| String | No | Pre-existing email cover draft or application context. |

### Sample Import Template (`job-applied.json`)
```json
[
  {
    "company_name": "Involve Asia",
    "role_title": "Software Engineer",
    "status": "Applied",
    "job_url": "https://involve.asia/careers/software-engineer"
  },
  {
    "company_name": "Symple App Sdn Bhd",
    "role_title": "Backend Developer (Spring Boot)",
    "status": "Interviewing",
    "job_url": "https://symple.app/jobs/backend"
  },
  {
    "company_name": "Google DeepMind",
    "role_title": "Research Engineer",
    "status": "Offer",
    "generated_text": "Tailored cover letter text goes here..."
  }
]
```

To run a bulk import, click the **"Import JSON"** button in the dashboard, select your file, review the loaded preview table, and confirm ingestion.

---

## 🚀 Running the Application

### Option 1: One-command Start (Mac/Linux)
From the repository root:
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Start

#### 1. Backend Service
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. Frontend Development Server
```bash
cd frontend
npm install
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## 📡 API Reference

### Manual Application Ingestion
```http
POST /applications
Content-Type: application/json

{
  "company_name": "Company Name",
  "role_title": "Role Title",
  "status": "Applied",
  "job_url": "https://joblink.com"
}
```

### AI Generation Ingestion
```http
POST /generate
Content-Type: multipart/form-data

Parameters:
- job_description_text: string (optional)
- job_description_url: string (optional)
- job_description_file: file (optional, PDF or Image)
- resume_text: string (optional)
- tone: string (professional | enthusiastic | concise | conversational | formal)
- length: string (short | medium | long)
- focus: string (balanced | skills | achievements | culture)
```
*(Automatically creates an application database entry with `source="ai_generated"`)*
