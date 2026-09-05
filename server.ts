import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// File paths for persistence
const USERS_FILE = path.join(__dirname, "users.json");
const DOCUMENTS_FILE = path.join(__dirname, "documents.json");

const initFile = (filePath: string, defaultData: any) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};
initFile(USERS_FILE, []);
initFile(DOCUMENTS_FILE, []);

// Simple password hashing with SHA-256 + salt
function hashPassword(
  password: string,
  salt?: string,
): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, s, 100000, 64, "sha512")
    .toString("hex");
  return { hash, salt: s };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPassword(password, salt);
  return computed === hash;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

interface SessionEntry {
  username: string;
  createdAt: number;
}
const activeSessions = new Map<string, SessionEntry>();

// ──────────────────────────────────────────────────
//  GOOGLE SIGN-IN (Google Identity Services)
//  Verifies the ID token sent up by the browser and
//  finds (or creates) a matching local user account.
// ──────────────────────────────────────────────────
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleIdToken(idToken: string) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Google Sign-In is not configured: set GOOGLE_CLIENT_ID in .env",
    );
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const token = authHeader.slice(7);
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
  req.user = session.username;
  next();
}

const readJSON = (filePath: string) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return [];
  }
};

const writeJSON = (filePath: string, data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ──────────────────────────────────────────────────
//  AUTH & DOCUMENT MANAGEMENT API ROUTES
// ──────────────────────────────────────────────────

// POST /api/auth/signup — create a new user account
app.post("/api/auth/signup", (req: any, res: any) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 2) {
    return res
      .status(400)
      .json({ error: "Username must be at least 2 characters." });
  }
  if (password.length < 4) {
    return res
      .status(400)
      .json({ error: "Password must be at least 4 characters." });
  }
  const isAdmin = trimmed === "admin" || trimmed === "system_admin";

  const users = readJSON(USERS_FILE);
  if (users.find((u: any) => u.username === trimmed)) {
    return res.status(409).json({ error: "Username already exists." });
  }

  const { hash, salt } = hashPassword(password);
  users.push({
    username: trimmed,
    isAdmin,
    hash,
    salt,
    createdAt: new Date().toISOString(),
  });
  writeJSON(USERS_FILE, users);

  const token = generateSessionToken();
  activeSessions.set(token, { username: trimmed, createdAt: Date.now() });

  res.json({ success: true, token, user: { username: trimmed, isAdmin } });
});

// POST /api/auth/google — authenticate with a Google ID token
// Find or create a local account keyed by the Google subject ID, then
// issue the same app session token used by username/password login.
app.post("/api/auth/google", async (req: any, res: any) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: "Google ID token is required." });
  }

  let payload: any;
  try {
    payload = await verifyGoogleIdToken(idToken);
  } catch (err: any) {
    return res
      .status(401)
      .json({ error: err.message || "Google ID token verification failed." });
  }
  if (!payload || !payload.sub) {
    return res.status(401).json({ error: "Invalid Google ID token." });
  }

  const googleId = `google:${payload.sub}`;
  const email = payload.email ? payload.email.toLowerCase() : googleId;
  const displayName = payload.name || payload.email || googleId;

  const users = readJSON(USERS_FILE);
  let user =
    users.find((u: any) => u.googleId === googleId) ||
    users.find((u: any) => u.username === email);

  if (!user) {
    // Auto-provision an account for first-time Google sign-in.
    user = {
      username: email,
      displayName,
      googleId,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeJSON(USERS_FILE, users);
  }

  const token = generateSessionToken();
  activeSessions.set(token, { username: user.username, createdAt: Date.now() });
  res.json({
    success: true,
    token,
    user: { username: user.username, isAdmin: !!user.isAdmin },
  });
});
app.post("/api/auth/login", (req: any, res: any) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }
  const trimmed = username.trim().toLowerCase();
  const users = readJSON(USERS_FILE);
  const user = users.find((u: any) => u.username === trimmed);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  if (!verifyPassword(password, user.hash, user.salt)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const token = generateSessionToken();
  activeSessions.set(token, { username: trimmed, createdAt: Date.now() });
  res.json({
    success: true,
    token,
    user: { username: trimmed, isAdmin: user.isAdmin },
  });
});

// POST /api/auth/logout — invalidate session token
app.post("/api/auth/logout", (req: any, res: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// GET /api/auth/me — validate token and return current user
app.get("/api/auth/me", (req: any, res: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided." });
  }
  const token = authHeader.slice(7);
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
  const users = readJSON(USERS_FILE);
  const user = users.find((u: any) => u.username === session.username);
  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }
  res.json({
    success: true,
    user: { username: user.username, isAdmin: user.isAdmin },
  });
});

