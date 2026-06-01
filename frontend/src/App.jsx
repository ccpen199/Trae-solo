import { useState, useEffect } from 'react'
import ApplicationList from './components/ApplicationList'
import ApplicationDetail from './components/ApplicationDetail'
import RiskCheckPanel from './components/RiskCheckPanel'
import UserSwitcher from './components/UserSwitcher'
import { UserProvider, useUser } from './contexts/UserContext'
import './App.css'

function AppContent() {
  const { currentUser } = useUser()
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeView, setActiveView] = useState('applications')

  useEffect(() => {
    setRefreshKey(prev => prev + 1)
    setSelectedAppId(null)
  }, [currentUser])

  const handleApplicationCreated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleReviewComplete = () => {
    setRefreshKey(prev => prev + 1)
  }

  const canAccessReview = currentUser.role === 'reviewer' || currentUser.role === 'admin'
  const canAccessRisk = currentUser.role === 'risk' || currentUser.role === 'admin'
  const canCreateApplication = currentUser.role === 'applicant' || currentUser.role === 'admin'

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>贷前核验风控系统</h1>
            <p>Risk Verification System</p>
          </div>
          <UserSwitcher />
        </div>
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeView === 'applications' ? 'nav-tab-active' : ''}`}
            onClick={() => setActiveView('applications')}
          >
            申请管理
          </button>
          {canAccessReview && (
            <button 
              className={`nav-tab ${activeView === 'review' ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveView('review')}
            >
              信审工作台
            </button>
          )}
          {canAccessRisk && (
            <button 
              className={`nav-tab ${activeView === 'risk' ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveView('risk')}
            >
              风控复核
            </button>
          )}
        </nav>
      </header>
      
      <main className="app-main">
        {selectedAppId ? (
          <ApplicationDetail
            applicationId={selectedAppId}
            onBack={() => setSelectedAppId(null)}
            onReviewComplete={handleReviewComplete}
          />
        ) : activeView === 'risk' ? (
          <RiskCheckPanel key={refreshKey} onSelectApplication={setSelectedAppId} />
        ) : (
          <ApplicationList
            key={refreshKey}
            onSelectApplication={setSelectedAppId}
            onApplicationCreated={handleApplicationCreated}
            showReviewActions={activeView === 'review'}
            canCreateApplication={canCreateApplication}
          />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}

export default App
