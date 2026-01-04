'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, FileText, BookOpen, FileJson, Calculator, ChevronDown, ChevronRight, Info, AlertTriangle, Trophy, XCircle, Shield } from 'lucide-react';
import { TraceData, AuditRecord, LogEntry, ScoreBreakdown, SCORING_GLOSSARY, SensitivityResult, ViolationOverride, StageError, RuleEvaluationResult } from '@/lib/types';
import { computeSensitivity } from '@/lib/scoringEngine';

interface TracePanelProps {
  trace: TraceData | null;
  auditRecord: AuditRecord | null;
  logs: { decision: LogEntry[]; policy: LogEntry[]; risk: LogEntry[] };
  sensitivity: SensitivityResult[];
}

type TabType = 'scoring' | 'trace' | 'logs' | 'explainer' | 'errors' | 'audit';

export default function TracePanel({ trace, auditRecord, logs, sensitivity }: TracePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('scoring');
  const errorCount = auditRecord?.errors?.length || 0;

  const tabs: { id: TabType; label: string; icon: typeof Activity; badge?: number }[] = [
    { id: 'scoring', label: 'Scoring', icon: Calculator },
    { id: 'trace', label: 'Trace', icon: Activity },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'explainer', label: 'Explainer', icon: BookOpen },
    { id: 'errors', label: 'Errors', icon: AlertTriangle, badge: errorCount },
    { id: 'audit', label: 'Audit', icon: FileJson },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button flex items-center gap-1 whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 px-1 py-0.5 text-[9px] bg-error-red/20 text-error-red rounded">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'scoring' && <ScoringTab auditRecord={auditRecord} sensitivity={sensitivity} />}
        {activeTab === 'trace' && <TraceTab trace={trace} />}
        {activeTab === 'logs' && <LogsTab logs={logs} />}
        {activeTab === 'explainer' && <ExplainerTab auditRecord={auditRecord} />}
        {activeTab === 'errors' && <ErrorsTab auditRecord={auditRecord} />}
        {activeTab === 'audit' && <AuditTab auditRecord={auditRecord} />}
      </div>
    </div>
  );
}

