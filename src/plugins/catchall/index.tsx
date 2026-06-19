import { lazy } from 'react';
import type { ToolPlugin } from '../types';

const CatchallApp = lazy(() => import('./App'));

export const CatchallPlugin: ToolPlugin = {
  metadata: {
    id: 'catchall-email',
    name: 'Catchall Email Manager',
    description: 'Manage catchall email addresses, automate responses, and handle email processing with IMAP and SMTP.',
    category: 'email',
    icon: 'Mail'
  },
  component: CatchallApp
};