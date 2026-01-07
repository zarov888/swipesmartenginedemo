'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Shield, Zap, GripVertical, Save, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Rule, RuleType } from '@/lib/types';

interface CustomRule {
  id: string;
  label: string;
  type: RuleType;
  conditions: RuleCondition[];
  action: 'FORCE' | 'EXCLUDE' | 'PREFER' | 'AVOID';
  targetTokenPattern?: string;
  enabled: boolean;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: string;
}

const conditionFields = [
  { value: 'context.mcc', label: 'MCC Code' },
  { value: 'context.amount', label: 'Amount' },
  { value: 'context.currency', label: 'Currency' },
  { value: 'context.merchantCountry', label: 'Merchant Country' },
  { value: 'context.isRecurring', label: 'Is Recurring' },
  { value: 'context.channel', label: 'Channel' },
  { value: 'token.network', label: 'Card Network' },
  { value: 'token.type', label: 'Card Type' },
  { value: 'token.issuer', label: 'Issuer' },
];

const operators = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'in list' },
];

const STORAGE_KEY = 'swipesmart-custom-rules';

function getStoredRules(): CustomRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRules(rules: CustomRule[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

interface RuleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRules: (rules: CustomRule[]) => void;
}

export default function RuleBuilder({ isOpen, onClose, onApplyRules }: RuleBuilderProps) {
  const [rules, setRules] = useState<CustomRule[]>(getStoredRules);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const createNewRule = (): CustomRule => ({
    id: `custom-${Date.now()}`,
    label: 'New Rule',
    type: 'SOFT',
    conditions: [],
    action: 'PREFER',
    enabled: true,
  });

  const addRule = () => {
    const newRule = createNewRule();
    setRules(prev => [...prev, newRule]);
    setEditingRule(newRule);
    setHasChanges(true);
  };

  const updateRule = (id: string, updates: Partial<CustomRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    if (editingRule?.id === id) {
      setEditingRule(prev => prev ? { ...prev, ...updates } : null);
    }
    setHasChanges(true);
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    if (editingRule?.id === id) {
      setEditingRule(null);
    }
    setHasChanges(true);
  };

  const addCondition = (ruleId: string) => {
    const condition: RuleCondition = {
      id: `cond-${Date.now()}`,
      field: 'context.mcc',
      operator: 'eq',
      value: '',
    };
    updateRule(ruleId, {
      conditions: [...(rules.find(r => r.id === ruleId)?.conditions || []), condition],
    });
  };

  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<RuleCondition>) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, {
      conditions: rule.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c),
    });
  };

  const deleteCondition = (ruleId: string, conditionId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, {
      conditions: rule.conditions.filter(c => c.id !== conditionId),
    });
  };

  const handleSave = () => {
    saveRules(rules);
    onApplyRules(rules);
    setHasChanges(false);
  };

  const handleReset = () => {
    setRules(getStoredRules());
    setEditingRule(null);
    setHasChanges(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-surface-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Custom Rule Builder</h3>
                  <p className="text-xs text-text-secondary">Create and manage your own routing rules</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="px-2 py-1 bg-accent-orange/20 text-accent-orange text-xs rounded">Unsaved changes</span>
                )}
                <button
                  onClick={onClose}
                  className="text-text-tertiary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Rules List */}
              <div className="w-64 border-r border-white/5 flex flex-col">
                <div className="p-3 border-b border-white/5">
                  <button
                    onClick={addRule}
                    className="w-full py-2 rounded-lg bg-accent-orange/20 border border-accent-orange/30 text-accent-orange text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent-orange/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {rules.length === 0 ? (
                    <p className="text-xs text-text-tertiary text-center py-4">No custom rules yet</p>
                  ) : (
                    rules.map(rule => (
                      <button
                        key={rule.id}
                        onClick={() => setEditingRule(rule)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          editingRule?.id === rule.id
                            ? 'bg-accent-orange/10 border border-accent-orange/30'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white truncate">{rule.label}</span>
                          <span className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-accent-green' : 'bg-text-tertiary'}`} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded ${
                            rule.type === 'HARD' ? 'bg-error-red/20 text-error-red' : 'bg-accent-blue/20 text-accent-blue'
                          }`}>
                            {rule.type}
                          </span>
                          <span className="text-text-tertiary">{rule.conditions.length} conditions</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Rule Editor */}
              <div className="flex-1 overflow-y-auto p-5">
                {editingRule ? (
                  <div className="space-y-5">
                    {/* Rule Name & Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Rule Name</label>
                        <input
                          type="text"
                          value={editingRule.label}
                          onChange={(e) => updateRule(editingRule.id, { label: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-orange/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Rule Type</label>
                        <select
                          value={editingRule.type}
                          onChange={(e) => updateRule(editingRule.id, { type: e.target.value as RuleType })}
                          className="w-full px-3 py-2 bg-surface-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-orange/50"
                        >
                          <option value="SOFT">SOFT (Preference)</option>
                          <option value="HARD">HARD (Mandatory)</option>
                        </select>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Action When Matched</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['FORCE', 'EXCLUDE', 'PREFER', 'AVOID'].map(action => (
                          <button
                            key={action}
                            onClick={() => updateRule(editingRule.id, { action: action as CustomRule['action'] })}
                            className={`py-2 rounded-lg text-xs font-medium transition-all ${
                              editingRule.action === action
                                ? 'bg-accent-orange/20 border border-accent-orange/50 text-accent-orange'
                                : 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10'
                            }`}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conditions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-text-tertiary uppercase tracking-wider">Conditions</label>
                        <button
                          onClick={() => addCondition(editingRule.id)}
                          className="text-xs text-accent-orange hover:text-accent-orange/80 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Condition
                        </button>
                      </div>

                      {editingRule.conditions.length === 0 ? (
                        <div className="p-4 bg-white/5 rounded-lg text-center">
                          <AlertTriangle className="w-5 h-5 text-accent-orange mx-auto mb-2" />
                          <p className="text-xs text-text-secondary">No conditions defined</p>
                          <p className="text-[10px] text-text-tertiary">This rule will always match</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editingRule.conditions.map((condition, idx) => (
                            <div key={condition.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                              <GripVertical className="w-4 h-4 text-text-tertiary cursor-move" />
                              {idx > 0 && (
                                <span className="text-xs text-accent-blue font-mono">AND</span>
                              )}
                              <select
                                value={condition.field}
                                onChange={(e) => updateCondition(editingRule.id, condition.id, { field: e.target.value })}
                                className="flex-1 px-2 py-1.5 bg-surface-100 border border-white/10 rounded text-xs text-white focus:outline-none"
                              >
                                {conditionFields.map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                              <select
                                value={condition.operator}
                                onChange={(e) => updateCondition(editingRule.id, condition.id, { operator: e.target.value as RuleCondition['operator'] })}
                                className="w-20 px-2 py-1.5 bg-surface-100 border border-white/10 rounded text-xs text-white font-mono focus:outline-none"
                              >
                                {operators.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={condition.value}
                                onChange={(e) => updateCondition(editingRule.id, condition.id, { value: e.target.value })}
                                placeholder="value"
                                className="w-32 px-2 py-1.5 bg-surface-100 border border-white/10 rounded text-xs text-white focus:outline-none"
                              />
                              <button
                                onClick={() => deleteCondition(editingRule.id, condition.id)}
                                className="p-1 text-text-tertiary hover:text-error-red transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Target Token */}
                    {(editingRule.action === 'FORCE' || editingRule.action === 'PREFER') && (
                      <div>
                        <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Target Token Pattern</label>
                        <input
                          type="text"
                          value={editingRule.targetTokenPattern || ''}
                          onChange={(e) => updateRule(editingRule.id, { targetTokenPattern: e.target.value })}
                          placeholder="e.g., *Sapphire*, AMEX*, etc."
                          className="w-full px-3 py-2 bg-surface-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-orange/50"
                        />
                        <p className="text-[10px] text-text-tertiary mt-1">Use * as wildcard. Leave empty to apply to top-scoring token.</p>
                      </div>
                    )}

                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-white">Rule Enabled</span>
                      <button
                        onClick={() => updateRule(editingRule.id, { enabled: !editingRule.enabled })}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          editingRule.enabled ? 'bg-accent-green' : 'bg-surface-100'
                        }`}
                      >
                        <motion.div
                          animate={{ x: editingRule.enabled ? 24 : 0 }}
                          className="w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteRule(editingRule.id)}
                      className="w-full py-2 rounded-lg bg-error-red/10 border border-error-red/20 text-error-red text-sm flex items-center justify-center gap-2 hover:bg-error-red/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Rule
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Zap className="w-12 h-12 text-text-tertiary mb-4" />
                    <p className="text-text-secondary">Select a rule to edit</p>
                    <p className="text-xs text-text-tertiary mt-1">Or create a new one to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="px-4 py-2 text-sm text-text-secondary hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Changes
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-accent-green/20 border border-accent-green/30 text-accent-green text-sm font-medium flex items-center gap-2 hover:bg-accent-green/30 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save & Apply
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RuleBuilderTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-secondary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono"
      title="Custom rule builder"
    >
      <Shield className="w-3.5 h-3.5" />
      Rules
    </button>
  );
}
