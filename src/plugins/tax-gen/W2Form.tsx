import React from 'react';
import type { W2Data } from './types';
import './W2Form.css';

interface W2FormProps {
  data: W2Data;
  copyLabel?: string;
}

const fmt = (n: number): string => {
  if (n === 0) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const W2Form: React.FC<W2FormProps> = ({ data, copyLabel = 'Copy B — To Be Filed With Employee\'s FEDERAL Tax Return.' }) => {
  return (
    <div className="w2-page">
      <div className="w2-form">
        <div className="w2-grid">
          {/* Row 1 */}
          <div className="w2-row w2-row-1">
            <div className="w2-cell w2-cell-a">
              <span className="w2-label">a Employee's social security number</span>
              <span className="w2-value w2-ssn">{data.employeeSSN}</span>
            </div>
            <div className="w2-cell w2-cell-omb">
              <span className="w2-label-small">OMB No. 1545-0008</span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="w2-row w2-row-2">
            <div className="w2-cell w2-cell-b">
              <span className="w2-label">b Employer identification number (EIN)</span>
              <span className="w2-value">{data.employerEIN}</span>
            </div>
            <div className="w2-cell w2-cell-1">
              <span className="w2-label">1 Wages, tips, other compensation</span>
              <span className="w2-value w2-amount">{fmt(data.box1_wagesTips)}</span>
            </div>
            <div className="w2-cell w2-cell-2">
              <span className="w2-label">2 Federal income tax withheld</span>
              <span className="w2-value w2-amount">{fmt(data.box2_federalTaxWithheld)}</span>
            </div>
          </div>

          {/* Row 3 */}
          <div className="w2-row w2-row-3">
            <div className="w2-cell w2-cell-c">
              <span className="w2-label">c Employer's name, address, and ZIP code</span>
              <span className="w2-value w2-employer-name">{data.employerName}</span>
              <span className="w2-value w2-employer-addr">{data.employerAddress}</span>
              <span className="w2-value w2-employer-city">{data.employerCity}, {data.employerState} {data.employerZip}</span>
            </div>
            <div className="w2-cell w2-cell-3">
              <span className="w2-label">3 Social security wages</span>
              <span className="w2-value w2-amount">{fmt(data.box3_socialSecurityWages)}</span>
            </div>
            <div className="w2-cell w2-cell-4">
              <span className="w2-label">4 Social security tax withheld</span>
              <span className="w2-value w2-amount">{fmt(data.box4_socialSecurityTax)}</span>
            </div>
          </div>

          {/* Row 4 */}
          <div className="w2-row w2-row-4">
            <div className="w2-cell w2-cell-c2" style={{ borderTop: 'none' }}>
              {/* continuation of box c */}
            </div>
            <div className="w2-cell w2-cell-5">
              <span className="w2-label">5 Medicare wages and tips</span>
              <span className="w2-value w2-amount">{fmt(data.box5_medicareWages)}</span>
            </div>
            <div className="w2-cell w2-cell-6">
              <span className="w2-label">6 Medicare tax withheld</span>
              <span className="w2-value w2-amount">{fmt(data.box6_medicareTax)}</span>
            </div>
          </div>

          {/* Row 5 */}
          <div className="w2-row w2-row-5">
            <div className="w2-cell w2-cell-d">
              <span className="w2-label">d Control number</span>
              <span className="w2-value">{data.controlNumber}</span>
            </div>
            <div className="w2-cell w2-cell-7">
              <span className="w2-label">7 Social security tips</span>
              <span className="w2-value w2-amount">{fmt(data.box7_socialSecurityTips)}</span>
            </div>
            <div className="w2-cell w2-cell-8">
              <span className="w2-label">8 Allocated tips</span>
              <span className="w2-value w2-amount">{fmt(data.box8_allocatedTips)}</span>
            </div>
          </div>

          {/* Row 6 */}
          <div className="w2-row w2-row-6">
            <div className="w2-cell w2-cell-e">
              <span className="w2-label">e Employee's first name and initial</span>
              <span className="w2-value">{data.employeeFirstName} {data.employeeMiddleInit}</span>
              <span className="w2-label w2-label-last-name">Last name</span>
              <span className="w2-value">{data.employeeLastName}{data.employeeSuffix ? ` ${data.employeeSuffix}` : ''}</span>
              <span className="w2-label w2-label-suff">Suff.</span>
            </div>
            <div className="w2-cell w2-cell-9">
              <span className="w2-label">9</span>
              <span className="w2-value w2-amount"></span>
            </div>
            <div className="w2-cell w2-cell-10">
              <span className="w2-label">10 Dependent care benefits</span>
              <span className="w2-value w2-amount">{fmt(data.box10_dependentCareBenefits)}</span>
            </div>
          </div>

          {/* Row 7 */}
          <div className="w2-row w2-row-7">
            <div className="w2-cell w2-cell-f">
              <span className="w2-label">f Employee's address and ZIP code</span>
              <span className="w2-value">{data.employeeAddress}</span>
              <span className="w2-value">{data.employeeCity}, {data.employeeState} {data.employeeZip}</span>
            </div>
            <div className="w2-cell w2-cell-11">
              <span className="w2-label">11 Nonqualified plans</span>
              <span className="w2-value w2-amount">{fmt(data.box11_nonqualifiedPlans)}</span>
            </div>
            <div className="w2-cell w2-cell-12a">
              <span className="w2-label">12a <span className="w2-see-instr">See instructions for box 12</span></span>
              <div className="w2-box12-row">
                <div className="w2-box12-code">
                  <span className="w2-label-tiny">C<br/>o<br/>d<br/>e</span>
                  <span className="w2-value w2-code-val">{data.box12a_code}</span>
                </div>
                <span className="w2-value w2-amount">{fmt(data.box12a_amount)}</span>
              </div>
            </div>
          </div>

          {/* Row 8 */}
          <div className="w2-row w2-row-8">
            <div className="w2-cell w2-cell-f2" style={{ borderTop: 'none' }}>
            </div>
            <div className="w2-cell w2-cell-13">
              <span className="w2-label">13</span>
              <div className="w2-checkboxes">
                <label><input type="checkbox" checked={data.box13_statutory} readOnly /> Statutory employee</label>
                <label><input type="checkbox" checked={data.box13_retirement} readOnly /> Retirement plan</label>
                <label><input type="checkbox" checked={data.box13_thirdPartySick} readOnly /> Third-party sick pay</label>
              </div>
            </div>
            <div className="w2-cell w2-cell-12b">
              <span className="w2-label">12b</span>
              <div className="w2-box12-row">
                <div className="w2-box12-code">
                  <span className="w2-label-tiny">C<br/>o<br/>d<br/>e</span>
                  <span className="w2-value w2-code-val">{data.box12b_code}</span>
                </div>
                <span className="w2-value w2-amount">{fmt(data.box12b_amount)}</span>
              </div>
            </div>
          </div>

          {/* Row 9 */}
          <div className="w2-row w2-row-9">
            <div className="w2-cell w2-cell-f3" style={{ borderTop: 'none' }}>
            </div>
            <div className="w2-cell w2-cell-14">
              <span className="w2-label">14 Other</span>
              <span className="w2-value">{data.box14_other}</span>
            </div>
            <div className="w2-cell w2-cell-12c">
              <span className="w2-label">12c</span>
              <div className="w2-box12-row">
                <div className="w2-box12-code">
                  <span className="w2-label-tiny">C<br/>o<br/>d<br/>e</span>
                  <span className="w2-value w2-code-val">{data.box12c_code}</span>
                </div>
                <span className="w2-value w2-amount">{fmt(data.box12c_amount)}</span>
              </div>
            </div>
          </div>

          {/* Row 10 */}
          <div className="w2-row w2-row-10">
            <div className="w2-cell w2-cell-f4" style={{ borderTop: 'none' }}>
            </div>
            <div className="w2-cell w2-cell-14b" style={{ borderTop: 'none' }}>
            </div>
            <div className="w2-cell w2-cell-12d">
              <span className="w2-label">12d</span>
              <div className="w2-box12-row">
                <div className="w2-box12-code">
                  <span className="w2-label-tiny">C<br/>o<br/>d<br/>e</span>
                  <span className="w2-value w2-code-val">{data.box12d_code}</span>
                </div>
                <span className="w2-value w2-amount">{fmt(data.box12d_amount)}</span>
              </div>
            </div>
          </div>

          {/* State/Local - Row 11 */}
          <div className="w2-row w2-row-state">
            <div className="w2-cell w2-cell-15">
              <span className="w2-label">15 State</span>
              <div className="w2-state-row">
                <span className="w2-value w2-state-code">{data.box15_stateCode}</span>
                <div className="w2-state-id">
                  <span className="w2-label-tiny">Employer's state ID number</span>
                  <span className="w2-value">{data.box15_stateID}</span>
                </div>
              </div>
            </div>
            <div className="w2-cell w2-cell-16">
              <span className="w2-label">16 State wages, tips, etc.</span>
              <span className="w2-value w2-amount">{fmt(data.box16_stateWages)}</span>
            </div>
            <div className="w2-cell w2-cell-17">
              <span className="w2-label">17 State income tax</span>
              <span className="w2-value w2-amount">{fmt(data.box17_stateTax)}</span>
            </div>
            <div className="w2-cell w2-cell-18">
              <span className="w2-label">18 Local wages, tips, etc.</span>
              <span className="w2-value w2-amount">{fmt(data.box18_localWages)}</span>
            </div>
            <div className="w2-cell w2-cell-19">
              <span className="w2-label">19 Local income tax</span>
              <span className="w2-value w2-amount">{fmt(data.box19_localTax)}</span>
            </div>
            <div className="w2-cell w2-cell-20">
              <span className="w2-label">20 Locality name</span>
              <span className="w2-value">{data.box20_localityName}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w2-footer">
          <div className="w2-form-title">
            <span className="w2-form-name">Form</span>
            <span className="w2-form-number">W-2</span>
            <span className="w2-form-desc">Wage and Tax Statement</span>
          </div>
          <div className="w2-form-year">
            <span className="w2-year">{data.taxYear}</span>
          </div>
          <div className="w2-copy-label">
            <span>{copyLabel}</span>
          </div>
          <div className="w2-dept">
            <span>Department of the Treasury—Internal Revenue Service</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default W2Form;
