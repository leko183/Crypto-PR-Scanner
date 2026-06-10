import React from 'react'

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="sb">
      <div className="sb-logo">
        <div className="logo-row">
          <div className="logo-dot"><i className="ti ti-radar-2"></i></div>
          <div>
            <div className="logo-name">CryptoPR Scan</div>
            <div className="logo-tag">Media Intelligence</div>
          </div>
        </div>
      </div>
      <nav className="sb-nav">
        <div 
          className={`nav-item ${activeView === 'dashboard' ? 'act' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <i className="ti ti-layout-dashboard"></i> Dashboard <span className="nav-badge">3</span>
        </div>
        <div 
          className={`nav-item ${activeView === 'history' ? 'act' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <i className="ti ti-history"></i> Reports History
        </div>
        <div 
          className={`nav-item ${activeView === 'outreach' ? 'act' : ''}`}
          onClick={() => setActiveView('outreach')}
        >
          <i className="ti ti-message-bolt"></i> Outreach Scripts
        </div>
        <div className="sb-sep"></div>
        <div className="nav-item"><i className="ti ti-bell"></i> Alerts</div>
        <div 
          className={`nav-item ${activeView === 'settings' ? 'act' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <i className="ti ti-settings"></i> Settings
        </div>
      </nav>
      <div className="sb-footer">
        <div className="user-row">
          <div className="uavatar">NM</div>
          <div>
            <div className="uname">Nguyen Minh</div>
            <div className="uplan">Pro · 15 platforms</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
