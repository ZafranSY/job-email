import React, { useState, useRef } from 'react';

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

export default function JobGenerator({ tone, length, focus }) {
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');

  const [jobDesc, setJobDesc] = useState('');
  const [jobDescUrl, setJobDescUrl] = useState('');
  const [jobDescFile, setJobDescFile] = useState(null);
  const [jobDescMode, setJobDescMode] = useState('text'); // 'text', 'url', 'file'

  const [resume, setResume] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeMode, setResumeMode] = useState('text'); // 'text', 'url', 'file'

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
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
    if (!companyName.trim()) {
      return setError('Company Name is required.');
    }

    const hasJobDesc = jobDescMode === 'text' ? jobDesc.trim() : 
                       jobDescMode === 'url' ? jobDescUrl.trim() : jobDescFile;
    const hasResume = resumeMode === 'text' ? resume.trim() : 
                      resumeMode === 'url' ? resumeUrl.trim() : resumeFile;
    
    if (!hasJobDesc) return setError('Please provide a job description (text, URL, or file).');
    if (!hasResume) return setError('Please provide your resume (text, URL, or file).');

    setLoading(true);
    setResult(null);
    setResumeResult(null);
    startLoadingMsgs();

    try {
      const formData = new FormData();
      formData.append('company_name', companyName.trim());
      formData.append('role_title', roleTitle.trim() || 'Software Engineer');

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

  const generateResume = async () => {
    setError('');
    
    // Resume tailoring doesn't strictly persist to SQLite but we require company name for context uniformity
    if (!companyName.trim()) {
      return setError('Company Name is required to personalize your resume.');
    }

    setLoading(true);
    setResult(null); 
    setResumeResult(null);
    startLoadingMsgs();

    try {
      const formData = new FormData();
      formData.append('company_name', companyName.trim());
      formData.append('role_title', roleTitle.trim() || 'Software Engineer');

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
            type="button"
            className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            Text
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
          >
            URL
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'file' ? 'active' : ''}`}
            onClick={() => setMode('file')}
          >
            File
          </button>
        </div>
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
            placeholder="Paste a URL (e.g. LinkedIn job posting link)..."
          />
          <span className="input-helper">URLs are fetched and parsed by backend</span>
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
          <span className="input-helper">Supported: PDF, PNG, JPG, GIF, BMP (OCR matching)</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="top-bar">
        <h1 className="page-title">Enterprise Job Generator</h1>
        <p className="page-sub">Configure details below to draft tailored cover letters and sync them to your local Pipeline Board.</p>
      </header>

      {/* Target Details Form */}
      <div className="target-details-card">
        <div className="target-details-grid">
          <div className="field">
            <label className="field-label required-label">Company Name *</label>
            <input 
              type="text" 
              className="text-input" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Stripe, Canva" 
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Role Title</label>
            <input 
              type="text" 
              className="text-input" 
              value={roleTitle} 
              onChange={e => setRoleTitle(e.target.value)}
              placeholder="e.g. Full Stack Engineer (optional)" 
            />
          </div>
        </div>
      </div>

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
          'Job description requirements',
          'Paste the job specifications, roles, responsibilities and stack details...'
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
          'Candidate resume profile',
          'Paste your experience details, skills, education, and relevant projects...'
        )}
      </div>

      <div className="action-buttons-row">
        <button className="gen-btn" onClick={generate} disabled={loading}>
          {loading ? <span className="spinner" /> : '✦ Draft Cover Letter & Save'}
        </button>
        <button className="gen-btn accent" onClick={generateResume} disabled={loading}>
          {loading ? <span className="spinner" /> : '📄 Tailor My Resume Content'}
        </button>
      </div>

      {loading && (
        <div className="loader-container">
          <div className="spinner large" />
          <p className="loader-text">{loadingMsg}</p>
        </div>
      )}

      {error && <div className="error-box">⚠ {error}</div>}

      {result && (
        <div className="output" ref={outputRef}>
          <div className="output-header">
            <h2 className="output-title">Your application email</h2>
            <div className="output-actions">
              <span className={`score-badge ${scoreClass(result.match_score)}`}>{result.match_score}% Match Score</span>
              <button className="action-btn" onClick={copyEmail}>{copied ? '✓ Copied!' : '⎘ Copy'}</button>
              <button className="action-btn" onClick={openMailto}>✉ Open Mail Client</button>
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
            <div className="section-title">🏷 Extracted ATS Keywords</div>
            <div className="keywords">
              {result.keywords.map((kw, i) => <span key={i} className="keyword">{kw}</span>)}
            </div>
          </div>

          <div className="section-card">
            <div className="section-title">💡 Writing Tips & Best Practices</div>
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
            <h2 className="output-title">Optimized Resume Content</h2>
            <div className="output-actions">
              <span className={`score-badge ${scoreClass(resumeResult.match_score)}`}>
                {resumeResult.match_score}% ATS Match
              </span>
              <button className="action-btn" onClick={() => {
                navigator.clipboard.writeText(`${resumeResult.summary}\n\n${resumeResult.experience}`);
              }}>⎘ Copy Optimized Content</button>
            </div>
          </div>

          <div className="email-card">
            <div className="email-subject-row">
              <span className="email-field-label">Focus</span>
              <span className="email-subject">{resumeResult.header}</span>
            </div>
            <div className="email-divider" />
            <div className="email-body">
              <strong>Summary Profile</strong>
              <p>{resumeResult.summary}</p>
              <br />
              <strong>ATS Experience Bullets</strong>
              <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                {resumeResult.experience}
              </pre>
            </div>
          </div>

          <div className="section-card">
            <div className="section-title">🏷 Recommended Keywords</div>
            <div className="keywords">
              {resumeResult.keywords.map((kw, i) => <span key={i} className="keyword">{kw}</span>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
