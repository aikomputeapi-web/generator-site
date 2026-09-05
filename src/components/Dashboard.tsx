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

  const filteredPlugins = plugins.filter(p =>
    p.metadata.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Tools</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent-solid)' }}>
            <Icons.Layers size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{plugins.length}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>Loaded Tools</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Icons.CheckSquare size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{totalSessions}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>Created</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Icons.Play size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{sessionStats.registrationsCount}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>Accounts</p>
          </div>
        </div>
      </div>

      {/* Saved */}
      {savedDocs.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.FolderHeart size={18} color="var(--accent-solid)" /> Saved
          </h2>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Type</th>
                  <th>Name</th>
                  <th style={{ width: '160px' }}>Date</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--accent-solid)' }}>{renderIcon(typeIcon, 16)}</span>
                          <span>{typeLabel}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {new Date(doc.timestamp).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={() => loadDoc(doc)}
                          >
                            Open
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.25rem', borderRadius: '6px' }}
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
        </div>
      )}

      {/* Tools Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>All Tools</h2>
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              placeholder="Search tools..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Icons.Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.metadata.id}
              className="glass-card"
              onClick={() => setActiveTab(plugin.metadata.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '1rem'
              }}
            >
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-solid)' }}>
                {renderIcon(plugin.metadata.icon, 22)}
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>{plugin.metadata.name}</h3>
            </div>
          ))}

          {filteredPlugins.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No tools found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
