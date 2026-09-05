import type { W2Data, Form1040Data } from './types';

export const mockW2Data: W2Data = {
  employeeSSN: '123-45-6789',
  employerEIN: '98-7654321',
  employerName: 'ACME TECHNOLOGY SOLUTIONS INC',
  employerAddress: '1234 Innovation Drive, Suite 500',
  employerCity: 'San Francisco',
  employerState: 'CA',
  employerZip: '94105',
  controlNumber: '000012345',
  employeeFirstName: 'JOHN',
  employeeLastName: 'SMITH',
  employeeMiddleInit: 'A',
  employeeSuffix: '',
  employeeAddress: '5678 Oak Street, Apt 3B',
  employeeCity: 'San Francisco',
  employeeState: 'CA',
  employeeZip: '94110',
  box1_wagesTips: 85000.00,
  box2_federalTaxWithheld: 14280.00,
  box3_socialSecurityWages: 85000.00,
  box4_socialSecurityTax: 5270.00,
  box5_medicareWages: 85000.00,
  box6_medicareTax: 1232.50,
  box7_socialSecurityTips: 0,
  box8_allocatedTips: 0,
  box10_dependentCareBenefits: 0,
  box11_nonqualifiedPlans: 0,
  box12a_code: 'DD',
  box12a_amount: 7200.00,
  box12b_code: 'D',
  box12b_amount: 6500.00,
  box12c_code: '',
  box12c_amount: 0,
  box12d_code: '',
  box12d_amount: 0,
  box13_statutory: false,
  box13_retirement: true,
  box13_thirdPartySick: false,
  box14_other: '',
  box15_stateCode: 'CA',
  box15_stateID: '800-1234567',
  box16_stateWages: 85000.00,
  box17_stateTax: 4250.00,
  box18_localWages: 0,
  box19_localTax: 0,
  box20_localityName: '',
  taxYear: '2024',
};

export function generateMock1040FromW2(w2: W2Data): Form1040Data {
  const wages = w2.box1_wagesTips;
  const federalWithheld = w2.box2_federalTaxWithheld;

  // Standard deduction for single filer 2024
  const standardDeduction = 14600;

  // Taxable income
  const agi = wages;
  const taxableIncome = Math.max(0, agi - standardDeduction);

  // 2024 tax bracket calculation for Single filer
  const tax = calculateTax(taxableIncome, 'single');

  const totalTax = tax;
  const totalPayments = federalWithheld;
  const refundOrOwe = totalPayments - totalTax;

  return {
    filingStatus: 'single',
    firstName: w2.employeeFirstName,
    lastName: w2.employeeLastName,
    ssn: w2.employeeSSN,
    spouseFirstName: '',
    spouseLastName: '',
    spouseSSN: '',
    address: w2.employeeAddress,
    aptNo: '',
    city: w2.employeeCity,
    state: w2.employeeState,
    zip: w2.employeeZip,
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
    line1a: wages,
    line1b: 0,
    line1c: 0,
    line1d: 0,
    line1e: 0,
    line1f: 0,
    line1g: 0,
    line1h: 0,
    line1i: 0,
    line1z: wages,
    line2a: 0,
    line2b: 150.00,
    line3a: 0,
    line3b: 0,
    line4a: 0,
    line4b: 0,
    line5a: 0,
    line5b: 0,
    line6a: 0,
    line6b: 0,
    line6c: false,
    line7: 0,
    line8: 0,
    line9: wages + 150,
    line10: 0,
    line11: wages + 150,
    line12: standardDeduction,
    line13: 0,
    line14: standardDeduction,
    line15: taxableIncome + 150,
    line16: tax,
    line17: 0,
    line18: tax,
    line19: 0,
    line20: 0,
    line21: 0,
    line22: tax,
    line23: 0,
    line24: totalTax,
    line25a: federalWithheld,
    line25b: 0,
    line25c: 0,
    line25d: federalWithheld,
    line26: 0,
    line27a: 0,
    line27b: false,
    line27c: 0,
    line28: 0,
    line29: 0,
    line30: 0,
    line31: 0,
    line32: 0,
    line33: totalPayments,
    line34: refundOrOwe > 0 ? refundOrOwe : 0,
    line35a: refundOrOwe > 0 ? refundOrOwe : 0,
    line35b_routingNumber: '',
    line35b_accountType: '',
    line35b_accountNumber: '',
    line36: 0,
    line37: refundOrOwe < 0 ? Math.abs(refundOrOwe) : 0,
    line38: 0,
    thirdPartyDesignee: 'no',
    designeeName: '',
    designeePhone: '',
    designeePIN: '',
    occupation: 'Software Engineer',
    spouseOccupation: '',
    phone: '(415) 555-0123',
    email: 'john.smith@email.com',
    identityPIN: '',
    spouseIdentityPIN: '',
    taxYear: '2024',
    preparerName: '',
    preparerPTIN: '',
    preparerFirmName: '',
    preparerFirmEIN: '',
    preparerFirmAddress: '',
    preparerFirmPhone: '',
    preparerSelfEmployed: false,
  };
}

