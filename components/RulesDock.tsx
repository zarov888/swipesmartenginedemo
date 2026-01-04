'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Check, X, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rule, RuleEvaluationResult } from '@/lib/types';

interface RulesDockProps {
  rules: Rule[];
  evaluationResults: RuleEvaluationResult[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleRule: (ruleId: string) => void;
}

export default function RulesDock({ rules, evaluationResults, isExpanded, onToggleExpand, onToggleRule }: RulesDockProps) {
  const getEvalResult = (ruleId: string) => evaluationResults.find(r => r.ruleId === ruleId);
  const matchedCount = evaluationResults.filter(r => r.matched).length;

  return (
    <div className="bg-void-light border-t border-neon-cyan/20">
      {/* Header */}
      <button onClick={onToggleExpand} className="w-full px-4 py-2 flex items-center justify-between hover:bg-void-lighter transition-colors">
        <div className="flex items-center gap-3">
          <Code className="w-4 h-4 text-neon-cyan" />
          <span className="font-mono text-sm">Rule Builder + DSL</span>
          <span className="text-xs text-gray-500">({rules.length} rules, {matchedCount} matched)</span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-3 border-t border-gray-800 max-h-64 overflow-y-auto">
              <div className="grid gap-2">
                {rules.map((rule, index) => {
                  const evalResult = getEvalResult(rule.id);
                  const matched = evalResult?.matched;
                  return (
                    <div key={rule.id} className={`p-2 rounded border ${matched ? 'border-neon-green/30 bg-neon-green/5' : 'border-gray-800 bg-void'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 w-6">#{index + 1}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${rule.type === 'HARD' ? 'bg-error-red/20 text-error-red' : 'bg-neon-cyan/20 text-neon-cyan'}`}>
                          {rule.type}
                        </span>
                        <span className="flex-1 text-sm font-medium truncate">{rule.label}</span>
                        {matched !== undefined && (matched ? <Check className="w-4 h-4 text-neon-green" /> : <X className="w-4 h-4 text-gray-600" />)}
                        <button onClick={() => onToggleRule(rule.id)} className={`w-8 h-4 rounded-full ${rule.enabled ? 'bg-neon-green/30' : 'bg-gray-700'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-all ${rule.enabled ? 'ml-4' : 'ml-0.5'}`} />
                        </button>
                      </div>
                      <div className="dsl-block mt-1">
                        <span className="dsl-keyword">IF</span> <span className="dsl-field">{rule.condition.field}</span>{' '}
                        <span className="dsl-operator">{rule.condition.operator}</span>{' '}
                        <span className="dsl-value">{JSON.stringify(rule.condition.value)}</span>{' '}
                        <span className="dsl-keyword">THEN</span> <span className="dsl-operator">{rule.action.type}</span>
                      </div>
                      {evalResult && (
                        <div className="mt-1 text-xs text-gray-500">
                          {evalResult.matched ? `✓ ${evalResult.reason}` : `✗ ${evalResult.reason}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
