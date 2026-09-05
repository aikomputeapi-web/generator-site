import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, AlertCircle, Server, Settings, Terminal as TermIcon, FolderHeart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TaskState {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed' | 'stopped';
  progress: string;
  success: number;
  errors: string[];
  skipped?: number;
}

export const AccountRegisterSuite: React.FC = () => {
  const { currentUser, saveDoc, loadedDoc, clearLoadedDoc } = useAuth();
  
  // Connection and Mode settings
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [showConnectionConfig, setShowConnectionConfig] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Form Fields
  const [platform, setPlatform] = useState('chatgpt');
  const [executorType, setExecutorType] = useState('protocol');
  const [captchaSolver, setCaptchaSolver] = useState('yescaptcha');
  const [batchCount, setBatchCount] = useState(1);
  const [concurrency, setConcurrency] = useState(1);
  const [delay, setDelay] = useState(0);
  const [proxy, setProxy] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mailProvider, setMailProvider] = useState('luckmail');
  const [apiKey, setApiKey] = useState('');

  // Task & Polling state
  const [task, setTask] = useState<TaskState | null>(null);
  const [polling, setPolling] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Listen for loaded document data
  useEffect(() => {
    if (loadedDoc && loadedDoc.type === 'account-registration-suite') {
      const d = loadedDoc.data;
      setPlatform(d.platform || 'chatgpt');
      setExecutorType(d.executorType || 'protocol');
      setCaptchaSolver(d.captchaSolver || 'yescaptcha');
      setBatchCount(d.batchCount || 1);
      setConcurrency(d.concurrency || 1);
      setDelay(d.delay || 0);
      setProxy(d.proxy || '');
      setPhoneNumber(d.phoneNumber || '');
      setMailProvider(d.mailProvider || 'luckmail');
      setApiKey(d.apiKey || '');
      
      if (d.task) {
        setTask(d.task);
      }
      if (d.logs) {
        setLogs(d.logs);
      }
      
      clearLoadedDoc();
    }
  }, [loadedDoc]);

  const handleSave = () => {
    if (!currentUser || !task) return;
    const defaultName = `Reg Job - ${platform.toUpperCase()} - ${task.progress} (${task.status})`;
    const docName = prompt('Enter a name for this job report:', defaultName);
    if (docName === null) return;
    
    const finalName = docName.trim() || defaultName;
    saveDoc('account-registration-suite', finalName, {
      platform,
      executorType,
      captchaSolver,
      batchCount,
      concurrency,
      delay,
      proxy,
      phoneNumber,
      mailProvider,
      apiKey,
      task,
      logs
    });
    alert('Job report saved to your dashboard!');
  };

  // Check connection status on load
  const checkBackendHealth = async (url: string) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/config`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        setIsBackendOnline(true);
        return;
      }
    } catch (e) {
      // Ignored
    }
    setIsBackendOnline(false);
  };

  useEffect(() => {
    checkBackendHealth(backendUrl);
  }, [backendUrl]);

  // Start task handler
  const startRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogs([]);
    setTask(null);

    const payload = {
      platform,
      count: batchCount,
      concurrency,
      register_delay_seconds: delay,
      proxy: proxy || null,
      executor_type: executorType,
      captcha_solver: captchaSolver,
      extra: {
        mail_provider: mailProvider,
        yescaptcha_key: apiKey || null,
        phone_number: phoneNumber || null,
      }
    };

    if (isBackendOnline) {
      // Try to connect to real API
      try {
        setLogs([`Connecting to API at ${backendUrl}...`]);
        const res = await fetch(`${backendUrl}/tasks/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('API server returned error status');
        
        const data = await res.json();
        setIsSimulated(false);
        setTask({
          id: data.task_id || data.id,
          status: 'processing',
          progress: '0%',
          success: 0,
          errors: []
        });
        setPolling(true);
        pollTask(data.task_id || data.id);
      } catch (err: any) {
        setLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`, 'Falling back to Simulated Offline Mode...']);
        runSimulation(payload);
      }
    } else {
      runSimulation(payload);
    }
  };

  // Poll real task
  const pollTask = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${backendUrl}/tasks/${id}`);
        const t = await res.json();
        
        setTask({
          id: t.id,
          status: t.status,
          progress: t.progress,
          success: t.success || 0,
          errors: t.errors || []
        });

        // Try parsing log stream if available from server
        if (t.logs && Array.isArray(t.logs)) {
          setLogs(t.logs);
        } else if (t.log_lines) {
          setLogs(t.log_lines);
        }

        if (t.status === 'done' || t.status === 'failed' || t.status === 'stopped') {
          clearInterval(interval);
          setPolling(false);
        }
      } catch (err) {
        clearInterval(interval);
        setPolling(false);
        setLogs(prev => [...prev, `[ERROR] Lost connection during polling.`]);
      }
    }, 2000);
  };

  // Run simulated script loop
  const runSimulation = (payload: any) => {
    setIsSimulated(true);
    const mockTaskId = `sim-${Math.floor(Math.random() * 900000 + 100000)}`;
    setTask({
      id: mockTaskId,
      status: 'processing',
      progress: '0%',
      success: 0,
      errors: []
    });
    setPolling(true);

    const simulationSteps = [
      { text: `[12:04:12] [Shell] Launching registration executor: ${payload.executor_type}`, delay: 500, progress: '5%' },
      { text: `[12:04:13] [Browser] Initializing clean canvas context. UserAgent spoofing active.`, delay: 1200, progress: '12%' },
      { text: `[12:04:15] [Network] Tunneling connection through proxy: ${payload.proxy || 'direct://'}`, delay: 800, progress: '25%' },
      { text: `[12:04:16] [Mail] Requesting new temporary inbox address from ${payload.extra.mail_provider}...`, delay: 1500, progress: '38%' },
      { text: `[12:04:18] [Mail] Generated account target: user_872@luckmail.com`, delay: 1000, progress: '50%' },
      { text: `[12:04:20] [Platform] Navigating signup route on ${payload.platform.toUpperCase()}...`, delay: 1800, progress: '65%' },
      { text: `[12:04:22] [Captcha] Turnstile challenge encountered. Invoking solver: ${payload.captcha_solver}`, delay: 2000, progress: '78%' },
      { text: `[12:04:25] [Captcha] Token solved successfully (response_key: c5287...f81)`, delay: 1200, progress: '85%' },
      { text: `[12:04:26] [Mail] Polling inbox for registration validation code...`, delay: 2000, progress: '90%' },
      { text: `[12:04:29] [Mail] Verification message detected. Verification Code: 549320`, delay: 1500, progress: '95%' },
      { text: `[12:04:31] [Platform] Registration successfully completed. Dumping credentials.`, delay: 1000, progress: '100%' }
    ];

    let currentStepIndex = 0;
    const executeNextStep = () => {
      if (currentStepIndex >= simulationSteps.length) {
        setTask(prev => prev ? {
          ...prev,
          status: 'done',
          progress: '100%',
          success: payload.count
        } : null);
        setPolling(false);
        setLogs(prev => [...prev, `[12:04:32] [Task] Executor finished successfully. Batch complete.`]);
        return;
      }

      const step = simulationSteps[currentStepIndex];
      setLogs(prev => [...prev, step.text]);
      setTask(prev => prev ? {
        ...prev,
        progress: step.progress
      } : null);

      currentStepIndex++;
      setTimeout(executeNextStep, step.delay);
    };

    setLogs([
      `[System] Initializing simulation run...`,
      `[System] Real-time logs simulation active because API server is offline.`
    ]);
    setTimeout(executeNextStep, 500);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="no-print-grid">
      
      {/* Configuration Column */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontWeight: 700 }} className="title-gradient">Account Creator</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.75rem', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              background: isBackendOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isBackendOnline ? '#10b981' : '#ef4444'
            }}>
              <Server size={12} /> {isBackendOnline ? 'API Connected' : 'Offline Mode'}
            </span>
            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => setShowConnectionConfig(!showConnectionConfig)}>
              <Settings size={14} />
            </button>
          </div>
        </div>

        {showConnectionConfig && (
          <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
            <div className="form-group">
              <label className="form-label">Backend Host URL</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-field" value={backendUrl} onChange={e => setBackendUrl(e.target.value)} placeholder="http://localhost:8000" />
                <button className="btn btn-secondary" onClick={() => checkBackendHealth(backendUrl)}>Test</button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configured API path for `/tasks/register` endpoint.</span>
            </div>
          </div>
        )}

        <form onSubmit={startRegistration}>
          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">Platform Target</label>
              <select className="input-field" value={platform} onChange={e => setPlatform(e.target.value)}>
                <option value="chatgpt">ChatGPT</option>
                <option value="cloudflare">Cloudflare</option>
                <option value="cursor">Cursor</option>
                <option value="kiro">Kiro</option>
                <option value="grok">Grok</option>
                <option value="tavily">Tavily</option>
                <option value="openblocklabs">OpenBlockLabs</option>
                <option value="cerebras">Cerebras</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Executor Engine</label>
              <select className="input-field" value={executorType} onChange={e => setExecutorType(e.target.value)}>
                <option value="protocol">API Protocol (Fast)</option>
                <option value="headless">Headless Webdriver</option>
                <option value="headed">Headed Chrome GUI</option>
              </select>
            </div>
          </div>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">Captcha Solver</label>
              <select className="input-field" value={captchaSolver} onChange={e => setCaptchaSolver(e.target.value)}>
                <option value="yescaptcha">YesCaptcha API</option>
                <option value="local_solver">Local Solver (Camoufox)</option>
                <option value="manual">Manual Bypass</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Solver API Key (Optional)</label>
              <input type="password" className="input-field" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="YesCaptcha Secret" />
            </div>
          </div>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">Batch Count</label>
              <input type="number" min="1" className="input-field" value={batchCount} onChange={e => setBatchCount(parseInt(e.target.value) || 1)} />
            </div>
            <div className="form-group">
              <label className="form-label">Concurrency</label>
              <input type="number" min="1" className="input-field" value={concurrency} onChange={e => setConcurrency(parseInt(e.target.value) || 1)} />
            </div>
            <div className="form-group">
              <label className="form-label">Delay (Sec)</label>
              <input type="number" min="0" className="input-field" value={delay} onChange={e => setDelay(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mailbox Provider</label>
            <select className="input-field" value={mailProvider} onChange={e => setMailProvider(e.target.value)}>
              <option value="luckmail">LuckMail (SMS/Inbox)</option>
              <option value="mail_import">Outlook / Microsoft Pool</option>
              <option value="moemail">MoeMail (sall.cc)</option>
              <option value="tempmail_lol">TempMail.lol</option>
              <option value="skymail">SkyMail (CloudMail)</option>
              <option value="cloudmail">CloudMail (genToken)</option>
              <option value="cfworker">Self-Hosted CF Worker</option>
            </select>
          </div>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">Tunnel Proxy (Optional)</label>
              <input className="input-field" value={proxy} onChange={e => setProxy(e.target.value)} placeholder="http://user:pass@host:port" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <input className="input-field" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1234567890" />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }} disabled={polling}>
            <PlayCircle size={16} /> {polling ? 'Executing Batch Task...' : 'Run Registration Job'}
          </button>
        </form>
      </div>

      {/* Task Logs Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Status Card */}
        {task && (
          <div className="glass-card" style={{ borderLeft: `4px solid ${task.status === 'done' ? '#10b981' : task.status === 'failed' ? '#ef4444' : 'var(--accent-solid)'}` }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Active Job Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Task ID:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{task.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: task.status === 'done' ? '#10b981' : task.status === 'failed' ? '#ef4444' : 'var(--accent-solid)',
                  textTransform: 'uppercase'
                }}>{task.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Progress:</span>
                <span>{task.progress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Success Accounts:</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{task.success}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ 
                background: 'var(--accent-gradient)', 
                width: task.progress, 
                height: '100%', 
                transition: 'width 0.4s ease-out' 
              }}></div>
            </div>

            {isSimulated && (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginTop: '1rem', padding: '0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.75rem' }}>
                <AlertCircle size={14} /> <span>Simulation run (Backend is not reachable)</span>
              </div>
            )}

            {currentUser && (task.status === 'done' || task.status === 'failed' || task.status === 'stopped') && (
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                onClick={handleSave}
              >
                <FolderHeart size={14} style={{ color: 'var(--accent-solid)' }} /> Save Job Report
              </button>
            )}
          </div>
        )}

        {/* Logs Terminal */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TermIcon size={16} /> Console Outputs
            </h3>
            {polling && (
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-solid)', animation: 'pulse 1.5s infinite' }}></span>
            )}
          </div>

          <div 
            ref={logTerminalRef}
            style={{ 
              flex: 1, 
              background: '#040609', 
              border: '1px solid var(--border-color)', 
              borderRadius: '6px', 
              padding: '1rem', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem', 
              color: '#a7f3d0', 
              overflowY: 'auto',
              maxHeight: '320px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {logs.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>Idle. Launch a registration job to view standard logging output.</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ 
                  marginBottom: '4px',
                  color: log.includes('[ERROR]') ? '#f87171' : log.includes('[System]') ? '#60a5fa' : '#a7f3d0' 
                }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
