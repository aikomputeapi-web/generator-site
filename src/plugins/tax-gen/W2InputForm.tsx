import React, { useState } from 'react';
import type { W2Data } from './types';
import { mockW2Data } from './mockData';

interface W2InputFormProps {
  onGenerate: (data: W2Data) => void;
}

const emptyW2: W2Data = {
  employeeSSN: '',
  employerEIN: '',
  employerName: '',
  employerAddress: '',
  employerCity: '',
  employerState: '',
  employerZip: '',
  controlNumber: '',
  employeeFirstName: '',
  employeeLastName: '',
  employeeMiddleInit: '',
  employeeSuffix: '',
  employeeAddress: '',
  employeeCity: '',
  employeeState: '',
  employeeZip: '',
  box1_wagesTips: 0,
  box2_federalTaxWithheld: 0,
  box3_socialSecurityWages: 0,
  box4_socialSecurityTax: 0,
  box5_medicareWages: 0,
  box6_medicareTax: 0,
  box7_socialSecurityTips: 0,
  box8_allocatedTips: 0,
  box10_dependentCareBenefits: 0,
  box11_nonqualifiedPlans: 0,
  box12a_code: '',
  box12a_amount: 0,
  box12b_code: '',
  box12b_amount: 0,
  box12c_code: '',
  box12c_amount: 0,
  box12d_code: '',
  box12d_amount: 0,
  box13_statutory: false,
  box13_retirement: false,
  box13_thirdPartySick: false,
  box14_other: '',
  box15_stateCode: '',
  box15_stateID: '',
  box16_stateWages: 0,
  box17_stateTax: 0,
  box18_localWages: 0,
  box19_localTax: 0,
  box20_localityName: '',
  taxYear: '2024',
};

