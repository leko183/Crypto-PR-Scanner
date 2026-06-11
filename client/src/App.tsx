import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Outreach from './components/Outreach'
import Settings from './components/Settings'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [stats, setStats] = useState<any>({ prArticles: 0, projectsDetected: 0, contactsCollected: 0, outreachSent: 0, todayPR: '0', weekProjects: '0', contactRate: '0%', replyRate: '0%' })
  const [leads, setLeads] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const refreshData = async () => {
    try {
      const sRes = await fetch('/api/stats');
      if (sRes.ok) setStats(await sRes.json());
      
      const lRes = await fetch('/api/leads');
      if (lRes.ok) setLeads(await lRes.json());
      
      const srcRes = await fetch('/api/sources');
      if (srcRes.ok) setSources(await srcRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 10000); // Tự động làm mới mỗi 10 giây
    return () => clearInterval(interval);
  }, [])

  const handleScan = async () => {
    setLoading(true)
    try {
      await fetch('/api/scan', { method: 'POST' })
      // Không cần chờ scan xong, vì server chạy ngầm. refreshData sẽ tự cập nhật.
    } catch (error) {
      console.error('Scan failed', error)
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  }

  const handleAddSource = async (newSource: any) => {
    try {
      await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      })
      refreshData()
    } catch (error) {
      console.error('Failed to add source', error)
    }
  }

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="main">
        {activeView === 'dashboard' ? (
          <Dashboard 
            stats={stats} 
            leads={leads} 
            sources={sources} 
            onScan={handleScan} 
            loading={loading} 
          />
        ) : activeView === 'outreach' ? (
          <Outreach leads={leads} />
        ) : activeView === 'settings' ? (
          <Settings sources={sources} onAddSource={handleAddSource} />
        ) : (
          <div className="content">
            <div className="topbar">
              <div className="tb-left">
                <div className="tb-title">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>Coming soon...</div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
