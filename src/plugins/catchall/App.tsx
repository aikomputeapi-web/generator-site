import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Activity, 
  Mail, 
  Settings, 
  Key, 
  Search, 
  Lock, 
  Inbox, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Copy, 
  RefreshCw, 
  CreditCard, 
  ArrowRight, 
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
interface DomainRecord {
  id: string;
  domain: string;
  customerEmail: string;
  status: string;
  progress: number;
  created: string;
  adminUsername: string;
  adminPassword: string;
  nameservers: string[];
  cloudflareZoneId: string;
  errorMessage?: string;
  steps: {
    stripe: string;
    registration: string;
    nameservers: string;
    dns_sync: string;
    email_routing: string;
    catch_all: string;
    credentials: string;
    delivery: string;
  };
}

interface LogRecord {
  id: string;
  timestamp: string;
  domain: string;
  step: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  payload?: string;
}

interface EmailRecord {
  id: string;
  domain: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'webmail' | 'credentials'>('dashboard');
  
  // App States
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [config, setConfig] = useState({
    porkbunApiKey: '',
    porkbunSecretKey: '',
    cloudflareToken: '',
    cloudflareAccountId: '',
    resendApiKey: '',
    masterInbox: 'master_catchall@yourplatform.com',
    simulatedMode: true,
    
    // IONOS Browser Automation fields
    ionosEmail: '',
    ionosPassword: '',
    ionosFirstName: '',
    ionosLastName: '',
    ionosAddress: '',
    ionosCity: '',
    ionosState: '',
    ionosZip: '',
    ionosPhone: '',
    ionosCardNumber: '',
    ionosCardExpiry: '',
    ionosCardCvv: '',
    headlessMode: true,

    // Central IMAP Credentials
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPassword: '',
    imapSecure: true
  });

  // Storefront Sandbox States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedDomain, setSearchedDomain] = useState<string | null>(null);
  const [domainAvailability, setDomainAvailability] = useState<'available' | 'checking' | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  
  // Pipeline Visualizer states
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [inspectedStep, setInspectedStep] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Email simulation states
  const [selectedWebmailDomain, setSelectedWebmailDomain] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  
  // Email injector states
  const [injSender, setInjSender] = useState('billing@netflix.com');
  const [injRecipient, setInjRecipient] = useState('inbox');
  const [injSubject, setInjSubject] = useState('Payment Received for Account #98217');
  const [injBody, setInjBody] = useState('Hello! Your subscription has been renewed. The invoice is attached. Thank you for your business!');
  
  // Credentials UI States
  const [showKeys, setShowKeys] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [configMsg, setConfigMsg] = useState('');

  // Refs
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const logsStreamRef = useRef<EventSource | null>(null);

