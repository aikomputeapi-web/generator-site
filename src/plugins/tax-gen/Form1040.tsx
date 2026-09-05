import React from 'react';
import type { Form1040Data } from './types';
import './Form1040.css';

interface Form1040Props {
  data: Form1040Data;
}

const fmt = (n: number): string => {
  if (n === 0) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const fmtDec = (n: number): string => {
  if (n === 0) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Form1040: React.FC<Form1040Props> = ({ data }) => {
  return (
    <div className="f1040-document">
      {/* PAGE 1 */}
      <div className="f1040-page f1040-page-1">
        {/* Header */}
        <div className="f1040-header">
          <div className="f1040-header-left">
            <div className="f1040-dept">Department of the Treasury—Internal Revenue Service</div>
            <div className="f1040-form-title-row">
              <span className="f1040-form-label">Form</span>
              <span className="f1040-form-number">1040</span>
            </div>
            <div className="f1040-form-subtitle">U.S. Individual Income Tax Return</div>
          </div>
          <div className="f1040-header-center">
            <div className="f1040-tax-year">{data.taxYear || '2024'}</div>
            <div className="f1040-omb">OMB No. 1545-0074</div>
            <div className="f1040-irs-use">IRS Use Only—Do not write or staple in this space.</div>
          </div>
        </div>

        {/* Filing Status */}
        <div className="f1040-section f1040-filing-status">
          <div className="f1040-section-label">Filing Status</div>
          <div className="f1040-status-options">
            <label className="f1040-radio-label">
              <input type="radio" name="status" checked={data.filingStatus === 'single'} readOnly />
              Single
            </label>
            <label className="f1040-radio-label">
              <input type="radio" name="status" checked={data.filingStatus === 'married_joint'} readOnly />
              Married filing jointly
            </label>
            <label className="f1040-radio-label">
              <input type="radio" name="status" checked={data.filingStatus === 'married_separate'} readOnly />
              Married filing separately (MFS)
            </label>
            <label className="f1040-radio-label">
              <input type="radio" name="status" checked={data.filingStatus === 'head_of_household'} readOnly />
              Head of household (HOH)
            </label>
            <label className="f1040-radio-label">
              <input type="radio" name="status" checked={data.filingStatus === 'qualifying_widow'} readOnly />
              Qualifying surviving spouse (QSS)
            </label>
          </div>
        </div>

        {/* Personal Info */}
        <div className="f1040-section f1040-personal-info">
          <div className="f1040-info-row">
            <div className="f1040-field f1040-field-name">
              <span className="f1040-field-label">Your first name and middle initial</span>
              <span className="f1040-field-value">{data.firstName}</span>
            </div>
            <div className="f1040-field f1040-field-lastname">
              <span className="f1040-field-label">Last name</span>
              <span className="f1040-field-value">{data.lastName}</span>
            </div>
            <div className="f1040-field f1040-field-ssn">
              <span className="f1040-field-label">Your social security number</span>
              <span className="f1040-field-value">{data.ssn}</span>
            </div>
          </div>
          <div className="f1040-info-row">
            <div className="f1040-field f1040-field-name">
              <span className="f1040-field-label">If joint return, spouse's first name and middle initial</span>
              <span className="f1040-field-value">{data.spouseFirstName}</span>
            </div>
            <div className="f1040-field f1040-field-lastname">
              <span className="f1040-field-label">Last name</span>
              <span className="f1040-field-value">{data.spouseLastName}</span>
            </div>
            <div className="f1040-field f1040-field-ssn">
              <span className="f1040-field-label">Spouse's social security number</span>
              <span className="f1040-field-value">{data.spouseSSN}</span>
            </div>
          </div>
          <div className="f1040-info-row">
            <div className="f1040-field f1040-field-address">
              <span className="f1040-field-label">Home address (number and street). If you have a P.O. box, see instructions.</span>
              <span className="f1040-field-value">{data.address}</span>
            </div>
            <div className="f1040-field f1040-field-apt">
              <span className="f1040-field-label">Apt. no.</span>
              <span className="f1040-field-value">{data.aptNo}</span>
            </div>
          </div>
          <div className="f1040-info-row">
            <div className="f1040-field f1040-field-city">
              <span className="f1040-field-label">City, town, or post office. If you have a foreign address, also complete spaces below.</span>
              <span className="f1040-field-value">{data.city}</span>
            </div>
            <div className="f1040-field f1040-field-state">
              <span className="f1040-field-label">State</span>
              <span className="f1040-field-value">{data.state}</span>
            </div>
            <div className="f1040-field f1040-field-zip">
              <span className="f1040-field-label">ZIP code</span>
              <span className="f1040-field-value">{data.zip}</span>
            </div>
          </div>
          <div className="f1040-info-row">
            <div className="f1040-field f1040-field-foreign">
              <span className="f1040-field-label">Foreign country name</span>
              <span className="f1040-field-value">{data.foreignCountry}</span>
            </div>
            <div className="f1040-field f1040-field-province">
              <span className="f1040-field-label">Foreign province/state/county</span>
              <span className="f1040-field-value">{data.foreignProvince}</span>
            </div>
            <div className="f1040-field f1040-field-fzip">
              <span className="f1040-field-label">Foreign postal code</span>
              <span className="f1040-field-value">{data.foreignPostalCode}</span>
            </div>
          </div>
        </div>

        {/* Digital Assets */}
        <div className="f1040-section f1040-digital-assets">
          <div className="f1040-da-question">
            At any time during {data.taxYear || '2024'}, did you: (a) receive (as a reward, award, or payment for property or services); or (b) sell, exchange, gift, or 
            otherwise dispose of a digital asset (or a financial interest in a digital asset)? (See instructions.)
          </div>
          <div className="f1040-da-options">
            <label><input type="radio" name="da" checked={data.digitalAssets === 'yes'} readOnly /> Yes</label>
            <label><input type="radio" name="da" checked={data.digitalAssets === 'no'} readOnly /> No</label>
          </div>
        </div>

        {/* Standard Deduction */}
        <div className="f1040-section f1040-std-deduction">
          <div className="f1040-section-label">Standard Deduction</div>
          <div className="f1040-sd-checks">
            <label><input type="checkbox" checked={data.youStandardDeduction} readOnly /> You as a dependent</label>
            <label><input type="checkbox" checked={data.youBorn1960} readOnly /> You were born before January 2, 1960</label>
            <label><input type="checkbox" checked={data.youBlind} readOnly /> You are blind</label>
            <label><input type="checkbox" checked={data.spouseStandardDeduction} readOnly /> Spouse as a dependent</label>
            <label><input type="checkbox" checked={data.spouseBorn1960} readOnly /> Spouse was born before January 2, 1960</label>
            <label><input type="checkbox" checked={data.spouseBlind} readOnly /> Spouse is blind</label>
          </div>
        </div>

        {/* Dependents */}
        {data.dependents.length > 0 && (
          <div className="f1040-section f1040-dependents">
            <div className="f1040-section-label">Dependents (see instructions)</div>
            <table className="f1040-dep-table">
              <thead>
                <tr>
                  <th>First name, Last name</th>
                  <th>Social security number</th>
                  <th>Relationship to you</th>
                  <th>✓ Child tax credit</th>
                  <th>✓ Credit for other dependents</th>
                </tr>
              </thead>
              <tbody>
                {data.dependents.map((dep, i) => (
                  <tr key={i}>
                    <td>{dep.firstName} {dep.lastName}</td>
                    <td>{dep.ssn}</td>
                    <td>{dep.relationship}</td>
                    <td className="f1040-dep-check">{dep.childTaxCredit ? '✓' : ''}</td>
                    <td className="f1040-dep-check">{dep.otherDependentCredit ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Income */}
        <div className="f1040-section f1040-income">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Income</span>
            <span className="f1040-attach-note">Attach Form(s) W-2 here. Also attach Forms W-2G and 1099-R if tax was withheld.</span>
          </div>

          <div className="f1040-line-group">
            <div className="f1040-line">
              <span className="f1040-line-num">1a</span>
              <span className="f1040-line-desc">Wages, salaries, tips, etc. Attach Form(s) W-2</span>
              <span className="f1040-line-amount">{fmt(data.line1a)}</span>
              <span className="f1040-line-ref">1a</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">b</span>
              <span className="f1040-line-desc">Household employee income. Not reported on Form(s) W-2</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1b)}</span>
              <span className="f1040-line-ref">1b</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">c</span>
              <span className="f1040-line-desc">Tip income not on line 1a</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1c)}</span>
              <span className="f1040-line-ref">1c</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">d</span>
              <span className="f1040-line-desc">Medicaid waiver payments not included in income</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1d)}</span>
              <span className="f1040-line-ref">1d</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">e</span>
              <span className="f1040-line-desc">Taxable dependent care benefits from Form 2441, line 26</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1e)}</span>
              <span className="f1040-line-ref">1e</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">f</span>
              <span className="f1040-line-desc">Employer-provided adoption benefits from Form 8839, line 29</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1f)}</span>
              <span className="f1040-line-ref">1f</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">g</span>
              <span className="f1040-line-desc">Wages from Form 8919, line 6</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1g)}</span>
              <span className="f1040-line-ref">1g</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">h</span>
              <span className="f1040-line-desc">Strike benefits</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1h)}</span>
              <span className="f1040-line-ref">1h</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">i</span>
              <span className="f1040-line-desc">Stock option(s) income reported on Form(s) W-2</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line1i)}</span>
              <span className="f1040-line-ref">1i</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">z</span>
              <span className="f1040-line-desc">Add lines 1a through 1i</span>
              <span className="f1040-line-amount">{fmt(data.line1z)}</span>
              <span className="f1040-line-ref">1z</span>
            </div>
          </div>

          <div className="f1040-line-group">
            <div className="f1040-line">
              <span className="f1040-line-num">2a</span>
              <span className="f1040-line-desc">Tax-exempt interest</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line2a)}</span>
              <span className="f1040-line-ref">2a</span>
              <span className="f1040-line-num f1040-inline-num">b</span>
              <span className="f1040-line-desc f1040-inline-desc">Taxable interest</span>
              <span className="f1040-line-amount">{fmt(data.line2b)}</span>
              <span className="f1040-line-ref">2b</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">3a</span>
              <span className="f1040-line-desc">Qualified dividends</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line3a)}</span>
              <span className="f1040-line-ref">3a</span>
              <span className="f1040-line-num f1040-inline-num">b</span>
              <span className="f1040-line-desc f1040-inline-desc">Ordinary dividends</span>
              <span className="f1040-line-amount">{fmt(data.line3b)}</span>
              <span className="f1040-line-ref">3b</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">4a</span>
              <span className="f1040-line-desc">IRA distributions</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line4a)}</span>
              <span className="f1040-line-ref">4a</span>
              <span className="f1040-line-num f1040-inline-num">b</span>
              <span className="f1040-line-desc f1040-inline-desc">Taxable amount</span>
              <span className="f1040-line-amount">{fmt(data.line4b)}</span>
              <span className="f1040-line-ref">4b</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">5a</span>
              <span className="f1040-line-desc">Pensions and annuities</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line5a)}</span>
              <span className="f1040-line-ref">5a</span>
              <span className="f1040-line-num f1040-inline-num">b</span>
              <span className="f1040-line-desc f1040-inline-desc">Taxable amount</span>
              <span className="f1040-line-amount">{fmt(data.line5b)}</span>
              <span className="f1040-line-ref">5b</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">6a</span>
              <span className="f1040-line-desc">Social security benefits</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line6a)}</span>
              <span className="f1040-line-ref">6a</span>
              <span className="f1040-line-num f1040-inline-num">b</span>
              <span className="f1040-line-desc f1040-inline-desc">Taxable amount</span>
              <span className="f1040-line-amount">{fmt(data.line6b)}</span>
              <span className="f1040-line-ref">6b</span>
            </div>
          </div>

          <div className="f1040-line-group">
            <div className="f1040-line">
              <span className="f1040-line-num">7</span>
              <span className="f1040-line-desc">Capital gain or (loss). Attach Schedule D if required</span>
              <span className="f1040-line-amount">{fmt(data.line7)}</span>
              <span className="f1040-line-ref">7</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">8</span>
              <span className="f1040-line-desc">Other income from Schedule 1, line 10</span>
              <span className="f1040-line-amount">{fmt(data.line8)}</span>
              <span className="f1040-line-ref">8</span>
            </div>
            <div className="f1040-line f1040-line-total">
              <span className="f1040-line-num">9</span>
              <span className="f1040-line-desc"><strong>Total income.</strong> Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7, and 8</span>
              <span className="f1040-line-amount f1040-total-amount">{fmt(data.line9)}</span>
              <span className="f1040-line-ref">9</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">10</span>
              <span className="f1040-line-desc">Adjustments to income from Schedule 1, line 26</span>
              <span className="f1040-line-amount">{fmt(data.line10)}</span>
              <span className="f1040-line-ref">10</span>
            </div>
            <div className="f1040-line f1040-line-total">
              <span className="f1040-line-num">11</span>
              <span className="f1040-line-desc"><strong>Adjusted gross income.</strong> Subtract line 10 from line 9</span>
              <span className="f1040-line-amount f1040-total-amount">{fmt(data.line11)}</span>
              <span className="f1040-line-ref">11</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">12</span>
              <span className="f1040-line-desc">Standard deduction or itemized deductions (from Schedule A)</span>
              <span className="f1040-line-amount">{fmt(data.line12)}</span>
              <span className="f1040-line-ref">12</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">13</span>
              <span className="f1040-line-desc">Qualified business income deduction from Form 8995 or Form 8995-A</span>
              <span className="f1040-line-amount">{fmt(data.line13)}</span>
              <span className="f1040-line-ref">13</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">14</span>
              <span className="f1040-line-desc">Add lines 12 and 13</span>
              <span className="f1040-line-amount">{fmt(data.line14)}</span>
              <span className="f1040-line-ref">14</span>
            </div>
            <div className="f1040-line f1040-line-total">
              <span className="f1040-line-num">15</span>
              <span className="f1040-line-desc"><strong>Taxable income.</strong> Subtract line 14 from line 11. If zero or less, enter -0-</span>
              <span className="f1040-line-amount f1040-total-amount">{fmt(data.line15)}</span>
              <span className="f1040-line-ref">15</span>
            </div>
          </div>
        </div>

        {/* Page 1 footer */}
        <div className="f1040-page-footer">
          <div className="f1040-pf-left">
            For Disclosure, Privacy Act, and Paperwork Reduction Act Notice, see separate instructions.
          </div>
          <div className="f1040-pf-cat">Cat. No. 11320B</div>
          <div className="f1040-pf-right">
            Form <strong>1040</strong> ({data.taxYear || '2024'})
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="f1040-page f1040-page-2">
        <div className="f1040-page2-header">
          <span>Form 1040 ({data.taxYear || '2024'})</span>
          <span className="f1040-page2-right">Page <strong>2</strong></span>
        </div>

        {/* Tax and Credits */}
        <div className="f1040-section f1040-tax-credits">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Tax and Credits</span>
          </div>
          <div className="f1040-line-group">
            <div className="f1040-line">
              <span className="f1040-line-num">16</span>
              <span className="f1040-line-desc"><strong>Tax</strong> (see instructions). Check if any from Form(s): 8814 ☐ 4972 ☐ other ☐</span>
              <span className="f1040-line-amount">{fmt(data.line16)}</span>
              <span className="f1040-line-ref">16</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">17</span>
              <span className="f1040-line-desc">Amount from Schedule 2, Part I, line 4</span>
              <span className="f1040-line-amount">{fmt(data.line17)}</span>
              <span className="f1040-line-ref">17</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">18</span>
              <span className="f1040-line-desc">Add lines 16 and 17</span>
              <span className="f1040-line-amount">{fmt(data.line18)}</span>
              <span className="f1040-line-ref">18</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">19</span>
              <span className="f1040-line-desc">Child tax credit or credit for other dependents from Schedule 8812</span>
              <span className="f1040-line-amount">{fmt(data.line19)}</span>
              <span className="f1040-line-ref">19</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">20</span>
              <span className="f1040-line-desc">Amount from Schedule 3, line 8</span>
              <span className="f1040-line-amount">{fmt(data.line20)}</span>
              <span className="f1040-line-ref">20</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">21</span>
              <span className="f1040-line-desc">Add lines 19 and 20</span>
              <span className="f1040-line-amount">{fmt(data.line21)}</span>
              <span className="f1040-line-ref">21</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">22</span>
              <span className="f1040-line-desc">Subtract line 21 from line 18. If zero or less, enter -0-</span>
              <span className="f1040-line-amount">{fmt(data.line22)}</span>
              <span className="f1040-line-ref">22</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">23</span>
              <span className="f1040-line-desc">Other taxes, including self-employment tax, from Schedule 2, Part II, line 21</span>
              <span className="f1040-line-amount">{fmt(data.line23)}</span>
              <span className="f1040-line-ref">23</span>
            </div>
            <div className="f1040-line f1040-line-total">
              <span className="f1040-line-num">24</span>
              <span className="f1040-line-desc"><strong>Total tax.</strong> Add lines 22 and 23</span>
              <span className="f1040-line-amount f1040-total-amount">{fmt(data.line24)}</span>
              <span className="f1040-line-ref">24</span>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="f1040-section f1040-payments">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Payments</span>
          </div>
          <div className="f1040-line-group">
            <div className="f1040-line">
              <span className="f1040-line-num">25</span>
              <span className="f1040-line-desc">Federal income tax withheld from:</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">a</span>
              <span className="f1040-line-desc">Form(s) W-2</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line25a)}</span>
              <span className="f1040-line-ref">25a</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">b</span>
              <span className="f1040-line-desc">Form(s) 1099</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line25b)}</span>
              <span className="f1040-line-ref">25b</span>
            </div>
            <div className="f1040-line f1040-sub-line">
              <span className="f1040-line-num">c</span>
              <span className="f1040-line-desc">Other forms</span>
              <span className="f1040-line-amount f1040-sub-amount">{fmt(data.line25c)}</span>
              <span className="f1040-line-ref">25c</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">d</span>
              <span className="f1040-line-desc">Add lines 25a through 25c</span>
              <span className="f1040-line-amount">{fmt(data.line25d)}</span>
              <span className="f1040-line-ref">25d</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">26</span>
              <span className="f1040-line-desc">{data.taxYear || '2024'} estimated tax payments and amount applied from {parseInt(data.taxYear || '2024') - 1} return</span>
              <span className="f1040-line-amount">{fmt(data.line26)}</span>
              <span className="f1040-line-ref">26</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">27a</span>
              <span className="f1040-line-desc">Earned income credit (EIC)</span>
              <span className="f1040-line-amount">{fmt(data.line27a)}</span>
              <span className="f1040-line-ref">27a</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">28</span>
              <span className="f1040-line-desc">Additional child tax credit from Schedule 8812</span>
              <span className="f1040-line-amount">{fmt(data.line28)}</span>
              <span className="f1040-line-ref">28</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">29</span>
              <span className="f1040-line-desc">American opportunity credit from Form 8863, line 8</span>
              <span className="f1040-line-amount">{fmt(data.line29)}</span>
              <span className="f1040-line-ref">29</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">30</span>
              <span className="f1040-line-desc">Reserved for future use</span>
              <span className="f1040-line-amount">{fmt(data.line30)}</span>
              <span className="f1040-line-ref">30</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">31</span>
              <span className="f1040-line-desc">Amount from Schedule 3, line 15</span>
              <span className="f1040-line-amount">{fmt(data.line31)}</span>
              <span className="f1040-line-ref">31</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">32</span>
              <span className="f1040-line-desc">Add lines 27a, 28, 29, and 31</span>
              <span className="f1040-line-amount">{fmt(data.line32)}</span>
              <span className="f1040-line-ref">32</span>
            </div>
            <div className="f1040-line f1040-line-total">
              <span className="f1040-line-num">33</span>
              <span className="f1040-line-desc"><strong>Total payments.</strong> Add lines 25d, 26, and 32</span>
              <span className="f1040-line-amount f1040-total-amount">{fmt(data.line33)}</span>
              <span className="f1040-line-ref">33</span>
            </div>
          </div>
        </div>

        {/* Refund */}
        <div className="f1040-section f1040-refund">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Refund</span>
          </div>
          <div className="f1040-line-group">
            <div className="f1040-line">
              <span className="f1040-line-num">34</span>
              <span className="f1040-line-desc">If line 33 is more than line 24, subtract line 24 from line 33. This is the amount you <strong>overpaid</strong></span>
              <span className="f1040-line-amount">{fmt(data.line34)}</span>
              <span className="f1040-line-ref">34</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">35a</span>
              <span className="f1040-line-desc">Amount of line 34 you want <strong>refunded to you.</strong> If Form 8888 is attached, check here ☐</span>
              <span className="f1040-line-amount">{fmt(data.line35a)}</span>
              <span className="f1040-line-ref">35a</span>
            </div>
            <div className="f1040-line f1040-sub-line f1040-bank-info">
              <span className="f1040-line-num">b</span>
              <span className="f1040-line-desc">Routing number</span>
              <span className="f1040-line-value-inline">{data.line35b_routingNumber}</span>
              <span className="f1040-line-desc">▶ c Account type: </span>
              <label><input type="radio" name="acct" checked={data.line35b_accountType === 'checking'} readOnly /> Checking</label>
              <label><input type="radio" name="acct" checked={data.line35b_accountType === 'savings'} readOnly /> Savings</label>
            </div>
            <div className="f1040-line f1040-sub-line f1040-bank-info">
              <span className="f1040-line-num">d</span>
              <span className="f1040-line-desc">Account number</span>
              <span className="f1040-line-value-inline">{data.line35b_accountNumber}</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">36</span>
              <span className="f1040-line-desc">Amount of line 34 you want <strong>applied to your {parseInt(data.taxYear || '2024') + 1} estimated tax</strong></span>
              <span className="f1040-line-amount">{fmt(data.line36)}</span>
              <span className="f1040-line-ref">36</span>
            </div>
          </div>
        </div>

        {/* Amount You Owe */}
        <div className="f1040-section f1040-owe">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Amount You Owe</span>
          </div>
          <div className="f1040-line-group">
            <div className="f1040-line">
              <span className="f1040-line-num">37</span>
              <span className="f1040-line-desc">Subtract line 33 from line 24. This is the <strong>amount you owe.</strong></span>
              <span className="f1040-line-amount">{fmtDec(data.line37)}</span>
              <span className="f1040-line-ref">37</span>
            </div>
            <div className="f1040-line">
              <span className="f1040-line-num">38</span>
              <span className="f1040-line-desc">Estimated tax penalty (see instructions)</span>
              <span className="f1040-line-amount">{fmtDec(data.line38)}</span>
              <span className="f1040-line-ref">38</span>
            </div>
          </div>
        </div>

        {/* Third Party Designee */}
        <div className="f1040-section f1040-designee">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Third Party Designee</span>
          </div>
          <div className="f1040-designee-row">
            <span>Do you want to allow another person to discuss this return with the IRS? See instructions.</span>
            <label><input type="radio" name="designee" checked={data.thirdPartyDesignee === 'yes'} readOnly /> Yes. Complete below.</label>
            <label><input type="radio" name="designee" checked={data.thirdPartyDesignee === 'no'} readOnly /> No</label>
          </div>
          {data.thirdPartyDesignee === 'yes' && (
            <div className="f1040-designee-details">
              <div className="f1040-field">
                <span className="f1040-field-label">Designee's name</span>
                <span className="f1040-field-value">{data.designeeName}</span>
              </div>
              <div className="f1040-field">
                <span className="f1040-field-label">Phone no.</span>
                <span className="f1040-field-value">{data.designeePhone}</span>
              </div>
              <div className="f1040-field">
                <span className="f1040-field-label">Personal identification number (PIN)</span>
                <span className="f1040-field-value">{data.designeePIN}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sign Here */}
        <div className="f1040-section f1040-sign">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Sign Here</span>
          </div>
          <div className="f1040-sign-note">
            Under penalties of perjury, I declare that I have examined this return and accompanying schedules and statements, and to the 
            best of my knowledge and belief, they are true, correct, and complete.
          </div>
          <div className="f1040-sign-row">
            <div className="f1040-field">
              <span className="f1040-field-label">Your signature</span>
              <span className="f1040-field-value f1040-sig-line"></span>
            </div>
            <div className="f1040-field">
              <span className="f1040-field-label">Date</span>
              <span className="f1040-field-value f1040-sig-line"></span>
            </div>
            <div className="f1040-field">
              <span className="f1040-field-label">Your occupation</span>
              <span className="f1040-field-value">{data.occupation}</span>
            </div>
          </div>
          <div className="f1040-sign-row">
            <div className="f1040-field">
              <span className="f1040-field-label">Spouse's signature (if joint return)</span>
              <span className="f1040-field-value f1040-sig-line"></span>
            </div>
            <div className="f1040-field">
              <span className="f1040-field-label">Date</span>
              <span className="f1040-field-value f1040-sig-line"></span>
            </div>
            <div className="f1040-field">
              <span className="f1040-field-label">Spouse's occupation</span>
              <span className="f1040-field-value">{data.spouseOccupation}</span>
            </div>
          </div>
          <div className="f1040-sign-row">
            <div className="f1040-field">
              <span className="f1040-field-label">Phone no.</span>
              <span className="f1040-field-value">{data.phone}</span>
            </div>
            <div className="f1040-field">
              <span className="f1040-field-label">Email address</span>
              <span className="f1040-field-value">{data.email}</span>
            </div>
          </div>
        </div>

        {/* Paid Preparer */}
        <div className="f1040-section f1040-preparer">
          <div className="f1040-section-header">
            <span className="f1040-section-title">Paid Preparer Use Only</span>
          </div>
          <div className="f1040-preparer-rows">
            <div className="f1040-sign-row">
              <div className="f1040-field">
                <span className="f1040-field-label">Preparer's name</span>
                <span className="f1040-field-value">{data.preparerName}</span>
              </div>
              <div className="f1040-field">
                <span className="f1040-field-label">PTIN</span>
                <span className="f1040-field-value">{data.preparerPTIN}</span>
              </div>
              <div className="f1040-field f1040-field-check">
                <label><input type="checkbox" checked={data.preparerSelfEmployed} readOnly /> Self-employed</label>
              </div>
            </div>
            <div className="f1040-sign-row">
              <div className="f1040-field">
                <span className="f1040-field-label">Firm's name</span>
                <span className="f1040-field-value">{data.preparerFirmName}</span>
              </div>
              <div className="f1040-field">
                <span className="f1040-field-label">Firm's EIN</span>
                <span className="f1040-field-value">{data.preparerFirmEIN}</span>
              </div>
            </div>
            <div className="f1040-sign-row">
              <div className="f1040-field">
                <span className="f1040-field-label">Firm's address</span>
                <span className="f1040-field-value">{data.preparerFirmAddress}</span>
              </div>
              <div className="f1040-field">
                <span className="f1040-field-label">Phone no.</span>
                <span className="f1040-field-value">{data.preparerFirmPhone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="f1040-page-footer">
          <div className="f1040-pf-right">
            Form <strong>1040</strong> ({data.taxYear || '2024'})
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form1040;
