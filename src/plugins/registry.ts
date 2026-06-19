import type { ToolPlugin } from './types';
import { BankStatementGenerator } from './bank-statement';
import { PayStubGenerator } from './pay-stub';
import { BusinessProfileGenerator } from './business-profile';
import { AccountRegisterSuite } from './account-register';
import { WellsFargoGenerator } from './wells-fargo';

export const plugins: ToolPlugin[] = [
  {
    metadata: {
      id: 'bank-statement-gen',
      name: 'Bank Statement Generator',
      description: 'Generate high-fidelity bank statements, manage transactions, and export print-ready PDFs.',
      category: 'generator',
      icon: 'FileSpreadsheet'
    },
    component: BankStatementGenerator
  },
  {
    metadata: {
      id: 'wells-fargo-gen',
      name: 'Wells Fargo PDF Generator',
      description: 'Generate high-fidelity Wells Fargo layout bank statements using server-side ReportLab PDF compilation.',
      category: 'generator',
      icon: 'FileSpreadsheet'
    },
    component: WellsFargoGenerator
  },
  {
    metadata: {
      id: 'pay-stub-gen',
      name: 'Pay Stub Generator',
      description: 'Calculate federal/state withholdings, compute net pay, and output professional pay stubs.',
      category: 'generator',
      icon: 'FileText'
    },
    component: PayStubGenerator
  },
  {
    metadata: {
      id: 'business-profile-gen',
      name: 'Business Profile Hub',
      description: 'Manage core entity data, preview brand-matching business cards, and generate invoice templates.',
      category: 'generator',
      icon: 'Briefcase'
    },
    component: BusinessProfileGenerator
  },
  {
    metadata: {
      id: 'account-registration-suite',
      name: 'Account Registration Suite',
      description: 'Run automated platform script loaders, monitor runner status, and inspect real-time logs.',
      category: 'registration',
      icon: 'Cpu'
    },
    component: AccountRegisterSuite
  }
];

export const getPluginById = (id: string) => plugins.find(p => p.metadata.id === id);
