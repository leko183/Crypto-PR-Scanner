import React, { useState } from 'react'

interface OutreachProps {
  leads: any[]
}

const Outreach: React.FC<OutreachProps> = ({ leads }) => {
  const [activeTab, setActiveTab] = useState('email')
  const [emailBody, setEmailBody] = useState(`Hi {{contact_name}},

I came across {{project_name}}'s recent article on {{source_site}} — really impressive work on {{category}}.

I'm reaching out because we specialize in PR & sponsored content placements across 15+ top crypto media platforms.

Would you be open to a quick 15-min call this week?

Best regards,
Nguyen Minh`)

  return (
    <>
      <div className="topbar">
        <div className="tb-left">
          <div className="tb-title">Outreach Scripts</div>
          <div className="tb-sub">Soạn template và gửi hàng loạt tới danh sách leads</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost"><i className="ti ti-history"></i> Lịch sử</button>
          <button className="btn-ghost"><i className="ti ti-sparkles"></i> AI Generate ↗</button>
        </div>
      </div>

      <div className="content">
        <div className="tabs-row">
          <div className={`tab ${activeTab === 'email' ? 'act' : ''}`} onClick={() => setActiveTab('email')}>
            <i className="ti ti-mail"></i> Email <span className="tab-count">3</span>
          </div>
          <div className={`tab ${activeTab === 'tg' ? 'act' : ''}`} onClick={() => setActiveTab('tg')}>
            <i className="ti ti-brand-telegram"></i> Telegram <span className="tab-count">2</span>
          </div>
        </div>

        <div className="tcard">
          <div style={{ padding: '20px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: activeTab === 'email' ? '#E6F1FB' : '#E1F5EE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <i className={`ti ti-${activeTab === 'email' ? 'mail' : 'brand-telegram'}`} style={{ color: activeTab === 'email' ? '#185FA5' : '#0F6E56', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{activeTab === 'email' ? 'Email Template' : 'Telegram Template'}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Sử dụng các biến để cá nhân hoá</div>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {activeTab === 'email' && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, width: '60px' }}>Subject</span>
                <input className="subj-input" style={{ flex: 1, height: '36px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '0 12px' }} value="Partnership opportunity with {{project_name}}" />
              </div>
            )}
            
            <textarea 
              className="template-area" 
              value={activeTab === 'email' ? emailBody : 'Hi {{contact_name}}!'}
              onChange={(e) => activeTab === 'email' ? setEmailBody(e.target.value) : null}
            />

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['contact_name', 'project_name', 'source_site', 'category'].map(v => (
                <span key={v} className="var-tag" style={{ background: '#EEEDFE', color: '#534AB7', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid #AFA9EC' }}>
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <i className="ti ti-users"></i>
            <span className="ph-title">Danh sách nhận</span>
            <span className="ph-count">{leads.length} leads</span>
          </div>
          <table className="ltable">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked /></th>
                <th>Project</th>
                <th>Category</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td><input type="checkbox" checked /></td>
                  <td>
                    <div className="proj-name">{lead.project}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{lead.source}</div>
                  </td>
                  <td><span className={`cat-badge cb-${lead.category.toLowerCase()}`}>{lead.category}</span></td>
                  <td style={{ fontSize: '12px' }}>{lead.contact || '—'}</td>
                  <td><span className={`status-pill sp-${lead.status === 'Sent' ? 'sent' : lead.status === 'Pending' ? 'pending' : 'failed'}`}>{lead.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ padding: '16px 20px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Ước tính gửi: <strong>~{leads.filter(l => l.contact).length * 0.5} phút</strong></span>
            <button className="btn-primary"><i className="ti ti-send"></i> Gửi hàng loạt</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Outreach
