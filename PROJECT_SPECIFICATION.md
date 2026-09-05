# Omni Deck (generator-site) — Complete Technical Specification for Frontend Rebuild

## 1. PROJECT OVERVIEW

**Omni Deck** (branded internally as "OMNI DECK CONTROL SITE") is a single-page application that serves as a unified "command deck" for a suite of document generators, account-registration automation tools, and a catch-all email/domain provisioning system. The current frontend is built with **React 19 + TypeScript + Vite 8**, styled with a custom **glassmorphic dark theme**, and communicates with two backend services:

1. **Node.js Express 5 server** (`server.ts`, port `5000`) — handles auth, document persistence, domain automation pipeline, Stripe webhooks, IMAP email polling, and SSE log streaming.
2. **Python Flask app** (`bankstatement/app.py`, port `5001`) — a separate microservice that compiles high-fidelity Wells Fargo bank statement PDFs using **ReportLab**.

The Vite dev server proxies `/api/bankstatement/*` → `localhost:5001` and `/api/*` → `localhost:5000`.

---

## 2. TECH STACK & DEPENDENCIES

### Frontend
- **React 19.2** + **React DOM 19.2**
- **TypeScript ~6.0**
- **Vite 8** with `@vitejs/plugin-react`
- **lucide-react 1.17** — the *only* icon library; icons are referenced dynamically by string name via `(Icons as any)[iconName]`.
- **html2canvas 1.4** + **jspdf 4.2** — used by the Tax Document Generator for client-side PDF export.
- No router library (navigation is state-driven via `activeTab` string).
- No CSS framework (all custom CSS in `index.css` + inline styles).

### Backend (Node)
- **express 5.2**, **cors**, **dotenv 17**
- **imapflow 1.3** + **mailparser 3.9** — IMAP polling for catch-all email ingestion
- **puppeteer 25** + **puppeteer-extra** + **puppeteer-extra-plugin-stealth** — browser automation for IONOS domain registration
- **stripe 22** — payment processing for domain purchases

### Backend (Python — bankstatement microservice)
- **Flask**, **Faker**, **PyYAML**, **ReportLab**
- Data models in `bankstatement/src/models.py`, transaction generation in `transaction_gen.py`, PDF rendering in `pdf_generator.py`

### Persistence
- **JSON flat-file database** — `users.json`, `documents.json`, `domains.json`, `logs.json`, `emails.json` (all in project root).
- **In-memory session map** — `activeSessions: Map<string, {username, createdAt}>` (no Redis/JWT; tokens are random 32-byte hex strings).
- **localStorage** on the client for token (`omni_deck_token`) and cached user (`omni_deck_current_user`).

---

## 3. DESIGN SYSTEM & STYLING

The app uses a **dark glassmorphic theme** defined via CSS custom properties in `src/index.css`:

```css
--bg-app: #0a0a0a
--bg-sidebar: #121212
--bg-card: rgba(24, 24, 27, 0.7)  (with backdrop-filter: blur(16px))
--bg-input: #18181b
--border-color: rgba(255, 255, 255, 0.08)
--accent-gradient: linear-gradient(135deg, #f97316 0%, #ea580c 100%)  (orange)
--accent-solid: #f97316
--text-primary: #f4f4f5
--text-secondary: #a1a1aa
--text-muted: #71717a
--font-sans: 'Plus Jakarta Sans', 'Outfit', ...
--font-mono: ui-monospace, SFMono-Regular, ...
```

**Key UI component classes:**
- `.glass-card` — translucent card with blur, 16px radius, 1.5rem padding, hover state
- `.btn`, `.btn-primary` (orange gradient), `.btn-secondary` (subtle white), `.btn-danger` (red tint)
- `.input-field` — dark input with orange focus ring
- `.input-grid` — `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`
- `.custom-table` / `.table-container` — styled data tables
- `.title-gradient` — orange gradient text via `background-clip: text`
- `.print-preview-pane` — white "paper" preview pane for PDF previews
- `@media print` — hides sidebar, header, buttons, forms; shows only `.print-preview-pane`

