'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, X, Loader2 } from 'lucide-react';
import { AuditRecord, TransactionContext } from '@/lib/types';

interface ExportReportProps {
  auditRecord: AuditRecord | null;
  context: TransactionContext;
}

export default function ExportReport({ auditRecord, context }: ExportReportProps) {
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateReport = async () => {
    if (!auditRecord) return;

    setExporting(true);

    // Generate HTML report
    const selectedScore = auditRecord.scoreBreakdown.find(s => s.tokenId === auditRecord.selectedRoute);
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SwipeSmart Decision Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      background: #f5f5f7;
      color: #1d1d1f;
      padding: 40px;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #d2d2d7;
    }
    .header h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; }
    .header p { color: #86868b; font-size: 14px; }
    .section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1d1d1f;
    }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .metric { padding: 16px; background: #f5f5f7; border-radius: 8px; }
    .metric-label { font-size: 12px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { font-size: 24px; font-weight: 600; margin-top: 4px; }
    .metric-value.green { color: #30d158; }
    .metric-value.blue { color: #0a84ff; }
    .metric-value.orange { color: #ff9f0a; }
    .score-bar {
      height: 8px;
      background: #e5e5ea;
      border-radius: 4px;
      margin-top: 8px;
      overflow: hidden;
    }
    .score-fill { height: 100%; border-radius: 4px; }
    .token-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f5f5f7;
    }
    .token-row:last-child { border-bottom: none; }
    .token-rank {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      margin-right: 12px;
    }
    .token-rank.first { background: #30d158; color: white; }
    .token-rank.other { background: #f5f5f7; color: #86868b; }
    .token-info { flex: 1; }
    .token-name { font-weight: 500; }
    .token-score { font-family: 'SF Mono', monospace; font-weight: 600; }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #d2d2d7;
      color: #86868b;
      font-size: 12px;
    }
    @media print {
      body { background: white; padding: 20px; }
      .section { box-shadow: none; border: 1px solid #e5e5ea; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SwipeSmart Decision Report</h1>
      <p>Generated ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
      <h2>Transaction Details</h2>
      <div class="grid">
        <div class="metric">
          <div class="metric-label">Amount</div>
          <div class="metric-value">$${context.amount.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Merchant</div>
          <div class="metric-value">${context.merchant}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Category</div>
          <div class="metric-value">${context.category || 'General'}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Country</div>
          <div class="metric-value">${context.country}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Decision Summary</h2>
      <div class="grid">
        <div class="metric">
          <div class="metric-label">Selected Token</div>
          <div class="metric-value blue">${auditRecord.selectedRouteName}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Final Score</div>
          <div class="metric-value green">${selectedScore?.finalScore.toFixed(1) || 'N/A'}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Selection Method</div>
          <div class="metric-value">${auditRecord.selectionMethod.type}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Authorization</div>
          <div class="metric-value ${auditRecord.authResult.approved ? 'green' : 'orange'}">
            ${auditRecord.authResult.approved ? 'APPROVED' : 'DECLINED'}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Score Breakdown</h2>
      ${selectedScore ? `
      <div class="grid">
        <div class="metric">
          <div class="metric-label">Rewards</div>
          <div class="metric-value">${selectedScore.subscores.rewards.weighted.toFixed(1)}</div>
          <div class="score-bar"><div class="score-fill" style="width: ${selectedScore.subscores.rewards.normalized}%; background: #30d158;"></div></div>
        </div>
        <div class="metric">
          <div class="metric-label">Credit Health</div>
          <div class="metric-value">${selectedScore.subscores.credit.weighted.toFixed(1)}</div>
          <div class="score-bar"><div class="score-fill" style="width: ${selectedScore.subscores.credit.normalized}%; background: #64d2ff;"></div></div>
        </div>
        <div class="metric">
          <div class="metric-label">Cash Flow</div>
          <div class="metric-value">${selectedScore.subscores.cashflow.weighted.toFixed(1)}</div>
          <div class="score-bar"><div class="score-fill" style="width: ${selectedScore.subscores.cashflow.normalized}%; background: #ff9f0a;"></div></div>
        </div>
        <div class="metric">
          <div class="metric-label">Risk</div>
          <div class="metric-value">${selectedScore.subscores.risk.weighted.toFixed(1)}</div>
          <div class="score-bar"><div class="score-fill" style="width: ${selectedScore.subscores.risk.normalized}%; background: #ff375f;"></div></div>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <h2>All Candidates</h2>
      ${auditRecord.scoreBreakdown
        .filter(s => !s.excluded)
        .sort((a, b) => b.finalScore - a.finalScore)
        .map((score, idx) => `
        <div class="token-row">
          <div class="token-rank ${idx === 0 ? 'first' : 'other'}">${idx + 1}</div>
          <div class="token-info">
            <div class="token-name">${score.tokenName}</div>
          </div>
          <div class="token-score">${score.finalScore.toFixed(1)}</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Audit Trail</h2>
      <div class="grid">
        <div class="metric">
          <div class="metric-label">Correlation ID</div>
          <div class="metric-value" style="font-size: 14px; font-family: monospace;">${auditRecord.correlationId}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Replay Seed</div>
          <div class="metric-value" style="font-size: 14px; font-family: monospace;">${auditRecord.replaySeed}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Policy Version</div>
          <div class="metric-value">v${auditRecord.policyVersion}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Processing Time</div>
          <div class="metric-value">${auditRecord.processingTimeMs}ms</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>SwipeSmart Engine • Intelligent Payment Routing</p>
      <p>This report is for demonstration purposes only.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swipesmart-report-${auditRecord.correlationId.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={!auditRecord}
        className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono disabled:opacity-50"
        title="Export as report"
      >
        <FileText className="w-3.5 h-3.5" />
        Report
      </button>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface-50 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent-purple" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Export Report</h3>
                    <p className="text-xs text-text-secondary">Download a printable summary</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-tertiary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                <div className="p-4 bg-black/20 rounded-lg mb-4">
                  <p className="text-sm text-text-secondary mb-3">
                    The report includes:
                  </p>
                  <ul className="space-y-2 text-xs text-text-tertiary">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                      Transaction details and context
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                      Decision summary with selected token
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
                      Complete score breakdown
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                      Audit trail with correlation ID
                    </li>
                  </ul>
                </div>

                <button
                  onClick={generateReport}
                  disabled={exporting}
                  className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-accent-purple/20 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/30 transition-all disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download HTML Report
                    </>
                  )}
                </button>

                <p className="text-[10px] text-text-tertiary text-center mt-3">
                  Opens in browser • Print to PDF for best results
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
