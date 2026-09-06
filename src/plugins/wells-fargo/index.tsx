import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, FileText, CheckCircle2, AlertTriangle, Sparkles, Calendar, Loader2 } from 'lucide-react';

interface StatementSummaryInfo {
  beginning_balance: string;
  total_deposits: string;
  total_withdrawals: string;
  ending_balance: string;
  transaction_count: number;
  pages: number;
}

interface MultiStatementInfo {
  filename: string;
  period: string;
  transactions: number;
  pages: number;
}

export const WellsFargoGenerator: React.FC = () => {
  // Form states
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('SAN JOSE');
  const [state, setState] = useState('CA');
  const [zip, setZip] = useState('95110');
  
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('121042882'); // Wells Fargo CA
  const [accountType, setAccountType] = useState('Wells Fargo Everyday Checking');

  const [periodMode, setPeriodMode] = useState('1month');
  const [anchorMonth, setAnchorMonth] = useState((new Date().getMonth() || 12).toString());
  const [anchorYear, setAnchorYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [monthlyRevenue, setMonthlyRevenue] = useState(8500);
  const [businessType, setBusinessType] = useState('retail');
  const [personalProfile, setPersonalProfile] = useState('auto');
  const [generationSeed, setGenerationSeed] = useState('');
  const [startingBalanceMin, setStartingBalanceMin] = useState(2500);
  const [startingBalanceMax, setStartingBalanceMax] = useState(12000);

  // LLM/AI transaction toggle for the ReportLab WF generator.
  const [useAiTransactions, setUseAiTransactions] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('A typical small business month: a few POS deposits, card payouts out, rent, utilities, payroll, supplies.');
  const [aiCount, setAiCount] = useState(12);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTransactions, setAiTransactions] = useState<Array<{ date: string; description: string; type: 'deposit' | 'withdrawal'; amount: number }>>([]);

  // Status & loading states
  const [loading, setLoading] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<{
    single?: {
      filename: string;
      summary: StatementSummaryInfo;
    };
    multi?: {
      statements: MultiStatementInfo[];
      totals: {
        total_statements: number;
        total_transactions: number;
        total_pages: number;
      };
    };
  } | null>(null);

  // Initialize random account number on mount
  useEffect(() => {
    setAccountNumber(Math.floor(1000000000 + Math.random() * 9000000000).toString());
    
    // Set manual dates to past 30 days
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    setStartDate(past.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const handleGenerateMockData = async () => {
    setMockLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bankstatement/generate-mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to generate mock address.');
      const data = await res.json();
      setName(data.name || '');
      setStreet(data.street || '');
      setCity(data.city || 'SAN JOSE');
      setState(data.state || 'CA');
      setZip(data.zip || '95110');
    } catch (err: any) {
      setError(err.message || 'Failed connecting to Wells Fargo Python server.');
    } finally {
      setMockLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessResult(null);

    const payload = {
      name,
      street,
      city,
      state,
      zip,
      account_number: accountNumber,
      routing_number: routingNumber,
      account_type: accountType,
      period_mode: periodMode,
      anchor_month: periodMode !== 'manual' ? parseInt(anchorMonth) : null,
      anchor_year: periodMode !== 'manual' ? parseInt(anchorYear) : null,
      start_date: periodMode === 'manual' ? startDate : null,
      end_date: periodMode === 'manual' ? endDate : null,
      monthly_revenue: monthlyRevenue,
      business_type: businessType,
      personal_profile: personalProfile,
      generation_seed: generationSeed,
      starting_balance_min: startingBalanceMin,
      starting_balance_max: startingBalanceMax
    };

    try {
      const endpoint = useAiTransactions && aiTransactions.length > 0
        ? '/api/bankstatement/generate-statement-from-transactions'
        : '/api/bankstatement/generate-statement';
      const finalPayload = useAiTransactions && aiTransactions.length > 0
        ? { ...payload, transactions: aiTransactions }
        : payload;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed compiling statement.');
      }
      
      const data = await res.json();
      
      if (data.statements) {
        setSuccessResult({
          multi: {
            statements: data.statements,
            totals: data.totals
          }
        });
      } else {
        setSuccessResult({
          single: {
            filename: data.filename,
            summary: data.summary
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'ReportLab PDF compiler returned an error.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (filename: string) => {
    window.open(`/api/bankstatement/download/${filename}`, '_blank');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="no-print-grid">
      
      {/* Settings Form Column */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontWeight: 700 }} className="title-gradient">ReportLab WF Generator</h2>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={handleGenerateMockData}
            disabled={mockLoading}
          >
            <Sparkles size={12} style={{ color: 'var(--accent-solid)' }} /> {mockLoading ? 'Spoofing...' : 'Autofill Mock Address'}
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
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section 1: Customer Details */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Customer Details</h3>
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="e.g. JOHN DOE" required />
            </div>
            
            <div className="input-grid">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Street Address</label>
                <input className="input-field" value={street} onChange={e => setStreet(e.target.value.toUpperCase())} placeholder="123 MAIN ST" required />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="input-field" value={city} onChange={e => setCity(e.target.value.toUpperCase())} required />
              </div>
            </div>
            
            <div className="input-grid">
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="input-field" value={state} onChange={e => setState(e.target.value.toUpperCase())} maxLength={2} required />
              </div>
              <div className="form-group">
                <label className="form-label">Zip Code</label>
                <input className="input-field" value={zip} onChange={e => setZip(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Section 2: Account Details */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Account Details</h3>
            <div className="input-grid">
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input className="input-field" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Routing Number</label>
                <input className="input-field" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Account Layout/Type</label>
              <select className="input-field" value={accountType} onChange={e => setAccountType(e.target.value)}>
                <option value="Wells Fargo Everyday Checking">Wells Fargo Everyday Checking</option>
                <option value="Wells Fargo Preferred Checking">Wells Fargo Preferred Checking</option>
                <option value="Wells Fargo Business Checking">Wells Fargo Business Checking</option>
              </select>
            </div>
          </div>

          {/* Section 3: Period Range */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Statement Period</h3>
            <div className="input-grid">
              <div className="form-group">
                <label className="form-label">Period Type</label>
                <select className="input-field" value={periodMode} onChange={e => setPeriodMode(e.target.value)}>
                  <option value="1month">1 Month (Prior Complete Month)</option>
                  <option value="2months">2 Months</option>
                  <option value="3months">3 Months</option>
                  <option value="90days">90 Days</option>
                  <option value="manual">Custom Date Range (Manual)</option>
                </select>
              </div>
            </div>

            {periodMode !== 'manual' ? (
              <div className="input-grid">
                <div className="form-group">
                  <label className="form-label">Anchor Month</label>
                  <select className="input-field" value={anchorMonth} onChange={e => setAnchorMonth(e.target.value)}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i+1} value={i+1}>
                        {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Anchor Year</label>
                  <input type="number" className="input-field" value={anchorYear} onChange={e => setAnchorYear(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="input-grid">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Revenue & Algorithms */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Algorithms & Constraints</h3>
            
            <div className="input-grid">
              <div className="form-group">
                <label className="form-label">Monthly Target Revenue ($)</label>
                <input type="number" className="input-field" value={monthlyRevenue} onChange={e => setMonthlyRevenue(parseInt(e.target.value) || 0)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Transaction Niche</label>
                <select className="input-field" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                  <option value="retail">Retail Store</option>
                  <option value="service">Service Business</option>
                  <option value="construction">Construction / Contractor</option>
                  <option value="online">E-Commerce / Stripe Shop</option>
                  <option value="consulting">Professional Consulting</option>
                </select>
              </div>
            </div>

            <div className="input-grid">
              <div className="form-group">
                <label className="form-label">Min Starting Balance ($)</label>
                <input type="number" className="input-field" value={startingBalanceMin} onChange={e => setStartingBalanceMin(parseInt(e.target.value) || 0)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Max Starting Balance ($)</label>
                <input type="number" className="input-field" value={startingBalanceMax} onChange={e => setStartingBalanceMax(parseInt(e.target.value) || 0)} required />
              </div>
            </div>

            <div className="input-grid">
              <div className="form-group">
                <label className="form-label">Transaction Density</label>
                <select className="input-field" value={personalProfile} onChange={e => setPersonalProfile(e.target.value)}>
                  <option value="auto">Auto-Select</option>
                  <option value="high">High Density (More transactions)</option>
                  <option value="low">Low Density (Fewer transactions)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Randomizer Seed (Optional)</label>
                <input className="input-field" value={generationSeed} onChange={e => setGenerationSeed(e.target.value)} placeholder="e.g. custom_seed_1" />
              </div>
            </div>
          </div>

          {/* Section 5: AI / LLM Transaction Generator */}
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.85rem',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={useAiTransactions}
                onChange={e => setUseAiTransactions(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <Sparkles size={15} style={{ color: 'var(--accent-solid)' }} />
              <strong style={{ fontSize: '0.95rem' }}>Use AI-generated transactions</strong>
            </label>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0 0 0.55rem' }}>
              When enabled, the LLM produces a transaction list from your prompt and the PDF is rendered from those instead of the algorithmic generator. Uses the period dates above.
            </p>
            <textarea
              className="input-field"
              rows={3}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe activity: POS deposits, card payouts, rent, utilities, payroll, supplies..."
              style={{ width: '100%', resize: 'vertical', padding: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <label title="Approx transactions per month. Auto-scales for multi-month modes (capped at 40 per request)." style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Txns/month
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={aiCount}
                  onChange={e => setAiCount(Math.max(1, Math.min(40, parseInt(e.target.value) || 12)))}
                  className="input-field"
                  style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                />
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  if (aiLoading) return;
                  setAiLoading(true);
                  setError('');
                  try {
                    // Compute the actual statement period client-side so the LLM
                    // endpoint can spread transaction dates across it — mirroring
                    // the Flask get_month_range / get_previous_months logic.
                    const computePeriod = (): { startDate: string; endDate: string } => {
                      if (periodMode === 'manual') {
                        return { startDate, endDate };
                      }
                      const ay = parseInt(anchorYear);
                      const am = parseInt(anchorMonth);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate();
                      if (periodMode === '90days') {
                        const end = ay && am ? new Date(ay, am, 0) : new Date();
                        const start = new Date(end);
                        start.setDate(start.getDate() - 90);
                        return {
                          startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
                          endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
                        };
                      }
                      // 1month / 2months / 3months — anchor month is the LATEST
                      // month in the period (forward-incompatible loop removed:
                      // the Flask get_previous_months(numMonths, anchor) returns
                      // the N months ENDING at anchor, so endDate = anchor month).
                      const numMonths = periodMode === '2months' ? 2 : periodMode === '3months' ? 3 : 1;
                      let year = ay || new Date().getFullYear();
                      let month = am || new Date().getMonth();
                      if (!am) {
                        // default to most recent complete month
                        const t = new Date();
                        year = t.getMonth() === 0 ? t.getFullYear() - 1 : t.getFullYear();
                        month = t.getMonth() === 0 ? 12 : t.getMonth();
                      }
                      const endYear = year;
                      const endMonth = month;
                      const ed = lastDay(endYear, endMonth);
                      // start of oldest month = numMonths back from anchor
                      let sYear = endYear;
                      let sMonth = endMonth;
                      for (let i = 0; i < numMonths - 1; i++) {
                        if (sMonth === 1) { sYear -= 1; sMonth = 12; } else { sMonth -= 1; }
                      }
                      return {
                        startDate: `${sYear}-${pad(sMonth)}-01`,
                        endDate: `${endYear}-${pad(endMonth)}-${pad(ed)}`
                      };
                    };
                    const periodPayload = computePeriod();
                    // For multi-month modes, scale the requested count so each
                    // month gets roughly the same density the user asked for.
                    const scale = periodMode === '2months' ? 2
                      : periodMode === '3months' ? 3
                      : periodMode === '90days' ? 3
                      : 1;
                    const res = await fetch('/api/llm/generate-transactions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        prompt: `${aiPrompt} (this covers a ${scale}-month period — spread transactions across all months)`,
                        count: Math.min(40, aiCount * scale),
                        bankName: 'Wells Fargo',
                        holderName: name || 'Account Holder',
                        startBalance: startingBalanceMin,
                        ...periodPayload
                      })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`);
                    setAiTransactions(data.transactions || []);
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Generation failed.';
                    setError(msg);
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? 'Generating…' : 'Generate with AI'}
              </button>
              {aiTransactions.length > 0 && (
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{aiTransactions.length} transactions ready</span>
              )}
            </div>
            {useAiTransactions && aiTransactions.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--danger, #e57373)', margin: '0.55rem 0 0' }}>
                Enable + generate to populate, or compile will fall back to algorithmic mode.
              </p>
            )}
          </div>

          <button 
            className="btn btn-primary" 
            type="submit" 
            style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
            disabled={loading}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Calendar size={16} />}
            {loading ? 'Compiling reportlab PDF...' : 'Compile Wells Fargo PDF'}
          </button>
        </form>
      </div>

      {/* Compiler Output & Download Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ margin: 0, fontWeight: 700 }} className="title-gradient">Compilation Output</h2>

        {successResult ? (
          <div className="glass-card" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
              <CheckCircle2 size={20} />
              <span>Statement Rendered Successfully!</span>
            </div>

            {successResult.single ? (
              /* Single Statement Summary details */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>File Generated:</span>
                    <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{successResult.single.filename}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Beginning Balance:</span>
                    <strong>{successResult.single.summary.beginning_balance}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Deposits (+):</span>
                    <strong style={{ color: '#10b981' }}>{successResult.single.summary.total_deposits}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Withdrawals (-):</span>
                    <strong style={{ color: '#ef4444' }}>{successResult.single.summary.total_withdrawals}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ending Balance:</span>
                    <strong style={{ color: '#3b82f6' }}>{successResult.single.summary.ending_balance}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Transactions Logged:</span>
                    <strong>{successResult.single.summary.transaction_count} items</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Page Count:</span>
                    <strong>{successResult.single.summary.pages} pages</strong>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--accent-gradient)' }}
                  onClick={() => triggerDownload(successResult.single!.filename)}
                >
                  <Download size={16} /> Download Statement PDF
                </button>
              </div>
            ) : successResult.multi ? (
              /* Multi Statement List details */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Statements Created:</span>
                    <strong>{successResult.multi.totals.total_statements} units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Transactions:</span>
                    <strong>{successResult.multi.totals.total_transactions} items</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Page Count:</span>
                    <strong>{successResult.multi.totals.total_pages} pages</strong>
                  </div>
                </div>

                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.5rem 0 0' }}>Multi-Month Statement Files</h3>
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Transactions</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {successResult.multi.statements.map((stmt, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'bold' }}>{stmt.period}</td>
                          <td>{stmt.transactions} txs ({stmt.pages} pages)</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.25rem' }}
                              onClick={() => triggerDownload(stmt.filename)}
                            >
                              <Download size={12} /> Get PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Fill out the account and algorithm properties, then click "Compile" to generate high-fidelity ReportLab PDF files.</p>
          </div>
        )}
      </div>

    </div>
  );
};