const W2InputForm: React.FC<W2InputFormProps> = ({ onGenerate }) => {
  const [data, setData] = useState<W2Data>({ ...emptyW2 });

  const handleChange = (field: keyof W2Data, value: string | number | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumChange = (field: keyof W2Data, value: string) => {
    const num = parseFloat(value) || 0;
    setData(prev => ({ ...prev, [field]: num }));
  };

  const fillMockData = () => {
    setData({ ...mockW2Data });
  };

  const autoCalculate = () => {
    const wages = data.box1_wagesTips;
    
    setData(prev => ({
      ...prev,
      box3_socialSecurityWages: Math.min(wages, 168600),
      box4_socialSecurityTax: Math.round(Math.min(wages, 168600) * 0.062 * 100) / 100,
      box5_medicareWages: wages,
      box6_medicareTax: Math.round(wages * 0.0145 * 100) / 100,
      box16_stateWages: wages,
    }));
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
          Auto-Calculate Taxes
        </button>
      </div>

      {/* Tax Year */}
      <div className="input-section">
        <h3 className="input-section-title">Tax Year</h3>
        <div className="input-grid input-grid-1">
          <div className="input-field">
            <label>Tax Year</label>
            <input type="text" value={data.taxYear} onChange={e => handleChange('taxYear', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Employer Info */}
      <div className="input-section">
        <h3 className="input-section-title">Employer Information</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>Employer EIN (b)</label>
            <input type="text" value={data.employerEIN} onChange={e => handleChange('employerEIN', e.target.value)} placeholder="XX-XXXXXXX" />
          </div>
          <div className="input-field">
            <label>Control Number (d)</label>
            <input type="text" value={data.controlNumber} onChange={e => handleChange('controlNumber', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field input-field-wide">
            <label>Employer Name (c)</label>
            <input type="text" value={data.employerName} onChange={e => handleChange('employerName', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field input-field-wide">
            <label>Address</label>
            <input type="text" value={data.employerAddress} onChange={e => handleChange('employerAddress', e.target.value)} />
          </div>
        </div>
        <div className="input-grid input-grid-3">
          <div className="input-field">
            <label>City</label>
            <input type="text" value={data.employerCity} onChange={e => handleChange('employerCity', e.target.value)} />
          </div>
          <div className="input-field">
            <label>State</label>
            <input type="text" value={data.employerState} onChange={e => handleChange('employerState', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>ZIP</label>
            <input type="text" value={data.employerZip} onChange={e => handleChange('employerZip', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Employee Info */}
      <div className="input-section">
        <h3 className="input-section-title">Employee Information</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>SSN (a)</label>
            <input type="text" value={data.employeeSSN} onChange={e => handleChange('employeeSSN', e.target.value)} placeholder="XXX-XX-XXXX" />
          </div>
        </div>
        <div className="input-grid input-grid-4">
          <div className="input-field">
            <label>First Name (e)</label>
            <input type="text" value={data.employeeFirstName} onChange={e => handleChange('employeeFirstName', e.target.value)} />
          </div>
          <div className="input-field" style={{ flex: '0 0 60px' }}>
            <label>M.I.</label>
            <input type="text" value={data.employeeMiddleInit} onChange={e => handleChange('employeeMiddleInit', e.target.value)} maxLength={1} />
          </div>
          <div className="input-field">
            <label>Last Name</label>
            <input type="text" value={data.employeeLastName} onChange={e => handleChange('employeeLastName', e.target.value)} />
          </div>
          <div className="input-field" style={{ flex: '0 0 60px' }}>
            <label>Suffix</label>
            <input type="text" value={data.employeeSuffix} onChange={e => handleChange('employeeSuffix', e.target.value)} maxLength={3} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field input-field-wide">
            <label>Address (f)</label>
            <input type="text" value={data.employeeAddress} onChange={e => handleChange('employeeAddress', e.target.value)} />
          </div>
        </div>
        <div className="input-grid input-grid-3">
          <div className="input-field">
            <label>City</label>
            <input type="text" value={data.employeeCity} onChange={e => handleChange('employeeCity', e.target.value)} />
          </div>
          <div className="input-field">
            <label>State</label>
            <input type="text" value={data.employeeState} onChange={e => handleChange('employeeState', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>ZIP</label>
            <input type="text" value={data.employeeZip} onChange={e => handleChange('employeeZip', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Wage & Tax Data */}
      <div className="input-section">
        <h3 className="input-section-title">Wage & Tax Information</h3>
        <div className="input-grid">
          <div className="input-field">
            <label>Box 1 — Wages, tips, other comp.</label>
            <input type="number" step="0.01" value={data.box1_wagesTips || ''} onChange={e => handleNumChange('box1_wagesTips', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 2 — Federal income tax withheld</label>
            <input type="number" step="0.01" value={data.box2_federalTaxWithheld || ''} onChange={e => handleNumChange('box2_federalTaxWithheld', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>Box 3 — Social security wages</label>
            <input type="number" step="0.01" value={data.box3_socialSecurityWages || ''} onChange={e => handleNumChange('box3_socialSecurityWages', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 4 — Social security tax withheld</label>
            <input type="number" step="0.01" value={data.box4_socialSecurityTax || ''} onChange={e => handleNumChange('box4_socialSecurityTax', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>Box 5 — Medicare wages and tips</label>
            <input type="number" step="0.01" value={data.box5_medicareWages || ''} onChange={e => handleNumChange('box5_medicareWages', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 6 — Medicare tax withheld</label>
            <input type="number" step="0.01" value={data.box6_medicareTax || ''} onChange={e => handleNumChange('box6_medicareTax', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>Box 7 — Social security tips</label>
            <input type="number" step="0.01" value={data.box7_socialSecurityTips || ''} onChange={e => handleNumChange('box7_socialSecurityTips', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 8 — Allocated tips</label>
            <input type="number" step="0.01" value={data.box8_allocatedTips || ''} onChange={e => handleNumChange('box8_allocatedTips', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>Box 10 — Dependent care benefits</label>
            <input type="number" step="0.01" value={data.box10_dependentCareBenefits || ''} onChange={e => handleNumChange('box10_dependentCareBenefits', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 11 — Nonqualified plans</label>
            <input type="number" step="0.01" value={data.box11_nonqualifiedPlans || ''} onChange={e => handleNumChange('box11_nonqualifiedPlans', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Box 12 */}
      <div className="input-section">
        <h3 className="input-section-title">Box 12 — Codes</h3>
        <div className="input-grid input-grid-4">
          <div className="input-field" style={{ flex: '0 0 80px' }}>
            <label>12a Code</label>
            <input type="text" value={data.box12a_code} onChange={e => handleChange('box12a_code', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>12a Amount</label>
            <input type="number" step="0.01" value={data.box12a_amount || ''} onChange={e => handleNumChange('box12a_amount', e.target.value)} />
          </div>
          <div className="input-field" style={{ flex: '0 0 80px' }}>
            <label>12b Code</label>
            <input type="text" value={data.box12b_code} onChange={e => handleChange('box12b_code', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>12b Amount</label>
            <input type="number" step="0.01" value={data.box12b_amount || ''} onChange={e => handleNumChange('box12b_amount', e.target.value)} />
          </div>
        </div>
        <div className="input-grid input-grid-4">
          <div className="input-field" style={{ flex: '0 0 80px' }}>
            <label>12c Code</label>
            <input type="text" value={data.box12c_code} onChange={e => handleChange('box12c_code', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>12c Amount</label>
            <input type="number" step="0.01" value={data.box12c_amount || ''} onChange={e => handleNumChange('box12c_amount', e.target.value)} />
          </div>
          <div className="input-field" style={{ flex: '0 0 80px' }}>
            <label>12d Code</label>
            <input type="text" value={data.box12d_code} onChange={e => handleChange('box12d_code', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>12d Amount</label>
            <input type="number" step="0.01" value={data.box12d_amount || ''} onChange={e => handleNumChange('box12d_amount', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Box 13 */}
      <div className="input-section">
        <h3 className="input-section-title">Box 13 — Checkboxes</h3>
        <div className="input-checkboxes">
          <label className="input-checkbox-label">
            <input type="checkbox" checked={data.box13_statutory} onChange={e => handleChange('box13_statutory', e.target.checked)} />
            Statutory employee
          </label>
          <label className="input-checkbox-label">
            <input type="checkbox" checked={data.box13_retirement} onChange={e => handleChange('box13_retirement', e.target.checked)} />
            Retirement plan
          </label>
          <label className="input-checkbox-label">
            <input type="checkbox" checked={data.box13_thirdPartySick} onChange={e => handleChange('box13_thirdPartySick', e.target.checked)} />
            Third-party sick pay
          </label>
        </div>
      </div>

      {/* Box 14 */}
      <div className="input-section">
        <h3 className="input-section-title">Box 14 — Other</h3>
        <div className="input-grid input-grid-1">
          <div className="input-field">
            <label>Other</label>
            <input type="text" value={data.box14_other} onChange={e => handleChange('box14_other', e.target.value)} />
          </div>
        </div>
      </div>

      {/* State/Local */}
      <div className="input-section">
        <h3 className="input-section-title">State & Local Information</h3>
        <div className="input-grid input-grid-3">
          <div className="input-field" style={{ flex: '0 0 80px' }}>
            <label>Box 15 — State</label>
            <input type="text" value={data.box15_stateCode} onChange={e => handleChange('box15_stateCode', e.target.value)} maxLength={2} />
          </div>
          <div className="input-field">
            <label>Employer's State ID</label>
            <input type="text" value={data.box15_stateID} onChange={e => handleChange('box15_stateID', e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="input-field">
            <label>Box 16 — State wages</label>
            <input type="number" step="0.01" value={data.box16_stateWages || ''} onChange={e => handleNumChange('box16_stateWages', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 17 — State income tax</label>
            <input type="number" step="0.01" value={data.box17_stateTax || ''} onChange={e => handleNumChange('box17_stateTax', e.target.value)} />
          </div>
        </div>
        <div className="input-grid input-grid-3">
          <div className="input-field">
            <label>Box 18 — Local wages</label>
            <input type="number" step="0.01" value={data.box18_localWages || ''} onChange={e => handleNumChange('box18_localWages', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 19 — Local income tax</label>
            <input type="number" step="0.01" value={data.box19_localTax || ''} onChange={e => handleNumChange('box19_localTax', e.target.value)} />
          </div>
          <div className="input-field">
            <label>Box 20 — Locality name</label>
            <input type="text" value={data.box20_localityName} onChange={e => handleChange('box20_localityName', e.target.value)} />
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
        Generate W-2 Document
      </button>
    </form>
  );
};

export default W2InputForm;