**Fonts:** Loaded from Google Fonts: `Outfit` (300-700) and `Plus Jakarta Sans` (300-700).

**Brand identity:** The logo is the Greek letter **Ω** (Omega) in an orange-gradient rounded square. Brand name: "OMNI DECK" / "CONTROL SITE".

---

## 4. APPLICATION ARCHITECTURE

### Entry Point
`src/main.tsx` wraps `<App />` in `<AuthProvider>` (from `src/context/AuthContext.tsx`) and renders into `#root` with `StrictMode`.

### App Shell (`src/App.tsx`)
- **Auth gate:** If `!currentUser`, renders `<Login />`.
- **Layout:** Fixed `<Sidebar />` (280px, collapsible) + `<main>` content area.
- **Routing:** State-based via `activeTab: string`. No URL routing.
  - `activeTab === 'dashboard'` → `<Dashboard />`
  - `activeTab === 'admin'` → `<AdminDashboard />` (admin-only)
  - Otherwise → looks up `getPluginById(activeTab)` and renders `<ActiveComponent />`
- **Session stats:** Tracks counters (statements, stubs, profiles, registrations) via a global `click` event listener that inspects button text.
- **Loaded doc auto-routing:** When a saved doc is loaded from the dashboard, `loadedDoc.type` sets `activeTab` to auto-navigate to the relevant plugin.
- **Responsive:** Sidebar auto-collapses at `window.innerWidth <= 1024`.

### Auth Context (`src/context/AuthContext.tsx`)
Provides:
- `currentUser: {username, isAdmin} | null`
- `savedDocs: SavedDocument[]` — fetched from `/api/documents`
- `loadedDoc` — a doc being loaded into a plugin for editing
- `login(username, password)`, `signup(...)`, `logout()`
- `saveDoc(type, name, data)` — POSTs to `/api/documents`
- `deleteDoc(id)`, `loadDoc(doc)`, `clearLoadedDoc()`
- Admin functions: `getAllUsers()`, `adminDeleteUser()`, `adminDeleteDoc()`

**`SavedDocument` interface:**
```ts
{ id: string; type: string; name: string; timestamp: number; data: any; downloadUrl?: string }
```

All API calls use a helper `apiFetch(path, options)` that injects `Authorization: Bearer <token>` from localStorage. On failure, the context gracefully falls back to localStorage caching.

---

## 5. THE PLUGIN SYSTEM

This is the **core architectural pattern** the rebuild must preserve. It is a simple, file-based plugin registry — no dynamic loading, no manifest files, just TypeScript imports.

### Type Definitions (`src/plugins/types.ts`)
```ts
export interface PluginMetadata {
  id: string;           // unique slug, e.g. 'bank-statement-gen'
  name: string;         // display name
  description: string;
  category: 'generator' | 'registration' | 'utility' | 'email';
  icon: string;         // Lucide icon name as a string, e.g. 'FileSpreadsheet'
}

export interface ToolPlugin {
  metadata: PluginMetadata;
  component: React.ComponentType;  // a standard React component
}
```

### Registry (`src/plugins/registry.ts`)
Exports a flat `plugins: ToolPlugin[]` array. Each entry imports a component and attaches metadata. Also exports `getPluginById(id)`.

**Currently registered plugins (7 total):**

| id | name | category | icon | component |
|----|------|----------|------|-----------|
| `bank-statement-gen` | Bank Statement Generator | generator | FileSpreadsheet | `BankStatementGenerator` |
| `wells-fargo-gen` | Wells Fargo PDF Generator | generator | FileSpreadsheet | `WellsFargoGenerator` |
| `pay-stub-gen` | Pay Stub Generator | generator | FileText | `PayStubGenerator` |
| `business-profile-gen` | Business Profile Hub | generator | Briefcase | `BusinessProfileGenerator` |
| `tax-doc-gen` | Tax Document Generator | generator | Receipt | `TaxDocumentGenerator` |
| `account-registration-suite` | Account Registration Suite | registration | Cpu | `AccountRegisterSuite` |
| `catchall-email` | Catchall Email Manager | email | Mail | `CatchallPlugin.component` |

