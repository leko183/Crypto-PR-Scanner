import React from 'react'

interface DashboardProps {
  stats: any
  leads: any[]
  sources: any[]
  onScan: () => void
  loading: boolean
}

const Dashboard: React.FC<DashboardProps> = ({ stats, leads, sources, onScan, loading }) => {
  if (!stats) return <div style={{ padding: '40px' }}>Loading...</div>

  return (
    <>
      <div className="topbar">
        <div className="tb-left">
          <div className="tb-title">Lead Scanner</div>
          <div className="tb-sub">Tracking PR & Sponsored articles across 15 platforms</div>
        </div>
        <button 
          className="btn-primary" 
          onClick={onScan} 
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? (
            <><i className="ti ti-loader-2" style={{ marginRight: '5px' }}></i> Scanning...</>
          ) : (
            <><i className="ti ti-radar-2"></i> Start New Scan ↗</>
          )}
        </button>
      </div>

      <div className="stats-row">
        <div className="sc">
          <div className="sc-label"><i className="ti ti-file-text" style={{ color: '#534AB7' }}></i> Bài PR tìm được</div>
          <div className="sc-val">{stats.prArticles}</div>
          <div className="sc-note c-up"><i className="ti ti-arrow-up" style={{ fontSize: '10px' }}></i> {stats.todayPR} hôm nay</div>
        </div>
        <div className="sc">
          <div className="sc-label"><i className="ti ti-building" style={{ color: '#1D9E75' }}></i> Dự án phát hiện</div>
          <div className="sc-val">{stats.projectsDetected}</div>
          <div className="sc-note c-up"><i className="ti ti-arrow-up" style={{ fontSize: '10px' }}></i> {stats.weekProjects} tuần này</div>
        </div>
        <div className="sc">
          <div className="sc-label"><i className="ti ti-mail" style={{ color: '#534AB7' }}></i> Contact thu thập</div>
          <div className="sc-val">{stats.contactsCollected}</div>
          <div className="sc-note c-pr">{stats.contactRate} có email/TG</div>
        </div>
        <div className="sc">
          <div className="sc-label"><i className="ti ti-send" style={{ color: '#D85A30' }}></i> Outreach gửi</div>
          <div className="sc-val">{stats.outreachSent}</div>
          <div className="sc-note c-or">{stats.replyRate} reply rate</div>
        </div>
      </div>

      <div className="body-grid">
        <div className="panel">
          <div className="ph">
            <i className="ti ti-world" style={{ color: '#534AB7' }}></i>
            <span className="ph-title">Sources Tracking</span>
            <span className="ph-count">15 sites</span>
          </div>
          <div className="sources-list">
            {sources.map((src, i) => (
              <div className="src-item" key={i}>
                <div className="src-favicon"><i className="ti ti-globe"></i></div>
                <span className="src-name">{src.name}</span>
                <span className={`st-tag ${src.status === 'DONE' ? 'st-done' : src.status === 'SCANNING' ? 'st-scan' : 'st-wait'}`}>
                  {src.status === 'SCANNING' && <i className="ti ti-loader-2" style={{ fontSize: '10px', verticalAlign: '-1px' }}></i>} {src.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1D9E75' }}></div>
            <span className="ph-title">Live Leads Preview</span>
          </div>
          <div className="leads-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="ltable">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="proj-name">{lead.project}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{lead.type}</div>
                    </td>
                    <td><span className={`cat-badge cb-${lead.category.toLowerCase()}`}>{lead.category}</span></td>
                    <td><span style={{ fontSize: '11px' }}>{lead.date}</span></td>
                    <td>
                      {lead.contact ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className={`ti ti-brand-${lead.contact.includes('@') ? 'x' : 'telegram'}`}></i>
                          <span style={{ fontSize: '11px' }}>{lead.contact}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>not found</span>
                      )}
                    </td>
                    <td><a href="#" style={{ color: '#534AB7', textDecoration: 'none', fontSize: '11px' }}>{lead.source} ↗</a></td>
                    <td><button className="btn-ghost" style={{ height: '24px', fontSize: '11px' }}>Outreach</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
