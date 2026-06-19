import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AdminUserData, SavedDocument } from '../context/AuthContext';
import * as Icons from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { getAllUsers, adminDeleteUser, adminDeleteDoc } = useAuth();
  
  // Data State
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [inspectDoc, setInspectDoc] = useState<SavedDocument | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'standard'>('all');

  // Trigger reloading users list
  const reloadData = () => {
    const data = getAllUsers();
    setUsers(data);
    
    // Sync selected user state if open
    if (selectedUser) {
      const updatedSelected = data.find(u => u.username === selectedUser.username);
      setSelectedUser(updatedSelected || null);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Compute metrics
  const totalUsers = users.length;
  const totalDocs = users.reduce((acc, u) => acc + u.docCount, 0);
  const averageDocs = totalUsers > 0 ? (totalDocs / totalUsers).toFixed(1) : '0';
  
  // Calculate document type breakdown
  const documentBreakdown = users.reduce((acc, u) => {
    u.docs.forEach(doc => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const statementCount = documentBreakdown['bank-statement-gen'] || 0;
  const stubCount = documentBreakdown['pay-stub-gen'] || 0;
  const profileCount = documentBreakdown['business-profile-gen'] || 0;
  const registrationCount = documentBreakdown['account-registration-suite'] || 0;

  // Approximate storage computation (JSON size of all docs)
  const computeStorageBytes = () => {
    let rawStr = '';
    users.forEach(u => {
      rawStr += JSON.stringify(u.docs);
    });
    return new Blob([rawStr]).size;
  };
  const storageBytes = computeStorageBytes();
  const storageFormatted = 
    storageBytes > 1024 
      ? `${(storageBytes / 1024).toFixed(2)} KB` 
      : `${storageBytes} Bytes`;

  // Search logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'admin' && u.isAdmin) || 
      (filterType === 'standard' && !u.isAdmin);
    return matchesSearch && matchesFilter;
  });

  const handleDeleteUser = (username: string) => {
    if (confirm(`Are you absolutely sure you want to delete user account "${username}" and purge all their documents?`)) {
      adminDeleteUser(username);
      if (selectedUser && selectedUser.username === username) {
        setSelectedUser(null);
        setInspectDoc(null);
      }
      reloadData();
    }
  };

  const handleDeleteDoc = (username: string, docId: string) => {
    if (confirm('Delete this saved document from the user\'s storage?')) {
      adminDeleteDoc(username, docId);
      if (inspectDoc && inspectDoc.id === docId) {
        setInspectDoc(null);
      }
      reloadData();
    }
  };

  const renderIcon = (iconName: string, size = 18, color = "var(--text-secondary)") => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={size} style={{ color }} />;
    }
    return <Icons.HelpCircle size={size} style={{ color }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome & System State banner */}
      <div className="glass-card" style={{ 
        padding: '2.5rem', 
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(24, 24, 27, 0.02) 100%)',
        borderLeft: '4px solid var(--accent-solid)'
      }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>System Administrative Deck</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
          Manage global user registries, monitor document creation limits, inspect JSON transaction payloads, and audit system activities.
        </p>
      </div>

      {/* Analytics stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent-solid)' }}>
            <Icons.Users size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{totalUsers}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>Registered Agents</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Icons.FolderHeart size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{totalDocs}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>Saved Documents (Global)</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Icons.Layers size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{averageDocs}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>Avg Docs / User</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
            <Icons.HardDrive size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{storageFormatted}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>Database Weight</p>
          </div>
        </div>
      </div>

      {/* Main Admin Section */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 1fr' : '1.5fr 1fr', gap: '2rem' }}>
        
        {/* User Directory Column */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>User Accounts Registry</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="input-field" 
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', width: '130px' }}
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="standard">Standard Agents</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search user profile..." 
              style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Icons.Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* User list table */}
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Documents</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr 
                    key={u.username} 
                    style={{ 
                      background: selectedUser?.username === u.username ? 'rgba(249, 115, 22, 0.04)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => { setSelectedUser(u); setInspectDoc(null); }}
                  >
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px',
                        background: u.isAdmin ? 'var(--accent-light)' : 'rgba(255,255,255,0.04)',
                        color: u.isAdmin ? 'var(--accent-solid)' : 'var(--text-secondary)'
                      }}>
                        {u.isAdmin ? 'ADMIN' : 'AGENT'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{u.docCount}</td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => { setSelectedUser(u); setInspectDoc(null); }}
                        >
                          Lookup
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.25rem' }}
                          disabled={u.username === 'admin'} // Protect primary admin from self deletion
                          onClick={() => handleDeleteUser(u.username)}
                        >
                          <Icons.UserMinus size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No accounts found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected User Profiles / Inspector Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedUser ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.ShieldAlert size={20} color="var(--accent-solid)" /> Agent Dossier
                </h2>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => { setSelectedUser(null); setInspectDoc(null); }}>
                  Close
                </button>
              </div>

              {/* Profile details */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Agent Username:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedUser.username}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Privilege Level:</span>
                  <strong style={{ color: selectedUser.isAdmin ? 'var(--accent-solid)' : 'var(--text-primary)' }}>
                    {selectedUser.isAdmin ? 'System Administrator' : 'Standard Field Agent'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Storage Count:</span>
                  <strong>{selectedUser.docCount} Items Saved</strong>
                </div>
              </div>

              {/* Saved documents list */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>User Storage Archives</h3>
                {selectedUser.docs.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
                    Agent has not saved any content.
                  </div>
                ) : (
                  <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Document Type</th>
                          <th>Name</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.docs.map(doc => {
                          let typeLabel = doc.type;
                          let typeIcon = 'File';
                          if (doc.type === 'bank-statement-gen') {
                            typeLabel = 'Statement';
                            typeIcon = 'FileSpreadsheet';
                          } else if (doc.type === 'pay-stub-gen') {
                            typeLabel = 'Pay Stub';
                            typeIcon = 'FileText';
                          } else if (doc.type === 'business-profile-gen') {
                            typeLabel = 'Profile';
                            typeIcon = 'Briefcase';
                          } else if (doc.type === 'account-registration-suite') {
                            typeLabel = 'Reg Task';
                            typeIcon = 'Cpu';
                          }
                          
                          return (
                            <tr key={doc.id} style={{ background: inspectDoc?.id === doc.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  {renderIcon(typeIcon, 14, 'var(--accent-solid)')}
                                  <span>{typeLabel}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{doc.name}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={() => setInspectDoc(doc)}>
                                    Inspect
                                  </button>
                                  <button className="btn btn-danger" style={{ padding: '0.2rem', borderRadius: '4px' }} onClick={() => handleDeleteDoc(selectedUser.username, doc.id)}>
                                    <Icons.Trash2 size={11} />
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

              {/* JSON Metadata Payload Viewer */}
              {inspectDoc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyItems: 'center', gap: '0.25rem', margin: 0 }}>
                    <Icons.Code size={14} color="var(--accent-solid)" /> Document Metadata Payload
                  </h4>
                  <pre style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    color: '#c4b5fd',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    maxHeight: '200px',
                    margin: 0
                  }}>
                    <code>{JSON.stringify(inspectDoc.data, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            /* System Summary Metrics Column (if no user is selected) */
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Activity size={20} color="var(--accent-solid)" /> Platform Health Diagnostics
              </h2>
              
              {/* Document distributions */}
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Document Library Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Bank Statements</span>
                      <strong>{statementCount} docs</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: '#f97316', width: `${totalDocs > 0 ? (statementCount/totalDocs)*100 : 0}%`, height: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Pay Stubs</span>
                      <strong>{stubCount} docs</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: '#3b82f6', width: `${totalDocs > 0 ? (stubCount/totalDocs)*100 : 0}%`, height: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Business Profiles</span>
                      <strong>{profileCount} docs</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: '#10b981', width: `${totalDocs > 0 ? (profileCount/totalDocs)*100 : 0}%`, height: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Automation Jobs</span>
                      <strong>{registrationCount} tasks</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: '#8b5cf6', width: `${totalDocs > 0 ? (registrationCount/totalDocs)*100 : 0}%`, height: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Engine Status */}
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Central Engine Health</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Icons.Settings size={14} /> Local Host API Router</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></span> ACTIVE
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Icons.Database size={14} /> LocalStorage Sync</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>SYNCHRONIZED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Icons.Cpu size={14} /> Micro-service Node</span>
                    <span style={{ color: 'var(--text-muted)' }}>MOCK SIMULATOR</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};