### How Plugins Are Consumed
1. **Sidebar** (`src/components/Sidebar.tsx`) — receives `plugins.map(p => p.metadata)`, groups by `category` into accordion sections ("Data Generators", "Automation Suites"). Renders each as a nav button with the dynamically-resolved Lucide icon.
2. **Dashboard** (`src/components/Dashboard.tsx`) — renders a searchable card grid of all plugins. Each card shows icon, name, description, category badge, and "Launch Tool" link. Clicking sets `activeTab`.
3. **App.tsx** — when `activeTab` matches a plugin id, renders `<ActiveComponent />` with a header showing the plugin's `name` and `description`.

### How to Add a New Plugin (documented in the Dashboard UI itself)
1. Create a folder under `src/plugins/my-new-tool/`
2. Add an `index.tsx` exporting a React component
3. Import it in `registry.ts` and append a `{metadata, component}` entry to the `plugins` array

### Plugin Conventions
- Each plugin is a **self-contained React component** that manages its own state.
- Plugins that produce documents call `saveDoc(pluginId, name, data)` from `useAuth()` to persist to the backend.
- Plugins that load saved docs check `loadedDoc.type === their-plugin-id` in a `useEffect` and populate their form state, then call `clearLoadedDoc()`.
- Print-based plugins use `window.print()` with CSS `@media print` rules that hide everything except `.print-preview-pane`.
- The catchall plugin uses `React.lazy()` for code-splitting.

---

## 6. DETAILED PLUGIN SPECIFICATIONS

### 6.1 Bank Statement Generator (`src/plugins/bank-statement/index.tsx`)
**Purpose:** Client-side, browser-printable bank statement generator with live preview.

**Features:**
- Two-column layout: left = editor form, right = sticky "PDF preview pane"
- Fields: bank name, bank address, routing number, account number, holder name, holder address, statement period (start/end date), starting balance
- **Transaction table editor:** add/remove rows, each with date, description, type (deposit/withdrawal), amount
- **Auto-calculate:** running balances computed chronologically; totals (deposits, withdrawals, ending balance) update live
- **"Auto-Generate" button:** fills 6-10 random transactions from a pool of realistic descriptions (gas station, coffee, payroll, Zelle, etc.) with random dates within the statement period
- **Preview pane:** white "paper" with Georgia serif font, professional bank statement layout — header with bank name/address, account holder box, routing/account numbers, dark summary bar (starting/deposits/withdrawals/ending), transaction ledger table with color-coded amounts
- **Export:** `window.print()` (browser "Save as PDF")
- **Save:** `saveDoc('bank-statement-gen', name, {all form fields + transactions})`

### 6.2 Wells Fargo PDF Generator (`src/plugins/wells-fargo/index.tsx`)
**Purpose:** Server-side, ReportLab-compiled Wells Fargo statement PDFs via the Python Flask microservice.

**Features:**
- Form with sections: Customer Details (name, street, city, state, zip — all uppercased), Account Details (account number, routing number, account type dropdown), Statement Period (mode: 1month/2months/3months/90days/manual + anchor month/year or custom dates), Algorithms & Constraints (monthly revenue, business type, min/max starting balance, transaction density, randomizer seed)
- **"Autofill Mock Address" button:** calls `POST /api/bankstatement/generate-mock-data` → returns a random Faker name + San Jose-area address
- **"Compile Wells Fargo PDF" button:** calls `POST /api/bankstatement/generate-statement` with the full payload
- **Response handling:** Supports both single-statement (returns `filename` + `summary`) and multi-month (returns `statements[]` array + `totals`)
- **Download:** `window.open('/api/bankstatement/download/<filename>')`
- **No client-side print/preview** — all rendering is server-side ReportLab

