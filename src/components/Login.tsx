import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username is required.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    let success = false;
    if (isSignUp) {
      success = signup(trimmed);
    } else {
      success = login(trimmed);
    }

    if (!success) {
      setError('Failed to authenticate.');
    }
  };

  const handleDemoAccess = () => {
    login('demo_guest');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      backgroundImage: 
        'radial-gradient(at 0% 0%, rgba(249, 115, 22, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(24, 24, 27, 0.2) 0px, transparent 50%)',
      padding: '1.5rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.03) 0%, transparent 70%)', top: '-100px', right: '-50px', pointerEvents: 'none' }}></div>
        
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.5rem',
            boxShadow: '0 8px 20px -6px rgba(249, 115, 22, 0.5)'
          }}>
            Ω
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>OMNI DECK</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>CONTROL INTERFACE LOGIN</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          padding: '0.25rem',
          borderRadius: '8px',
          marginBottom: '1.75rem'
        }}>
          <button
            onClick={() => { setIsSignUp(false); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: 'none',
              background: !isSignUp ? 'var(--accent-light)' : 'transparent',
              color: !isSignUp ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: 'none',
              background: isSignUp ? 'var(--accent-light)' : 'transparent',
              color: isSignUp ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Shield size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={13} style={{ color: 'var(--text-muted)' }} /> Username
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. system_admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={13} style={{ color: 'var(--text-muted)' }} /> Secret Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isSignUp ? 'Initialize Profile' : 'Authenticate & Unlock'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <button 
          onClick={handleDemoAccess}
          className="btn btn-secondary" 
          style={{ width: '100%', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent-solid)' }} /> Quick Demo Access (No Auth)
        </button>
      </div>
    </div>
  );
};