// GET /api/auth/users — list all users (admin only)
app.get("/api/auth/users", authMiddleware, (req: any, res: any) => {
  const users = readJSON(USERS_FILE);
  const caller = users.find((u: any) => u.username === req.user);
  if (!caller || !caller.isAdmin) {
    return res.status(403).json({ error: "Admin access required." });
  }
  const safeList = users.map((u: any) => ({
    username: u.username,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
  }));
  res.json({ success: true, users: safeList });
});

// POST /api/auth/admin/delete-user — admin delete a user
app.post(
  "/api/auth/admin/delete-user",
  authMiddleware,
  (req: any, res: any) => {
    const { username } = req.body;
    const users = readJSON(USERS_FILE);
    const caller = users.find((u: any) => u.username === req.user);
    if (!caller || !caller.isAdmin) {
      return res.status(403).json({ error: "Admin access required." });
    }
    const updatedUsers = users.filter((u: any) => u.username !== username);
    writeJSON(USERS_FILE, updatedUsers);
    const allDocs = readJSON(DOCUMENTS_FILE);
    const filteredDocs = allDocs.filter((d: any) => d.username !== username);
    writeJSON(DOCUMENTS_FILE, filteredDocs);
    for (const [token, session] of activeSessions) {
      if (session.username === username) {
        activeSessions.delete(token);
      }
    }
    res.json({ success: true });
  },
);

// ── Document Management Routes ──

// GET /api/documents — fetch current user's documents (auth required)
app.get("/api/documents", authMiddleware, (req: any, res: any) => {
  const allDocs = readJSON(DOCUMENTS_FILE);
  const userDocs = allDocs
    .filter((d: any) => d.username === req.user)
    .sort((a: any, b: any) => b.timestamp - a.timestamp);
  res.json({ success: true, documents: userDocs });
});

// POST /api/documents — save a new document (auto-saves on generation)
app.post("/api/documents", authMiddleware, (req: any, res: any) => {
  const { type, name, data } = req.body;
  if (!type || !name) {
    return res.status(400).json({ error: "type and name are required." });
  }
  const newDoc = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    username: req.user,
    type,
    name,
    timestamp: Date.now(),
    data: data || {},
  };
  const allDocs = readJSON(DOCUMENTS_FILE);
  allDocs.push(newDoc);
  writeJSON(DOCUMENTS_FILE, allDocs);
  res.json({ success: true, document: newDoc });
});

// DELETE /api/documents/:id — delete one of current user's documents
app.delete("/api/documents/:id", authMiddleware, (req: any, res: any) => {
  const { id } = req.params;
  let allDocs = readJSON(DOCUMENTS_FILE);
  const doc = allDocs.find((d: any) => d.id === id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found." });
  }
  if (doc.username !== req.user) {
    return res
      .status(403)
      .json({ error: "You can only delete your own documents." });
  }
  allDocs = allDocs.filter((d: any) => d.id !== id);
  writeJSON(DOCUMENTS_FILE, allDocs);
  res.json({ success: true });
});

// DELETE /api/documents/admin/:username/:id — admin delete any user's doc
app.delete(
  "/api/documents/admin/:username/:id",
  authMiddleware,
  (req: any, res: any) => {
    const users = readJSON(USERS_FILE);
    const caller = users.find((u: any) => u.username === req.user);
    if (!caller || !caller.isAdmin) {
      return res.status(403).json({ error: "Admin access required." });
    }
    const { username, id } = req.params;
    let allDocs = readJSON(DOCUMENTS_FILE);
    allDocs = allDocs.filter(
      (d: any) => !(d.username === username && d.id === id),
    );
    writeJSON(DOCUMENTS_FILE, allDocs);
    res.json({ success: true });
  },
);

// ─────────────────────────────────────────────────────────
//  LLM TRANSACTION GENERATOR (Gemini)
//  Generates realistic bank-statement transactions from a free
//  natural-language prompt. Response is strict JSON the React
//  BankStatementGenerator can drop straight into its table.
// ─────────────────────────────────────────────────────────

interface LlmTransaction {
  date: string; // YYYY-MM-DD, within startDate..endDate
  description: string;
  type: "deposit" | "withdrawal";
  amount: number; // positive, 2 decimals
}

interface GenRequest {
  prompt?: string;
  startDate?: string;
  endDate?: string;
  startBalance?: number;
  count?: number;
  bankName?: string;
  holderName?: string;
}

/** Combined request/response JSON sent to Gemini. */
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  text?: string;
  [k: string]: unknown;
}