**Backend (Python Flask, port 5001):**
- `POST /generate-statement` — parses form data, creates `AccountHolder`/`AccountInfo`/`StatementPeriod` models, runs `TransactionGenerator` (business or personal profile based on account type), compiles PDF via `StatementPDFGenerator` (ReportLab `BaseDocTemplate` with custom page templates, Wells Fargo logo, checkboxes, transaction tables)
- `POST /generate-mock-data` — returns `Faker.name()` + random San Jose address
- `GET /download/<filename>` — serves generated PDF from `output/` directory
- **Transaction generator** supports 5 personal profiles (homebody, commuter, student, suburban_family, higher_income_professional) with weighted category pools, digital ratio targets, payday weekday logic, and Wells Fargo-specific wording packs
- **Multi-month mode:** generates separate PDFs with rolling balances (ending balance of month N = starting balance of month N+1)

### 6.3 Pay Stub Generator (`src/plugins/pay-stub/index.tsx`)
**Purpose:** Client-side pay stub with full tax calculations and YTD estimates.

**Features:**
- Fields: employer (company name, address), employee (name, ID, address, masked SSN), pay cycle (frequency: semimonthly/biweekly/monthly, period number, start/end/pay dates), earnings (hourly rate, regular hours, OT hours, OT multiplier), tax rules (federal %, state %, medical $, 401k $)
- **Auto-calculations:** regular gross, OT gross, total gross, federal tax, state tax, FICA SS (6.2%), FICA Medicare (1.45%), total taxes, total deductions, net pay
- **YTD estimates:** current values × pay period number
- **Auto-fill period number:** based on end date and pay frequency
- **Preview pane:** monospace (Courier New) "check stub" layout with earnings breakdown table, taxes/deductions table, and a Gross − Taxes = Net Pay summary box
- **Export:** `window.print()`
- **Save:** `saveDoc('pay-stub-gen', name, {all fields})`

### 6.4 Business Profile Hub (`src/plugins/business-profile/index.tsx`)
**Purpose:** Generate and preview randomized business profiles with brand-matching collateral.

**Features:**
- Fields: business name, tagline, entity type (LLC/Inc./Sole Prop/Partnership), industry, founded year, phone, email, address, website, description, primary brand color, secondary brand color
- **"Generate New Profile" button:** randomizes all fields from curated pools (15 prefixes × 14 suffixes for names, 8 taglines, 8 industries, 8 cities with area codes, 8 streets, 5 descriptions, 8 brand colors)
- **Three output tabs:**
  1. **Business Card** — front (gradient card with logo initial, name, tagline) + back (contact info)
  2. **Sample Invoice** — branded invoice with line items, subtotal, balance due
  3. **JSON Metadata** — copyable JSON payload of the full profile
- **Save:** `saveDoc('business-profile-gen', name, {all fields})`

### 6.5 Tax Document Generator (`src/plugins/tax-gen/`)
**Purpose:** Generate IRS Form W-2 and Form 1040 with full layout fidelity.

**Structure:**
- `index.tsx` — main component with tab switcher (W-2 / 1040), input mode vs preview mode
- `types.ts` — `W2Data` (53 fields: employee/employer info, boxes 1-20, box 12 codes, box 13 checkboxes, state/local) and `Form1040Data` (80+ fields: filing status, personal info, dependents, income lines 1a-15, tax/credits lines 16-24, payments lines 25-33, refund lines 34-38, third-party designee, signature, preparer info)
- `W2InputForm.tsx` / `Form1040InputForm.tsx` — comprehensive input forms
- `W2Form.tsx` / `Form1040.tsx` — pixel-accurate IRS form renderings (with dedicated CSS files)
- `mockData.ts` — pre-filled sample data

