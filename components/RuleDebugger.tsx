'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronRight, ChevronDown, CheckCircle, XCircle, AlertTriangle, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { RuleEvaluationResult, TransactionContext, Token } from '@/lib/types';

interface RuleDebuggerProps {
  evaluations: RuleEvaluationResult[];
  context: TransactionContext;
  tokens: Token[];
}

interface DebugStep {
  ruleId: string;
  ruleLabel: string;
  ruleType: string;
  matched: boolean;
  reason: string;
  action?: string;
}

export default function RuleDebugger({ evaluations, context, tokens }: RuleDebuggerProps) {
  const [isDebugging, setIsDebugging] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // Generate debug steps from evaluations
  const debugSteps: DebugStep[] = evaluations.map(eval_ => ({
    ruleId: eval_.ruleId,
    ruleLabel: eval_.ruleLabel,
    ruleType: eval_.ruleType,
    matched: eval_.matched,
    reason: eval_.reason,
    action: eval_.action,
  }));

  const toggleRule = (ruleId: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  const startDebug = () => {
    setIsDebugging(true);
    setCurrentStep(0);
  };

  const stepForward = () => {
    if (currentStep < debugSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsDebugging(false);
    }
  };

  const resetDebug = () => {
    setCurrentStep(0);
    setIsDebugging(false);
  };

  // Group evaluations by rule type
  const hardRules = evaluations.filter(e => e.ruleType === 'HARD');
  const softRules = evaluations.filter(e => e.ruleType === 'SOFT');

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-accent-pink/10 via-surface-50 to-accent-purple/10 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-accent-pink" />
          <h3 className="text-sm font-semibold text-white">Rule Debugger</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isDebugging ? (
            <button
              onClick={startDebug}
              disabled={debugSteps.length === 0}
              className="px-2 py-1 text-[10px] bg-accent-pink/20 text-accent-pink rounded flex items-center gap-1 hover:bg-accent-pink/30 transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              Step Through
            </button>
          ) : (
            <>
              <button
                onClick={stepForward}
                className="p-1 text-text-tertiary hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={resetDebug}
                className="p-1 text-text-tertiary hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Debug Stepping View */}
        {isDebugging && debugSteps.length > 0 && (
          <div className="mb-4 p-3 bg-black/30 rounded-lg border border-accent-pink/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-text-tertiary">
                Step {currentStep + 1} of {debugSteps.length}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                debugSteps[currentStep].ruleType === 'HARD'
                  ? 'bg-error-red/20 text-error-red'
                  : 'bg-accent-blue/20 text-accent-blue'
              }`}>
                {debugSteps[currentStep].ruleType}
              </span>
            </div>

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                {debugSteps[currentStep].matched ? (
                  <CheckCircle className="w-4 h-4 text-accent-green" />
                ) : (
                  <XCircle className="w-4 h-4 text-error-red" />
                )}
                <span className="text-sm font-medium text-white">
                  {debugSteps[currentStep].ruleLabel}
                </span>
              </div>

              <div className="p-2 bg-white/5 rounded text-xs">
                <p className="text-text-tertiary text-[10px] mb-1">Result</p>
                <p className="text-white">{debugSteps[currentStep].reason}</p>
              </div>

              {debugSteps[currentStep].action && (
                <div className="p-2 bg-accent-purple/10 rounded text-xs">
                  <p className="text-text-tertiary text-[10px] mb-1">Action</p>
                  <p className="text-accent-purple font-mono">{debugSteps[currentStep].action}</p>
                </div>
              )}
            </motion.div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / debugSteps.length) * 100}%` }}
                className="h-full bg-accent-pink rounded-full"
              />
            </div>
          </div>
        )}

        {/* Context Info */}
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <p className="text-[10px] text-text-tertiary uppercase mb-2">Current Context</p>
          <div className="grid grid-cols-4 gap-2 text-[10px]">
            <div className="text-center">
              <p className="text-text-tertiary">MCC</p>
              <p className="text-white font-mono">{context.mcc}</p>
            </div>
            <div className="text-center">
              <p className="text-text-tertiary">Amount</p>
              <p className="text-white font-mono">${context.amount}</p>
            </div>
            <div className="text-center">
              <p className="text-text-tertiary">Currency</p>
              <p className="text-white font-mono">{context.currency}</p>
            </div>
            <div className="text-center">
              <p className="text-text-tertiary">Tokens</p>
              <p className="text-white font-mono">{tokens.length}</p>
            </div>
          </div>
        </div>

        {/* Rule Summary */}
        <div className="space-y-3">
          {/* Hard Rules */}
          {hardRules.length > 0 && (
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-error-red" />
                Hard Rules ({hardRules.length})
              </p>
              <div className="space-y-1">
                {hardRules.map(rule => (
                  <RuleRow
                    key={rule.ruleId}
                    rule={rule}
                    isExpanded={expandedRules.has(rule.ruleId)}
                    onToggle={() => toggleRule(rule.ruleId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Soft Rules */}
          {softRules.length > 0 && (
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-accent-blue" />
                Soft Rules ({softRules.length})
              </p>
              <div className="space-y-1">
                {softRules.map(rule => (
                  <RuleRow
                    key={rule.ruleId}
                    rule={rule}
                    isExpanded={expandedRules.has(rule.ruleId)}
                    onToggle={() => toggleRule(rule.ruleId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-accent-green/10 rounded-lg">
            <p className="text-lg font-mono font-bold text-accent-green">
              {evaluations.filter(e => e.matched).length}
            </p>
            <p className="text-[9px] text-text-tertiary">Matched</p>
          </div>
          <div className="p-2 bg-error-red/10 rounded-lg">
            <p className="text-lg font-mono font-bold text-error-red">
              {evaluations.filter(e => !e.matched).length}
            </p>
            <p className="text-[9px] text-text-tertiary">Failed</p>
          </div>
          <div className="p-2 bg-accent-purple/10 rounded-lg">
            <p className="text-lg font-mono font-bold text-accent-purple">
              {evaluations.filter(e => e.action).length}
            </p>
            <p className="text-[9px] text-text-tertiary">With Actions</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RuleRow({
  rule,
  isExpanded,
  onToggle,
}: {
  rule: RuleEvaluationResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-lg border transition-all ${
      rule.matched
        ? 'bg-accent-green/5 border-accent-green/20'
        : 'bg-white/5 border-white/10'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-2 flex items-center gap-2 text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-text-tertiary" />
        ) : (
          <ChevronRight className="w-3 h-3 text-text-tertiary" />
        )}
        {rule.matched ? (
          <CheckCircle className="w-3 h-3 text-accent-green" />
        ) : (
          <XCircle className="w-3 h-3 text-error-red" />
        )}
        <span className="text-xs text-white flex-1 truncate">{rule.ruleLabel}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          rule.ruleType === 'HARD'
            ? 'bg-error-red/20 text-error-red'
            : 'bg-accent-blue/20 text-accent-blue'
        }`}>
          {rule.ruleType}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/5">
              {/* Reason */}
              <div className="p-2 bg-black/20 rounded">
                <p className="text-[9px] text-text-tertiary mb-1">Reason</p>
                <p className="text-[11px] text-white">{rule.reason}</p>
              </div>

              {/* Action */}
              {rule.action && (
                <div className="p-2 bg-accent-purple/10 rounded">
                  <p className="text-[9px] text-text-tertiary mb-1">Action</p>
                  <p className="text-[11px] text-accent-purple font-mono">{rule.action}</p>
                </div>
              )}

              {/* Forced Token */}
              {rule.forcedToken && (
                <div className="flex items-center gap-2 p-2 bg-accent-green/10 rounded">
                  <span className="text-[9px] text-text-tertiary">Forces:</span>
                  <span className="text-[10px] text-accent-green font-mono">{rule.forcedToken}</span>
                </div>
              )}

              {/* Excluded Tokens */}
              {rule.excludedTokens && rule.excludedTokens.length > 0 && (
                <div>
                  <p className="text-[9px] text-text-tertiary mb-1">Excludes:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.excludedTokens.map(token => (
                      <span key={token} className="px-1.5 py-0.5 bg-error-red/20 text-error-red text-[9px] rounded">
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* DSL Snippet */}
              {rule.dslSnippet && (
                <div className="p-2 bg-black/30 rounded font-mono text-[9px] text-text-secondary overflow-x-auto">
                  <pre>{rule.dslSnippet}</pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
