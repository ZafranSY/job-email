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