**Export:**
- **Print:** Opens a new window, copies all stylesheets + the form HTML, calls `printWindow.print()`
- **Download PDF:** Uses `html2canvas` (scale 2x) + `jsPDF` (letter size, inches) to rasterize each `.w2-page` / `.f1040-page` element into a multi-page PDF

### 6.6 Account Registration Suite (`src/plugins/account-register/index.tsx`)
**Purpose:** Frontend for an external account-creation automation API (runs on `localhost:8000`), with a full simulation fallback.

**Features:**
- **Backend connection config:** configurable URL (default `http://localhost:8000`), health check via `GET /config`
- **Form fields:** platform target (ChatGPT, Cloudflare, Cursor, Kiro, Grok, Tavily, OpenBlockLabs, Cerebras), executor engine (protocol/headless/headed), captcha solver (yescaptcha/local_solver/manual), solver API key, batch count, concurrency, delay, mailbox provider (8 options including IMAP catchall), proxy, phone number
- **Live mode:** `POST /tasks/register` → polls `GET /tasks/<id>` every 2s for status/progress/logs
- **Simulation mode (when backend offline):** runs a scripted 11-step log sequence with realistic timestamps, progress %, and mock messages (browser init, proxy tunneling, mail inbox, captcha solving, verification code, completion)
- **Task status card:** shows task ID, status, progress bar, success count, simulation badge
- **Console terminal:** dark terminal with color-coded log lines (red for errors, blue for system, green for normal)
- **Save:** `saveDoc('account-registration-suite', name, {form fields + task + logs})`

### 6.7 Catchall Email Manager (`src/plugins/catchall/`)
**Purpose:** Full domain provisioning + catch-all email automation system. This is the most complex plugin, code-split via `React.lazy()`.

**Structure:**
- `index.tsx` — exports `CatchallPlugin` with metadata + lazy-loaded component
- `App.tsx` — ~1878 lines, self-contained full application with its own nav header and tab system

**Three sub-tabs:**

#### Control Center (Dashboard)
- **Storefront:** domain search bar → simulated availability check → $12/yr pricing → checkout form (customer email) → "Simulate Stripe Payment" (calls `/api/purchase` in simulated mode, or `/api/checkout-session` for real Stripe redirect)
- **Pipeline visualizer:** 8-node flow diagram (Stripe Webhook → IONOS Buy Bot → NS Delegation → Cloudflare Zone → CF Email Router → Catch-All Rule → Credentials → Delivery). Each node is clickable to inspect the exact cURL/JSON mock details.
- **Live terminal:** SSE-connected (`EventSource('/api/logs/stream')`) real-time log stream with color-coded status (INFO/SUCCESS/WARNING/ERROR)
- **Domain selector:** switch between active domain pipelines
- **Failure handling:** red alert banner with error message + "Failsafe Active" notice

#### Webmail Client
- Domain selector dropdown
- Inbox list (fetched from `/api/inbox/<domain>`)
- Email viewer (sender, recipient, subject, body, timestamp)
- **Email injector:** form to send mock emails (sender, recipient prefix, subject, body) via `/api/inbox/inject` to test catch-all routing

#### API Vault Settings
- Configuration form for all backend credentials: Porkbun API keys, Cloudflare token/account ID, Resend API key, master inbox, simulated mode toggle, IONOS browser automation fields (email, password, name, address, card details), IMAP credentials
- **Show/hide keys** toggle, save status indicator
- **Save:** `POST /api/config` → writes to `.env` file on server, reloads dotenv, restarts IMAP poller

---

## 7. BACKEND API REFERENCE (Node Express, port 5000)

### Auth
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | — | Create user (PBKDF2-SHA512, 100k iterations). Admin if username is `admin` or `system_admin` |
| POST | `/api/auth/login` | — | Verify password, return `{token, user}` |
| POST | `/api/auth/logout` | Bearer | Invalidate session token |
| GET | `/api/auth/me` | Bearer | Validate token, return current user |
| GET | `/api/auth/users` | Bearer+Admin | List all users |
| POST | `/api/auth/admin/delete-user` | Bearer+Admin | Delete user + their docs + sessions |

