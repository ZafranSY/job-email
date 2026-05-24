import React, { useState, useMemo } from 'react';

const STAGES = ['Applied', 'Interviewing', 'Rejected', 'Offer'];

const STATUS_STYLES = {
  Applied:      { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  color: '#93c5fd' },
  Interviewing: { bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.4)',   color: '#fde047' },
  Rejected:     { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   color: '#fca5a5' },
  Offer:        { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)',  color: '#6ee7b7' },
};

const SOURCE_LABEL = {
  manual:       '🖊 Manual',
  ai_generated: '✦ AI',
  bulk_import:  '⬆ Import',
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Applied;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '99px',
      fontSize: '12px',
      fontWeight: 600,
      background: style.bg,
      border: `1px solid ${style.border}`,
      color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

export default function ApplicationTable({ applications, onStatusChange, onDelete, onRowClick, activeId }) {
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir]     = useState('desc');
  const [filterStatus, setFilterStatus] = useState('All');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    let rows = filterStatus === 'All'
      ? [...applications]
      : applications.filter(a => a.status === filterStatus);

    rows.sort((a, b) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (sortField === 'created_at') {
        va = new Date(va);
        vb = new Date(vb);
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [applications, sortField, sortDir, filterStatus]);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: 'var(--accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thStyle = (field) => ({
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid var(--border)',
    cursor: field ? 'pointer' : 'default',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Filter Bar */}
      <div className="table-filter-bar">
        <span className="table-count">
          {sorted.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
        </span>
        <div className="table-filter-pills">
          {['All', ...STAGES].map(s => (
            <button
              key={s}
              className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'All' ? 'All' : (
                <><span className="pill-dot" data-status={s} />{s}</>
              )}
              {s !== 'All' && (
                <span className="pill-badge">
                  {applications.filter(a => a.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="app-table-wrap">
        {sorted.length === 0 ? (
          <div className="empty-column-placeholder" style={{ padding: '48px', textAlign: 'center' }}>
            No applications match the selected filter.
          </div>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th style={thStyle('company_name')} onClick={() => handleSort('company_name')}>
                  Company <SortIcon field="company_name" />
                </th>
                <th style={thStyle('role_title')} onClick={() => handleSort('role_title')}>
                  Role <SortIcon field="role_title" />
                </th>
                <th style={thStyle('status')} onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th style={thStyle('created_at')} onClick={() => handleSort('created_at')}>
                  Date Applied <SortIcon field="created_at" />
                </th>
                <th style={thStyle(null)}>Source</th>
                <th style={thStyle(null)}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((app) => (
                <tr
                  key={app.id}
                  className={`app-table-row ${activeId === app.id ? 'selected' : ''}`}
                  onClick={() => onRowClick(app)}
                >
                  <td className="app-table-cell">
                    <span className="table-company">{app.company_name}</span>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-link"
                        onClick={e => e.stopPropagation()}
                        title="Open job link"
                      >
                        ↗
                      </a>
                    )}
                  </td>
                  <td className="app-table-cell table-role">{app.role_title || <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td className="app-table-cell" onClick={e => e.stopPropagation()}>
                    <select
                      className="status-select-micro"
                      value={app.status}
                      onChange={e => onStatusChange(app.id, e.target.value)}
                      style={{ background: 'transparent', border: 'none', padding: 0 }}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="app-table-cell table-date">{formatDate(app.created_at)}</td>
                  <td className="app-table-cell">
                    <span className="table-source-label">
                      {SOURCE_LABEL[app.source] || app.source}
                    </span>
                  </td>
                  <td className="app-table-cell" onClick={e => e.stopPropagation()}>
                    <button
                      className="delete-btn-micro"
                      onClick={() => onDelete(app.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
