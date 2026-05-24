import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ tone, setTone, length, setLength, focus, setFocus, isGeneratorPage }) {
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

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-icon">💼</span>
        <span className="logo-text">Career OS</span>
      </div>

      <nav className="nav">
        <div className="nav-label">Navigation</div>
        <NavLink 
          to="/generator" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-item-icon">✦</span> Generator
        </NavLink>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-item-icon">📊</span> Pipeline Board
        </NavLink>

        {isGeneratorPage && (
          <>
            <div className="divider" />
            <div className="nav-label">Generator Options</div>

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
          </>
        )}

        <div className="divider" />

        <div className="env-note">
          <span className="env-icon">🔑</span>
          <div>
            <div className="env-title">Local Environment</div>
            <div className="env-sub">FastAPI running on port <code>8005</code></div>
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <p>Enterprise JobMailer</p>
      </div>
    </aside>
  );
}