### Documents
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/documents` | Bearer | List current user's saved docs (sorted by timestamp desc) |
| POST | `/api/documents` | Bearer | Save a new doc `{type, name, data}` |
| DELETE | `/api/documents/:id` | Bearer | Delete own doc |
| DELETE | `/api/documents/admin/:username/:id` | Bearer+Admin | Admin delete any user's doc |

### Domain Automation Pipeline
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/config` | Return config status (masked secrets) |
| POST | `/api/config` | Save config to `.env`, reload, restart IMAP poller |
| GET | `/api/domains` | List all domain records |
| POST | `/api/purchase` | Simulated domain purchase → triggers `runRegistrationWorkflow()` |
| POST | `/api/checkout-session` | Real Stripe checkout session creation ($12.00) |
| POST | `/api/webhooks/stripe` | Stripe webhook handler (verifies signature in live mode) |
| POST | `/api/retry/:id` | Retry a failed domain pipeline from last completed step |

### Email
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/inbox/:domain` | List emails for a domain |
| POST | `/api/inbox/inject` | Inject a mock email into a domain's inbox |
| GET | `/api/logs/stream` | SSE stream of real-time pipeline logs |
| GET | `/api/logs` | Log history (capped at 1000) |

### Registration Workflow (8 steps)
`runRegistrationWorkflow(domainId)` is an async function that:
1. **Stripe trigger** — marks checkout complete
2. **Domain registration** — Porkbun API (if keys present) OR IONOS Puppeteer browser automation (`ionos_automator.ts` with stealth plugin)
3. **Cloudflare zone creation** — `POST https://api.cloudflare.com/client/v4/zones`
4. **Nameserver delegation** — Porkbun API or IONOS dashboard Puppeteer automation
5. **DNS propagation check** — polls Cloudflare zone status (max 5 retries, 5s sleep)
6. **Email routing enable** — `POST /zones/{id}/email/routing/enable`
7. **Catch-all rule** — `POST /zones/{id}/email/routing/rules` with `matchers: [{type: 'all'}]` forwarding to master inbox
8. **Credentials + delivery** — generates admin password, sends welcome email via Resend API

Each step logs via `logPipeline()` which persists to `logs.json` and streams to all SSE clients. The workflow supports **resumption** — it checks `steps[key] === 'COMPLETED'` and skips already-done steps. Failed pipelines set `status: 'FAILED'` and can be retried.

### IMAP Poller
Background daemon (`pollIMAP()`, every 15s) connects to the master IMAP inbox, fetches unseen messages, parses them with `mailparser`, extracts the recipient address from `delivered-to`/`x-forwarded-to` headers, matches the domain, and stores the email in `emails.json`.

---

## 8. BACKEND API REFERENCE (Python Flask, port 5001)

Proxied via Vite as `/api/bankstatement/*` → `localhost:5001/*`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Render Flask web UI (standalone) |
| GET | `/get-default-period` | Return prior complete month as anchor |
| POST | `/generate-mock-data` | Return random Faker name + San Jose address |
| POST | `/generate-statement` | Generate PDF(s), return filename + summary or statements array |
| GET | `/download/<filename>` | Download generated PDF |

**Data models:** `Address`, `AccountHolder`, `AccountInfo`, `Transaction` (with `TransactionType` enum, `running_balance`, `check_number`), `StatementPeriod`, `StatementSummary` (with `from_transactions` classmethod), `BankStatement` (with `page_count` property).

**Transaction generator:** 1265-line module with business templates (POS deposits, Stripe transfers, payroll, rent, utilities, suppliers) and personal templates (5 profile presets with weighted category pools, digital ratio targets, payday weekday logic, Wells Fargo-specific wording). Supports deterministic generation via seed.

