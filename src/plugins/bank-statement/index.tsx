import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Printer,
  FolderHeart,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "deposit" | "withdrawal";
  amount: number;
  balance: number;
}

export const BankStatementGenerator: React.FC = () => {
  const { currentUser, saveDoc, loadedDoc, clearLoadedDoc } = useAuth();

  // Setup standard state with high fidelity defaults
  const [bankName, setBankName] = useState("Apex International Bank");
  const [bankAddress, setBankAddress] = useState(
    "100 Financial Plaza, New York, NY 10005",
  );
  const [routingNumber, setRoutingNumber] = useState("021000021");
  const [accountNumber, setAccountNumber] = useState("123456789012");
  const [holderName, setHolderName] = useState("John Doe");
  const [holderAddress, setHolderAddress] = useState(
    "742 Evergreen Terrace, Springfield, OR 97477",
  );
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-31");
  const [startBalance, setStartBalance] = useState(14850.5);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      date: "2026-05-02",
      description: "Payroll Direct Deposit - Acme Corp",
      type: "deposit",
      amount: 3450.0,
      balance: 0,
    },
    {
      id: "2",
      date: "2026-05-05",
      description: "Supermarket Store 421",
      type: "withdrawal",
      amount: 124.32,
      balance: 0,
    },
    {
      id: "3",
      date: "2026-05-12",
      description: "Electric Utility Bill Pay",
      type: "withdrawal",
      amount: 85.0,
      balance: 0,
    },
    {
      id: "4",
      date: "2026-05-15",
      description: "Online Retailer Purchase",
      type: "withdrawal",
      amount: 45.99,
      balance: 0,
    },
    {
      id: "5",
      date: "2026-05-20",
      description: "ATM Cash Withdrawal",
      type: "withdrawal",
      amount: 200.0,
      balance: 0,
    },
    {
      id: "6",
      date: "2026-05-25",
      description: "Mobile Deposit Check",
      type: "deposit",
      amount: 1250.0,
      balance: 0,
    },
  ]);

  // Recalculate balances automatically whenever starting balance or transactions modify
  // Running balance + totals are derived state; useMemo keeps them in sync
  // with `transactions`/`startBalance` without setState-in-effect. Single
  // reduce pass — no closure-variable reassignment inside .map.
  const { calcRows: calculatedTransactions, calcTotals: totals } =
    React.useMemo(() => {
      const sorted = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const acc = sorted.reduce(
        (s, t) => {
          const delta = t.type === "deposit" ? t.amount : -t.amount;
          const nextBalance = s.balance + delta;
          const row: Transaction = { ...t, balance: nextBalance };
          return {
            balance: nextBalance,
            depTotal: s.depTotal + (t.type === "deposit" ? t.amount : 0),
            withTotal: s.withTotal + (t.type === "withdrawal" ? t.amount : 0),
            rows: [...s.rows, row],
          };
        },
        {
          balance: startBalance,
          depTotal: 0,
          withTotal: 0,
          rows: [] as Transaction[],
        },
      );

      return {
        calcRows: acc.rows,
        calcTotals: {
          totalDeposits: acc.depTotal,
          totalWithdrawals: acc.withTotal,
          endingBalance: acc.balance,
        },
      };
    }, [transactions, startBalance]);

  // LLM (Gemini) transaction generation state
  const [aiPrompt, setAiPrompt] = useState(
    "A typical month: two payroll deposits, rent, groceries, utilities, gas, a couple of dining-out charges, and one refund.",
  );
  const [aiCount, setAiCount] = useState(12);
  const [aiMode, setAiMode] = useState<"replace" | "append">("replace");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAiGenerate = async () => {
    if (aiLoading) return;
    setAiError("");
    if (!aiPrompt.trim()) {
      setAiError("Enter a prompt first.");
      return;
    }
    setAiLoading(true);
    try {
      const resp = await fetch("/api/llm/generate-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          startDate,
          endDate,
          startBalance,
          count: aiCount,
          bankName,
          holderName,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || `Request failed (${resp.status})`);
      }
      const incoming: Transaction[] = (data.transactions || []).map(
        (
          t: {
            date: string;
            description: string;
            type: "deposit" | "withdrawal";
            amount: number;
          },
          i: number,
        ) => ({
          id: `ai-${Date.now()}-${i}`,
          date: t.date,
          description: t.description,
          type: t.type,
          amount: t.amount,
          balance: 0,
        }),
      );
      setTransactions((prev) =>
        aiMode === "append" ? [...prev, ...incoming] : incoming,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  // Hydrate form fields when a saved document is loaded for editing. The
  // React docs' approved pattern for "adjust state when a prop changes" is a
  // render-time check guarded by a marker (here loadedDocId), NOT a setState-in
  // useEffect. This avoids cascading renders and the eslint set-state-in-effect
  // rule. `clearLoadedDoc` is called during the same render pass that consumes
  // the doc, which is safe because it only mutates context state.
  const [loadedDocId, setLoadedDocId] = useState<string | null>(null);
  if (loadedDoc && loadedDoc.id !== loadedDocId) {
    if (loadedDoc.type === "bank-statement-gen") {
      const d = loadedDoc.data || {};
      setBankName(d.bankName || "");
      setBankAddress(d.bankAddress || "");
      setRoutingNumber(d.routingNumber || "");
      setAccountNumber(d.accountNumber || "");
      setHolderName(d.holderName || "");
      setHolderAddress(d.holderAddress || "");
      setStartDate(d.startDate || "");
      setEndDate(d.endDate || "");
      setStartBalance(d.startBalance || 0);
      setTransactions(d.transactions || []);
    }
    setLoadedDocId(loadedDoc.id);
  }
  // Clear the loaded doc from context once consumed (one-shot).
  useEffect(() => {
    if (loadedDoc && loadedDoc.id === loadedDocId) {
      clearLoadedDoc();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedDoc, loadedDocId]);

  const addTransaction = () => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      date: endDate,
      description: "New Transaction",
      type: "withdrawal",
      amount: 100.0,
      balance: 0,
    };
    setTransactions([...transactions, newTx]);
  };

  const updateTransaction = (
    id: string,
    field: keyof Transaction,
    value: string | number,
  ) => {
    const updated = transactions.map((t) => {
      if (t.id === id) {
        let val: string | number = value;
        if (field === "amount") {
          val = parseFloat(String(value)) || 0;
        }
        return { ...t, [field]: val };
      }
      return t;
    });
    setTransactions(updated);
  };

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const triggerRandomGeneration = () => {
    const descriptions = [
      { desc: "Gas Station Fuel", type: "withdrawal", range: [30, 80] },
      { desc: "Local Coffee Shop", type: "withdrawal", range: [5, 20] },
      { desc: "Streaming Subscription", type: "withdrawal", range: [10, 25] },
      { desc: "Zelle Transfer Received", type: "deposit", range: [50, 400] },
      { desc: "Restaurant Dining Out", type: "withdrawal", range: [40, 150] },
      { desc: "Cell Phone Bill Pay", type: "withdrawal", range: [70, 130] },
      { desc: "ACH Payroll Credit", type: "deposit", range: [2000, 4500] },
      { desc: "Online Marketplace Refund", type: "deposit", range: [20, 100] },
      { desc: "Office Supply Depot", type: "withdrawal", range: [25, 200] },
    ];

    const randomCount = Math.floor(Math.random() * 5) + 6; // 6 to 10 random transactions
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    const range = endTimestamp - startTimestamp;

    const newTxs: Transaction[] = Array.from({ length: randomCount }).map(
      (_, i) => {
        const randomItem =
          descriptions[Math.floor(Math.random() * descriptions.length)];
        const randomDate = new Date(startTimestamp + Math.random() * range)
          .toISOString()
          .split("T")[0];
        const randomAmount = parseFloat(
          (
            Math.random() * (randomItem.range[1] - randomItem.range[0]) +
            randomItem.range[0]
          ).toFixed(2),
        );

        return {
          id: `rand-${i}-${Date.now()}`,
          date: randomDate,
          description: randomItem.desc,
          type: randomItem.type as "deposit" | "withdrawal",
          amount: randomAmount,
          balance: 0,
        };
      },
    );

    setTransactions(newTxs);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!currentUser) return;
    const defaultName = `${bankName} - ${holderName} (${startDate} to ${endDate})`;
    const docName = prompt(
      "Enter a name for this saved statement:",
      defaultName,
    );
    if (docName === null) return;

    const finalName = docName.trim() || defaultName;
    saveDoc("bank-statement-gen", finalName, {
      bankName,
      bankAddress,
      routingNumber,
      accountNumber,
      holderName,
      holderAddress,
      startDate,
      endDate,
      startBalance,
      transactions,
    });
    alert("Statement saved to your dashboard!");
  };

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      className="no-print-grid"
    >
      {/* Editor Panel */}
      <div className="glass-card form-container">
        <h2
          style={{ marginBottom: "1.5rem", fontWeight: 700 }}
          className="title-gradient"
        >
          Statement Configuration
        </h2>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Bank Name</label>
            <input
              className="input-field"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Routing Number</label>
            <input
              className="input-field"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Bank Address</label>
          <input
            className="input-field"
            value={bankAddress}
            onChange={(e) => setBankAddress(e.target.value)}
          />
        </div>

        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input
              className="input-field"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Starting Balance ($)</label>
            <input
              className="input-field"
              type="number"
              step="0.01"
              value={startBalance}
              onChange={(e) => setStartBalance(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <h3
          style={{
            margin: "1.5rem 0 0.75rem",
            fontSize: "1.1rem",
            color: "var(--text-primary)",
          }}
        >
          Account Holder
        </h3>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className="input-field"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input
            className="input-field"
            value={holderAddress}
            onChange={(e) => setHolderAddress(e.target.value)}
          />
        </div>

        <h3
          style={{
            margin: "1.5rem 0 0.75rem",
            fontSize: "1.1rem",
            color: "var(--text-primary)",
          }}
        >
          Statement Period
        </h3>
        <div className="input-grid">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              className="input-field"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              className="input-field"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "2rem 0 1rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Transactions List
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary"
              onClick={triggerRandomGeneration}
              title="Simulate ledger activity"
            >
              <RefreshCw size={14} /> Auto-Generate
            </button>
            <button className="btn btn-primary" onClick={addTransaction}>
              <Plus size={14} /> Add Row
            </button>
          </div>
        </div>

        {/* AI / LLM transaction generator */}
        <div
          style={{
            margin: "0 0 1rem",
            padding: "0.85rem",
            borderRadius: "8px",
            border: "1px solid var(--border, rgba(255,255,255,0.12))",
            background: "var(--glass-bg, rgba(255,255,255,0.04))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              marginBottom: "0.5rem",
            }}
          >
            <Sparkles size={15} style={{ color: "var(--accent-solid)" }} />
            <strong style={{ fontSize: "0.95rem" }}>
              AI Transaction Generator
            </strong>
          </div>
          <p
            style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0 0 0.55rem" }}
          >
            Describe the activity in plain English. The LLM returns realistic
            transactions dated within your statement period.
          </p>
          <textarea
            className="input-field"
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Tech worker month: salary, rent, AWS bill, groceries, Uber, one refund, gym membership"
            style={{
              width: "100%",
              resize: "vertical",
              padding: "0.5rem",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <label
              style={{
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              Count
              <input
                type="number"
                min={1}
                max={40}
                value={aiCount}
                onChange={(e) =>
                  setAiCount(
                    Math.max(1, Math.min(40, parseInt(e.target.value) || 12)),
                  )
                }
                className="input-field"
                style={{
                  width: "70px",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </label>
            <select
              className="input-field"
              value={aiMode}
              onChange={(e) =>
                setAiMode(e.target.value as "replace" | "append")
              }
              style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
            >
              <option value="replace">Replace existing</option>
              <option value="append">Append to list</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={handleAiGenerate}
              disabled={aiLoading}
              style={{ marginLeft: "auto" }}
            >
              {aiLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {aiLoading ? "Generating…" : "Generate with AI"}
            </button>
          </div>
          {aiError && (
            <p
              style={{
                color: "var(--danger, #e57373)",
                fontSize: "0.8rem",
                margin: "0.55rem 0 0",
              }}
            >
              {aiError}
            </p>
          )}
        </div>

        <div
          className="table-container"
          style={{ maxHeight: "350px", overflowY: "auto" }}
        >
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th style={{ width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <input
                      type="date"
                      className="input-field"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                      value={tx.date}
                      onChange={(e) =>
                        updateTransaction(tx.id, "date", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                      value={tx.description}
                      onChange={(e) =>
                        updateTransaction(tx.id, "description", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      className="input-field"
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.8rem",
                        minWidth: "95px",
                      }}
                      value={tx.type}
                      onChange={(e) =>
                        updateTransaction(tx.id, "type", e.target.value)
                      }
                    >
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                      value={tx.amount}
                      onChange={(e) =>
                        updateTransaction(tx.id, "amount", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "0.3rem", borderRadius: "4px" }}
                      onClick={() => removeTransaction(tx.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          {currentUser && (
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={handleSave}
            >
              <FolderHeart size={16} style={{ color: "var(--accent-solid)" }} />{" "}
              Save to Dashboard
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ flex: currentUser ? 1 : "100%" }}
            onClick={handlePrint}
          >
            <Printer size={16} /> Print or Save as PDF
          </button>
        </div>
      </div>

      {/* PDF High-Fidelity Preview Pane */}
      <div
        className="print-preview-pane-container"
        style={{ position: "sticky", top: "2rem", alignSelf: "start" }}
      >
        <h2
          style={{ marginBottom: "1.5rem", fontWeight: 700 }}
          className="no-print title-gradient"
        >
          Interactive PDF Preview
        </h2>

        <div
          className="print-preview-pane"
          style={{
            background: "#ffffff",
            color: "#1a1a1a",
            padding: "2.5rem",
            borderRadius: "8px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            fontFamily: "Georgia, serif",
            fontSize: "12px",
            lineHeight: "1.4",
            minHeight: "800px",
            overflowY: "auto",
          }}
        >
          {/* Statement Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "2px solid #333",
              paddingBottom: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "22px",
                  margin: 0,
                  fontWeight: "bold",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {bankName || "BANK NAME"}
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#666",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "10px",
                }}
              >
                {bankAddress}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2
                style={{
                  fontSize: "16px",
                  margin: 0,
                  textTransform: "uppercase",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  color: "#444",
                }}
              >
                Account Statement
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "11px",
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}
              >
                Period: <strong>{startDate}</strong> to{" "}
                <strong>{endDate}</strong>
              </p>
            </div>
          </div>

          {/* Account details and balances */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                border: "1px solid #ccc",
                padding: "1rem",
                borderRadius: "4px",
                background: "#fafafa",
              }}
            >
              <h3
                style={{
                  textTransform: "uppercase",
                  fontSize: "10px",
                  color: "#666",
                  marginTop: 0,
                  fontFamily: "Helvetica, Arial, sans-serif",
                  borderBottom: "1px solid #ddd",
                  paddingBottom: "4px",
                }}
              >
                Prepared For
              </h3>
              <p
                style={{
                  margin: "8px 0 2px",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                {holderName}
              </p>
              <p style={{ margin: 0, color: "#444", whiteSpace: "pre-line" }}>
                {holderAddress}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "2px",
                }}
              >
                <span style={{ color: "#555" }}>Routing Number:</span>
                <strong style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                  {routingNumber}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "2px",
                }}
              >
                <span style={{ color: "#555" }}>Account Number:</span>
                <strong style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                  {accountNumber}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "2px",
                }}
              >
                <span style={{ color: "#555" }}>Statement Date:</span>
                <span>{endDate}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary Box */}
          <div
            style={{
              background: "#333",
              color: "#fff",
              borderRadius: "4px",
              padding: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
              textAlign: "center",
              marginBottom: "2.5rem",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: "4px",
                }}
              >
                Starting Balance
              </div>
              <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                {formatCurrency(startBalance)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: "4px",
                }}
              >
                Total Deposits
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#81c784",
                }}
              >
                {formatCurrency(totals.totalDeposits)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: "4px",
                }}
              >
                Total Withdrawals
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#e57373",
                }}
              >
                {formatCurrency(totals.totalWithdrawals)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: "4px",
                }}
              >
                Ending Balance
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#64b5f6",
                }}
              >
                {formatCurrency(totals.endingBalance)}
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <h3
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              textTransform: "uppercase",
              fontSize: "11px",
              borderBottom: "1px solid #333",
              paddingBottom: "6px",
              marginBottom: "10px",
            }}
          >
            Transaction History
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #333",
                  textAlign: "left",
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}
              >
                <th style={{ padding: "6px 4px", width: "85px" }}>Date</th>
                <th style={{ padding: "6px 4px" }}>Description</th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "right",
                    width: "100px",
                  }}
                >
                  Withdrawals (-)
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "right",
                    width: "100px",
                  }}
                >
                  Deposits (+)
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "right",
                    width: "110px",
                  }}
                >
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{
                  borderBottom: "1px dotted #ccc",
                  background: "#fcfcfc",
                }}
              >
                <td style={{ padding: "6px 4px", color: "#666" }}>
                  {startDate}
                </td>
                <td style={{ padding: "6px 4px", fontStyle: "italic" }}>
                  STARTING BALANCE Balance Forward
                </td>
                <td style={{ padding: "6px 4px", textAlign: "right" }}>-</td>
                <td style={{ padding: "6px 4px", textAlign: "right" }}>-</td>
                <td
                  style={{
                    padding: "6px 4px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {formatCurrency(startBalance)}
                </td>
              </tr>
              {calculatedTransactions.map((tx, idx) => (
                <tr
                  key={tx.id || idx}
                  style={{
                    borderBottom: "1px solid #eee",
                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                    {tx.date}
                  </td>
                  <td style={{ padding: "6px 4px", wordBreak: "break-word" }}>
                    {tx.description}
                  </td>
                  <td
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                      color: tx.type === "withdrawal" ? "#b71c1c" : "#555",
                    }}
                  >
                    {tx.type === "withdrawal" ? formatCurrency(tx.amount) : "-"}
                  </td>
                  <td
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                      color: tx.type === "deposit" ? "#1b5e20" : "#555",
                    }}
                  >
                    {tx.type === "deposit" ? formatCurrency(tx.amount) : "-"}
                  </td>
                  <td
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {formatCurrency(tx.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer note */}
          <div
            style={{
              marginTop: "4rem",
              borderTop: "1px solid #ccc",
              paddingTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
              color: "#777",
              fontSize: "9px",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            <span>Thank you for banking with {bankName}.</span>
            <span>Page 1 of 1</span>
            <span>Apex Statement Service</span>
          </div>
        </div>
      </div>
    </div>
  );
};
