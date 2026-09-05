import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import type { PluginMetadata } from '../plugins/types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  plugins: PluginMetadata[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  plugins,
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed
}) => {
  const { currentUser } = useAuth();
  
  // Accordion folder expanded state
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [generatorsExpanded, setGeneratorsExpanded] = useState(true);
  const [registrationsExpanded, setRegistrationsExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);

  const handleItemClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 1024) {
      setCollapsed(true);
    }
  };

  // Categorize plugins
  const generators = plugins.filter(p => p.category === 'generator');
  const registrations = plugins.filter(p => p.category === 'registration');

  // Helper to render lucide icons dynamically based on metadata string
  const renderIcon = (iconName: string, size = 18) => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={size} />;
    }
    return <Icons.HelpCircle size={size} />;
  };

  return (
    <aside className="sidebar" style={{ 
      transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
      width: collapsed ? '0px' : '280px',
      padding: collapsed ? '0px' : '2rem 1.5rem',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '8px', 
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.25rem'
        }}>
          Ω
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.5px' }}>OMNI DECK</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>CONTROL SITE</span>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto' }}>
        {/* Core Deck Accordion */}
        <div>
          <button 
            onClick={() => setCoreExpanded(!coreExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              padding: '0.25rem 0',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
               Core
             </span>
            {coreExpanded ? <Icons.ChevronDown size={12} /> : <Icons.ChevronRight size={12} />}
          </button>
          
          <div style={{ 
            maxHeight: coreExpanded ? '150px' : '0px', 
            overflow: 'hidden', 
            transition: 'max-height 0.25s ease-in-out',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.35rem' 
          }}>
            <button 
              onClick={() => handleItemClick('dashboard')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: activeTab === 'dashboard' ? 'var(--accent-light)' : 'transparent',
                color: activeTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: activeTab === 'dashboard' ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9rem',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <Icons.LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Generator Plugins Accordion */}
        {generators.length > 0 && (
          <div>
            <button 
              onClick={() => setGeneratorsExpanded(!generatorsExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: 'none',
                padding: '0.25rem 0',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                textAlign: 'left'
              }}
            >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
               Generators
             </span>
              {generatorsExpanded ? <Icons.ChevronDown size={12} /> : <Icons.ChevronRight size={12} />}
            </button>
            
            <div style={{ 
              maxHeight: generatorsExpanded ? '300px' : '0px', 
              overflow: 'hidden', 
              transition: 'max-height 0.25s ease-in-out',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.35rem' 
            }}>
              {generators.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleItemClick(p.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: activeTab === p.id ? 'var(--accent-light)' : 'transparent',
                    color: activeTab === p.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: activeTab === p.id ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  {renderIcon(p.icon)}
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Automation Accordion */}
        {registrations.length > 0 && (
          <div>
            <button 
              onClick={() => setRegistrationsExpanded(!registrationsExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: 'none',
                padding: '0.25rem 0',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                textAlign: 'left'
              }}
            >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
               Automation
             </span>
              {registrationsExpanded ? <Icons.ChevronDown size={12} /> : <Icons.ChevronRight size={12} />}
            </button>
            
            <div style={{ 
              maxHeight: registrationsExpanded ? '200px' : '0px', 
              overflow: 'hidden', 
              transition: 'max-height 0.25s ease-in-out',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.35rem' 
            }}>
              {registrations.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleItemClick(p.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: activeTab === p.id ? 'var(--accent-light)' : 'transparent',
                    color: activeTab === p.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: activeTab === p.id ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  {renderIcon(p.icon)}
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Administrative Folder Accordion */}
        {currentUser?.isAdmin && (
          <div>
            <button 
              onClick={() => setAdminExpanded(!adminExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: 'none',
                padding: '0.25rem 0',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Administration
              </span>
              {adminExpanded ? <Icons.ChevronDown size={12} /> : <Icons.ChevronRight size={12} />}
            </button>
            
            <div style={{ 
              maxHeight: adminExpanded ? '150px' : '0px', 
              overflow: 'hidden', 
              transition: 'max-height 0.25s ease-in-out',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.35rem' 
            }}>
              <button 
                onClick={() => handleItemClick('admin')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: activeTab === 'admin' ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: activeTab === 'admin' ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <Icons.ShieldAlert size={18} />
                <span>Admin Console</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Console Stats Panel at bottom */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '0.85rem', 
        borderRadius: '8px', 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid var(--border-color)',
        fontSize: '0.75rem' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <span>Core System:</span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>ONLINE</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Active Tools:</span>
          <span>{plugins.length}</span>
        </div>
      </div>
    </aside>
  );
};