**PDF generator:** 633-line ReportLab module with `BaseDocTemplate`, custom `PageTemplate`s (first page vs later pages), drawn checkboxes (`DrawnCheckbox` Flowable), Wells Fargo logo image, activity summary table, account info, overdraft section, and paginated transaction history table.

---

## 9. OTHER COMPONENTS

### Login (`src/components/Login.tsx`)
- Centered glass card with Ω logo
- Tab toggle: Log In / Register
- Username + password fields
- "Quick Demo Access" button (auto-creates/logs in `demo_guest`)
- Calls `login()` or `signup()` from AuthContext

### Dashboard (`src/components/Dashboard.tsx`)
- Welcome banner with "SECURE ENGINE ONLINE" status
- Stats row: loaded plugins count, documents/tasks created, accounts created (session)
- **Saved Documents table:** type (with icon), name, date, open/delete actions
- **Installed Tool Directory:** searchable card grid of all plugins
- **"How to Add Your Own Plugins"** developer guide section

### Sidebar (`src/components/Sidebar.tsx`)
- 280px fixed left sidebar, collapsible
- Ω logo + "OMNI DECK" / "CONTROL SITE" branding
- Accordion sections: System Core (Dashboard), Data Generators, Automation Suites, Administration (admin only)
- Console stats panel at bottom (Core System: ONLINE, Active Plugins: N Loaded)

### AdminDashboard (`src/components/AdminDashboard.tsx`)
- Admin-only (shown when `activeTab === 'admin'` and `currentUser.isAdmin`)
- Stats: registered agents, saved documents (global), avg docs/user, database weight
- User accounts registry table (searchable, filterable by role)
- Agent dossier panel: profile details + saved documents list + JSON metadata payload viewer
- Platform health diagnostics: document distribution bars, engine status indicators

---

## 10. DEPLOYMENT CONFIGURATION

- **Dockerfile** — containerized build
- **nginx.conf** — reverse proxy configuration
- **supervisord.conf** — process management (likely runs both Node + Python + nginx)
- **Procfile** (in bankstatement/) — for Python deployment (Render/Heroku)
- `.env` — environment variables (Porkbun, Cloudflare, Resend, IONOS, IMAP, Stripe credentials)

---

## 11. KEY PATTERNS THE REBUILD MUST PRESERVE

1. **Plugin registry pattern** — `ToolPlugin[]` with `{metadata, component}`. The sidebar, dashboard, and App routing all derive from this single array. Adding a plugin = create folder + add to registry.
2. **Dynamic Lucide icons** — `metadata.icon` is a string name resolved at runtime via `(Icons as any)[iconName]`.
3. **Category-based grouping** — sidebar groups plugins by `category` ('generator', 'registration', 'email', 'utility').
4. **Auth-gated rendering** — `!currentUser` → Login screen; admin features gated by `currentUser.isAdmin`.
5. **Document save/load flow** — plugins call `saveDoc(type, name, data)` → stored on backend → appears in Dashboard saved docs table → clicking "Open" sets `loadedDoc` → plugin's `useEffect` detects `loadedDoc.type` and populates form state → `clearLoadedDoc()`.
6. **Print-based PDF export** — `.print-preview-pane` class with `@media print` overrides hiding all `.no-print` / `.sidebar` / `.btn` elements.
7. **SSE log streaming** — `EventSource('/api/logs/stream')` for real-time pipeline updates.
8. **Simulation mode** — `SIMULATED_MODE` env var (default true) controls whether the backend makes real API calls or logs simulated steps.
9. **Two-column editor/preview layout** — most generators use `grid-template-columns: 1fr 1fr` with a sticky preview pane on the right.
10. **Glassmorphic dark theme** — all components use CSS variables and `.glass-card` for consistent styling.eeeeeeeeeeeeeeeeeeeeeeeeeeeeee