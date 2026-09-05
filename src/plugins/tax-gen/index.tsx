import React, { useState, useRef } from 'react';
import type { W2Data, Form1040Data } from './types';
import W2Form from './W2Form';
import Form1040 from './Form1040';
import W2InputForm from './W2InputForm';
import Form1040InputForm from './Form1040InputForm';
import './W2Form.css';
import './Form1040.css';

// Inline the InputForm.css styles
const inputFormStyles = `
/* Input Form Styles */
.input-form {
  max-width: 720px;
  margin: 0 auto;
}

.input-form-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn-mock,
.btn-calc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-mock {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
}

.btn-mock:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-calc {
  background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 176, 155, 0.35);
}

.btn-calc:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 176, 155, 0.5);
}

/* Sections */
.input-section {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.input-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #e0e0ff;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

/* Grid */
.input-grid {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.input-grid:last-child {
  margin-bottom: 0;
}

.input-grid-1 > .input-field {
  flex: 1;
}

.input-grid-3 > .input-field {
  flex: 1;
}

.input-grid-4 > .input-field {
  flex: 1;
}

/* Fields */
.input-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.input-field-wide {
  flex: 2 !important;
}

.input-field label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-field input,
.input-field select {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
}

.input-field input:focus,
.input-field select:focus {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.input-field input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.input-field select option {
  background: #1a1a2e;
  color: #fff;
}

.input-field input[type="number"]::-webkit-outer-spin-button,
.input-field input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-field input[type="number"] {
  -moz-appearance: textfield;
}

/* Checkboxes */
.input-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 4px 0;
}

.input-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.input-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
  cursor: pointer;
}

/* Generate Button */
.btn-generate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 24px;
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.35);
  letter-spacing: 0.3px;
}

.btn-generate:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 35px rgba(102, 126, 234, 0.5);
}

.btn-generate:active {
  transform: translateY(-1px);
}

/* Tab styles */
.tax-tab-container {
  margin-bottom: 2rem;
}

.tax-tab-switcher {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 4px;
}

.tax-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: var(--text-secondary);
  flex: 1;
  justify-content: center;
}

.tax-tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.tax-tab-btn.tax-tab-active {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.tax-tab-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  font-weight: 500;
}

.tax-tab-btn.tax-tab-active .tax-tab-badge {
  background: rgba(255, 255, 255, 0.2);
}

/* Preview controls */
.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  transform: translateY(-1px);
}

.btn-print {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.35);
}

.btn-print:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.5);
}

.btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.35);
}

.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.5);
}

.preview-wrapper {
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  overflow-x: auto;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
}
`;

type TabType = 'w2' | '1040';

export const TaxDocumentGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('w2');
  const [w2Data, setW2Data] = useState<W2Data | null>(null);
  const [form1040Data, setForm1040Data] = useState<Form1040Data | null>(null);
  const [viewMode, setViewMode] = useState<'input' | 'preview'>('input');
  const printRef = useRef<HTMLDivElement>(null);

  const handleW2Generate = (data: W2Data) => {
    setW2Data(data);
    setViewMode('preview');
  };

  const handleForm1040Generate = (data: Form1040Data) => {
    setForm1040Data(data);
    setViewMode('preview');
  };

  const goBack = () => setViewMode('input');

  const handlePrint = (docTitle: string) => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>${docTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #fff; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
        ${Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('')}
      </head>
      <body>
        ${printRef.current.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleDownloadPDF = async (fileName: string, pageSelector: string) => {
    if (!printRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const pages = printRef.current.querySelectorAll(pageSelector);
      if (pages.length === 0) return;

      const pdf = new jsPDF('p', 'in', 'letter');
      let firstPage = true;

      for (const page of Array.from(pages)) {
        const canvas = await html2canvas(page as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 8.5;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!firstPage) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        firstPage = false;
      }

      pdf.save(`${fileName}_${new Date().getFullYear()}.pdf`);
    } catch (e) {
      console.error('PDF generation requires html2canvas and jspdf dependencies');
      alert('PDF generation failed. Please ensure html2canvas and jspdf are installed:\nnpm install html2canvas jspdf');
    }
  };

  return (
    <div>
      <style>{inputFormStyles}</style>
      
      <p className="page-subtitle">Generate IRS Form W-2 and Form 1040 documents</p>

      {viewMode === 'input' ? (
        <>
          <div className="tax-tab-container">
            <div className="tax-tab-switcher">
              <button
                className={`tax-tab-btn ${activeTab === 'w2' ? 'tax-tab-active' : ''}`}
                onClick={() => setActiveTab('w2')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <path d="M8 7h8" />
                  <path d="M8 11h8" />
                  <path d="M8 15h4" />
                </svg>
                Form W-2
                <span className="tax-tab-badge">Wage & Tax</span>
              </button>
              <button
                className={`tax-tab-btn ${activeTab === '1040' ? 'tax-tab-active' : ''}`}
                onClick={() => setActiveTab('1040')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
                Form 1040
                <span className="tax-tab-badge">Income Tax</span>
              </button>
            </div>
          </div>

          <div className="form-container">
            {activeTab === 'w2' ? (
              <W2InputForm onGenerate={handleW2Generate} />
            ) : (
              <Form1040InputForm onGenerate={handleForm1040Generate} />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="preview-controls">
            <button className="btn-back" onClick={goBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Back to Editor
            </button>
            <div className="preview-actions">
              <button className="btn-print" onClick={() => handlePrint(activeTab === 'w2' ? 'W-2' : 'Form 1040')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
              <button
                className="btn-download"
                onClick={() =>
                  handleDownloadPDF(activeTab === 'w2' ? 'W-2' : 'Form-1040', activeTab === 'w2' ? '.w2-page' : '.f1040-page')
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>

          <div className="preview-wrapper">
            <div ref={printRef}>
              {activeTab === 'w2' && w2Data && <W2Form data={w2Data} />}
              {activeTab === '1040' && form1040Data && <Form1040 data={form1040Data} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