export function calculateTax(taxableIncome: number, filingStatus: string): number {
  // 2024 Tax Brackets
  const brackets: Record<string, { rate: number; min: number; max: number }[]> = {
    single: [
      { rate: 0.10, min: 0, max: 11600 },
      { rate: 0.12, min: 11600, max: 47150 },
      { rate: 0.22, min: 47150, max: 100525 },
      { rate: 0.24, min: 100525, max: 191950 },
      { rate: 0.32, min: 191950, max: 243725 },
      { rate: 0.35, min: 243725, max: 609350 },
      { rate: 0.37, min: 609350, max: Infinity },
    ],
    married_joint: [
      { rate: 0.10, min: 0, max: 23200 },
      { rate: 0.12, min: 23200, max: 94300 },
      { rate: 0.22, min: 94300, max: 201050 },
      { rate: 0.24, min: 201050, max: 383900 },
      { rate: 0.32, min: 383900, max: 487450 },
      { rate: 0.35, min: 487450, max: 731200 },
      { rate: 0.37, min: 731200, max: Infinity },
    ],
    married_separate: [
      { rate: 0.10, min: 0, max: 11600 },
      { rate: 0.12, min: 11600, max: 47150 },
      { rate: 0.22, min: 47150, max: 100525 },
      { rate: 0.24, min: 100525, max: 191950 },
      { rate: 0.32, min: 191950, max: 243725 },
      { rate: 0.35, min: 243725, max: 365600 },
      { rate: 0.37, min: 365600, max: Infinity },
    ],
    head_of_household: [
      { rate: 0.10, min: 0, max: 16550 },
      { rate: 0.12, min: 16550, max: 63100 },
      { rate: 0.22, min: 63100, max: 100500 },
      { rate: 0.24, min: 100500, max: 191950 },
      { rate: 0.32, min: 191950, max: 243700 },
      { rate: 0.35, min: 243700, max: 609350 },
      { rate: 0.37, min: 609350, max: Infinity },
    ],
    qualifying_widow: [
      { rate: 0.10, min: 0, max: 23200 },
      { rate: 0.12, min: 23200, max: 94300 },
      { rate: 0.22, min: 94300, max: 201050 },
      { rate: 0.24, min: 201050, max: 383900 },
      { rate: 0.32, min: 383900, max: 487450 },
      { rate: 0.35, min: 487450, max: 731200 },
      { rate: 0.37, min: 731200, max: Infinity },
    ],
  };

  const applicableBrackets = brackets[filingStatus] || brackets['single'];
  let tax = 0;

  for (const bracket of applicableBrackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  return Math.round(tax);
}

export const getStandardDeduction = (filingStatus: string): number => {
  const deductions: Record<string, number> = {
    single: 14600,
    married_joint: 29200,
    married_separate: 14600,
    head_of_household: 21900,
    qualifying_widow: 29200,
  };
  return deductions[filingStatus] || 14600;
};
