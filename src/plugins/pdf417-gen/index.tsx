import { useState, useEffect, useRef, useCallback } from 'react';
import * as BwipJs from 'bwip-js/browser';
import { QrCode, FolderHeart, Download, Copy, Shuffle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const EYE_COLORS = [
  { value: 'BLK', label: 'Black' },
  { value: 'BLU', label: 'Blue' },
  { value: 'BRO', label: 'Brown' },
  { value: 'GRN', label: 'Green' },
  { value: 'GRY', label: 'Gray' },
  { value: 'HAZ', label: 'Hazel' },
  { value: 'MAR', label: 'Maroon' },
  { value: 'PNK', label: 'Pink' },
  { value: 'DIC', label: 'Dichromatic' },
  { value: 'UNK', label: 'Unknown' }
];

const FIRST_NAMES = [
  'JAMES', 'MARY', 'JOHN', 'PATRICIA', 'ROBERT', 'JENNIFER', 'MICHAEL', 'LINDA',
  'WILLIAM', 'ELIZABETH', 'DAVID', 'BARBARA', 'RICHARD', 'SUSAN', 'JOSEPH', 'JESSICA',
  'THOMAS', 'SARAH', 'CHARLES', 'KAREN', 'DANIEL', 'NANCY', 'MATTHEW', 'LISA',
  'ANTHONY', 'BETTY', 'MARK', 'HELEN', 'DONALD', 'SANDRA'
];

const LAST_NAMES = [
  'SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS',
  'RODRIGUEZ', 'MARTINEZ', 'HERNANDEZ', 'LOPEZ', 'GONZALEZ', 'WILSON', 'ANDERSON',
  'THOMAS', 'TAYLOR', 'MOORE', 'JACKSON', 'MARTIN', 'LEE', 'PEREZ', 'THOMPSON',
  'WHITE', 'HARRIS'
];

const MIDDLE_NAMES = [
  'LYNN', 'MARIE', 'ANN', 'MICHAEL', 'JAMES', 'LEE', 'RAY', 'JEAN', 'SUE', 'MAE',
  'LOUISE', 'ROSE', 'PAUL', 'DAVID', 'JOSEPH', 'MARIE', 'ELIZABETH', 'GRACE', 'JANE', 'CLARE'
];

const STREETS = ['PINE ST', 'OAK AVE', 'MAPLE DR', 'CEDAR LN', 'ELM ST', 'WILLOW RD', 'BIRCH BLVD', 'SPRUCE WAY', 'ASPEN CT', 'HICKORY ST'];
const CITIES = ['FRANKLIN', 'SPRINGFIELD', 'GREENVILLE', 'MADISON', 'CLAYTON', 'MARION', 'OXFORD', 'BURLINGTON', 'MILFORD', 'SALEM'];
const LICENSE_CLASSES = ['A', 'B', 'C', 'D', 'E', 'M'];

interface BarcodeData {
  state: string;
  firstName: string;
  middleName: string;
  lastName: string;
  street: string;
  city: string;
  zip: string;
  dob: string;
  sex: string;
  eyeColor: string;
  height: string;
  licenseNumber: string;
  licenseClass: string;
  issueDate: string;
  expiryDate: string;
}

const formatZip = (zip: string) => {
  const digits = zip.replace(/\D/g, '');
  return digits.padEnd(9, '0').slice(0, 9);
};

const formatHeight = (height: string) => {
  const digits = height.replace(/\D/g, '');
  return digits ? digits + ' in' : '';
};

const formatDate = (dateStr: string) => {
  const digits = dateStr.replace(/\D/g, '');
  return digits.slice(0, 8);
};

const formatAAMVA = (data: BarcodeData) => {
  const lines: string[] = [];
  lines.push('@');
  lines.push('ANSI 636000030001DL00410267ZV03190008');

  if (data.lastName) lines.push('DCS' + data.lastName.toUpperCase());
  if (data.firstName) lines.push('DAC' + data.firstName.toUpperCase());
  if (data.middleName) lines.push('DAD' + data.middleName.toUpperCase());
  if (data.dob) lines.push('DBB' + formatDate(data.dob));
  if (data.sex) lines.push('DBC' + data.sex);
  if (data.eyeColor) lines.push('DAY' + data.eyeColor.toUpperCase());
  if (data.height) lines.push('DAU' + formatHeight(data.height));
  if (data.street) lines.push('DAG' + data.street.toUpperCase());
  if (data.city) lines.push('DAI' + data.city.toUpperCase());
  if (data.state) lines.push('DAJ' + data.state.toUpperCase());
  if (data.zip) lines.push('DAK' + formatZip(data.zip));
  if (data.licenseNumber) lines.push('DAQ' + data.licenseNumber.toUpperCase());
  if (data.licenseClass) lines.push('DCA' + data.licenseClass.toUpperCase());
  if (data.issueDate) lines.push('DBD' + formatDate(data.issueDate));
  if (data.expiryDate) lines.push('DBA' + formatDate(data.expiryDate));

  return lines.join('\n') + '\n';
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (startYear: number, endYear: number) => {
  const year = randomInt(startYear, endYear);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return month + day + year;
};

const toDisplayDate = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 8) return raw;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

const fromDisplayDate = (display: string) => display.replace(/\D/g, '');

export const Pdf417Generator: React.FC = () => {
  const { currentUser, saveDoc, loadedDoc, clearLoadedDoc } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const [data, setData] = useState<BarcodeData>({
    state: 'CA',
    firstName: 'DANIEL',
    middleName: 'LYNN',
    lastName: 'JOHNSON',
    street: '7389 PINE ST',
    city: 'FRANKLIN',
    zip: '63062',
    dob: '11141961',
    sex: '2',
    eyeColor: 'BLK',
    height: '551',
    licenseNumber: 'M84320346',
    licenseClass: 'D',
    issueDate: '11142022',
    expiryDate: '11142030'
  });

  const rawData = formatAAMVA(data);

  const generateBarcode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      BwipJs.toCanvas(canvas, {
        bcid: 'pdf417',
        text: rawData,
        scale: 3,
        height: 12,
        includetext: false,
        parsefnc: false
      });
      setIsGenerated(true);
    } catch (err) {
      console.error('Barcode generation failed:', err);
      setIsGenerated(false);
    }
  }, [rawData]);

  useEffect(() => {
    if (loadedDoc && loadedDoc.type === 'pdf417-gen') {
      const d = loadedDoc.data as Partial<BarcodeData>;
      setData(prev => ({
        state: d.state ?? prev.state,
        firstName: d.firstName ?? prev.firstName,
        middleName: d.middleName ?? prev.middleName,
        lastName: d.lastName ?? prev.lastName,
        street: d.street ?? prev.street,
        city: d.city ?? prev.city,
        zip: d.zip ?? prev.zip,
        dob: d.dob ?? prev.dob,
        sex: d.sex ?? prev.sex,
        eyeColor: d.eyeColor ?? prev.eyeColor,
        height: d.height ?? prev.height,
        licenseNumber: d.licenseNumber ?? prev.licenseNumber,
        licenseClass: d.licenseClass ?? prev.licenseClass,
        issueDate: d.issueDate ?? prev.issueDate,
        expiryDate: d.expiryDate ?? prev.expiryDate
      }));
      clearLoadedDoc();
    }
  }, [loadedDoc]);

  useEffect(() => {
    generateBarcode();
  }, [generateBarcode]);

  const updateField = <K extends keyof BarcodeData>(field: K, value: BarcodeData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleRandom = () => {
    const state = randomChoice(US_STATES);
    const first = randomChoice(FIRST_NAMES);
    const last = randomChoice(LAST_NAMES);
    const middle = randomChoice(MIDDLE_NAMES);

    setData({
      state,
      firstName: first,
      middleName: middle,
      lastName: last,
      street: `${randomInt(1000, 9999)} ${randomChoice(STREETS)}`,
      city: randomChoice(CITIES),
      zip: String(randomInt(10000, 99999)),
      dob: randomDate(1950, 2000),
      sex: Math.random() > 0.5 ? '1' : '2',
      eyeColor: randomChoice(EYE_COLORS).value,
      height: String(randomInt(400, 700)),
      licenseNumber: randomChoice('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) + randomInt(10000000, 99999999),
      licenseClass: randomChoice(LICENSE_CLASSES),
      issueDate: randomDate(2018, 2023),
      expiryDate: randomDate(2026, 2034)
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isGenerated) return;

    const link = document.createElement('a');
    link.download = `pdf417-${data.lastName.toLowerCase() || 'barcode'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    if (!rawData) return;
    try {
      await navigator.clipboard.writeText(rawData);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = rawData;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  };

  const handleSave = () => {
    if (!currentUser) return;
    const defaultName = `PDF417 - ${data.lastName}, ${data.firstName} (${data.state})`;
    const docName = prompt('Enter a name for this saved barcode:', defaultName);
    if (docName === null) return;

    saveDoc('pdf417-gen', docName.trim() || defaultName, { ...data });
    alert('Barcode saved to your dashboard!');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="no-print-grid">
      {/* Editor Panel */}
      <div className="glass-card form-container">
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }} className="title-gradient">
          <QrCode size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          License Data
        </h2>

        <div className="form-group">
          <label className="form-label">State</label>
          <select
            className="input-field"
            value={data.state}
            onChange={e => updateField('state', e.target.value)}
          >
            {US_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="input-field"
              value={data.firstName}
              onChange={e => updateField('firstName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Middle Name</label>
            <input
              className="input-field"
              value={data.middleName}
              onChange={e => updateField('middleName', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input
            className="input-field"
            value={data.lastName}
            onChange={e => updateField('lastName', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Street Address</label>
          <input
            className="input-field"
            value={data.street}
            onChange={e => updateField('street', e.target.value)}
          />
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              className="input-field"
              value={data.city}
              onChange={e => updateField('city', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">ZIP Code</label>
            <input
              className="input-field"
              value={data.zip}
              onChange={e => updateField('zip', e.target.value)}
            />
          </div>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Date of Birth (MMDDYYYY)</label>
            <input
              className="input-field"
              value={data.dob}
              maxLength={8}
              onChange={e => updateField('dob', fromDisplayDate(e.target.value))}
              placeholder="MMDDYYYY"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{toDisplayDate(data.dob)}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Sex</label>
            <select
              className="input-field"
              value={data.sex}
              onChange={e => updateField('sex', e.target.value)}
            >
              <option value="1">Male</option>
              <option value="2">Female</option>
            </select>
          </div>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Eye Color</label>
            <select
              className="input-field"
              value={data.eyeColor}
              onChange={e => updateField('eyeColor', e.target.value)}
            >
              {EYE_COLORS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Height (in)</label>
            <input
              className="input-field"
              value={data.height}
              onChange={e => updateField('height', e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">License Number</label>
            <input
              className="input-field"
              value={data.licenseNumber}
              onChange={e => updateField('licenseNumber', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Class</label>
            <input
              className="input-field"
              value={data.licenseClass}
              onChange={e => updateField('licenseClass', e.target.value)}
            />
          </div>
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Issue Date (MMDDYYYY)</label>
            <input
              className="input-field"
              value={data.issueDate}
              maxLength={8}
              onChange={e => updateField('issueDate', fromDisplayDate(e.target.value))}
              placeholder="MMDDYYYY"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{toDisplayDate(data.issueDate)}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date (MMDDYYYY)</label>
            <input
              className="input-field"
              value={data.expiryDate}
              maxLength={8}
              onChange={e => updateField('expiryDate', fromDisplayDate(e.target.value))}
              placeholder="MMDDYYYY"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{toDisplayDate(data.expiryDate)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleRandom}>
            <Shuffle size={16} /> Random
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateBarcode}>
            <RefreshCw size={16} /> Generate Barcode
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div style={{ position: 'sticky', top: '2rem', alignSelf: 'start' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }} className="title-gradient">Barcode Preview</h2>

        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
        </div>

        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Raw Encoded Data</label>
          <textarea
            readOnly
            value={rawData}
            style={{
              width: '100%',
              minHeight: '240px',
              background: '#0f172a',
              color: '#22c55e',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleDownload} disabled={!isGenerated}>
              <Download size={16} /> Download PNG
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopy} disabled={!rawData}>
              <Copy size={16} /> {copyFeedback ? 'Copied!' : 'Copy Raw Data'}
            </button>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>About AAMVA PDF417</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
            <span>Format</span>
            <span style={{ color: 'var(--text-muted)' }}>PDF417 2D Barcode</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
            <span>Standard</span>
            <span style={{ color: 'var(--text-muted)' }}>AAMVA DL/ID Card Design</span>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Encodes driver license data using the AAMVA D20 standard PDF417 format commonly used on US driver's licenses and ID cards.
          </p>
          {currentUser && (
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleSave}>
              <FolderHeart size={16} style={{ color: 'var(--accent-solid)' }} /> Save to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
