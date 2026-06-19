import React, { useState, useEffect } from 'react';
import { Copy, Check, Eye, Code, FileText, FolderHeart, Shuffle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Data pools used to auto-generate a fresh, randomized business profile.
const BIZ_PREFIXES = ['Nebula', 'Vertex', 'Quantum', 'Apex', 'Lumen', 'Cobalt', 'Helix', 'Orbit', 'Pulse', 'Strata', 'Zenith', 'Forge', 'Cascade', 'Onyx', 'Aether'];
const BIZ_SUFFIXES = ['Creative', 'Labs', 'Works', 'Studio', 'Systems', 'Dynamics', 'Collective', 'Industries', 'Group', 'Partners', 'Ventures', 'Technologies', 'Hub', 'Co.'];
const TAGLINES = [
  'Design-driven software solutions',
  'Engineering the future, today',
  'Where ideas become reality',
  'Building bold digital experiences',
  'Precision craft for modern teams',
  'Innovation at full throttle',
  'Your vision, our code',
  'Crafted with intent'
];
const INDUSTRIES = ['Technology & Design', 'Financial Services', 'Healthcare', 'E-Commerce', 'Media & Entertainment', 'Logistics & Supply Chain', 'Real Estate', 'Consulting'];
const ENTITY_OPTIONS = ['LLC', 'Inc.', 'Sole Prop', 'Partnership'] as const;
const CITIES = [
  { city: 'Austin', state: 'TX', zip: '78701', area: '512' },
  { city: 'Seattle', state: 'WA', zip: '98101', area: '206' },
  { city: 'Denver', state: 'CO', zip: '80202', area: '303' },
  { city: 'Miami', state: 'FL', zip: '33101', area: '305' },
  { city: 'Chicago', state: 'IL', zip: '60601', area: '312' },
  { city: 'Portland', state: 'OR', zip: '97201', area: '503' },
  { city: 'Atlanta', state: 'GA', zip: '30303', area: '404' },
  { city: 'Phoenix', state: 'AZ', zip: '85001', area: '602' }
];
const STREETS = ['Enterprise Way', 'Market Street', 'Commerce Blvd', 'Innovation Dr', 'Sunset Ave', 'Industrial Pkwy', 'Main Street', 'Tech Center Dr'];
const DESCRIPTIONS = [
  'We build high-performance web and mobile products using cutting-edge developer tools.',
  'A full-service agency delivering end-to-end digital transformation for ambitious brands.',
  'We craft scalable platforms, beautiful interfaces, and the infrastructure behind them.',
  'Specialists in cloud architecture, data engineering, and product design for modern startups.',
  'From strategy to launch, we help companies ship software that customers love.'
];
const BRAND_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#eab308'];
const SECONDARY_COLORS = ['#1e293b', '#0f172a', '#111827', '#3730a3', '#7c2d12', '#312e81'];

export const BusinessProfileGenerator: React.FC = () => {
  const { currentUser, saveDoc, loadedDoc, clearLoadedDoc } = useAuth();
  // Config state
  const [bizName, setBizName] = useState('Nebula Creative Co.');
  const [tagline, setTagline] = useState('Design-driven software solutions');
  const [entityType, setEntityType] = useState('LLC');
  const [industry, setIndustry] = useState('Technology & Design');
  const [foundedYear, setFoundedYear] = useState('2024');
  const [phone, setPhone] = useState('+1 (512) 555-0199');
  const [email, setEmail] = useState('hello@nebulacreative.co');
  const [address, setAddress] = useState('101 Rainey St, Austin, TX 78701');
  const [website, setWebsite] = useState('www.nebulacreative.co');
  const [description, setDescription] = useState('We build high-performance web and mobile products using cutting-edge developer tools.');
  
  // Brand color selection
  const [brandColor, setBrandColor] = useState('#f97316'); // Orange
  const [secondaryColor, setSecondaryColor] = useState('#1e293b'); // Dark Slate

  // View state: 'card' | 'invoice' | 'json'
  const [activeOutputTab, setActiveOutputTab] = useState<'card' | 'invoice' | 'json'>('card');
  const [copied, setCopied] = useState(false);

  // Listen for loaded document data
  useEffect(() => {
    if (loadedDoc && loadedDoc.type === 'business-profile-gen') {
      const d = loadedDoc.data;
      setBizName(d.bizName || '');
      setTagline(d.tagline || '');
      setEntityType(d.entityType || 'LLC');
      setIndustry(d.industry || '');
      setFoundedYear(d.foundedYear || '');
      setPhone(d.phone || '');
      setEmail(d.email || '');
      setAddress(d.address || '');
      setWebsite(d.website || '');
      setDescription(d.description || '');
      setBrandColor(d.brandColor || '#f97316');
      setSecondaryColor(d.secondaryColor || '#1e293b');
      
      clearLoadedDoc();
    }
  }, [loadedDoc]);

  const handleSave = () => {
    if (!currentUser) return;
    const defaultName = `${bizName} - Profile (${entityType})`;
    const docName = prompt('Enter a name for this saved business profile:', defaultName);
    if (docName === null) return;
    
    const finalName = docName.trim() || defaultName;
    saveDoc('business-profile-gen', finalName, {
      bizName,
      tagline,
      entityType,
      industry,
      foundedYear,
      phone,
      email,
      address,
      website,
      description,
      brandColor,
      secondaryColor
    });
    alert('Business profile saved to your dashboard!');
  };

  const getProfileJSON = () => {
    return JSON.stringify({
      company: bizName,
      entity: entityType,
      slogan: tagline,
      industry: industry,
      founded: foundedYear,
      contact: {
        phone,
        email,
        address,
        website
      },
      branding: {
        primaryColor: brandColor,
        secondaryColor: secondaryColor
      },
      about: description
    }, null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getProfileJSON());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const randomItem = <T,>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Fill every field with a fresh, randomized but coherent business profile.
  const generateNewProfile = () => {
    const name = `${randomItem(BIZ_PREFIXES)} ${randomItem(BIZ_SUFFIXES)}`;
    const loc = randomItem(CITIES);
    const streetNum = Math.floor(100 + Math.random() * 9900);
    const lineNum = Math.floor(200 + Math.random() * 7800);
    const ext = Math.floor(1000 + Math.random() * 8999);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18);

    setBizName(name);
    setTagline(randomItem(TAGLINES));
    setEntityType(randomItem(ENTITY_OPTIONS));
    setIndustry(randomItem(INDUSTRIES));
    setFoundedYear(String(2015 + Math.floor(Math.random() * 11)));
    setPhone(`+1 (${loc.area}) ${lineNum}-${ext}`);
    setEmail(`hello@${slug}.co`);
    setAddress(`${streetNum} ${randomItem(STREETS)}, ${loc.city}, ${loc.state} ${loc.zip}`);
    setWebsite(`www.${slug}.co`);
    setDescription(randomItem(DESCRIPTIONS));
    setBrandColor(randomItem(BRAND_COLORS));
    setSecondaryColor(randomItem(SECONDARY_COLORS));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="no-print-grid">
      {/* Editor Panel */}
      <div className="glass-card form-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontWeight: 700, margin: 0 }} className="title-gradient">Business Profile</h2>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            onClick={generateNewProfile}
            title="Fill the form with a fresh randomized business profile"
          >
            <Shuffle size={15} /> Generate New Profile
          </button>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input className="input-field" value={bizName} onChange={e => setBizName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tagline/Motto</label>
            <input className="input-field" value={tagline} onChange={e => setTagline(e.target.value)} />
          </div>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Entity Type</label>
            <select className="input-field" value={entityType} onChange={e => setEntityType(e.target.value)}>
              <option value="LLC">Limited Liability Company (LLC)</option>
              <option value="Inc.">C-Corp / S-Corp (Inc.)</option>
              <option value="Sole Prop">Sole Proprietorship</option>
              <option value="Partnership">General Partnership</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Industry</label>
            <input className="input-field" value={industry} onChange={e => setIndustry(e.target.value)} />
          </div>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Year Founded</label>
            <input className="input-field" type="number" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Primary Email</label>
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Website Domain</label>
            <input className="input-field" value={website} onChange={e => setWebsite(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Office Address</label>
          <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Company Bio / Description</label>
          <textarea className="input-field" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Brand Customizer</h3>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Primary Theme Color</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="color" className="input-field" style={{ width: '45px', padding: '0.2rem', height: '40px' }} value={brandColor} onChange={e => setBrandColor(e.target.value)} />
              <input type="text" className="input-field" value={brandColor} onChange={e => setBrandColor(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Secondary Base Color</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="color" className="input-field" style={{ width: '45px', padding: '0.2rem', height: '40px' }} value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
              <input type="text" className="input-field" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
            </div>
          </div>
        </div>

        {currentUser && (
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
            onClick={handleSave}
          >
            <FolderHeart size={16} /> Save Business Profile
          </button>
        )}
      </div>

      {/* Visual Render Hub */}
      <div>
        {/* Toggle Nav */}
        <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button 
            className="btn" 
            style={{ flex: 1, padding: '0.5rem', background: activeOutputTab === 'card' ? 'var(--accent-light)' : 'transparent', color: activeOutputTab === 'card' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none' }}
            onClick={() => setActiveOutputTab('card')}
          >
            <Eye size={14} /> Business Card
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, padding: '0.5rem', background: activeOutputTab === 'invoice' ? 'var(--accent-light)' : 'transparent', color: activeOutputTab === 'invoice' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none' }}
            onClick={() => setActiveOutputTab('invoice')}
          >
            <FileText size={14} /> Sample Invoice
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, padding: '0.5rem', background: activeOutputTab === 'json' ? 'var(--accent-light)' : 'transparent', color: activeOutputTab === 'json' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none' }}
            onClick={() => setActiveOutputTab('json')}
          >
            <Code size={14} /> JSON Metadata
          </button>
        </div>

        {/* Dynamic Previews */}
        <div className="print-preview-pane">
          {activeOutputTab === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
              
              {/* Front Side */}
              <div style={{
                width: '350px',
                height: '200px',
                background: `linear-gradient(135deg, ${brandColor} 0%, ${secondaryColor} 100%)`,
                borderRadius: '12px',
                padding: '1.5rem',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Visual accent circles */}
                <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', top: '-50px', right: '-50px' }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: brandColor, fontSize: '16px' }}>N</div>
                  <strong style={{ fontSize: '16px', letterSpacing: '1px', fontFamily: 'system-ui' }}>{bizName.toUpperCase()}</strong>
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, fontStyle: 'italic' }}>{tagline}</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px', fontSize: '9px', opacity: 0.7, textAlign: 'right' }}>
                  Est. {foundedYear} | {entityType}
                </div>
              </div>

              {/* Back Side */}
              <div style={{
                width: '350px',
                height: '200px',
                background: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '1.5rem',
                color: '#1e293b',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#000', fontWeight: 'bold' }}>Company Hub</h4>
                    <span style={{ fontSize: '10px', color: brandColor, fontWeight: 'bold', textTransform: 'uppercase' }}>{industry}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold', color: secondaryColor }}>
                    <div style={{ width: '10px', height: '10px', background: brandColor, borderRadius: '2px' }}></div>
                    {bizName}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', fontFamily: 'sans-serif' }}>
                  <div style={{ display: 'flex', gap: '6px' }}><span style={{ color: brandColor, fontWeight: 'bold', width: '12px' }}>P:</span> <span>{phone}</span></div>
                  <div style={{ display: 'flex', gap: '6px' }}><span style={{ color: brandColor, fontWeight: 'bold', width: '12px' }}>E:</span> <span>{email}</span></div>
                  <div style={{ display: 'flex', gap: '6px' }}><span style={{ color: brandColor, fontWeight: 'bold', width: '12px' }}>W:</span> <span>{website}</span></div>
                  <div style={{ display: 'flex', gap: '6px' }}><span style={{ color: brandColor, fontWeight: 'bold', width: '12px' }}>A:</span> <span>{address}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeOutputTab === 'invoice' && (
            <div style={{
              background: '#fff',
              color: '#333',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
              fontSize: '11px',
              fontFamily: 'sans-serif',
              minHeight: '450px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `3px solid ${brandColor}`, paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 'bold', color: '#000', fontSize: '18px' }}>{bizName}</h2>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#666' }}>{entityType} | {industry}</span>
                  <p style={{ margin: '6px 0 0', color: '#555' }}>{address}</p>
                  <p style={{ margin: '2px 0 0', color: '#555' }}>{phone} | {email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ margin: 0, color: brandColor, fontSize: '24px', letterSpacing: '1px' }}>INVOICE</h1>
                  <p style={{ margin: '6px 0 0' }}>Invoice #: <strong>INV-2026-001</strong></p>
                  <p style={{ margin: '2px 0 0' }}>Date: {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '10px', background: '#fafafa', borderRadius: '4px', borderLeft: `3px solid ${secondaryColor}` }}>
                <strong style={{ textTransform: 'uppercase', fontSize: '9px', color: '#666' }}>Billed To:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 'bold', color: '#000' }}>Acme Corporation LLC</p>
                <p style={{ margin: '2px 0 0', color: '#555' }}>100 Industrial Parkway, Austin, TX 78704</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>
                    <th style={{ padding: '6px 8px' }}>Description</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '80px' }}>Quantity</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '90px' }}>Unit Price</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '100px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>Professional Consulting & Tool Integration</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>15.00</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>$150.00</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>$2,250.00</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>Custom Scripts Hub Deployment (Vite Command Deck)</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>1.00</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>$1,200.00</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>$1,200.00</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <table style={{ width: '200px', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#666' }}>Subtotal:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>$3,450.00</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#666' }}>Tax (0%):</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>$0.00</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #333', fontSize: '13px', fontWeight: 'bold' }}>
                      <td style={{ padding: '6px 0' }}>Balance Due:</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', color: brandColor }}>$3,450.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeOutputTab === 'json' && (
            <div style={{ position: 'relative' }}>
              <pre style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                overflowX: 'auto',
                maxHeight: '450px'
              }}>
                <code>{getProfileJSON()}</code>
              </pre>
              <button 
                className="btn btn-secondary" 
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                onClick={copyToClipboard}
              >
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                {copied ? ' Copied!' : ' Copy'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
