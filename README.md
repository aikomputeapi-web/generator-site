# Omni Deck

> Unified command deck for document generators, account-registration automation, and catch-all email / domain provisioning.

Omni Deck is a single-page application built with **React 19 + TypeScript + Vite 8**, styled with a custom **glassmorphic dark theme**, and backed by two services:

- **Node / Express 5** server (`server.ts`, port `5000`) — auth, document persistence, domain automation pipeline, Stripe webhooks, IMAP email polling, SSE log streaming.
- **Python / Flask** microservice (`bankstatement/app.py`, port `5001`) — high-fidelity Wells Fargo bank statement PDFs compiled with ReportLab.

The Vite dev server proxies `/api/bankstatement/*` → `localhost:5001` and `/api/*` → `localhost:5000`.

---

## Features

- **Plugin-based architecture** — add a new tool by creating a folder under `src/plugins/` and registering it in `src/plugins/registry.ts`.
- **7 built-in plugins:**
  - Bank Statement Generator (client-side, printable)
  - Wells Fargo PDF Generator (server-side, ReportLab)
  - Pay Stub Generator (client-side, printable)
  - Business Profile Hub (cards, invoices, JSON metadata)
  - Tax Document Generator (IRS Form W-2 + Form 1040, PDF export)
  - Account Registration Suite (live + simulated modes)
  - Catchall Email Manager (domain provisioning + webmail + API vault)
- **Auth & roles** — password login/registration plus Google Sign-In, PBKDF2-SHA512 password hashing, random 32-byte session tokens, and admin / user roles.
- **Document save / load** — every generator persists to the backend and reloads into its form via a shared `useAuth()` context.
- **Live pipeline logs** — Server-Sent Events stream for the domain automation pipeline.
- **Simulation mode** — `SIMULATED_MODE=true` (default) lets the entire pipeline run end-to-end without real third-party API keys.
- **Dark glassmorphic theme** — orange-accented design system built on CSS custom properties (`.glass-card`, `.btn-primary`, etc.).

---

## Quick start

### Prerequisites

- Node.js 20+
- Python 3.10+ (only required for the Wells Fargo PDF plugin)

### Install

```bash
npm install
```

For the Wells Fargo plugin:

```bash
cd bankstatement
pip install -r requirements.txt
```

### Run (development)

In one terminal — starts both the Express API (`:5000`) and the Vite dev server (`:5173`):

```bash
npm run start
```

For the Wells Fargo plugin, in a second terminal:

```bash
cd bankstatement
python app.py
```

Then open <http://localhost:5173>. The default admin user is `admin` / `admin` (created on first signup). A `demo_guest` account can be created with one click from the login screen.

### Build (production)

```bash
npm run build
```

Outputs to `dist/`. The included `Dockerfile` + `nginx.conf` + `supervisord.conf` run both backends and the static frontend in a single container.

---

## Project structure

```
.
├── server.ts                 # Express API (auth, docs, pipeline, Stripe, IMAP, SSE)
├── ionos_automator.ts        # Puppeteer stealth automation for IONOS domain registration
├── src/
│   ├── App.tsx               # Auth gate + sidebar + plugin router
│   ├── main.tsx              # Entry: <App /> wrapped in <AuthProvider />
│   ├── index.css             # Design system: CSS variables, .glass-card, .btn-*, etc.
│   ├── context/AuthContext.tsx
│   ├── components/           # Login, Sidebar, Dashboard, AdminDashboard
│   └── plugins/              # One folder per plugin
│       ├── registry.ts       # plugins: ToolPlugin[]
│       ├── types.ts          # PluginMetadata, ToolPlugin
│       ├── bank-statement/
│       ├── wells-fargo/
│       ├── pay-stub/
│       ├── business-profile/
│       ├── tax-gen/          # W-2 + 1040, with dedicated CSS
│       ├── account-register/
│       └── catchall/         # Code-split via React.lazy(); owns its own App.tsx
├── bankstatement/            # Python Flask microservice (port 5001)
│   ├── app.py
│   └── src/
│       ├── models.py
│       ├── transaction_gen.py
│       └── pdf_generator.py
├── Dockerfile
├── nginx.conf
└── supervisord.conf
```

### Adding a new plugin

1. Create `src/plugins/my-tool/index.tsx` exporting a React component.
2. Add an entry to `plugins` in `src/plugins/registry.ts`:

   ```ts
   import MyTool from './my-tool';
   plugins.push({
     metadata: {
       id: 'my-tool',
       name: 'My Tool',
       description: 'Does a thing.',
       category: 'generator',
       icon: 'Wand', // any lucide-react icon name
     },
     component: MyTool,
   });
   ```

3. The sidebar, dashboard, and router pick it up automatically.

---

## Environment

Copy `.env` and fill in any keys you want to use. Everything is optional — with `SIMULATED_MODE=true` (the default) the entire app runs without external accounts.

| Variable | Used by |
|---|---|
| `SIMULATED_MODE` | All pipeline steps |
| `PORKBUN_API_KEY` / `PORKBUN_SECRET_KEY` | Domain registration + nameserver delegation |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | Zone creation, email routing, catch-all rules |
| `RESEND_API_KEY` | Welcome email delivery |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Real checkout sessions + webhook verification |
| `IONOS_EMAIL` / `IONOS_PASSWORD` / `IONOS_*` | Puppeteer fallback for IONOS dashboard |
| `IMAP_HOST` / `IMAP_USER` / `IMAP_PASS` | Catch-all inbox polling (15s interval) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth web client ID used by the browser |
| `GOOGLE_CLIENT_ID` | Same Google OAuth client ID, used to verify ID tokens on the API |

### Google Sign-In setup

1. In Google Cloud Console, create an OAuth 2.0 **Web application** client.
2. Add your application URLs to **Authorized JavaScript origins** (for local development, `http://localhost:5173`).
3. Put the client ID in both `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` in `.env`, then restart the app.

The Google button is shown only when `VITE_GOOGLE_CLIENT_ID` is configured. The API verifies every Google ID token before creating or signing in the local account.

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server only (`:5173`) |
| `npm run server` | Express API only (`:5000`) |
| `npm run start` | Both, via `concurrently` |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |
