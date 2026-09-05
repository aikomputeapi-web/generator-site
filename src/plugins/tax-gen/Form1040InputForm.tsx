import React, { useState } from 'react';
import type { Form1040Data } from './types';
import { mockW2Data, generateMock1040FromW2, calculateTax, getStandardDeduction } from './mockData';

interface Form1040InputFormProps {
  onGenerate: (data: Form1040Data) => void;
}

const empty1040: Form1040Data = {
  filingStatus: 'single',
  firstName: '',
  lastName: '',
  ssn: '',
  spouseFirstName: '',
  spouseLastName: '',
  spouseSSN: '',
  address: '',
  aptNo: '',
  city: '',
  state: '',
  zip: '',
  foreignCountry: '',
  foreignProvince: '',
  foreignPostalCode: '',
  digitalAssets: 'no',
  youStandardDeduction: false,
  spouseStandardDeduction: false,
  youBorn1960: false,
  youBlind: false,
  spouseBorn1960: false,
  spouseBlind: false,
  dependents: [],
  line1a: 0, line1b: 0, line1c: 0, line1d: 0, line1e: 0, line1f: 0, line1g: 0, line1h: 0, line1i: 0, line1z: 0,
  line2a: 0, line2b: 0, line3a: 0, line3b: 0, line4a: 0, line4b: 0, line5a: 0, line5b: 0,
  line6a: 0, line6b: 0, line6c: false, line7: 0, line8: 0, line9: 0, line10: 0, line11: 0,
  line12: 0, line13: 0, line14: 0, line15: 0,
  line16: 0, line17: 0, line18: 0, line19: 0, line20: 0, line21: 0, line22: 0, line23: 0, line24: 0,
  line25a: 0, line25b: 0, line25c: 0, line25d: 0, line26: 0,
  line27a: 0, line27b: false, line27c: 0, line28: 0, line29: 0, line30: 0, line31: 0, line32: 0, line33: 0,
  line34: 0, line35a: 0, line35b_routingNumber: '', line35b_accountType: '', line35b_accountNumber: '',
  line36: 0, line37: 0, line38: 0,
  thirdPartyDesignee: 'no', designeeName: '', designeePhone: '', designeePIN: '',
  occupation: '', spouseOccupation: '', phone: '', email: '',
  identityPIN: '', spouseIdentityPIN: '',
  taxYear: '2024',
  preparerName: '', preparerPTIN: '', preparerFirmName: '', preparerFirmEIN: '',
  preparerFirmAddress: '', preparerFirmPhone: '', preparerSelfEmployed: false,
};

