import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import type { ToolPlugin } from '../plugins/types';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  plugins: ToolPlugin[];
  setActiveTab: (tabId: string) => void;
  sessionStats: {
    statementsCount: number;
    stubsCount: number;
    profilesCount: number;
    registrationsCount: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({
  plugins,
  setActiveTab,
  sessionStats
}) => {
  const { savedDocs, loadDoc, deleteDoc } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Search filter
  const filteredPlugins = plugins.filter(p => 
    p.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.metadata.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderIcon = (iconName: string, size = 24, className = "") => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={size} className={className} />;
    }
    return <Icons.HelpCircle size={size} className={className} />;
  };

  const totalSessions = 
    sessionStats.statementsCount + 
    sessionStats.stubsCount + 
    sessionStats.profilesCount + 
    sessionStats.registrationsCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{ 
        padding: '2.5rem', 
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.04) 0%, transparent 70%)', top: '-100px', right: '-50px' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: '1.2' }}>
            Central Control Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Welcome to your command deck. Execute registration scripts, generate business documents, export bank ledgers, and manage your custom toolset in one unified interface.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM STATUS:</span>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: '#10b981', 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '0.25rem 0.6rem', 
              borderRadius: '9999px' 
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              SECURE ENGINE ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent-solid)' }}>
            <Icons.Layers size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{plugins.length}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>Loaded Tool Plugins</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Icons.CheckSquare size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{totalSessions}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>Documents & Tasks Created</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Icons.Play size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{sessionStats.registrationsCount}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>Accounts Created (This Session)</p>
          </div>
        </div>
      </div>

      {/* Saved Documents Section */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icons.FolderHeart size={22} color="var(--accent-solid)" /> Saved Documents & Tasks
        </h2>
        
        {savedDocs.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            <Icons.FolderOpen size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'inline-block' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No saved documents yet. Use any tool below and click "Save to Dashboard".</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Type</th>
                  <th>Document Name</th>
                  <th style={{ width: '180px' }}>Saved Date</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedDocs.map((doc) => {
                  let typeLabel = doc.type;
                  let typeIcon = 'HelpCircle';
                  if (doc.type === 'bank-statement-gen') {
                    typeLabel = 'Bank Statement';
                    typeIcon = 'FileSpreadsheet';
                  } else if (doc.type === 'pay-stub-gen') {
                    typeLabel = 'Pay Stub';
                    typeIcon = 'FileText';
                  } else if (doc.type === 'business-profile-gen') {
                    typeLabel = 'Business Profile';
                    typeIcon = 'Briefcase';
                  } else if (doc.type === 'account-registration-suite') {
                    typeLabel = 'Registration';
                    typeIcon = 'Cpu';
                  }
                  
                  return (
                    <tr key={doc.id}>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--accent-solid)' }}>{renderIcon(typeIcon, 16)}</span>
                          <span>{typeLabel}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(doc.timestamp).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.60rem', fontSize: '0.75rem' }}
                            onClick={() => loadDoc(doc)}
                          >
                            Open
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.3rem', borderRadius: '6px' }}
                            onClick={() => deleteDoc(doc.id)}
                          >
                            <Icons.Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Directory Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Installed Tool Directory</h2>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search tools & generators..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Icons.Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredPlugins.map((plugin) => (
            <div 
              key={plugin.metadata.id}
              className="glass-card"
              onClick={() => setActiveTab(plugin.metadata.id)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                height: '100%'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-solid)' }}>
                    {renderIcon(plugin.metadata.icon, 20)}
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: plugin.metadata.category === 'generator' ? 'var(--accent-light)' : 'rgba(255, 255, 255, 0.06)',
                    color: plugin.metadata.category === 'generator' ? 'var(--accent-solid)' : 'var(--text-secondary)'
                  }}>
                    {plugin.metadata.category}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{plugin.metadata.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                  {plugin.metadata.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-solid)', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Launch Tool</span>
                <Icons.ArrowUpRight size={14} />
              </div>
            </div>
          ))}

          {filteredPlugins.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No tools match your search criteria.
            </div>
          )}
        </div>
      </div>

      {/* Developer Plugin Customizer Guide */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-solid)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icons.Code size={20} color="var(--accent-solid)" /> How to Add Your Own Plugins
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
          Omni Deck has been designed around dynamic code plugins. You can easily add and run any javascript script, generator tool, or utility in this interface by following these three steps:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', fontSize: '0.85rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
            <strong style={{ color: 'var(--accent-solid)', display: 'block', marginBottom: '0.25rem' }}>1. Create Folder</strong>
            <span style={{ color: 'var(--text-secondary)' }}>Create a new directory under <code>src/plugins/my-new-tool/</code>.</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
            <strong style={{ color: 'var(--accent-solid)', display: 'block', marginBottom: '0.25rem' }}>2. Build Component</strong>
            <span style={{ color: 'var(--text-secondary)' }}>Add an <code>index.tsx</code> file exporting a standard React component containing your UI and script logic.</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
            <strong style={{ color: 'var(--accent-solid)', display: 'block', marginBottom: '0.25rem' }}>3. Register Tool</strong>
            <span style={{ color: 'var(--text-secondary)' }}>Open <code>src/plugins/registry.ts</code>, import your component, and append its configuration to the <code>plugins</code> list.</span>
          </div>
        </div>
      </div>

    </div>
  );
};
