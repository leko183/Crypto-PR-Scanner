import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Outreach from './components/Outreach'
import Settings from './components/Settings'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const refreshData = () => {
    fetch('/api/stats').then(res => res.json()).then(data => setStats(data))
    fetch('/api/leads').then(res => res.json()).then(data => setLeads(data))
    fetch('/api/sources').then(res => res.json()).then(data => setSources(data))
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleScan = async () => {
    setLoading(true)
    try {
      await fetch('/api/scan', { method: 'POST' })
      refreshData()
    } catch (error) {
      console.error('Scan failed', error)
    } finally {
      setLoading(false)
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
