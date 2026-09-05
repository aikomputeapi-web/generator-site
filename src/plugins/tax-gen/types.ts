// W-2 Form Data
export interface W2Data {
  // Employee/Employer Info
  employeeSSN: string;
  employerEIN: string;
  employerName: string;
  employerAddress: string;
  employerCity: string;
  employerState: string;
  employerZip: string;
  controlNumber: string;
  employeeFirstName: string;
  employeeLastName: string;
  employeeMiddleInit: string;
  employeeSuffix: string;
  employeeAddress: string;
  employeeCity: string;
  employeeState: string;
  employeeZip: string;
  // Boxes 1-14
  box1_wagesTips: number;
  box2_federalTaxWithheld: number;
  box3_socialSecurityWages: number;
  box4_socialSecurityTax: number;
  box5_medicareWages: number;
  box6_medicareTax: number;
  box7_socialSecurityTips: number;
  box8_allocatedTips: number;
  box10_dependentCareBenefits: number;
  box11_nonqualifiedPlans: number;
  box12a_code: string;
  box12a_amount: number;
  box12b_code: string;
  box12b_amount: number;
  box12c_code: string;
  box12c_amount: number;
  box12d_code: string;
  box12d_amount: number;
  box13_statutory: boolean;
  box13_retirement: boolean;
  box13_thirdPartySick: boolean;
  box14_other: string;
  // State/Local
  box15_stateCode: string;
  box15_stateID: string;
  box16_stateWages: number;
  box17_stateTax: number;
  box18_localWages: number;
  box19_localTax: number;
  box20_localityName: string;
  // Tax year
  taxYear: string;
}

// Form 1040 Data
export interface Form1040Data {
  // Filing Status
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';
  // Personal Info
  firstName: string;
  lastName: string;
  ssn: string;
  spouseFirstName: string;
  spouseLastName: string;
  spouseSSN: string;
  address: string;
  aptNo: string;
  city: string;
  state: string;
  zip: string;
  foreignCountry: string;
  foreignProvince: string;
  foreignPostalCode: string;
  digitalAssets: 'yes' | 'no';
  youStandardDeduction: boolean;
  spouseStandardDeduction: boolean;
  youBorn1960: boolean;
  youBlind: boolean;
  spouseBorn1960: boolean;
  spouseBlind: boolean;
  // Dependents
  dependents: Dependent[];
  // Income
  line1a: number;
  line1b: number;
  line1c: number;
  line1d: number;
  line1e: number;
  line1f: number;
  line1g: number;
  line1h: number;
  line1i: number;
  line1z: number;
  line2a: number;
  line2b: number;
  line3a: number;
  line3b: number;
  line4a: number;
  line4b: number;
  line5a: number;
  line5b: number;
  line6a: number;
  line6b: number;
  line6c: boolean;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  line14: number;
  line15: number;
  // Tax and Credits
  line16: number;
  line17: number;
  line18: number;
  line19: number;
  line20: number;
  line21: number;
  line22: number;
  line23: number;
  line24: number;
  // Payments
  line25a: number;
  line25b: number;
  line25c: number;
  line25d: number;
  line26: number;
  line27a: number;
  line27b: boolean;
  line27c: number;
  line28: number;
  line29: number;
  line30: number;
  line31: number;
  line32: number;
  line33: number;
  // Refund
  line34: number;
  line35a: number;
  line35b_routingNumber: string;
  line35b_accountType: 'checking' | 'savings' | '';
  line35b_accountNumber: string;
  line36: number;
  line37: number;
  line38: number;
  // Third party
  thirdPartyDesignee: 'yes' | 'no';
  designeeName: string;
  designeePhone: string;
  designeePIN: string;
  // Signature
  occupation: string;
  spouseOccupation: string;
  phone: string;
  email: string;
  identityPIN: string;
  spouseIdentityPIN: string;
  taxYear: string;
  // Preparer
  preparerName: string;
  preparerPTIN: string;
  preparerFirmName: string;
  preparerFirmEIN: string;
  preparerFirmAddress: string;
  preparerFirmPhone: string;
  preparerSelfEmployed: boolean;
}

export interface Dependent {
  firstName: string;
  lastName: string;
  ssn: string;
  relationship: string;
  childTaxCredit: boolean;
  otherDependentCredit: boolean;
}
