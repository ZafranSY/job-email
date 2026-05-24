import React, { useState, useRef } from 'react';
import './App.css';

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'concise', label: 'Concise & direct' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'formal', label: 'Formal' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (2–3 paragraphs)' },
  { value: 'medium', label: 'Medium (3–4 paragraphs)' },
  { value: 'long', label: 'Detailed (5+ paragraphs)' },
];

const FOCUS_OPTIONS = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'skills', label: 'Highlight skills' },
  { value: 'achievements', label: 'Lead with achievements' },
  { value: 'culture', label: 'Culture fit' },
];

const LOADING_MSGS = [
  'Analysing job description…',
  'Matching your experience to requirements…',
  'Crafting your opening hook…',
  'Tailoring tone and structure…',
  'Finalising your email…',
];

const TIP_ICONS = {
  clock: '⏰', paperclip: '📎', search: '🔍', edit: '✏️',
  mail: '📬', star: '⭐', check: '✅', info: 'ℹ️',
};

export default function App() {
  const [jobDesc, setJobDesc] = useState('');
  const [jobDescUrl, setJobDescUrl] = useState('');
  const [jobDescFile, setJobDescFile] = useState(null);
  const [jobDescMode, setJobDescMode] = useState('text'); // 'text', 'url', 'file'
  
  const [resume, setResume] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeMode, setResumeMode] = useState('text'); // 'text', 'url', 'file'
  const [resumeResult, setResumeResult] = useState(null);
  
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [focus, setFocus] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);
  const msgTimer = useRef(null);

  const startLoadingMsgs = () => {
    let i = 0;
    setLoadingMsg(LOADING_MSGS[0]);
    msgTimer.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[i]);
    }, 1400);
  };

  const stopLoadingMsgs = () => clearInterval(msgTimer.current);

  const generate = async () => {
    setError('');
    
    // Validate inputs
    const hasJobDesc = jobDescMode === 'text' ? jobDesc.trim() : 
                       jobDescMode === 'url' ? jobDescUrl.trim() : jobDescFile;
    const hasResume = resumeMode === 'text' ? resume.trim() : 
                      resumeMode === 'url' ? resumeUrl.trim() : resumeFile;
    
    if (!hasJobDesc) return setError('Please provide a job description (text, URL, or file).');
    if (!hasResume) return setError('Please provide your resume (text, URL, or file).');

    setLoading(true);
    setResult(null);
    startLoadingMsgs();

    try {
      const formData = new FormData();
      
      // Add job description
      if (jobDescMode === 'text') {
        formData.append('job_description_text', jobDesc);
      } else if (jobDescMode === 'url') {
        formData.append('job_description_url', jobDescUrl);
      } else if (jobDescMode === 'file') {
        formData.append('job_description_file', jobDescFile);
      }
      
      // Add resume
      if (resumeMode === 'text') {
        formData.append('resume_text', resume);
      } else if (resumeMode === 'url') {
        formData.append('resume_url', resumeUrl);
      } else if (resumeMode === 'file') {
        formData.append('resume_file', resumeFile);
      }
      
      // Add options
      formData.append('tone', tone);
      formData.append('length', length);
      formData.append('focus', focus);

      const res = await fetch('/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong.');

      setResult(data);
      stopLoadingMsgs();
      setLoading(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      stopLoadingMsgs();
      setLoading(false);
      setError(e.message);
    }
  };

  const copyEmail = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openMailto = () => {
    if (!result) return;
    window.open(`mailto:?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`);
  };

  const scoreClass = (s) => s >= 80 ? 'score-high' : s >= 60 ? 'score-mid' : 'score-low';

  const renderInputField = (
    mode,
    setMode,
    textValue,
    setText,
    urlValue,
    setUrl,
    fileValue,
    setFile,
    icon,
    title,
    placeholder
  ) => (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">{icon}</span>
        <span className="panel-title">{title}</span>
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            Text
          </button>
          <button
            className={`mode-tab ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
          >
            URL
          </button>
          <button
            className={`mode-tab ${mode === 'file' ? 'active' : ''}`}
            onClick={() => setMode('file')}
          >
            File
          </button>
        </div>
        {mode !== 'text' && <span className="char-count">{textValue.length} chars</span>}
      </div>
      
      {mode === 'text' && (
        <textarea
          className="panel-textarea"
          value={textValue}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
        />
      )}
      
      {mode === 'url' && (
        <div className="input-group">
          <input
            type="url"
            className="url-input"
            value={urlValue}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste a URL to the job posting or resume (e.g., LinkedIn job URL)…"
          />
          <span className="input-helper">URLs are fetched and converted to text</span>
        </div>
      )}
      
      {mode === 'file' && (
        <div className="file-input-group">
          <label className="file-input-label">
            <span className="file-input-text">
              {fileValue ? `✓ ${fileValue.name}` : '📎 Choose PDF or image file…'}
            </span>
            <input
              type="file"
              className="file-input"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <span className="input-helper">Supported: PDF, PNG, JPG, GIF, BMP (OCR for images)</span>
        </div>
      )}
    </div>
  );

  const generateResume = async () => {
    setError('');
    setLoading(true);
    setResult(null); 
    setResumeResult(null);
    startLoadingMsgs();

    try {
      const formData = new FormData();
      
      // Add job description logic
      if (jobDescMode === 'text') formData.append('job_description_text', jobDesc);
      else if (jobDescMode === 'url') formData.append('job_description_url', jobDescUrl);
      else if (jobDescMode === 'file') formData.append('job_description_file', jobDescFile);
      
      // Add resume logic
      if (resumeMode === 'text') formData.append('resume_text', resume);
      else if (resumeMode === 'url') formData.append('resume_url', resumeUrl);
      else if (resumeMode === 'file') formData.append('resume_file', resumeFile);

      // Options
      formData.append('tone', tone);
      formData.append('length', length);
      formData.append('focus', focus);

      const res = await fetch('/tailor-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong.');

      setResumeResult(data);
      stopLoadingMsgs();
      setLoading(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      stopLoadingMsgs();
      setLoading(false);
      setError(e.message);
    }
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">✉</span>
          <span className="logo-text">JobMailer</span>
        </div>

        <nav className="nav">
          <div className="nav-label">Options</div>

          <div className="field">
            <label className="field-label">Tone</label>
            <select className="select" value={tone} onChange={e => setTone(e.target.value)}>
              {TONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Length</label>
            <select className="select" value={length} onChange={e => setLength(e.target.value)}>
              {LENGTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Focus</label>
            <select className="select" value={focus} onChange={e => setFocus(e.target.value)}>
              {FOCUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="divider" />

          <div className="env-note">
            <span className="env-icon">🔑</span>
            <div>
              <div className="env-title">API key via .env</div>
              <div className="env-sub">Set <code>GEMINI_API_KEY</code> in <code>backend/.env</code></div>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <p>Powered by Gemini</p>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="top-bar">
          <h1 className="page-title">Job Application Generator</h1>
          <p className="page-sub">Paste a job description and your resume to get a tailored application email or optimized resume.</p>
        </header>

        <div className="panels">
          {renderInputField(
            jobDescMode,
            setJobDescMode,
            jobDesc,
            setJobDesc,
            jobDescUrl,
            setJobDescUrl,
            jobDescFile,
            setJobDescFile,
            '💼',
            'Job description',
            'Paste the full job posting here — role title, company, responsibilities, requirements…'
          )}

          {renderInputField(
            resumeMode,
            setResumeMode,
            resume,
            setResume,
            resumeUrl,
            setResumeUrl,
            resumeFile,
            setResumeFile,
            '📄',
            'Your resume / CV',
            'Paste your resume text here — experience, skills, education, achievements…'
          )}
        </div>

        <button className="gen-btn" onClick={generate} disabled={loading} style={{ flex: 1 }}>
          {loading ? <span className="spinner" /> : '✦ Generate tailored email'}
        </button>
        <button className="gen-btn accent" onClick={generateResume} disabled={loading} style={{ flex: 1 }}>
          {loading ? <span className="spinner" /> : '📄 Tailor my resume'}
        </button>

        {error && <div className="error-box">⚠ {error}</div>}

        {result && (
          <div className="output" ref={outputRef}>
            <div className="output-header">
              <h2 className="output-title">Your application email</h2>
              <div className="output-actions">
                <span className={`score-badge ${scoreClass(result.match_score)}`}>{result.match_score}% match</span>
                <button className="action-btn" onClick={copyEmail}>{copied ? '✓ Copied!' : '⎘ Copy'}</button>
                <button className="action-btn" onClick={openMailto}>✉ Open in mail</button>
                <button className="action-btn accent" onClick={generate} disabled={loading}>↺ Regenerate</button>
              </div>
            </div>

            <div className="email-card">
              <div className="email-subject-row">
                <span className="email-field-label">Subject</span>
                <span className="email-subject">{result.subject}</span>
              </div>
              <div className="email-divider" />
              <pre className="email-body">{result.body}</pre>
            </div>

            <div className="section-card">
              <div className="section-title">🏷 Matched keywords</div>
              <div className="keywords">
                {result.keywords.map((kw, i) => <span key={i} className="keyword">{kw}</span>)}
              </div>
            </div>

            <div className="section-card">
              <div className="section-title">💡 Sending tips</div>
              <div className="tips-grid">
                {result.tips.map((tip, i) => (
                  <div key={i} className="tip">
                    <span className="tip-icon">{TIP_ICONS[tip.icon] || 'ℹ️'}</span>
                    <span className="tip-text">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {resumeResult && (
            <div className="output" ref={outputRef}>
                <div className="output-header">
                    <h2 className="output-title">Tailored Resume Content</h2>
                    <div className="output-actions">
                        <span className={`score-badge ${scoreClass(resumeResult.match_score)}`}>
                            {resumeResult.match_score}% ATS Match
                        </span>
                        <button className="action-btn" onClick={() => {
                            navigator.clipboard.writeText(`${resumeResult.summary}\n\n${resumeResult.experience}`);
                        }}>⎘ Copy Content</button>
                    </div>
                </div>

                <div className="email-card">
                    <div className="email-subject-row">
                        <span className="email-field-label">Focus</span>
                        <span className="email-subject">{resumeResult.header}</span>
                    </div>
                    <div className="email-divider" />
                    <div className="email-body">
                        <strong>Summary</strong>
                        <p>{resumeResult.summary}</p>
                        <br />
                        <strong>Experience</strong>
                        <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                            {resumeResult.experience}
                        </pre>
                    </div>
                </div>

                <div className="section-card">
                    <div className="section-title">🏷 ATS Keywords Included</div>
                    <div className="keywords">
                        {resumeResult.keywords.map((kw, i) => <span key={i} className="keyword">{kw}</span>)}
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
