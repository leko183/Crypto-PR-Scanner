import React, { useState } from 'react'

interface SettingsProps {
  sources: any[]
  onAddSource: (source: any) => void
}

const Settings: React.FC<SettingsProps> = ({ sources, onAddSource }) => {
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    itemSelector: '',
    titleSelector: '',
    linkSelector: '',
    dateSelector: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddSource(newSource)
    setNewSource({ name: '', url: '', itemSelector: '', titleSelector: '', linkSelector: '', dateSelector: '' })
  }

  return (
    <>
      <div className="topbar">
        <div className="tb-left">
          <div className="tb-title">Settings & Sources</div>
          <div className="tb-sub">Quản lý các nguồn tin tức và cấu hình quét</div>
        </div>
      </div>

      <div className="content" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', padding: '20px' }}>
        <div className="panel">
          <div className="ph">
            <i className="ti ti-list"></i>
            <span className="ph-title">Current Sources</span>
            <span className="ph-count">{sources.length} sites</span>
          </div>
          <table className="ltable">
            <thead>
              <tr>
                <th>Site Name</th>
                <th>URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, i) => (
                <tr key={i}>
                  <td><strong>{src.name}</strong></td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{src.url}</td>
                  <td><span className="st-tag st-done">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel" style={{ height: 'fit-content' }}>
          <div className="ph">
            <i className="ti ti-plus"></i>
            <span className="ph-title">Add New Source</span>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Site Name</label>
              <input 
                className="subj-input" 
                placeholder="e.g. coindesk.com" 
                value={newSource.name}
                onChange={e => setNewSource({...newSource, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>PR Page URL</label>
              <input 
                className="subj-input" 
                placeholder="https://..." 
                value={newSource.url}
                onChange={e => setNewSource({...newSource, url: e.target.value})}
                required
              />
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>CSS Selectors (Technical)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input placeholder="Item (e.g. .post)" value={newSource.itemSelector} onChange={e => setNewSource({...newSource, itemSelector: e.target.value})} />
                <input placeholder="Title (e.g. h2 a)" value={newSource.titleSelector} onChange={e => setNewSource({...newSource, titleSelector: e.target.value})} />
                <input placeholder="Link (e.g. a)" value={newSource.linkSelector} onChange={e => setNewSource({...newSource, linkSelector: e.target.value})} />
                <input placeholder="Date (e.g. time)" value={newSource.dateSelector} onChange={e => setNewSource({...newSource, dateSelector: e.target.value})} />
              </div>
            </div>
            <button className="btn-primary" type="submit" style={{ marginTop: '10px' }}>Add Source</button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Settings
