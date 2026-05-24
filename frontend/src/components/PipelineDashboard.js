import React, { useState, useEffect } from 'react';

const STAGES = ['Applied', 'Interviewing', 'Rejected', 'Offer'];

export default function PipelineDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDetails, setActiveDetails] = useState(null);

  // Quick Add State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    company_name: '',
    role_title: 'Software Engineer',
    status: 'Applied',
    job_url: '',
  });
  const [quickAddError, setQuickAddError] = useState('');
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/applications');
      if (!res.ok) throw new Error('Failed to fetch applications.');
      const data = await res.json();
      setApplications(data);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status.');
      
      const updated = await res.json();
      setApplications(prev => prev.map(a => a.id === id ? updated : a));
      
      if (activeDetails && activeDetails.id === id) {
        setActiveDetails(updated);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const [deleteId, setDeleteId] = useState(null);

  const deleteApplication = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/applications/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete application.');
      
      setApplications(prev => prev.filter(a => a.id !== deleteId));
      if (activeDetails && activeDetails.id === deleteId) {
        setActiveDetails(null);
      }
      setDeleteId(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickAddForm.company_name.trim()) {
      setQuickAddError('Company Name is required.');
      return;
    }
    try {
      setQuickAddSubmitting(true);
      setQuickAddError('');
      const res = await fetch('/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quickAddForm),
      });
      if (!res.ok) throw new Error('Failed to save manual application.');
      
      const newApp = await res.json();
      setApplications(prev => [newApp, ...prev]);
      
      // Reset form and close modal
      setQuickAddForm({
        company_name: '',
        role_title: 'Software Engineer',
        status: 'Applied',
        job_url: '',
      });
      setShowQuickAdd(false);
    } catch (err) {
      setQuickAddError(err.message);
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  // Group applications by status
  const columns = STAGES.reduce((acc, stage) => {
    acc[stage] = applications.filter(
      app => app.status.toLowerCase() === stage.toLowerCase()
    );
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <>
      <header className="top-bar">
        <div>
          <h1 className="page-title">Career Pipeline Dashboard</h1>
          <p className="page-sub">Track and update the stages of all cover letters generated for your active applications.</p>
        </div>
        <button 
          className="gen-btn" 
          onClick={() => setShowQuickAdd(true)}
          style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>+</span> Quick Add Job
        </button>
      </header>

      {error && <div className="error-box">⚠ {error}</div>}

      {loading ? (
        <div className="loader-container">
          <div className="spinner large" />
          <p className="loader-text">Loading your career dashboard...</p>
        </div>
      ) : (
        <div className="dashboard-container">
          {/* Kanban Board */}
          <div className="kanban-board">
            {STAGES.map(stage => {
              const items = columns[stage] || [];
              return (
                <div key={stage} className={`kanban-column stage-${stage.toLowerCase()}`}>
                  <div className="column-header">
                    <span className="column-dot"></span>
                    <h3 className="column-title">{stage}</h3>
                    <span className="column-count">{items.length}</span>
                  </div>

                  <div className="column-cards">
                    {items.length === 0 ? (
                      <div className="empty-column-placeholder">No applications</div>
                    ) : (
                      items.map(app => (
                        <div 
                          key={app.id} 
                          className={`kanban-card ${activeDetails?.id === app.id ? 'selected' : ''}`}
                          onClick={() => setActiveDetails(app)}
                        >
                          <div className="card-top">
                            <span className="card-company">{app.company_name}</span>
                            <span className="card-date">{formatDate(app.created_at)}</span>
                          </div>
                          <h4 className="card-role">{app.role_title}</h4>

                          <div className="card-actions" onClick={e => e.stopPropagation()}>
                            <select 
                              className="status-select-micro" 
                              value={app.status}
                              onChange={e => updateStatus(app.id, e.target.value)}
                            >
                              {STAGES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button 
                              className="delete-btn-micro"
                              onClick={() => deleteApplication(app.id)}
                              title="Delete Application"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Overlay Panel if activeDetails is selected */}
          {activeDetails && (
            <div className="details-drawer">
              <div className="details-drawer-header">
                <h3>Application Details</h3>
                <button className="close-btn" onClick={() => setActiveDetails(null)}>✕</button>
              </div>
              <div className="details-drawer-body">
                <div className="detail-meta-row">
                  <div>
                    <label className="field-label">Company</label>
                    <div className="detail-value text-gold">{activeDetails.company_name}</div>
                  </div>
                  <div>
                    <label className="field-label">Role</label>
                    <div className="detail-value">{activeDetails.role_title}</div>
                  </div>
                </div>
                <div className="detail-meta-row">
                  <div>
                    <label className="field-label">Applied Date</label>
                    <div className="detail-value">{formatDate(activeDetails.created_at)}</div>
                  </div>
                  <div>
                    <label className="field-label">Pipeline Status</label>
                    <select 
                      className="select" 
                      value={activeDetails.status}
                      onChange={e => updateStatus(activeDetails.id, e.target.value)}
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="detail-meta-row">
                  <div>
                    <label className="field-label">Source</label>
                    <div className="detail-value" style={{ textTransform: 'capitalize' }}>
                      {activeDetails.source === 'manual' ? '🔌 Manual Log' : '✦ AI Generated'}
                    </div>
                  </div>
                  {activeDetails.job_url && (
                    <div>
                      <label className="field-label">Job Link</label>
                      <div className="detail-value">
                        <a href={activeDetails.job_url} target="_blank" rel="noopener noreferrer" className="text-gold" style={{ textDecoration: 'underline' }}>
                          Open Job Link ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {activeDetails.generated_text && (
                  <div className="detail-block">
                    <label className="field-label">Generated Text Context</label>
                    <div className="email-card">
                      <pre className="email-body">{activeDetails.generated_text}</pre>
                    </div>
                  </div>
                )}

                <div className="drawer-footer">
                  <button 
                    className="gen-btn danger" 
                    onClick={() => deleteApplication(activeDetails.id)}
                  >
                    Remove From Board
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {deleteId && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Delete Application</h3>
            <p>Are you sure you want to permanently remove this application from your Pipeline Board?</p>
            <div className="modal-actions">
              <button className="action-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="gen-btn danger" style={{ margin: 0, padding: '10px 20px', width: 'auto' }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showQuickAdd && (
        <div className="modal-backdrop" onClick={() => setShowQuickAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Quick Add Application</h3>
            {quickAddError && <div className="error-box" style={{ marginBottom: '16px' }}>⚠ {quickAddError}</div>}
            
            <form onSubmit={handleQuickAddSubmit}>
              <div className="modal-form-group">
                <label>Company Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Canva"
                  value={quickAddForm.company_name}
                  onChange={e => setQuickAddForm(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label>Role Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software Engineer"
                  value={quickAddForm.role_title}
                  onChange={e => setQuickAddForm(prev => ({ ...prev, role_title: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label>Job URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://indeed.com/job/123"
                  value={quickAddForm.job_url}
                  onChange={e => setQuickAddForm(prev => ({ ...prev, job_url: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label>Stage / Status</label>
                <select 
                  value={quickAddForm.status}
                  onChange={e => setQuickAddForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="action-btn" 
                  onClick={() => setShowQuickAdd(false)}
                  disabled={quickAddSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="gen-btn" 
                  style={{ margin: 0, padding: '10px 20px', width: 'auto' }}
                  disabled={quickAddSubmitting}
                >
                  {quickAddSubmitting ? 'Adding...' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

