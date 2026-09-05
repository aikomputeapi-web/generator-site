import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { plugins, getPluginById } from './plugins/registry';
import { Menu, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const { currentUser, loadedDoc, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Session stats counters
  const [sessionStats, setSessionStats] = useState({
    statementsCount: 0,
    stubsCount: 0,
    profilesCount: 0,
    registrationsCount: 0
  });

  // Listen for loaded documents to auto-route activeTab
  useEffect(() => {
    if (loadedDoc) {
      setActiveTab(loadedDoc.type);
    }
  }, [loadedDoc]);

  // Track page size to auto-collapse sidebar on smaller screens
  useEffect(() => {
    const checkSize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Listen to actions in child plugins to dynamically update stats
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if they clicked print/generate buttons
      const buttonText = target.innerText || '';
      
      if (buttonText.includes('Print or Save as PDF') || buttonText.includes('Auto-Generate')) {
        if (activeTab === 'bank-statement-gen') {
          setSessionStats(s => ({ ...s, statementsCount: s.statementsCount + 1 }));
        }
      }
      
      if (buttonText.includes('Print Pay Stub')) {
        if (activeTab === 'pay-stub-gen') {
          setSessionStats(s => ({ ...s, stubsCount: s.stubsCount + 1 }));
        }
      }
      
      if (buttonText.includes('Copy') || buttonText.includes('Sample Invoice') || buttonText.includes('Business Card')) {
        if (activeTab === 'business-profile-gen') {
          setSessionStats(s => ({ ...s, profilesCount: s.profilesCount + 1 }));
        }
      }

      if (buttonText.includes('Run Registration Job')) {
        if (activeTab === 'account-registration-suite') {
          setSessionStats(s => ({ ...s, registrationsCount: s.registrationsCount + 1 }));
        }
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeTab]);

  const activePlugin = getPluginById(activeTab);
  const ActiveComponent = activePlugin ? activePlugin.component : null;

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        plugins={plugins.map(p => p.metadata)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Layout Area */}
      <main className="main-content" style={{ 
        marginLeft: sidebarCollapsed ? '0px' : '280px'
      }}>
        {/* Header toolbar */}
        <header className="no-print main-content-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem' }} 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
              </button>
            )}

            {activeTab !== 'dashboard' && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setActiveTab('dashboard')}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
            {activeTab === 'account-registration-suite' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.08)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px'
              }}>
                <AlertTriangle size={12} />
                <span style={{ fontSize: '0.75rem' }}>Mock</span>
              </div>
            )}

            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.username}</span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dynamic Route Mounting */}
        <div style={{ paddingBottom: '3rem' }}>
          {activeTab === 'dashboard' ? (
            <Dashboard 
              plugins={plugins} 
              setActiveTab={setActiveTab}
              sessionStats={sessionStats}
            />
          ) : activeTab === 'admin' ? (
            <AdminDashboard />
          ) : (
            <div>
              {/* Header Title for specific active tool */}
              {activePlugin && (
                <div className="no-print" style={{ marginBottom: '2rem' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                    {activePlugin.metadata.name}
                  </h1>
                </div>
              )}
              
              {/* Mounted Tool */}
              {ActiveComponent && <ActiveComponent />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