  // Notifications Toast State
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      showToast('Failed to connect to backend configuration.', 'error');
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains');
      const data = await res.json();
      setDomains(data);
      if (data.length > 0 && !selectedDomainId) {
        setSelectedDomainId(data[0].id);
        setSelectedWebmailDomain(data[0].domain);
      }
    } catch (err) {
      showToast('Failed to load registered domains catalog.', 'error');
    }
  };

  const fetchInbox = async (domain: string) => {
    try {
      const res = await fetch(`/api/inbox/${domain}`);
      const data = await res.json();
      setEmails(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch inbox.', err);
    }
  };

  const setupLogsStream = () => {
    if (logsStreamRef.current) {
      logsStreamRef.current.close();
    }

    logsStreamRef.current = new EventSource('/api/logs/stream');
    
    logsStreamRef.current.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs((prev) => {
        // Avoid duplicate ids if fetched in history
        if (prev.find(l => l.id === newLog.id)) return prev;
        return [...prev, newLog];
      });

      // If active log is about our selected domain, refresh domain data
      if (newLog.domain !== 'SYSTEM') {
        fetchDomains();
      }

      // If log is completed or error, show toast notification
      if (newLog.status === 'SUCCESS' && newLog.step === 'Automation Engine') {
        showToast(`Domain ${newLog.domain} successfully configured!`, 'success');
        fetchDomains();
      } else if (newLog.status === 'ERROR') {
        showToast(`Deployment error on ${newLog.domain}: ${newLog.message}`, 'error');
        fetchDomains();
      }
    };

    logsStreamRef.current.onerror = () => {
      console.error('Logs EventSource disconnected. Reconnecting...');
    };
  };

  // Fetch initial state & connect logs stream
  useEffect(() => {
    fetchConfig();
    fetchDomains();
    setupLogsStream();

    // Parse URL params for successful checkout return
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const successfulDomain = params.get('domain');
      if (successfulDomain) {
        showToast(`Stripe checkout complete! Provisioning catch-all for ${successfulDomain}...`, 'success');
        setSelectedWebmailDomain(successfulDomain);
      } else {
        showToast('Stripe checkout complete! Setup is underway.', 'success');
      }
      // Clean up URL search params without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('cancel') === 'true') {
      showToast('Stripe payment checkout cancelled.', 'warning');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      if (logsStreamRef.current) {
        logsStreamRef.current.close();
      }
    };
  }, []);

  // Update inbox when webmail domain or catalog updates
  useEffect(() => {
    if (selectedWebmailDomain) {
      fetchInbox(selectedWebmailDomain);
    }
  }, [selectedWebmailDomain, domains]);

  // Scroll to bottom of terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Search domain availability handler
  const handleDomainSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchedDomain(searchQuery.trim().toLowerCase());
    setDomainAvailability('checking');

    // Simulate domain search check (fast)
    setTimeout(() => {
      setDomainAvailability('available');
    }, 800);
  };

  // Trigger Purchase / Stripe Webhook simulation
  const handleStripeCheckout = async () => {
    if (!searchedDomain || !customerEmail.trim()) {
      showToast('Please enter your checkout email.', 'warning');
      return;
    }

    setIsPurchasing(true);
    setPurchaseStatus(config.simulatedMode ? 'Processing Stripe payment authorization...' : 'Creating Stripe checkout session...');

    try {
      if (config.simulatedMode) {
        const res = await fetch('/api/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: searchedDomain,
            customerEmail: customerEmail
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Checkout process rejected.');
        }

        showToast('Stripe payment verified! Automations spinning up.', 'success');
        setSearchedDomain(null);
        setSearchQuery('');
        setCustomerEmail('');
        
        // Auto focus on the newly created domain pipeline
        if (data.domain) {
          setSelectedDomainId(data.domain.id);
          setSelectedWebmailDomain(data.domain.domain);
        }
        
        fetchDomains();
      } else {
        const res = await fetch('/api/checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: searchedDomain,
            customerEmail: customerEmail
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Checkout session generation failed.');
        }

        if (data.url) {
          showToast('Redirecting to Stripe Secure Checkout...', 'info');
          setTimeout(() => {
            window.location.href = data.url;
          }, 800);
        } else {
          throw new Error('No checkout session url returned from Stripe.');
        }
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsPurchasing(false);
      setPurchaseStatus(null);
    }
  };

  // Save Settings Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigStatus('saving');
    setConfigMsg('Writing credentials to system vault (.env)...');

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update system vault.');

      setConfigStatus('saved');
      setConfigMsg('Vault saved. Server context reloaded!');
      showToast('API credentials saved successfully.', 'success');
      fetchConfig();
      setTimeout(() => setConfigStatus('idle'), 3000);
    } catch (err: any) {
      setConfigStatus('error');
      setConfigMsg(err.message);
      showToast(err.message, 'error');
    }
  };

  // Inject Simulated Email
  const handleInjectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebmailDomain) {
      showToast('No active catch-all domain available to receive emails.', 'warning');
      return;
    }

    const fullRecipient = `${injRecipient}@${selectedWebmailDomain}`;

    try {
      const res = await fetch('/api/inbox/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: selectedWebmailDomain,
          sender: injSender,
          recipient: fullRecipient,
          subject: injSubject,
          body: injBody
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Email rejection.');
      }

      showToast(`Inbound caught: ${fullRecipient}`, 'success');
      
      // Refresh inbox
      fetchInbox(selectedWebmailDomain);
      
      // Reset subject/body for variety
      setInjSubject('Updated Service Alert Notification');
      setInjBody('This is another test message to confirm the catch-all accounts route seamlessly.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // Find active domain details
  const activeDomain = domains.find(d => d.id === selectedDomainId) || domains[0];

  // Render Node step detailed code details (to inspect the exact cURL / JSON)
  const getStepMockDetails = (step: string) => {
    if (!activeDomain) return null;
    const domainName = activeDomain.domain;
    const targetMasterInbox = config.masterInbox;

    switch (step) {
      case 'stripe':
        return {
          title: 'Stripe Webhook (Session Complete)',
          method: 'POST',
          url: '/api/webhooks/stripe',
          desc: 'Triggered when checkout.session.completed webhook fires. Initiates asynchronous domain acquisition.',
          curl: `curl -X POST http://localhost:5000/api/webhooks/stripe \\
  -H "stripe-signature: t=1618392019,v1=921b72a98f126f8..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "evt_1OpZ80CshXh54p07c...",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "customer_details": { "email": "${activeDomain.customerEmail}" },
        "metadata": { "domain": "${domainName}" }
      }
    }
  }'`,
          json: {
            status: 'SUCCESS',
            trigger: 'checkout.session.completed',
            parsed_metadata: {
              customer_email: activeDomain.customerEmail,
              purchase_domain: domainName
            }
          }
        };
      case 'registration':
        return {
          title: 'IONOS Browser Automation Acquisition',
          method: 'BROWSER',
          url: 'https://www.ionos.com/checkout',
          desc: 'Launches visual Puppeteer Chromium window, accepts cookies, inputs domain query, adds the $1.00 promotional card to the cart, completes account signup, enters credit card billing details, and clicks place order.',
          curl: `// Initialize Visual browser automation
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 ... Chrome/120.0.0.0');
await page.goto('https://www.ionos.com');
await page.type('input[placeholder*="domain"]', "${domainName}");
await page.click('button[type="submit"]');

// Click "Add to Cart" and proceed
await page.click('[data-testid="add-to-cart"]');
await page.click('[data-testid="checkout-button"]');

// Fill Contact Registration & Billing Details
await page.type('#email', "${config.ionosEmail || activeDomain.customerEmail}");
await page.type('#firstName', "${config.ionosFirstName || 'John'}");
await page.type('#lastName', "${config.ionosLastName || 'Customer'}");
await page.type('#street', "${config.ionosAddress || '123 Automation Ave'}");

// Securely input Credit Card Details
await page.type('#cardNumber', "4111••••••••${(config.ionosCardNumber || '4111').slice(-4)}");
await page.type('#cardExpiry', "${config.ionosCardExpiry || '12/28'}");
await page.type('#cvv', "•••");

// Complete Order
await page.click('#place-order-button');`,
          json: activeDomain.errorMessage ? {
            status: 'ERROR',
            message: activeDomain.errorMessage
          } : {
            status: 'SUCCESS',
            domain: domainName,
            automatorEngine: 'Puppeteer Core v22',
            orderId: 'IO-389201',
            invoiceAmount: '$1.00',
            currency: 'USD',
            billingProfile: {
              email: config.ionosEmail || activeDomain.customerEmail,
              firstName: config.ionosFirstName || 'John',
              lastName: config.ionosLastName || 'Customer',
              address: config.ionosAddress || '123 Automation Ave',
              cardExpiry: config.ionosCardExpiry || '12/28',
              cardNumberMasked: config.ionosCardNumber ? '••••••••••••' + config.ionosCardNumber.slice(-4) : '••••••••••••4111'
            }
          }
        };
      case 'nameservers':
        return {
          title: 'Update Registrar Nameservers',
          method: 'POST',
          url: `https://porkbun.com/api/v3/domain/updateNs/${domainName}`,
          desc: 'Instructs Porkbun to delegate DNS hosting authority to Cloudflare standard nameservers.',
          curl: `curl -X POST https://porkbun.com/api/v3/domain/updateNs/${domainName} \\
  -H "Content-Type: application/json" \\
  -d '{
    "apikey": "pk_live_••••••••",
    "secretapikey": "sk_live_••••••••",
    "ns": [
      "danny.ns.cloudflare.com",
      "lisa.ns.cloudflare.com"
    ]
  }'`,
          json: {
            status: 'SUCCESS',
            domain: domainName,
            previousNameservers: ['ns1.porkbun.com', 'ns2.porkbun.com'],
            newNameservers: ['danny.ns.cloudflare.com', 'lisa.ns.cloudflare.com']
          }
        };
      case 'dns_sync':
        return {
          title: 'Cloudflare Zone Provision & Sync',
          method: 'POST',
          url: 'https://api.cloudflare.com/client/v4/zones',
          desc: 'Creates a managed zone on Cloudflare, scans active bindings, and verifies name-resolution delegation.',
          curl: `curl -X POST https://api.cloudflare.com/client/v4/zones \\
  -H "Authorization: Bearer cf_token_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "${domainName}",
    "account": { "id": "${config.cloudflareAccountId || 'cf_acct_88921'}" },
    "type": "full",
    "jump_start": true
  }'`,
          json: {
            success: true,
            errors: [],
            messages: [],
            result: {
              id: activeDomain.cloudflareZoneId || 'cf_zone_881928a',
              name: domainName,
              status: 'active',
              paused: false,
              type: 'full',
              name_servers: ['danny.ns.cloudflare.com', 'lisa.ns.cloudflare.com'],
              original_name_servers: ['ns1.porkbun.com', 'ns2.porkbun.com']
            }
          }
        };
      case 'email_routing':
        return {
          title: 'Activate Cloudflare Email Routing',
          method: 'POST',
          url: `https://api.cloudflare.com/client/v4/zones/${activeDomain.cloudflareZoneId || 'zone_id'}/email/routing/enable`,
          desc: 'Enables programmatic incoming MX servers and verifies forwarding loops on the Cloudflare Edge network.',
          curl: `curl -X POST https://api.cloudflare.com/client/v4/zones/${activeDomain.cloudflareZoneId || 'zone_id'}/email/routing/enable \\
  -H "Authorization: Bearer cf_token_••••••••" \\
  -H "Content-Type: application/json"`,
          json: {
            success: true,
            errors: [],
            result: {
              id: activeDomain.cloudflareZoneId || 'cf_zone_881928a',
              status: 'enabled',
              modified_on: new Date().toISOString()
            }
          }
        };
      case 'catch_all':
        return {
          title: 'Cloudflare Catch-All Routing Rules',
          method: 'POST',
          url: `https://api.cloudflare.com/client/v4/zones/${activeDomain.cloudflareZoneId || 'zone_id'}/email/routing/rules`,
          desc: 'Creates wildcards that intercept *@domain and forwards them directly to the master SMTP inbox address.',
          curl: `curl -X POST https://api.cloudflare.com/client/v4/zones/${activeDomain.cloudflareZoneId || 'zone_id'}/email/routing/rules \\
  -H "Authorization: Bearer cf_token_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Catch-All Wildcard forwarding",
    "enabled": true,
    "matchers": [{ "type": "all" }],
    "actions": [{ "type": "forward", "value": ["${targetMasterInbox}"] }]
  }'`,
          json: {
            success: true,
            errors: [],
            result: {
              id: 'rule_9271109a',
              name: 'Catch-All Wildcard forwarding',
              enabled: true,
              priority: 1,
              matchers: [{ type: 'all' }],
              actions: [{ type: 'forward', value: [targetMasterInbox] }]
            }
          }
        };
      case 'credentials':
        return {
          title: 'Generate Admin Access credentials',
          method: 'INTERNAL',
          url: 'Local Cryptographic Salt & Vault System',
          desc: 'Generates secure randomized password and masks the IMAP login details to create the simulated direct login inbox.',
          curl: '# Handled securely in the local DB vault. Credentials mapped:',
          json: {
            domain: domainName,
            allocatedUsername: `admin@${domainName}`,
            allocatedPassword: activeDomain.adminPassword,
            centralVirtualMailbox: targetMasterInbox,
            imapServer: 'mail.yourplatform.com',
            secureIMAPPort: 993,
            tls: true
          }
        };
      case 'delivery':
        return {
          title: 'Deliver Client Welcome Email',
          method: 'POST',
          url: 'https://api.resend.com/emails',
          desc: 'Dispatches HTML welcome letter through Resend transactional API, outlining domains and generated admin credentials.',
          curl: `curl -X POST https://api.resend.com/emails \\
  -H "Authorization: Bearer re_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "Acme Domains <delivery@yourdomain.com>",
    "to": "${activeDomain.customerEmail}",
    "subject": "🚀 Your catch-all domain ${domainName} is ready!",
    "html": "<h3>Your Credentials:</h3><p>Domain: ${domainName}</p><p>Admin Email: admin@${domainName}</p>..."
  }'`,
          json: {
            id: 're_8829471A',
            from: 'Acme Domains <delivery@yourdomain.com>',
            to: activeDomain.customerEmail,
            subject: `🚀 Your catch-all domain ${domainName} is ready!`,
            success: true
          }
        };
      default:
        return null;
    }
  };

  return (
    <>
      {/* Toast alert system */}
      {toast && (
        <div className="toast-notification">
          {toast.type === 'success' && <CheckCircle2 size={20} color="var(--color-success)" />}
          {toast.type === 'info' && <Activity size={20} color="var(--color-info)" />}
          {toast.type === 'warning' && <AlertTriangle size={20} color="var(--color-warning)" />}
          {toast.type === 'error' && <XCircle size={20} color="var(--color-error)" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Nav Header */}
      <header className="nav-header">
        <a href="#" className="nav-logo" onClick={() => setActiveTab('dashboard')}>
          <Globe size={24} className="nav-logo-icon" />
          <span>OmniForwarder <span style={{fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent-secondary)'}}>Catch-all Orchestrator</span></span>
        </a>

        <div className="nav-status">
          <div className="system-status-indicator">
            <span className={`status-dot pulsing ${config.simulatedMode ? 'simulated' : ''}`}></span>
            <span>Engine: {config.simulatedMode ? 'Simulation Sandbox' : 'Live Production'}</span>
          </div>

          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Activity size={16} />
              <span>Control Center</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'webmail' ? 'active' : ''}`}
              onClick={() => setActiveTab('webmail')}
            >
              <Mail size={16} />
              <span>Webmail Client</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
              onClick={() => setActiveTab('credentials')}
            >
              <Settings size={16} />
              <span>API Vault Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* App Main Area */}
      <main className="app-container">
        
        {/* TAB 1: CONTROL CENTER DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            
            {/* Top row: Storefront + Benefits */}
            <div className="storefront-grid">
              
              {/* Domain Search Sandbox */}
              <div className="glass-panel store-card">
                <div className="store-hero">
                  <h2>Buy a Catch-All Domain</h2>
                  <p>Search, purchase, and automatically register a domain pre-configured with Cloudflare Catch-All email forwarding in 60 seconds.</p>
                </div>

                <form onSubmit={handleDomainSearch} className="search-container">
                  <div className="search-input-wrapper">
                    <Search size={20} className="search-icon" />
                    <input 
                      type="text" 
                      className="store-search-input"
                      placeholder="Enter desired domain (e.g. startupidea.com)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="store-btn">
                    <span>Search</span>
                    <ArrowRight size={18} />
                  </button>
                </form>

                {/* If searching / searched */}
                {searchedDomain && (
                  <div className="domain-result-card">
                    {domainAvailability === 'checking' ? (
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)'}}>
                        <Loader2 className="spinning" size={20} style={{animation: 'spin 1s linear infinite'}} />
                        <span>Querying Porkbun registries & checking availability...</span>
                      </div>
                    ) : (
                      <>
                        <div className="domain-info">
                          <h3>{searchedDomain}</h3>
                          <span className="domain-badge-green">
                            <CheckCircle2 size={12} />
                            Available
                          </span>
                        </div>
                        <div className="domain-pricing">
                          <div className="domain-price">$12.00<span style={{fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)'}}>/yr</span></div>
                          
                          <div className="domain-checkout-form">
                            <div className="input-group">
                              <label className="input-label">Delivery & Invoice Email</label>
                              <input 
                                type="email" 
                                className="form-input"
                                placeholder="name@yourinbox.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                required
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={handleStripeCheckout} 
                              className="stripe-payment-btn"
                              disabled={isPurchasing}
                            >
                              {isPurchasing ? (
                                <>
                                  <Loader2 className="spinning" size={18} style={{animation: 'spin 1s linear infinite'}} />
                                  <span>Authorizing Stripe...</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard size={18} />
                                  <span>Simulate Stripe Payment</span>
                                </>
                              )}
                            </button>
                            {purchaseStatus && (
                              <p style={{fontSize: '0.8rem', color: 'var(--accent-primary)', textAlign: 'center', marginTop: '0.25rem'}}>
                                {purchaseStatus}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Edge Case Warning Tip */}
                <div className="alert-message-box info" style={{fontSize: '0.8rem', padding: '0.75rem', gap: '0.5rem', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.1)'}}>
                  <Shield size={16} color="var(--accent-primary)" />
                  <span style={{color: 'var(--text-secondary)'}}>
                    <strong>Blueprint Edge Case Playground:</strong> Try registering a domain starting with <strong>"premium-"</strong> or containing <strong>"google"</strong> to simulate a registrar purchase exception, forcing the pipeline into automated failsafe mode!
                  </span>
                </div>
              </div>

              {/* Perks / Explainer panel */}
              <div className="glass-panel store-perks">
                <h3 style={{fontSize: '1.25rem', borderBottom: '1px solid var(--border-standard)', paddingBottom: '0.75rem'}}>How it Works under the Hood</h3>
                
                <div className="perk-item">
                  <div className="perk-icon-wrapper">
                    <CreditCard size={20} />
                  </div>
                  <div className="perk-text">
                    <h4>Stripe Payment Webhook</h4>
                    <p>Customer purchases domain. Stripe webhook alerts our Node.js app server with customer details.</p>
                  </div>
                </div>

                <div className="perk-item">
                  <div className="perk-icon-wrapper">
                    <Globe size={20} />
                  </div>
                  <div className="perk-text">
                    <h4>API Domain Registration</h4>
                    <p>Node.js triggers an instant Porkbun API registration and updates nameservers to Cloudflare.</p>
                  </div>
                </div>

                <div className="perk-item">
                  <div className="perk-icon-wrapper">
                    <Lock size={20} />
                  </div>
                  <div className="perk-text">
                    <h4>Cloudflare Email Routing</h4>
                    <p>App contacts Cloudflare API, syncs the zone, enables routing, and deploys a wildcard catch-all rule forwarding to your master inbox.</p>
                  </div>
                </div>

                <div className="perk-item">
                  <div className="perk-icon-wrapper">
                    <Send size={20} />
                  </div>
                  <div className="perk-text">
                    <h4>Credentials Dispatch</h4>
                    <p>App secures virtual login details, maps them to a masked inbox, and emails setup guides instantly to the buyer via Resend API.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Middle Section: Active Domain Pipeline + Live Terminal */}
            {activeDomain ? (
              <div className="glass-panel" style={{padding: '2rem'}}>
                <div className="pipeline-visualizer-container">
                  
                  <div className="pipeline-header">
                    <div>
                      <h3 style={{fontSize: '1.5rem', marginBottom: '0.25rem'}}>
                        <Activity size={22} color="var(--accent-primary)" />
                        Automation Deployment Pipeline
                      </h3>
                      <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                        Active Domain: <strong style={{color: 'var(--text-primary)'}}>{activeDomain.domain}</strong> (Purchased by {activeDomain.customerEmail})
                      </p>
                    </div>

                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      {domains.slice(0, 3).map(d => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setSelectedDomainId(d.id);
                            setInspectedStep(null);
                          }}
                          className={`tab-btn`}
                          style={{
                            padding: '0.4rem 0.8rem', 
                            fontSize: '0.8rem',
                            background: d.id === activeDomain.id ? 'var(--bg-tertiary)' : 'transparent',
                            border: '1px solid',
                            borderColor: d.id === activeDomain.id ? 'var(--border-glow)' : 'var(--border-standard)',
                            color: d.id === activeDomain.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          {d.domain}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeDomain.status === 'FAILED' && (
                    <div className="alert-message-box error" style={{marginTop: '0.5rem'}}>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>CRITICAL PIPELINE FAILURE:</strong> {activeDomain.errorMessage}
                        <br />
                        <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                          Automated Failsafe Active: The script has halted, alerted admins, and logged a recommended refund queue in the payment engine.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Visual Node Diagram */}
                  <div className="pipeline-flow">
                    
                    {/* Node 1: Stripe */}
                    <div className={`node-item ${activeDomain.steps.stripe === 'COMPLETED' ? 'completed' : ''}`}>
                      <div 
                        className={`node-circle ${activeDomain.steps.stripe === 'COMPLETED' ? 'completed' : ''} ${inspectedStep === 'stripe' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('stripe')}
                        style={{cursor: 'pointer'}}
                      >
                        1
                      </div>
                      <span className="node-title">Stripe Webhook</span>
                      <span className="node-status-text">Completed</span>
                    </div>

                    {/* Node 2: Register */}
                    <div className={`node-item`}>
                      <div 
                        className={`node-circle ${
                          activeDomain.steps.registration === 'COMPLETED' ? 'completed' : 
                          activeDomain.steps.registration === 'PROCESSING' ? 'processing' : 
                          activeDomain.status === 'FAILED' && activeDomain.steps.registration === 'PROCESSING' ? 'failed' : ''
                        } ${inspectedStep === 'registration' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('registration')}
                        style={{cursor: 'pointer'}}
                      >
                        2
                      </div>
                      <span className="node-title">IONOS Buy Bot</span>
                      <span className="node-status-text">{activeDomain.steps.registration}</span>
                    </div>

                    {/* Node 3: Update NS */}
                    <div className={`node-item`}>
                      <div 
                        className={`node-circle ${
                          activeDomain.steps.nameservers === 'COMPLETED' ? 'completed' : 
                          activeDomain.steps.nameservers === 'PROCESSING' ? 'processing' : ''
                        } ${inspectedStep === 'nameservers' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('nameservers')}
                        style={{cursor: 'pointer'}}
                      >
                        3
                      </div>
                      <span className="node-title">NS Delegation</span>
                      <span className="node-status-text">{activeDomain.steps.nameservers}</span>
                    </div>

                    {/* Node 4: DNS Sync */}
                    <div className={`node-item`}>
                      <div 
                        className={`node-circle ${
                          activeDomain.steps.dns_sync === 'COMPLETED' ? 'completed' : 
                          activeDomain.steps.dns_sync === 'PROCESSING' ? 'processing' : ''
                        } ${inspectedStep === 'dns_sync' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('dns_sync')}
                        style={{cursor: 'pointer'}}
                      >
                        4
                      </div>
                      <span className="node-title">Cloudflare Zone</span>
                      <span className="node-status-text">{activeDomain.steps.dns_sync}</span>
                    </div>

                    {/* Node 5: Email Routing */}
                    <div className={`node-item`}>
                      <div 
                        className={`node-circle ${
                          activeDomain.steps.email_routing === 'COMPLETED' ? 'completed' : 
                          activeDomain.steps.email_routing === 'PROCESSING' ? 'processing' : ''
                        } ${inspectedStep === 'email_routing' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('email_routing')}
                        style={{cursor: 'pointer'}}
                      >
                        5
                      </div>
                      <span className="node-title">CF Email Router</span>
                      <span className="node-status-text">{activeDomain.steps.email_routing}</span>
                    </div>

                    {/* Node 6: Catch-All Rule */}
                    <div className={`node-item`}>
                      <div 
                        className={`node-circle ${
                          activeDomain.steps.catch_all === 'COMPLETED' ? 'completed' : 
                          activeDomain.steps.catch_all === 'PROCESSING' ? 'processing' : ''
                        } ${inspectedStep === 'catch_all' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('catch_all')}
                        style={{cursor: 'pointer'}}
                      >
                        6
                      </div>
                      <span className="node-title">Catch-All Rule</span>
                      <span className="node-status-text">{activeDomain.steps.catch_all}</span>
                    </div>

                    {/* Node 7: Credentials */}
                    <div className={`node-item`}>
                      <div 
                        className={`node-circle ${
                          activeDomain.steps.credentials === 'COMPLETED' ? 'completed' : 
                          activeDomain.steps.credentials === 'PROCESSING' ? 'processing' : ''
                        } ${inspectedStep === 'credentials' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('credentials')}
                        style={{cursor: 'pointer'}}
                      >
                        7
                      </div>
                      <span className="node-title">Virtual Account</span>
                      <span className="node-status-text">{activeDomain.steps.credentials}</span>
                    </div>

                    {/* Node 8: Resend Email */}
                    <div className={`node-item`}>
                      <div 
                        className={`node-circle ${
                          activeDomain.steps.delivery === 'COMPLETED' ? 'completed' : 
                          activeDomain.steps.delivery === 'PROCESSING' ? 'processing' : ''
                        } ${inspectedStep === 'delivery' ? 'processing' : ''}`}
                        onClick={() => setInspectedStep('delivery')}
                        style={{cursor: 'pointer'}}
                      >
                        8
                      </div>
                      <span className="node-title">Resend Welcome</span>
                      <span className="node-status-text">{activeDomain.steps.delivery}</span>
                    </div>

                  </div>

                  <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic'}}>
                    💡 Click on any step number to inspect the exact API endpoint URL, headers, cURL request payload, and active JSON response!
                  </p>

                  {/* Inspected Node details panel */}
                  {inspectedStep && getStepMockDetails(inspectedStep) && (() => {
                    const stepDetails = getStepMockDetails(inspectedStep)!;
                    return (
                      <div className="glass-panel" style={{background: 'var(--bg-secondary)', padding: '1.25rem', borderLeft: '3px solid var(--accent-primary)', animation: 'slide-in 0.2s ease'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span style={{
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '4px', 
                              background: 'var(--bg-tertiary)', 
                              fontSize: '0.75rem', 
                              fontWeight: 700,
                              color: stepDetails.method === 'POST' ? 'var(--color-success)' : 'var(--color-info)'
                            }}>{stepDetails.method}</span>
                            <strong style={{color: 'var(--text-primary)'}}>{stepDetails.title}</strong>
                          </div>
                          <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{stepDetails.url}</span>
                        </div>
                        
                        <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem'}}>
                          {stepDetails.desc}
                        </p>

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem'}}>
                          <div>
                            <div className="input-label" style={{fontSize: '0.7rem', marginBottom: '0.25rem'}}>Request Context (cURL Syntax)</div>
                            <pre style={{
                              background: '#040508', 
                              color: '#cbd5e1', 
                              padding: '0.75rem', 
                              borderRadius: '6px', 
                              fontSize: '0.75rem', 
                              fontFamily: 'var(--font-mono)',
                              overflowX: 'auto',
                              border: '1px solid var(--border-standard)',
                              maxHeight: '180px'
                            }}>{stepDetails.curl}</pre>
                          </div>
                          <div>
                            <div className="input-label" style={{fontSize: '0.7rem', marginBottom: '0.25rem'}}>API Response Payloads</div>
                            <pre style={{
                              background: '#040508', 
                              color: 'var(--color-success)', 
                              padding: '0.75rem', 
                              borderRadius: '6px', 
                              fontSize: '0.75rem', 
                              fontFamily: 'var(--font-mono)',
                              overflowX: 'auto',
                              border: '1px solid var(--border-standard)',
                              maxHeight: '180px'
                            }}>{JSON.stringify(stepDetails.json, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
            ) : null}

            {/* Live Monospace Terminal Logs */}
            <div className="glass-panel" style={{padding: '1.5rem'}}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="terminal-dot red"></span>
                  <span className="terminal-dot yellow"></span>
                  <span className="terminal-dot green"></span>
                </div>
                <div className="terminal-title">Active Log Terminal: Streaming API Webhooks & Retries</div>
                <button 
                  onClick={() => {
                    setLogs([]);
                    showToast('Terminal logs cleared.', 'info');
                  }} 
                  style={{
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-muted)', 
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Clear Logs</span>
                </button>
              </div>

              <div className="terminal-console">
                {logs.length === 0 ? (
                  <div style={{color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center'}}>
                    &gt; Console listener established. Awaiting webhook notifications...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div className="log-entry" key={log.id}>
                      <div className="log-meta">
                        <span className="log-timestamp">&gt; {new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="log-domain">[{log.domain}]</span>
                        <span style={{color: 'var(--text-primary)', fontWeight: 500}}>[{log.step}]</span>
                        <span className={`log-badge ${log.status.toLowerCase()}`}>{log.status}</span>
                        <span className="log-message">{log.message}</span>
                        
                        {log.payload && (
                          <button 
                            className="log-payload-toggle"
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                          >
                            {expandedLogId === log.id ? 'Hide Details [-]' : 'Show cURL/JSON Details [+]'}
                          </button>
                        )}
                      </div>

                      {log.payload && expandedLogId === log.id && (
                        <pre className="log-payload">{log.payload}</pre>
                      )}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef}></div>
              </div>
            </div>

            {/* Active Domains Catalog Table */}
            <div className="glass-panel domains-card">
              <h3 style={{fontSize: '1.4rem'}}>Catch-All Domain Inventory ({domains.length})</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem'}}>
                Catalog of active and pending catch-all systems currently deployed on Cloudflare.
              </p>

              {domains.length === 0 ? (
                <div style={{textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)'}}>
                  <Globe size={40} style={{marginBottom: '0.75rem', color: 'var(--text-muted)'}} />
                  <p>No catch-all domains are registered in this workspace yet.</p>
                  <p style={{fontSize: '0.8rem', marginTop: '0.25rem'}}>Use the storefront above to trigger your first Stripe purchase.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="domains-table">
                    <thead>
                      <tr>
                        <th>Domain Name</th>
                        <th>Owner Account</th>
                        <th>Deployment Status</th>
                        <th>Central Routing Forwarder</th>
                        <th>Webmail Credentials</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domains.map((dom) => (
                        <tr key={dom.id} style={{background: dom.id === selectedDomainId ? 'rgba(99, 102, 241, 0.03)' : 'transparent'}}>
                          <td className="domain-td-name">
                            {dom.domain}
                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '0.2rem'}}>
                              Created: {new Date(dom.created).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="domain-td-email">{dom.customerEmail}</td>
                          <td>
                            <span className={`status-badge ${
                              dom.status === 'ACTIVE' ? 'active' : 
                              dom.status === 'FAILED' ? 'failed' : 'pending'
                            }`}>
                              {dom.status === 'ACTIVE' && <CheckCircle2 size={12} />}
                              {dom.status === 'FAILED' && <XCircle size={12} />}
                              {dom.status !== 'ACTIVE' && dom.status !== 'FAILED' && <Loader2 size={12} className="spinning" style={{animation: 'spin 1.5s linear infinite'}} />}
                              {dom.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                            {config.masterInbox}
                          </td>
                          <td>
                            {dom.status === 'FAILED' ? (
                              <span style={{color: 'var(--color-error)', fontSize: '0.8rem'}}>Setup Failsafe Halted</span>
                            ) : (
                              <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                                <div className="credentials-copy-wrapper">
                                  <span>{dom.adminUsername}</span>
                                  <button className="copy-btn" onClick={() => handleCopy(dom.adminUsername, 'Username')}>
                                    <Copy size={12} />
                                  </button>
                                </div>
                                <div className="credentials-copy-wrapper">
                                  <span>{dom.adminPassword}</span>
                                  <button className="copy-btn" onClick={() => handleCopy(dom.adminPassword, 'Password')}>
                                    <Copy size={12} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                              <button 
                                className="tab-btn" 
                                style={{padding: '0.4rem 0.8rem', fontSize: '0.75rem', border: '1px solid var(--border-standard)'}}
                                onClick={() => {
                                  setSelectedDomainId(dom.id);
                                  setInspectedStep(null);
                                  // Scroll to top of pipeline visualization
                                  window.scrollTo({top: 400, behavior: 'smooth'});
                                }}
                              >
                                Pipeline
                              </button>
                              
                              {dom.status === 'ACTIVE' && (
                                <button 
                                  className="tab-btn" 
                                  style={{padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--text-primary)'}}
                                  onClick={() => {
                                    setSelectedWebmailDomain(dom.domain);
                                    setActiveTab('webmail');
                                  }}
                                >
                                  Read Webmail
                                </button>
                              )}

                              {dom.status === 'FAILED' && (
                                <button 
                                  className="tab-btn" 
                                  style={{padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', border: '1px solid rgba(239, 68, 68, 0.2)'}}
                                  onClick={async () => {
                                    showToast(`Restarting setup for ${dom.domain}...`, 'info');
                                    try {
                                      const res = await fetch(`/api/retry/${dom.id}`, { method: 'POST' });
                                      const data = await res.json();
                                      if (res.ok) {
                                        showToast('Pipeline retry successfully initiated.', 'success');
                                        fetchDomains();
                                      } else {
                                        throw new Error(data.error);
                                      }
                                    } catch (err: any) {
                                      showToast(err.message || 'Retry initiation failed.', 'error');
                                    }
                                  }}
                                >
                                  Retry Setup
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: VIRTUAL WEBMAIL CLIENT */}
        {activeTab === 'webmail' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
            
            <div className="glass-panel" style={{padding: '2rem'}}>
              <h2 style={{fontSize: '1.8rem', marginBottom: '0.5rem'}}>Virtual Centralized Webmail Client</h2>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem'}}>
                This is a simulation of the <strong>Virtual Mailbox Architecture</strong> described in the blueprint. Instead of creating actual cPanel inboxes (which are expensive), all domains route wildcard emails to a single master mailbox repository. Our system securely splits and reads them by catch-all domain!
              </p>
            </div>

            {/* Split screen webmail box */}
            <div className="webmail-panel">
              
              {/* Left sidebar: Email list */}
              <div className="webmail-sidebar">
                <div className="webmail-sidebar-header">
                  <h4>
                    <Inbox size={18} color="var(--accent-primary)" />
                    Select Catch-All Account
                  </h4>
                  <select 
                    className="webmail-selector"
                    value={selectedWebmailDomain}
                    onChange={(e) => {
                      setSelectedWebmailDomain(e.target.value);
                      setSelectedEmail(null);
                    }}
                  >
                    <option value="" disabled>-- Choose Domain --</option>
                    {domains.filter(d => d.status === 'ACTIVE').map(d => (
                      <option key={d.id} value={d.domain}>admin@{d.domain}</option>
                    ))}
                  </select>
                </div>

                <div className="mail-list">
                  {!selectedWebmailDomain ? (
                    <div className="mail-list-empty">
                      <span>Choose a registered domain to check its mail routes.</span>
                    </div>
                  ) : emails.length === 0 ? (
                    <div className="mail-list-empty">
                      <Mail size={32} />
                      <span>Virtual inbox empty. Send a test email using the injector below!</span>
                    </div>
                  ) : (
                    emails.map((mail) => (
                      <div 
                        key={mail.id} 
                        className={`mail-item-card ${selectedEmail?.id === mail.id ? 'selected' : ''}`}
                        onClick={() => setSelectedEmail(mail)}
                      >
                        <div className="mail-item-header">
                          <span className="mail-item-sender">{mail.sender}</span>
                          <span className="mail-item-time">{new Date(mail.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="mail-item-subject">{mail.subject}</div>
                        <div className="mail-item-preview">{mail.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right panel: View mail */}
              <div className="webmail-view">
                {selectedEmail ? (
                  <>
                    <div className="mail-view-header">
                      <div className="mail-view-subject">{selectedEmail.subject}</div>
                      <div className="mail-view-details">
                        <div>
                          <span>From: <strong>{selectedEmail.sender}</strong></span>
                          <br />
                          <span>To: <strong style={{color: 'var(--accent-primary)'}}>{selectedEmail.recipient}</strong> (Caught on Catch-All)</span>
                        </div>
                        <span style={{color: 'var(--text-muted)'}}>
                          {new Date(selectedEmail.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mail-view-body">{selectedEmail.body}</div>
                  </>
                ) : (
                  <div className="mail-empty-state">
                    <Mail size={48} style={{color: 'var(--text-muted)'}} />
                    <p style={{color: 'var(--text-muted)'}}>Select an email from the left pane to read its routed content.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Email Injector Sandbox (so they can test in real-time) */}
            <div className="glass-panel email-injector-card">
              <h3 style={{fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignContent: 'center', gap: '0.5rem'}}>
                <Send size={18} color="var(--accent-primary)" />
                Test the Catch-All Routing: Send a Simulated Inbound Email
              </h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
                Inject any inbound mail sent from a third-party to *anything* on your custom catch-all domain (e.g. <code>sales@</code>, <code>invoicing@</code>, or <code>random-string@</code>). Watch it bypass traditional mailboxes and land instantly in this visual panel!
              </p>

              <form onSubmit={handleInjectEmail} className="email-injector-form">
                <div className="input-group">
                  <label className="input-label">Sender Address (From)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="support@stripe.com" 
                    value={injSender}
                    onChange={(e) => setInjSender(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Recipient Username (Caught as *@domain)</label>
                  <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-standard)', borderRadius: '8px', padding: '0 0.5rem'}}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="finance" 
                      value={injRecipient}
                      onChange={(e) => setInjRecipient(e.target.value)}
                      style={{border: 'none', paddingLeft: 0, paddingRight: 0}}
                      required
                    />
                    <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '0.25rem'}}>
                      @{selectedWebmailDomain || 'yourdomain.com'}
                    </span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Urgent: Billing Update" 
                    value={injSubject}
                    onChange={(e) => setInjSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group grid-full-width">
                  <label className="input-label">Email Content Body</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    value={injBody}
                    onChange={(e) => setInjBody(e.target.value)}
                    style={{fontFamily: 'var(--font-sans)', resize: 'vertical'}}
                    required
                  />
                </div>

                <div className="grid-full-width flex-end-item">
                  <button type="submit" className="injector-send-btn" disabled={!selectedWebmailDomain}>
                    <Send size={16} />
                    <span>Fire Simulated Inbound Email</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* TAB 3: API VAULT SETTINGS */}
        {activeTab === 'credentials' && (
          <div className="glass-panel config-card">
            
            <div style={{borderBottom: '1px solid var(--border-standard)', paddingBottom: '1.25rem', marginBottom: '1.5rem'}}>
              <h2 style={{fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                <Key size={24} color="var(--accent-primary)" />
                Secure API Vault Configurator
              </h2>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem'}}>
                Establish connections to Porkbun, Cloudflare, Stripe, and Resend APIs. Saving updates writes credentials to a secured local <code>.env</code> file.
              </p>
            </div>

            {/* Sandbox switch */}
            <div className="simulated-toggle-container">
              <div className="toggle-info">
                <h4>
                  <Shield size={18} color={config.simulatedMode ? 'var(--color-info)' : 'var(--color-success)'} />
                  Simulation Sandbox Mode (Toggle)
                </h4>
                <p>When enabled, the app skips live, costly domain purchases and Cloudflare zones, providing a high-fidelity playground with exact visual progress.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={config.simulatedMode}
                  onChange={(e) => setConfig({ ...config, simulatedMode: e.target.checked })}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Headless switch */}
            <div className="simulated-toggle-container" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-standard)', paddingTop: '1rem' }}>
              <div className="toggle-info">
                <h4>
                  <Shield size={18} color={config.headlessMode ? 'var(--color-info)' : 'var(--color-success)'} />
                  Puppeteer Headless Mode (Toggle)
                </h4>
                <p>When enabled, IONOS registration automation runs completely invisible in the background. Disable this to watch Puppeteer open browser and purchase domain visually!</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={config.headlessMode}
                  onChange={(e) => setConfig({ ...config, headlessMode: e.target.checked })}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Config forms */}
            <form onSubmit={handleSaveConfig}>
              
              <div className="config-form-grid">
                
                <div style={{gridColumn: 'span 2', display: 'flex', justifySelf: 'flex-start', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0'}}>
                  <Globe size={18} color="var(--accent-primary)" />
                  <h4 style={{fontSize: '1.1rem'}}>Registrar Credentials (Porkbun API)</h4>
                </div>

                <div className="input-group">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignContent: 'center'}}>
                    <label className="input-label">Porkbun API Public Key</label>
                    <button type="button" onClick={() => setShowKeys(!showKeys)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.2rem', fontSize:'0.75rem'}}>
                      {showKeys ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{showKeys ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder={config.porkbunApiKey ? '••••••••' : 'pk_live_...'}
                    value={config.porkbunApiKey.startsWith('••••') ? '' : config.porkbunApiKey}
                    onChange={(e) => setConfig({ ...config, porkbunApiKey: e.target.value })}
                  />
                </div>

                 <div className="input-group">
                  <label className="input-label">Porkbun Secret API Key</label>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder={config.porkbunSecretKey ? '••••••••' : 'sk_live_...'}
                    value={config.porkbunSecretKey.startsWith('••••') ? '' : config.porkbunSecretKey}
                    onChange={(e) => setConfig({ ...config, porkbunSecretKey: e.target.value })}
                  />
                </div>

                <div style={{gridColumn: 'span 2', display: 'flex', justifySelf: 'flex-start', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0.5rem 0'}}>
                  <Globe size={18} color="var(--accent-secondary)" />
                  <h4 style={{fontSize: '1.1rem'}}>IONOS Browser Automation (Registrar Purchase Bot)</h4>
                </div>

                <div className="input-group">
                  <label className="input-label">IONOS Account Sign-up Email</label>
                  <input 
                    type="email"
                    className="form-input"
                    placeholder="email@ionos-account.com"
                    value={config.ionosEmail || ''}
                    onChange={(e) => setConfig({ ...config, ionosEmail: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">IONOS Password</label>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Password for signup/login"
                    value={config.ionosPassword || ''}
                    onChange={(e) => setConfig({ ...config, ionosPassword: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Registrant First Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="John"
                    value={config.ionosFirstName || ''}
                    onChange={(e) => setConfig({ ...config, ionosFirstName: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Registrant Last Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Customer"
                    value={config.ionosLastName || ''}
                    onChange={(e) => setConfig({ ...config, ionosLastName: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Billing Street Address</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="123 Main St"
                    value={config.ionosAddress || ''}
                    onChange={(e) => setConfig({ ...config, ionosAddress: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Billing City</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="San Jose"
                    value={config.ionosCity || ''}
                    onChange={(e) => setConfig({ ...config, ionosCity: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Billing State / Zip Code</label>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="CA"
                      style={{width: '35%'}}
                      value={config.ionosState || ''}
                      onChange={(e) => setConfig({ ...config, ionosState: e.target.value })}
                    />
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="95112"
                      style={{width: '65%'}}
                      value={config.ionosZip || ''}
                      onChange={(e) => setConfig({ ...config, ionosZip: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Registrant Phone (Int'l Format)</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="+14085550199"
                    value={config.ionosPhone || ''}
                    onChange={(e) => setConfig({ ...config, ionosPhone: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Visa / MasterCard Number</label>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder="4111 2222 3333 4444"
                    value={config.ionosCardNumber.startsWith('••••') ? '' : config.ionosCardNumber}
                    onChange={(e) => setConfig({ ...config, ionosCardNumber: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Card Expiry / CVV</label>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="MM/YY"
                      style={{width: '60%'}}
                      value={config.ionosCardExpiry || ''}
                      onChange={(e) => setConfig({ ...config, ionosCardExpiry: e.target.value })}
                    />
                    <input 
                      type={showKeys ? 'text' : 'password'}
                      className="form-input"
                      placeholder="CVV"
                      style={{width: '40%'}}
                      value={config.ionosCardCvv.startsWith('••') ? '' : config.ionosCardCvv}
                      onChange={(e) => setConfig({ ...config, ionosCardCvv: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{gridColumn: 'span 2', display: 'flex', justifySelf: 'flex-start', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0.5rem 0'}}>
                  <Shield size={18} color="var(--accent-primary)" />
                  <h4 style={{fontSize: '1.1rem'}}>Cloudflare DNS & Email Routing Credentials</h4>
                </div>

                <div className="input-group">
                  <label className="input-label">Cloudflare Bearer Token</label>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder={config.cloudflareToken ? '••••••••' : 'CLOUDFLARE_API_TOKEN'}
                    value={config.cloudflareToken.startsWith('••••') ? '' : config.cloudflareToken}
                    onChange={(e) => setConfig({ ...config, cloudflareToken: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Cloudflare Account ID</label>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder={config.cloudflareAccountId ? '••••••••' : 'CLOUDFLARE_ACCOUNT_ID'}
                    value={config.cloudflareAccountId.startsWith('••••') ? '' : config.cloudflareAccountId}
                    onChange={(e) => setConfig({ ...config, cloudflareAccountId: e.target.value })}
                  />
                </div>

                <div style={{gridColumn: 'span 2', display: 'flex', justifySelf: 'flex-start', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0.5rem 0'}}>
                  <Mail size={18} color="var(--accent-primary)" />
                  <h4 style={{fontSize: '1.1rem'}}>SMTP / Delivery Credentials</h4>
                </div>

                <div className="input-group">
                  <label className="input-label">Resend / SendGrid API Key</label>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder={config.resendApiKey ? '••••••••' : 're_...'}
                    value={config.resendApiKey.startsWith('••••') ? '' : config.resendApiKey}
                    onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Central Master Routing Inbox Destination</label>
                  <input 
                    type="email"
                    className="form-input"
                    placeholder="master_catchall@yourdomain.com"
                    value={config.masterInbox}
                    onChange={(e) => setConfig({ ...config, masterInbox: e.target.value })}
                    required
                  />
                  <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                    Wildcards will forward *@domain emails directly to this master mailbox folder.
                  </span>
                </div>

                <div style={{gridColumn: 'span 2', display: 'flex', justifySelf: 'flex-start', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0.5rem 0'}}>
                  <Mail size={18} color="var(--accent-primary)" />
                  <h4 style={{fontSize: '1.1rem'}}>Central Master Inbox IMAP Credentials (For Inbound Processing)</h4>
                </div>

                <div className="input-group">
                  <label className="input-label">IMAP Host</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="imap.gmail.com"
                    value={config.imapHost || ''}
                    onChange={(e) => setConfig({ ...config, imapHost: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">IMAP Port / Connection Security</label>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="993"
                      style={{width: '30%'}}
                      value={config.imapPort || ''}
                      onChange={(e) => setConfig({ ...config, imapPort: e.target.value })}
                    />
                    <label className="switch" style={{transform: 'scale(0.8)'}}>
                      <input 
                        type="checkbox" 
                        checked={config.imapSecure || false}
                        onChange={(e) => setConfig({ ...config, imapSecure: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Secure TLS</span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">IMAP Account Username</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="master_catchall@yourdomain.com"
                    value={config.imapUser || ''}
                    onChange={(e) => setConfig({ ...config, imapUser: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">IMAP Account Password</label>
                  <input 
                    type={showKeys ? 'text' : 'password'}
                    className="form-input"
                    placeholder={(config.imapPassword || '').startsWith('••••') ? '••••••••' : 'Password or App Password'}
                    value={(config.imapPassword || '').startsWith('••••') ? '' : config.imapPassword}
                    onChange={(e) => setConfig({ ...config, imapPassword: e.target.value })}
                  />
                </div>

              </div>

              {/* Status and Action Buttons */}
              <div className="config-actions">
                {configStatus === 'saving' && (
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-secondary)'}}>
                    <Loader2 className="spinning" size={18} style={{animation: 'spin 1s linear infinite'}} />
                    <span>{configMsg}</span>
                  </div>
                )}
                {configStatus === 'saved' && (
                  <span style={{color: 'var(--color-success)', fontWeight: 600}}>
                    ✓ {configMsg}
                  </span>
                )}
                {configStatus === 'error' && (
                  <span style={{color: 'var(--color-error)', fontWeight: 600}}>
                    ✗ Error: {configMsg}
                  </span>
                )}

                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={configStatus === 'saving'}
                >
                  <Lock size={16} />
                  <span>Update Vault & .env</span>
                </button>
              </div>

            </form>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>
          OmniForwarder Domain Routing Automation Engine. Built for ultra-low overhead & massive scaling.
        </div>
        <div style={{fontSize: '0.75rem'}}>
          Orchestrates <a href="https://porkbun.com" className="footer-link" target="_blank">Porkbun</a> • <a href="https://cloudflare.com" className="footer-link" target="_blank">Cloudflare Email Routing</a> • <a href="https://resend.com" className="footer-link" target="_blank">Resend API</a> • <a href="https://stripe.com" className="footer-link" target="_blank">Stripe</a>
        </div>
      </footer>
    </>
  );
}

export default App;