/**
 * Strip code fences and extract the first {...} JSON object from a
 * possibly-chatty model response. Returns null when no object is found.
 */
function extractJsonObject(raw: string): Record<string, unknown> | null {
  let s = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences.
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  const candidate = s.slice(first, last + 1);
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Validate / coerce one transaction object from the model output.
 * Returns null if the row is unusable.
 */
function coerceTransaction(
  t: unknown,
  startDate: string,
  endDate: string,
): LlmTransaction | null {
  if (!t || typeof t !== "object") return null;
  const obj = t as Record<string, unknown>;
  const type: "deposit" | "withdrawal" =
    String(obj.type ?? "").toLowerCase() === "deposit"
      ? "deposit"
      : "withdrawal";
  let amount =
    typeof obj.amount === "number"
      ? obj.amount
      : parseFloat(String(obj.amount));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  amount = Math.round(amount * 100) / 100;

  // Date handling: coerce to YYYY-MM-DD and clamp into the period.
  let date = String(obj.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return null;
    date = parsed.toISOString().split("T")[0];
  }
  if (date < startDate) date = startDate;
  if (date > endDate) date = endDate;

  const description = String(obj.description ?? "")
    .trim()
    .slice(0, 120);
  if (!description) return null;

  return { date, description, type, amount };
}

// POST /api/llm/generate-transactions — generate realistic transactions via Gemini
app.post(
  "/api/llm/generate-transactions",
  async (req: Request, res: Response) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
    if (!GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const {
      prompt,
      startDate = "2026-05-01",
      endDate = "2026-05-31",
      startBalance = 0,
      count = 12,
      bankName = "Apex International Bank",
      holderName = "John Doe",
    }: GenRequest = req.body || {};

    const userPrompt = (prompt || "").trim();
    if (!userPrompt) {
      return res
        .status(400)
        .json({
          error: "A prompt describing the desired transactions is required.",
        });
    }

    // Clamp count to a sane range.
    const n = Math.max(1, Math.min(40, parseInt(String(count), 10) || 12));

    // Build the instruction that constrains the model to the statement period
    // and the exact JSON schema the frontend expects.
    const systemInstruction =
      "You generate realistic bank-statement transactions for a fictional statement. " +
      "Return ONLY a JSON object — no prose, no code fence, no commentary — with the shape " +
      '{"transactions": [{"date":"YYYY-MM-DD","description":"string","type":"deposit|withdrawal","amount":number}]}. ' +
      `All dates MUST fall between ${startDate} and ${endDate} inclusive and be realistic for that period. ` +
      "Amounts are positive USD numbers with 2 decimals. Descriptions are concise merchant/memo names " +
      '(max ~80 chars). The type field is literally "deposit" or "withdrawal".';

    const userText =
      `Generate ${n} transactions for the ${endDate} statement of ${holderName} at ${bankName} ` +
      `(${startDate} to ${endDate}, starting balance $${Number(startBalance).toFixed(2)}).\n\n` +
      `User request: "${userPrompt}"`;

    try {
      const model = "gemini-3.6-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!resp.ok) {
        const errTxt = await resp.text();
        return res
          .status(502)
          .json({
            error: `Gemini request failed (${resp.status}): ${errTxt.slice(0, 500)}`,
          });
      }

      const data: GeminiResponse = (await resp.json()) as GeminiResponse;
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const raw: string =
        parts.map((p) => p.text || "").join("") ||
        (typeof data?.text === "string" ? data.text : JSON.stringify(data));

      const parsed = extractJsonObject(raw);
      if (!parsed) {
        return res
          .status(502)
          .json({
            error: "Gemini returned non-JSON output.",
            raw: raw.slice(0, 1000),
          });
      }

      let list: unknown[];
      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (
        Array.isArray((parsed as Record<string, unknown[]>).transactions)
      ) {
        list = (parsed as Record<string, unknown[]>).transactions;
      } else if (Array.isArray((parsed as Record<string, unknown[]>).items)) {
        list = (parsed as Record<string, unknown[]>).items;
      } else {
        list = [];
      }

      const validated: LlmTransaction[] = list
        .map((t) => coerceTransaction(t, startDate, endDate))
        .filter((t): t is LlmTransaction => t !== null)
        .slice(0, n);

      if (validated.length === 0) {
        return res
          .status(502)
          .json({
            error: "Gemini produced no usable transactions.",
            raw: raw.slice(0, 1000),
          });
      }

      res.json({ success: true, transactions: validated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Transaction generation failed: ${msg}` });
    }
  },
);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "generator-site-api" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Generator Site API is listening!`);
  console.log(` Port: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
