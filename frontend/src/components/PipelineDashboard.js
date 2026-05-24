import React, { useState, useEffect, useRef, useCallback } from 'react';
import ApplicationTable from './ApplicationTable';

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

  // Bulk Import State
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null); // { count, data[] }
  const [importError, setImportError] = useState('');
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
  const toastTimeout = useRef(null);

  const showToast = useCallback((type, message) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ type, message });
    toastTimeout.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // View Mode: 'kanban' | 'table' — auto-switch to table when > 20 apps
  const [viewMode, setViewMode] = useState('kanban');
  useEffect(() => {
    if (applications.length > 20 && viewMode === 'kanban') {
      setViewMode('table');
    }
  // eslint-disable-next-line
  }, [applications.length]);

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

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = ''; // reset so same file can be re-selected
    if (!file) return;

    setImportError('');
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed)) {
          setImportError('Invalid format — expected a JSON array at the top level.');
          return;
        }
        if (parsed.length === 0) {
          setImportError('The JSON file is empty.');
          return;
        }
        if (parsed.length > 500) {
          setImportError(`Too many records (${parsed.length}). Max allowed is 500 per import.`);
          return;
        }
        // Quick client-side sanity check
        const invalid = parsed.filter(r => !r.company_name);
        if (invalid.length > 0) {
          setImportError(`${invalid.length} record(s) are missing the required "company_name" field.`);
          return;
        }
        setImportPreview({ count: parsed.length, data: parsed });
        setShowImportPreview(true);
      } catch {
        setImportError('Could not parse the file — make sure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!importPreview) return;
    try {
      setImportSubmitting(true);
      const res = await fetch('/applications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPreview.data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.detail || 'Import failed.');
      }
      setShowImportPreview(false);
      setImportPreview(null);
      await fetchApplications();
      showToast('success', result.message);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setImportSubmitting(false);
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Board view"
            >
              ▦ Board
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="List view"
            >
              ≡ List
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
          <button
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ↑ Import JSON
          </button>
          <button 
            className="gen-btn" 
            onClick={() => setShowQuickAdd(true)}
            style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>+</span> Quick Add Job
          </button>
        </div>
      </header>

      {error && <div className="error-box">⚠ {error}</div>}

      {loading ? (
        <div className="loader-container">
          <div className="spinner large" />
          <p className="loader-text">Loading your career dashboard...</p>
        </div>
      ) : (
        <div className="dashboard-container">
          {viewMode === 'table' ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <ApplicationTable
                applications={applications}
                onStatusChange={updateStatus}
                onDelete={deleteApplication}
                onRowClick={setActiveDetails}
                activeId={activeDetails?.id}
              />
            </div>
          ) : (
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
          )}

          {/* Details Drawer - shown in both kanban and table view */}
          {activeDetails && (
            <div className="drawer-backdrop" onClick={() => setActiveDetails(null)}>
              <div className="details-drawer" onClick={e => e.stopPropagation()}>
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
                        {activeDetails.source === 'manual' ? '🔌 Manual Log'
                          : activeDetails.source === 'bulk_import' ? '⬆ Bulk Import'
                          : '✦ AI Generated'}
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

      {/* Import Preview Confirmation Modal */}
      {showImportPreview && importPreview && (
        <div className="modal-backdrop" onClick={() => { setShowImportPreview(false); setImportPreview(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Import Preview</h3>
            <div className="import-preview-badge">
              <span className="import-count">{importPreview.count}</span>
              <span>application{importPreview.count !== 1 ? 's' : ''} found in file</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '12px 0 0', lineHeight: 1.6 }}>
              Duplicates (matched by company + role) will be skipped automatically. 
              Click <strong>Import</strong> to proceed.
            </p>

            {/* Scrollable preview table */}
            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.data.slice(0, 8).map((row, i) => (
                    <tr key={i}>
                      <td>{row.company_name}</td>
                      <td>{row.role_title || '—'}</td>
                      <td>{row.status || 'Applied'}</td>
                    </tr>
                  ))}
                  {importPreview.count > 8 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        + {importPreview.count - 8} more record(s) not shown
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button
                className="action-btn"
                onClick={() => { setShowImportPreview(false); setImportPreview(null); }}
                disabled={importSubmitting}
              >
                Cancel
              </button>
              <button
                className="gen-btn"
                style={{ margin: 0, padding: '10px 20px', width: 'auto' }}
                onClick={handleImportSubmit}
                disabled={importSubmitting}
              >
                {importSubmitting ? 'Importing...' : `Import ${importPreview.count} Record${importPreview.count !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Parse Error */}
      {importError && (
        <div className="modal-backdrop" onClick={() => setImportError('')}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Import Error</h3>
            <p style={{ color: 'var(--danger, #ef4444)', fontSize: '14px', margin: '12px 0 24px', lineHeight: 1.6 }}>
              ⚠ {importError}
            </p>
            <div className="modal-actions">
              <button className="gen-btn danger" style={{ margin: 0, padding: '10px 20px', width: 'auto' }} onClick={() => setImportError('')}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}
    </>
  );
}