function ScoringTab({ auditRecord, sensitivity }: { auditRecord: AuditRecord | null; sensitivity: SensitivityResult[] }) {
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);

  if (!auditRecord) {
    return <EmptyState icon={Calculator} text="Run pipeline to see scoring model" />;
  }

  const weights = auditRecord.weightsUsed;
  const candidates = auditRecord.candidateScores.sort((a, b) => b.finalScore - a.finalScore);
  const sensitivityChanges = sensitivity.filter(s => s.winnerChanged);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* Scoring Model Explanation */}
      <div className="p-3 bg-void-light rounded border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-300">Scoring Model</span>
          <button onClick={() => setShowGlossary(!showGlossary)} className="text-[10px] text-neon-cyan flex items-center gap-1">
            <Info className="w-3 h-3" /> What does this mean?
          </button>
        </div>
        
        {/* Formula */}
        <div className="font-mono text-[10px] text-gray-400 bg-black/30 p-2 rounded mb-2">
          TotalScore = Σ(weight<sub>i</sub> × subscore<sub>i</sub>) + bonuses − penalties
        </div>

        {/* Weights */}
        <div className="grid grid-cols-4 gap-2 text-[10px]">
          {(['rewards', 'credit', 'cashflow', 'risk'] as const).map(key => (
            <div key={key} className="text-center">
              <div className="text-gray-500">{SCORING_GLOSSARY[key].short}</div>
              <div className="font-mono font-bold text-neon-cyan">{(weights[key] * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>

        {/* Glossary */}
        <AnimatePresence>
          {showGlossary && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                {(['rewards', 'credit', 'cashflow', 'risk'] as const).map(key => (
                  <div key={key} className="text-[10px]">
                    <span className="font-semibold text-gray-300">{SCORING_GLOSSARY[key].name}:</span>
                    <span className="text-gray-500 ml-1">{SCORING_GLOSSARY[key].description}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top Candidates (Expandable) */}
      <div>
        <div className="text-xs text-gray-500 mb-2">Top Candidates (normalized 0-100)</div>
        <div className="space-y-1">
          {candidates.slice(0, 5).map((score, i) => (
            <TokenScoreCard
              key={score.tokenId}
              score={score}
              rank={i + 1}
              isWinner={i === 0}
              isExpanded={expandedToken === score.tokenId}
              onToggle={() => setExpandedToken(expandedToken === score.tokenId ? null : score.tokenId)}
              weights={weights}
            />
          ))}
        </div>
      </div>

      {/* Sensitivity Preview */}
      {sensitivityChanges.length > 0 && (
        <div className="p-2 bg-warn-amber/10 border border-warn-amber/30 rounded">
          <div className="text-[10px] font-semibold text-warn-amber mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Sensitivity Alert
          </div>
          <div className="text-[10px] text-gray-400">
            Winner changes with ±10% weight adjustment:
            {sensitivityChanges.slice(0, 2).map(s => (
              <div key={`${s.criterion}-${s.direction}`} className="ml-2">
                • {s.criterion} {s.direction}: {s.originalWinner.slice(6, 18)} → {s.newWinner.slice(6, 18)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TokenScoreCard({ score, rank, isWinner, isExpanded, onToggle, weights }: {
  score: ScoreBreakdown; rank: number; isWinner: boolean; isExpanded: boolean; onToggle: () => void;
  weights: { rewards: number; credit: number; cashflow: number; risk: number };
}) {
  return (
    <div className={`rounded border ${isWinner ? 'border-neon-green/40 bg-neon-green/5' : 'border-gray-800'}`}>
      <button onClick={onToggle} className="w-full p-2 flex items-center gap-2 text-left">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isWinner ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-800 text-gray-500'}`}>
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{score.tokenName}</div>
          <div className="text-[10px] text-gray-500 font-mono">{score.tokenId.slice(0, 20)}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold font-mono">{score.finalScore.toFixed(1)}</div>
          <div className="text-[9px] text-gray-500">/100</div>
        </div>
        {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-2 pb-2 border-t border-gray-800/50 pt-2 space-y-2">
              {/* Subscore breakdown */}
              <div className="text-[10px] text-gray-500 mb-1">Subscore Breakdown</div>
              {(['rewards', 'credit', 'cashflow', 'risk'] as const).map(key => {
                const sub = score.subscores[key];
                return (
                  <div key={key} className="flex items-center gap-2 text-[10px]">
                    <span className="w-12 text-gray-500">{SCORING_GLOSSARY[key].short}</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-neon-cyan/50" style={{ width: `${sub.normalized}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono">{sub.normalized.toFixed(0)}</span>
                    <span className="text-gray-600">×</span>
                    <span className="w-8 font-mono text-gray-400">{(sub.weight * 100).toFixed(0)}%</span>
                    <span className="text-gray-600">=</span>
                    <span className="w-8 text-right font-mono text-neon-cyan">{sub.weighted.toFixed(1)}</span>
                  </div>
                );
              })}

              {/* Base score */}
              <div className="flex justify-between text-[10px] pt-1 border-t border-gray-800/50">
                <span className="text-gray-500">Base Score</span>
                <span className="font-mono">{score.baseScore.toFixed(1)}</span>
              </div>

              {/* Bonuses/Penalties */}
              {score.bonuses.length > 0 && score.bonuses.map((b, i) => (
                <div key={i} className="flex justify-between text-[10px] text-neon-green">
                  <span>+ {b.label}</span>
                  <span className="font-mono">+{b.amount}</span>
                </div>
              ))}
              {score.penalties.length > 0 && score.penalties.map((p, i) => (
                <div key={i} className="flex justify-between text-[10px] text-error-red">
                  <span>− {p.label}</span>
                  <span className="font-mono">−{p.amount}</span>
                </div>
              ))}

              {/* Final */}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-gray-800">
                <span>Final Score</span>
                <span className="font-mono text-neon-cyan">{score.finalScore.toFixed(1)}/100</span>
              </div>

              {/* Factors */}
              <div className="text-[9px] text-gray-600 mt-1">
                {score.subscores.rewards.factors.slice(0, 2).map((f, i) => <div key={i}>• {f}</div>)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TraceTab({ trace }: { trace: TraceData | null }) {
  if (!trace) return <EmptyState icon={Activity} text="Run pipeline to see trace" />;

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 p-2 bg-void-light rounded border border-gray-800 grid grid-cols-2 gap-2 text-[10px]">
        <div><span className="text-gray-500">Trace ID:</span> <span className="font-mono text-neon-cyan">{trace.traceId.slice(0, 12)}...</span></div>
        <div><span className="text-gray-500">Seed:</span> <span className="font-mono text-neon-green">{trace.seed}</span></div>
        <div><span className="text-gray-500">Duration:</span> <span className="font-mono text-neon-orange">{trace.totalDurationMs}ms</span></div>
        <div><span className="text-gray-500">Spans:</span> <span className="font-mono">{trace.spans.length}</span></div>
      </div>

      <div className="space-y-1">
        {trace.spans.map((span, i) => {
          const width = Math.max(2, (span.durationMs / trace.totalDurationMs) * 100);
          const offset = (span.startOffset / trace.totalDurationMs) * 100;
          const color = span.status === 'completed' ? 'bg-neon-green' : span.status === 'error' ? 'bg-error-red' : span.status === 'skipped' ? 'bg-gray-600' : 'bg-neon-cyan';

          return (
            <motion.div key={span.spanId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="flex items-center gap-2">
              <div className="w-28 text-[10px] text-gray-400 truncate">{span.operationName}</div>
              <div className="flex-1 h-4 bg-void-lighter rounded relative">
                <div className={`absolute h-full ${color} rounded opacity-70`} style={{ left: `${offset}%`, width: `${width}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/70">{span.durationMs}ms</span>
              </div>
              <div className="w-16 text-[10px] text-gray-500 font-mono">t+{span.startOffset}→{span.endOffset}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: { decision: LogEntry[]; policy: LogEntry[]; risk: LogEntry[] } }) {
  const [stream, setStream] = useState<'decision' | 'policy' | 'risk'>('decision');
  const currentLogs = logs[stream];

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-1 p-2 border-b border-gray-800">
        {(['decision', 'policy', 'risk'] as const).map(s => (
          <button key={s} onClick={() => setStream(s)} className={`px-2 py-1 text-[10px] rounded ${stream === s ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-500'}`}>
            {s} ({logs[s].length})
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-0.5">
        {currentLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No logs</div>
        ) : currentLogs.map((log, i) => (
          <div key={i} className={`log-entry ${log.level}`}>
            <span className="text-gray-600">t+{log.offsetMs.toString().padStart(3)}ms</span>
            <span className="mx-1 text-gray-700">│</span>
            <span className={log.level === 'error' ? 'text-error-red' : log.level === 'warn' ? 'text-warn-amber' : 'text-neon-cyan'}>{log.level.slice(0, 4).toUpperCase()}</span>
            <span className="mx-1 text-gray-700">│</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExplainerTab({ auditRecord }: { auditRecord: AuditRecord | null }) {
  if (!auditRecord) return <EmptyState icon={BookOpen} text="Run pipeline for explanation" />;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Selected Route */}
      <div className="p-3 bg-neon-green/10 border border-neon-green/30 rounded">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-neon-green" />
          <span className="text-xs font-semibold text-neon-green">Selected Route</span>
        </div>
        <div className="font-mono text-sm">{auditRecord.selectedRouteName}</div>
        <div className="text-[10px] text-gray-500">DPAN: {auditRecord.selectedDpan}</div>
        <div className="text-[10px] mt-1">
          Method: <span className={auditRecord.selectionMethod.type === 'FORCED' ? 'text-warn-amber' : 'text-neon-cyan'}>
            {auditRecord.selectionMethod.type === 'FORCED' ? `FORCED by ${auditRecord.selectionMethod.ruleLabel}` : 'AUTO optimizer'}
          </span>
        </div>
      </div>

      {/* Shadow Winner */}
      {auditRecord.shadowOptimization && (
        <div className="p-2 bg-neon-purple/10 border border-neon-purple/30 rounded text-[10px]">
          <div className="font-semibold text-neon-purple mb-1">Shadow Winner (optimizer)</div>
          <div>Would have selected: <span className="font-mono">{auditRecord.shadowOptimization.wouldHaveSelectedName}</span></div>
          <div>Score: {auditRecord.shadowOptimization.wouldHaveScore.toFixed(1)} vs {auditRecord.shadowOptimization.actualScore.toFixed(1)}</div>
        </div>
      )}

      {/* Violations Overridden */}
      {auditRecord.violationsOverridden.length > 0 && (
        <div className="p-2 bg-warn-amber/10 border border-warn-amber/30 rounded">
          <div className="text-[10px] font-semibold text-warn-amber mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Violations Overridden ({auditRecord.violationsOverridden.length})
          </div>
          {auditRecord.violationsOverridden.map((v, i) => (
            <div key={i} className="text-[10px] text-gray-400">• {v.tokenName}: {v.constraint} (by {v.overriddenBy})</div>
          ))}
        </div>
      )}

      {/* Excluded Tokens */}
      {auditRecord.excludedTokens.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Excluded Tokens ({auditRecord.excludedTokens.length})
          </div>
          {auditRecord.excludedTokens.map((ex, i) => (
            <div key={i} className="text-[10px] flex gap-2">
              <span className="font-mono text-gray-500">{ex.tokenName}</span>
              <span className="text-error-red/70">→ {ex.reason}</span>
              <span className="text-gray-600">@{ex.stage}</span>
            </div>
          ))}
        </div>
      )}

      {/* Risk Info */}
      <div className="text-[10px] p-2 bg-void-light rounded border border-gray-800">
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-gray-500">Risk Score:</span> <span className="font-mono">{(auditRecord.riskScore * 100).toFixed(1)}%</span></div>
          <div><span className="text-gray-500">Decline Prob:</span> <span className="font-mono">{(auditRecord.declineProbability * 100).toFixed(1)}%</span></div>
          <div><span className="text-gray-500">Auth Result:</span> <span className={auditRecord.authResult.approved ? 'text-neon-green' : 'text-error-red'}>{auditRecord.authResult.approved ? 'APPROVED' : 'DECLINED'}</span></div>
          <div><span className="text-gray-500">Auth Code:</span> <span className="font-mono">{auditRecord.authResult.authCode || '—'}</span></div>
        </div>
      </div>
    </div>
  );
}

function ErrorsTab({ auditRecord }: { auditRecord: AuditRecord | null }) {
  const errors = auditRecord?.errors || [];
  const failedRules = auditRecord?.failedRules || [];

  if (errors.length === 0 && failedRules.length === 0) {
    return <EmptyState icon={AlertTriangle} text="No errors" />;
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-2">
      {errors.map((err, i) => (
        <div key={i} className="p-2 bg-error-red/10 border border-error-red/30 rounded">
          <div className="text-xs font-semibold text-error-red">{err.code}</div>
          <div className="text-[10px] text-gray-400">{err.message}</div>
          {err.ruleId && <div className="text-[10px] text-gray-500">Rule: {err.ruleId}</div>}
          {err.dslSnippet && <div className="font-mono text-[9px] bg-black/30 p-1 mt-1 rounded">{err.dslSnippet}</div>}
        </div>
      ))}
      {failedRules.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] text-gray-500 mb-1">Failed Rules ({failedRules.length})</div>
          {failedRules.slice(0, 5).map((r, i) => (
            <div key={i} className="text-[10px] text-gray-500 p-1 border-l-2 border-gray-700 mb-1">
              <span className="font-mono">{r.ruleId}</span>: {r.reason}
              {r.dslSnippet && <div className="font-mono text-[9px] text-gray-600 mt-0.5">{r.dslSnippet}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab({ auditRecord }: { auditRecord: AuditRecord | null }) {
  if (!auditRecord) return <EmptyState icon={FileJson} text="Run pipeline for audit" />;
  return (
    <div className="h-full overflow-auto p-3">
      <pre className="json-viewer text-[9px] whitespace-pre-wrap break-all">{JSON.stringify(auditRecord, null, 2)}</pre>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Activity; text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-gray-500">
      <div className="text-center">
        <Icon className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-xs">{text}</p>
      </div>
    </div>
  );
}
