import React, { useState, useEffect } from 'react';
import { Printer, FolderHeart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PayStubGenerator: React.FC = () => {
  const { currentUser, saveDoc, loadedDoc, clearLoadedDoc } = useAuth();
  
  // Employer Info
  const [companyName, setCompanyName] = useState('Global Tech Solutions Inc.');
  const [companyAddress, setCompanyAddress] = useState('500 Enterprise Way, Suite 400, Austin, TX 78701');
  
  // Employee Info
  const [employeeName, setEmployeeName] = useState('Jane Smith');
  const [employeeId, setEmployeeId] = useState('EMP-90234');
  const [employeeAddress, setEmployeeAddress] = useState('123 Meadow Lane, Round Rock, TX 78664');
  const [ssn, setSsn] = useState('XXX-XX-4321');

  // Pay Period Info
  const [startDate, setStartDate] = useState('2026-05-16');
  const [endDate, setEndDate] = useState('2026-05-31');
  const [payDate, setPayDate] = useState('2026-06-03');
  const [payFrequency, setPayFrequency] = useState<'semimonthly' | 'biweekly' | 'monthly'>('semimonthly');
  const [payPeriodNumber, setPayPeriodNumber] = useState(10); // 10th period of the year

  // Earnings
  const [hourlyRate, setHourlyRate] = useState(45.00);
  const [regularHours, setRegularHours] = useState(80.00);
  const [overtimeRateMult, setOvertimeRateMult] = useState(1.5);
  const [overtimeHours, setOvertimeHours] = useState(5.00);

  // Custom Taxes / Deductions percentages
  const [fedTaxRate, setFedTaxRate] = useState(0.12); // 12%
  const [stateTaxRate, setStateTaxRate] = useState(0.04); // 4%
  const [ficaSsRate] = useState(0.062); // 6.2%
  const [ficaMedRate] = useState(0.0145); // 1.45%
  const [medicalDeduction, setMedicalDeduction] = useState(75.00);
  const [retirementDeduction, setRetirementDeduction] = useState(120.00);

  // Calculated values
  const [calculations, setCalculations] = useState({
    regularGross: 0,
    overtimeGross: 0,
    totalGross: 0,
    fedTax: 0,
    stateTax: 0,
    ficaSs: 0,
    ficaMed: 0,
    totalTaxes: 0,
    totalDeductions: 0,
    netPay: 0,
    
    // YTD equivalents
    ytdRegularGross: 0,
    ytdOvertimeGross: 0,
    ytdTotalGross: 0,
    ytdFedTax: 0,
    ytdStateTax: 0,
    ytdFicaSs: 0,
    ytdFicaMed: 0,
    ytdMedical: 0,
    ytdRetirement: 0,
    ytdNetPay: 0
  });

  // Listen for loaded document data
  useEffect(() => {
    if (loadedDoc && loadedDoc.type === 'pay-stub-gen') {
      const d = loadedDoc.data;
      setCompanyName(d.companyName || '');
      setCompanyAddress(d.companyAddress || '');
      setEmployeeName(d.employeeName || '');
      setEmployeeId(d.employeeId || '');
      setEmployeeAddress(d.employeeAddress || '');
      setSsn(d.ssn || '');
      setStartDate(d.startDate || '');
      setEndDate(d.endDate || '');
      setPayDate(d.payDate || '');
      setPayFrequency(d.payFrequency || 'semimonthly');
      setPayPeriodNumber(d.payPeriodNumber || 1);
      setHourlyRate(d.hourlyRate || 0);
      setRegularHours(d.regularHours || 0);
      setOvertimeRateMult(d.overtimeRateMult || 1.5);
      setOvertimeHours(d.overtimeHours || 0);
      setFedTaxRate(d.fedTaxRate || 0);
      setStateTaxRate(d.stateTaxRate || 0);
      setMedicalDeduction(d.medicalDeduction || 0);
      setRetirementDeduction(d.retirementDeduction || 0);
      
      clearLoadedDoc();
    }
  }, [loadedDoc]);

  useEffect(() => {
    const regGross = hourlyRate * regularHours;
    const otRate = hourlyRate * overtimeRateMult;
    const otGross = overtimeHours * otRate;
    const totGross = regGross + otGross;

    const fed = totGross * fedTaxRate;
    const state = totGross * stateTaxRate;
    const ss = totGross * ficaSsRate;
    const med = totGross * ficaMedRate;
    
    const taxes = fed + state + ss + med;
    const deductions = medicalDeduction + retirementDeduction;
    const net = totGross - taxes - deductions;

    // Estimate Year to Date values based on period number
    const mult = payPeriodNumber;
    const ytdReg = regGross * mult;
    const ytdOt = otGross * mult;
    const ytdTot = totGross * mult;
    const ytdFed = fed * mult;
    const ytdState = state * mult;
    const ytdSs = ss * mult;
    const ytdMed = med * mult;
    const ytdMedDed = medicalDeduction * mult;
    const ytdRetDed = retirementDeduction * mult;
    const ytdNet = net * mult;

    setCalculations({
      regularGross: regGross,
      overtimeGross: otGross,
      totalGross: totGross,
      fedTax: fed,
      stateTax: state,
      ficaSs: ss,
      ficaMed: med,
      totalTaxes: taxes,
      totalDeductions: deductions,
      netPay: net,
      
      ytdRegularGross: ytdReg,
      ytdOvertimeGross: ytdOt,
      ytdTotalGross: ytdTot,
      ytdFedTax: ytdFed,
      ytdStateTax: ytdState,
      ytdFicaSs: ytdSs,
      ytdFicaMed: ytdMed,
      ytdMedical: ytdMedDed,
      ytdRetirement: ytdRetDed,
      ytdNetPay: ytdNet
    });
  }, [
    hourlyRate, regularHours, overtimeRateMult, overtimeHours,
    fedTaxRate, stateTaxRate, medicalDeduction, retirementDeduction,
    payPeriodNumber
  ]);

  const autofillPeriodNumber = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const diffTime = Math.abs(date.getTime() - startOfYear.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let period = 1;
      if (payFrequency === 'semimonthly') {
        // 24 periods per year. roughly 2 per month
        const month = date.getMonth();
        const day = date.getDate();
        period = (month * 2) + (day > 15 ? 2 : 1);
      } else if (payFrequency === 'biweekly') {
        // 26 periods per year
        period = Math.ceil(diffDays / 14);
      } else {
        // 12 periods per year
        period = date.getMonth() + 1;
      }
      
      setPayPeriodNumber(Math.min(period, 52));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    autofillPeriodNumber(endDate);
  }, [endDate, payFrequency]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const handleSave = () => {
    if (!currentUser) return;
    const defaultName = `Pay Stub - ${employeeName} - Period #${payPeriodNumber} (${payDate})`;
    const docName = prompt('Enter a name for this saved pay stub:', defaultName);
    if (docName === null) return;
    
    const finalName = docName.trim() || defaultName;
    saveDoc('pay-stub-gen', finalName, {
      companyName,
      companyAddress,
      employeeName,
      employeeId,
      employeeAddress,
      ssn,
      startDate,
      endDate,
      payDate,
      payFrequency,
      payPeriodNumber,
      hourlyRate,
      regularHours,
      overtimeRateMult,
      overtimeHours,
      fedTaxRate,
      stateTaxRate,
      medicalDeduction,
      retirementDeduction
    });
    alert('Pay stub saved to your dashboard!');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="no-print-grid">
      {/* Editor Panel */}
      <div className="glass-card form-container">
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }} className="title-gradient">Stub Configuration</h2>

        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Employer Details</h3>
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input className="input-field" value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Company Address</label>
          <input className="input-field" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
        </div>

        <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Employee Details</h3>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Employee Name</label>
            <input className="input-field" value={employeeName} onChange={e => setEmployeeName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Employee ID</label>
            <input className="input-field" value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="input-field" value={employeeAddress} onChange={e => setEmployeeAddress(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">SSN (Masked/Last 4)</label>
            <input className="input-field" value={ssn} onChange={e => setSsn(e.target.value)} />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Pay Cycle</h3>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select className="input-field" value={payFrequency} onChange={e => setPayFrequency(e.target.value as any)}>
              <option value="semimonthly">Semi-Monthly (24/yr)</option>
              <option value="biweekly">Bi-Weekly (26/yr)</option>
              <option value="monthly">Monthly (12/yr)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Pay Period Number (YTD)</label>
            <input className="input-field" type="number" min="1" max="52" value={payPeriodNumber} onChange={e => setPayPeriodNumber(parseInt(e.target.value) || 1)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="input-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="input-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pay Date</label>
            <input className="input-field" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Earnings Parameters</h3>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Hourly Rate ($)</label>
            <input className="input-field" type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Regular Hours</label>
            <input className="input-field" type="number" step="0.1" value={regularHours} onChange={e => setRegularHours(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Overtime Hours</label>
            <input className="input-field" type="number" step="0.1" value={overtimeHours} onChange={e => setOvertimeHours(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">OT Multiplier</label>
            <input className="input-field" type="number" step="0.1" value={overtimeRateMult} onChange={e => setOvertimeRateMult(parseFloat(e.target.value) || 1.5)} />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Tax & Deduction Rules</h3>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Federal Tax (%)</label>
            <input className="input-field" type="number" step="1" value={fedTaxRate * 100} onChange={e => setFedTaxRate((parseFloat(e.target.value) || 0) / 100)} />
          </div>
          <div className="form-group">
            <label className="form-label">State Tax (%)</label>
            <input className="input-field" type="number" step="1" value={stateTaxRate * 100} onChange={e => setStateTaxRate((parseFloat(e.target.value) || 0) / 100)} />
          </div>
        </div>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Medical Deduction ($)</label>
            <input className="input-field" type="number" step="0.01" value={medicalDeduction} onChange={e => setMedicalDeduction(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">401k/Retirement ($)</label>
            <input className="input-field" type="number" step="0.01" value={retirementDeduction} onChange={e => setRetirementDeduction(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          {currentUser && (
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleSave}>
              <FolderHeart size={16} style={{ color: 'var(--accent-solid)' }} /> Save to Dashboard
            </button>
          )}
          <button className="btn btn-primary" style={{ flex: currentUser ? 1 : '100%' }} onClick={() => window.print()}>
            <Printer size={16} /> Print Pay Stub
          </button>
        </div>
      </div>

      {/* PDF Paycheck Preview Pane */}
      <div className="print-preview-pane-container" style={{ position: 'sticky', top: '2rem', alignSelf: 'start' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }} className="no-print title-gradient">Stub PDF Preview</h2>

        <div className="print-preview-pane" style={{
          background: '#ffffff',
          color: '#000000',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          fontFamily: 'Courier New, Courier, monospace',
          fontSize: '11px',
          minHeight: '600px',
          overflowY: 'auto',
          lineHeight: '1.2',
          border: '2px solid #555'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed #000', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div>
              <strong style={{ fontSize: '13px' }}>{companyName}</strong>
              <p style={{ margin: '3px 0 0', fontSize: '9px', textTransform: 'uppercase' }}>{companyAddress}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>STATEMENT OF EARNINGS</strong>
              <p style={{ margin: '3px 0 0' }}>Pay Date: {payDate}</p>
            </div>
          </div>

          {/* Employee and Cycle Meta */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', borderBottom: '1px solid #000' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', width: '50%' }}>
                  <strong>Employee:</strong> {employeeName}<br />
                  <strong>Address:</strong> {employeeAddress}<br />
                  <strong>SSN:</strong> {ssn}
                </td>
                <td style={{ padding: '4px 0', verticalAlign: 'top' }}>
                  <strong>Employee ID:</strong> {employeeId}<br />
                  <strong>Period Start:</strong> {startDate}<br />
                  <strong>Period End:</strong> {endDate}<br />
                  <strong>Pay Frequency:</strong> {payFrequency.toUpperCase()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Earnings Breakdown */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', textAlign: 'left', fontWeight: 'bold' }}>
                <th style={{ padding: '4px 0' }}>EARNINGS TYPE</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>RATE</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>HOURS</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>CURRENT</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>YTD AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '4px 0' }}>Regular Pay</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(hourlyRate)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{regularHours.toFixed(2)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.regularGross)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdRegularGross)}</td>
              </tr>
              {overtimeHours > 0 && (
                <tr style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '4px 0' }}>Overtime Pay</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(hourlyRate * overtimeRateMult)}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{overtimeHours.toFixed(2)}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.overtimeGross)}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdOvertimeGross)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #000', fontWeight: 'bold' }}>
                <td style={{ padding: '6px 0' }}>Gross Earnings</td>
                <td></td>
                <td></td>
                <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(calculations.totalGross)}</td>
                <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdTotalGross)}</td>
              </tr>
            </tbody>
          </table>

          {/* Taxes & Deductions */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', textAlign: 'left', fontWeight: 'bold' }}>
                <th style={{ padding: '4px 0' }}>TAXES & DEDUCTIONS</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>CURRENT</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>YTD AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '4px 0' }}>Federal Income Tax</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.fedTax)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdFedTax)}</td>
              </tr>
              <tr style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '4px 0' }}>State Income Tax</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.stateTax)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdStateTax)}</td>
              </tr>
              <tr style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '4px 0' }}>Social Security (FICA)</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ficaSs)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdFicaSs)}</td>
              </tr>
              <tr style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '4px 0' }}>Medicare (FICA)</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ficaMed)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdFicaMed)}</td>
              </tr>
              {medicalDeduction > 0 && (
                <tr style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '4px 0' }}>Medical Insurance</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(medicalDeduction)}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdMedical)}</td>
                </tr>
              )}
              {retirementDeduction > 0 && (
                <tr style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '4px 0' }}>401k Plan</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(retirementDeduction)}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdRetirement)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #000', fontWeight: 'bold' }}>
                <td style={{ padding: '6px 0' }}>Total Deductions & Taxes</td>
                <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(calculations.totalTaxes + calculations.totalDeductions)}</td>
                <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(calculations.ytdFedTax + calculations.ytdStateTax + calculations.ytdFicaSs + calculations.ytdFicaMed + calculations.ytdMedical + calculations.ytdRetirement)}</td>
              </tr>
            </tbody>
          </table>

          {/* Paycheck Summary Box */}
          <div style={{ border: '2px solid #000', padding: '1rem', display: 'flex', justifyContent: 'space-around', background: '#f5f5f5', fontWeight: 'bold', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px' }}>GROSS PAY</div>
              <div style={{ fontSize: '13px' }}>{formatCurrency(calculations.totalGross)}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '18px', display: 'flex', alignItems: 'center' }}>-</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px' }}>TAXES & DED</div>
              <div style={{ fontSize: '13px' }}>{formatCurrency(calculations.totalTaxes + calculations.totalDeductions)}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '18px', display: 'flex', alignItems: 'center' }}>=</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px' }}>NET PAY</div>
              <div style={{ fontSize: '15px', textDecoration: 'underline' }}>{formatCurrency(calculations.netPay)}</div>
            </div>
          </div>

          {/* Sub-check mockup footer */}
          <div style={{ borderTop: '2px dashed #000', paddingTop: '1.5rem', marginTop: '3rem', textAlign: 'center', color: '#666', fontSize: '9px' }}>
            <span>DETACH HERE AND RETAIN FOR YOUR RECORDS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
