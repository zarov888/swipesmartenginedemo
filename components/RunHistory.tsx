'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Clock, CreditCard, CheckCircle, XCircle, ChevronRight, Trash2, RotateCcw } from 'lucide-react';
import { AuditRecord, TransactionContext } from '@/lib/types';

interface HistoryEntry {
  id: string;
  timestamp: number;
  correlationId: string;
  scenario: string;
  context: TransactionContext;
  selectedRoute: string;
  selectedRouteName: string;
  approved: boolean;
  topScore: number;
  totalLatency: number;
  ruleOverride: boolean;
}

const STORAGE_KEY = 'swipesmart-run-history';
const MAX_ENTRIES = 20;

function getStoredHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function useRunHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getStoredHistory());
  }, []);

  const addEntry = (
    auditRecord: AuditRecord,
    context: TransactionContext,
    scenario: string,
    totalLatency: number
  ) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      correlationId: auditRecord.correlationId,
      scenario,
      context,
      selectedRoute: auditRecord.selectedRoute,
      selectedRouteName: auditRecord.selectedRouteName,
      approved: auditRecord.authResult.approved,
      topScore: auditRecord.scoreBreakdown.find(s => s.tokenId === auditRecord.selectedRoute)?.finalScore || 0,
      totalLatency,
      ruleOverride: auditRecord.hardRuleOverride,
    };

    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      saveHistory(updated);
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { history, addEntry, clearHistory };
}

interface RunHistoryProps {
  history: HistoryEntry[];
  onReplay: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export default function RunHistory({ history, onReplay, onClear }: RunHistoryProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const scenarioLabels: Record<string, string> = {
    scenario_dining_domestic: 'Dining',
    scenario_travel_international: 'Travel',
    scenario_online_subscription: 'Subscription',
    scenario_grocery_weekend: 'Grocery',
    scenario_high_value_electronics: 'Electronics',
    scenario_gas_station: 'Gas',
    custom: 'Custom',
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative p-1.5 text-text-tertiary hover:text-white transition-colors"
        title="Run history"
      >
        <History className="w-4 h-4" />
        {history.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent-blue rounded-full text-[9px] font-bold flex items-center justify-center text-white">
            {history.length}
          </span>
        )}
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
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-50 border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                    <History className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Run History</h3>
                    <p className="text-xs text-text-secondary">{history.length} runs stored</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={onClear}
                      className="p-2 text-text-tertiary hover:text-error-red transition-colors"
                      title="Clear history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-text-tertiary hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <Clock className="w-12 h-12 text-text-tertiary mb-4" />
                    <p className="text-text-secondary">No runs yet</p>
                    <p className="text-xs text-text-tertiary mt-1">Your pipeline runs will appear here</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {history.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedEntry?.id === entry.id
                            ? 'bg-accent-blue/10 border-accent-blue/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedEntry(entry.id === selectedEntry?.id ? null : entry)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {entry.approved ? (
                              <CheckCircle className="w-4 h-4 text-accent-green" />
                            ) : (
                              <XCircle className="w-4 h-4 text-error-red" />
                            )}
                            <span className="text-sm font-medium text-white">{entry.selectedRouteName}</span>
                          </div>
                          <span className="text-[10px] text-text-tertiary">{formatTime(entry.timestamp)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-text-secondary">
                              {scenarioLabels[entry.scenario] || entry.scenario}
                            </span>
                            <span className="text-text-tertiary font-mono">${entry.context.amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-accent-green font-mono">{entry.topScore.toFixed(1)}</span>
                            {entry.ruleOverride && (
                              <span className="px-1 py-0.5 bg-accent-orange/20 text-accent-orange text-[9px] rounded">FORCED</span>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {selectedEntry?.id === entry.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t border-white/10"
                            >
                              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                                <div className="px-2 py-1.5 bg-black/20 rounded">
                                  <span className="text-text-tertiary">Correlation ID</span>
                                  <p className="text-white font-mono truncate">{entry.correlationId.slice(0, 16)}...</p>
                                </div>
                                <div className="px-2 py-1.5 bg-black/20 rounded">
                                  <span className="text-text-tertiary">Latency</span>
                                  <p className="text-white font-mono">{entry.totalLatency}ms</p>
                                </div>
                                <div className="px-2 py-1.5 bg-black/20 rounded">
                                  <span className="text-text-tertiary">MCC</span>
                                  <p className="text-white font-mono">{entry.context.mcc}</p>
                                </div>
                                <div className="px-2 py-1.5 bg-black/20 rounded">
                                  <span className="text-text-tertiary">Currency</span>
                                  <p className="text-white font-mono">{entry.context.currency}</p>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReplay(entry);
                                  setShowModal(false);
                                }}
                                className="w-full py-2 rounded-lg bg-accent-blue/20 border border-accent-blue/30 text-accent-blue text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent-blue/30 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Replay This Run
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              {history.length > 0 && (
                <div className="px-4 py-3 border-t border-white/5 bg-black/20">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-mono font-bold text-accent-green">
                        {history.filter(h => h.approved).length}
                      </p>
                      <p className="text-[10px] text-text-tertiary">Approved</p>
                    </div>
                    <div>
                      <p className="text-lg font-mono font-bold text-error-red">
                        {history.filter(h => !h.approved).length}
                      </p>
                      <p className="text-[10px] text-text-tertiary">Declined</p>
                    </div>
                    <div>
                      <p className="text-lg font-mono font-bold text-accent-blue">
                        {(history.reduce((sum, h) => sum + h.topScore, 0) / history.length).toFixed(1)}
                      </p>
                      <p className="text-[10px] text-text-tertiary">Avg Score</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