const Form1040InputForm: React.FC<Form1040InputFormProps> = ({ onGenerate }) => {
  const [data, setData] = useState<Form1040Data>({ ...empty1040 });

  const handleChange = (field: keyof Form1040Data, value: string | number | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumChange = (field: keyof Form1040Data, value: string) => {
    const num = parseFloat(value) || 0;
    setData(prev => ({ ...prev, [field]: num }));
  };

  const fillMockData = () => {
    const mock = generateMock1040FromW2(mockW2Data);
    setData(mock);
  };

  const autoCalculate = () => {
    setData(prev => {
      const line1z = prev.line1a + prev.line1b + prev.line1c + prev.line1d + prev.line1e + prev.line1f + prev.line1g + prev.line1h + prev.line1i;
      const line9 = line1z + prev.line2b + prev.line3b + prev.line4b + prev.line5b + prev.line6b + prev.line7 + prev.line8;
      const line11 = line9 - prev.line10;
      const line12 = prev.line12 || getStandardDeduction(prev.filingStatus);
      const line14 = line12 + prev.line13;
      const line15 = Math.max(0, line11 - line14);
      const line16 = calculateTax(line15, prev.filingStatus);
      const line18 = line16 + prev.line17;
      const line21 = prev.line19 + prev.line20;
      const line22 = Math.max(0, line18 - line21);
      const line24 = line22 + prev.line23;
      const line25d = prev.line25a + prev.line25b + prev.line25c;
      const line32 = prev.line27a + prev.line28 + prev.line29 + prev.line31;
      const line33 = line25d + prev.line26 + line32;
      const line34 = line33 > line24 ? line33 - line24 : 0;
      const line37 = line24 > line33 ? line24 - line33 : 0;

      return {
        ...prev,
        line1z, line9, line11, line12, line14, line15, line16,
        line18, line21, line22, line24, line25d, line32, line33,
        line34, line35a: line34, line37,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(data);
  };

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <div className="input-form-actions">
        <button type="button" className="btn-mock" onClick={fillMockData}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M16 13H8"/>
            <path d="M16 17H8"/>
            <path d="M10 9H8"/>
          </svg>
          Fill with Sample Data
        </button>
        <button type="button" className="btn-calc" onClick={autoCalculate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <line x1="8" y1="6" x2="16" y2="6"/>
            <line x1="8" y1="10" x2="10" y2="10"/>
            <line x1="14" y1="10" x2="16" y2="10"/>
            <line x1="8" y1="14" x2="10" y2="14"/>
            <line x1="14" y1="14" x2="16" y2="14"/>
            <line x1="8" y1="18" x2="16" y2="18"/>
          </svg>
          Auto-Calculate All Lines
        </button>
      </div>

      {/* Filing Status */}
      <div className="input-section">
        <h3 className="input-section-title">Filing Status & Tax Year</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>Filing Status</label>
            <select value={data.filingStatus} onChange={e => handleChange('filingStatus', e.target.value)}>
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
              <option value="qualifying_widow">Qualifying Surviving Spouse</option>
            </select>
          </div>
          <div className="input-field" style={{ flex: '0 0 120px' }}>
            <label>Tax Year</label>
            <input type="text" value={data.taxYear} onChange={e => handleChange('taxYear', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="input-section">
        <h3 className="input-section-title">Personal Information</h3>
        <div className="input-grid input-grid-3">
          <div className="input-field">
            <label>First Name</label>
            <input type="text" value={data.firstName} onChange={e => handleChange('firstName', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Last Name</label>
            <input type="text" value={data.lastName} onChange={e => handleChange('lastName', e.target.value)} />
          </div>
          <div className="input-field">
            <label>SSN</label>
            <input type="text" value={data.ssn} onChange={e => handleChange('ssn', e.target.value)} placeholder="XXX-XX-XXXX" />
          </div>
        </div>
        <div className="input-grid input-grid-3">
          <div className="input-field">
            <label>Spouse First Name</label>
            <input type="text" value={data.spouseFirstName} onChange={e => handleChange('spouseFirstName', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Spouse Last Name</label>
            <input type="text" value={data.spouseLastName} onChange={e => handleChange('spouseLastName', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Spouse SSN</label>
            <input type="text" value={data.spouseSSN} onChange={e => handleChange('spouseSSN', e.target.value)} placeholder="XXX-XX-XXXX" />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field input-field-wide">
            <label>Home Address</label>
            <input type="text" value={data.address} onChange={e => handleChange('address', e.target.value)} />
          </div>
          <div className="input-field" style={{ flex: '0 0 80px' }}>
            <label>Apt. No.</label>
            <input type="text" value={data.aptNo} onChange={e => handleChange('aptNo', e.target.value)} />
          </div>
        </div>
        <div className="input-grid input-grid-3">
          <div className="input-field">
            <label>City</label>
            <input type="text" value={data.city} onChange={e => handleChange('city', e.target.value)} />
          </div>
          <div className="input-field" style={{ flex: '0 0 80px' }}>
            <label>State</label>
            <input type="text" value={data.state} onChange={e => handleChange('state', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>ZIP</label>
            <input type="text" value={data.zip} onChange={e => handleChange('zip', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Income */}
      <div className="input-section">
        <h3 className="input-section-title">Income</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>1a — Wages, salaries, tips (W-2)</label>
            <input type="number" step="0.01" value={data.line1a || ''} onChange={e => handleNumChange('line1a', e.target.value)} />
          </div>
          <div className="input-field">
            <label>2b — Taxable interest</label>
            <input type="number" step="0.01" value={data.line2b || ''} onChange={e => handleNumChange('line2b', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>3b — Ordinary dividends</label>
            <input type="number" step="0.01" value={data.line3b || ''} onChange={e => handleNumChange('line3b', e.target.value)} />
          </div>
          <div className="input-field">
            <label>3a — Qualified dividends</label>
            <input type="number" step="0.01" value={data.line3a || ''} onChange={e => handleNumChange('line3a', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>4a — IRA distributions</label>
            <input type="number" step="0.01" value={data.line4a || ''} onChange={e => handleNumChange('line4a', e.target.value)} />
          </div>
          <div className="input-field">
            <label>4b — Taxable IRA</label>
            <input type="number" step="0.01" value={data.line4b || ''} onChange={e => handleNumChange('line4b', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>5a — Pensions and annuities</label>
            <input type="number" step="0.01" value={data.line5a || ''} onChange={e => handleNumChange('line5a', e.target.value)} />
          </div>
          <div className="input-field">
            <label>5b — Taxable pensions</label>
            <input type="number" step="0.01" value={data.line5b || ''} onChange={e => handleNumChange('line5b', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>6a — Social Security benefits</label>
            <input type="number" step="0.01" value={data.line6a || ''} onChange={e => handleNumChange('line6a', e.target.value)} />
          </div>
          <div className="input-field">
            <label>6b — Taxable Social Security</label>
            <input type="number" step="0.01" value={data.line6b || ''} onChange={e => handleNumChange('line6b', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>7 — Capital gain or (loss)</label>
            <input type="number" step="0.01" value={data.line7 || ''} onChange={e => handleNumChange('line7', e.target.value)} />
          </div>
          <div className="input-field">
            <label>8 — Other income (Schedule 1)</label>
            <input type="number" step="0.01" value={data.line8 || ''} onChange={e => handleNumChange('line8', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>10 — Adjustments to income</label>
            <input type="number" step="0.01" value={data.line10 || ''} onChange={e => handleNumChange('line10', e.target.value)} />
          </div>
          <div className="input-field">
            <label>13 — Qualified business income deduction</label>
            <input type="number" step="0.01" value={data.line13 || ''} onChange={e => handleNumChange('line13', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Credits & Other Taxes */}
      <div className="input-section">
        <h3 className="input-section-title">Credits & Other Taxes</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>19 — Child tax credit</label>
            <input type="number" step="0.01" value={data.line19 || ''} onChange={e => handleNumChange('line19', e.target.value)} />
          </div>
          <div className="input-field">
            <label>23 — Other taxes (Schedule 2)</label>
            <input type="number" step="0.01" value={data.line23 || ''} onChange={e => handleNumChange('line23', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="input-section">
        <h3 className="input-section-title">Payments</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>25a — W-2 withholding</label>
            <input type="number" step="0.01" value={data.line25a || ''} onChange={e => handleNumChange('line25a', e.target.value)} />
          </div>
          <div className="input-field">
            <label>25b — 1099 withholding</label>
            <input type="number" step="0.01" value={data.line25b || ''} onChange={e => handleNumChange('line25b', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>26 — Estimated tax payments</label>
            <input type="number" step="0.01" value={data.line26 || ''} onChange={e => handleNumChange('line26', e.target.value)} />
          </div>
          <div className="input-field">
            <label>27a — Earned income credit</label>
            <input type="number" step="0.01" value={data.line27a || ''} onChange={e => handleNumChange('line27a', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Signature Info */}
      <div className="input-section">
        <h3 className="input-section-title">Signature Information</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>Your Occupation</label>
            <input type="text" value={data.occupation} onChange={e => handleChange('occupation', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Phone Number</label>
            <input type="text" value={data.phone} onChange={e => handleChange('phone', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>Email</label>
            <input type="text" value={data.email} onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Spouse's Occupation</label>
            <input type="text" value={data.spouseOccupation} onChange={e => handleChange('spouseOccupation', e.target.value)} />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-generate">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6"/>
          <path d="M12 18v-6"/>
          <path d="M9 15l3-3 3 3"/>
        </svg>
        Generate Form 1040 Document
      </button>
    </form>
  );
};

export default Form1040InputForm;
