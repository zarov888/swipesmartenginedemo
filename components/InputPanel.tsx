'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, CreditCard, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionContext, UserProfile, Token, DRTToken, Scenario } from '@/lib/types';
import { scenarios, COUNTRIES, WALLET_TYPES, RISK_FLAGS, MCC_CATEGORIES } from '@/lib/mockData';

interface InputPanelProps {
  context: TransactionContext;
  user: UserProfile;
  selectedScenario: string;
  onContextChange: (context: TransactionContext) => void;
  onUserChange: (user: UserProfile) => void;
  onScenarioSelect: (scenarioId: string) => void;
}

export default function InputPanel({
  context,
  user,
  selectedScenario,
  onContextChange,
  onUserChange,
  onScenarioSelect,
}: InputPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    scenario: true,
    transaction: true,
    userState: false,
    tokens: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Scenario Picker */}
      <Section
        title="Scenario"
        expanded={expandedSections.scenario}
        onToggle={() => toggleSection('scenario')}
      >
        <div className="grid gap-2">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => onScenarioSelect(scenario.id)}
              className={`text-left p-2 rounded border transition-all ${
                selectedScenario === scenario.id
                  ? 'border-neon-cyan bg-neon-cyan/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-medium text-gray-200">{scenario.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{scenario.description}</div>
              {selectedScenario === scenario.id && scenario.expectedOutcome && (
                <div className="text-[10px] text-neon-green/80 mt-1 p-1.5 bg-neon-green/5 rounded border border-neon-green/20">
                  <span className="font-semibold">Expected:</span> {scenario.expectedOutcome}
                </div>
              )}
            </button>
          ))}
          <button
            onClick={() => onScenarioSelect('custom')}
            className={`text-left p-2 rounded border transition-all ${
              selectedScenario === 'custom'
                ? 'border-neon-purple bg-neon-purple/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="text-sm font-medium text-neon-purple">Custom</div>
            <div className="text-xs text-gray-500 mt-0.5">Define your own transaction</div>
          </button>
        </div>
      </Section>

      {/* Transaction Context */}
      <Section
        title="Transaction Context"
        expanded={expandedSections.transaction}
        onToggle={() => toggleSection('transaction')}
      >
        <div className="space-y-3">
          <InputRow label="Amount">
            <input
              type="number"
              value={context.amount}
              onChange={e => onContextChange({ ...context, amount: parseFloat(e.target.value) || 0 })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            />
          </InputRow>
          <InputRow label="Merchant">
            <input
              type="text"
              value={context.merchant}
              onChange={e => onContextChange({ ...context, merchant: e.target.value })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            />
          </InputRow>
          <InputRow label="MCC">
            <input
              type="number"
              value={context.mcc}
              onChange={e => onContextChange({ ...context, mcc: parseInt(e.target.value) || 0 })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            />
          </InputRow>
          <InputRow label="Category">
            <select
              value={context.category}
              onChange={e => onContextChange({ ...context, category: e.target.value })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            >
              <option value="dining">Dining</option>
              <option value="travel">Travel</option>
              <option value="groceries">Groceries</option>
              <option value="gas">Gas</option>
              <option value="electronics">Electronics</option>
              <option value="retail">Retail</option>
              <option value="other">Other</option>
            </select>
          </InputRow>
          <InputRow label="Country">
            <select
              value={context.country}
              onChange={e => onContextChange({ ...context, country: e.target.value })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </InputRow>
          <InputRow label="Wallet">
            <select
              value={context.walletType}
              onChange={e => onContextChange({ ...context, walletType: e.target.value as TransactionContext['walletType'] })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            >
              {WALLET_TYPES.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </InputRow>
          <InputRow label="In-Person">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={context.isInPerson}
                onChange={e => onContextChange({ ...context, isInPerson: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-void-light"
              />
              <span className="text-sm text-gray-400">{context.isInPerson ? 'Yes' : 'No'}</span>
            </label>
          </InputRow>
          <InputRow label="Risk Flags">
            <div className="flex flex-wrap gap-1">
              {RISK_FLAGS.map(flag => (
                <button
                  key={flag}
                  onClick={() => {
                    const newFlags = context.riskFlags.includes(flag)
                      ? context.riskFlags.filter(f => f !== flag)
                      : [...context.riskFlags, flag];
                    onContextChange({ ...context, riskFlags: newFlags });
                  }}
                  className={`px-2 py-0.5 text-xs rounded transition-all ${
                    context.riskFlags.includes(flag)
                      ? 'bg-error-red/20 border border-error-red/50 text-error-red'
                      : 'bg-void border border-gray-700 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {flag}
                </button>
              ))}
            </div>
          </InputRow>
        </div>
      </Section>

      {/* User State */}
      <Section
        title="User State"
        expanded={expandedSections.userState}
        onToggle={() => toggleSection('userState')}
      >
        <div className="space-y-3">
          <InputRow label="Cash Balance">
            <input
              type="number"
              value={user.cashBalance}
              onChange={e => onUserChange({ ...user, cashBalance: parseFloat(e.target.value) || 0 })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            />
          </InputRow>
          <InputRow label="Days to Paycheck">
            <input
              type="number"
              value={user.daysToPaycheck}
              onChange={e => onUserChange({ ...user, daysToPaycheck: parseInt(e.target.value) || 0 })}
              className="input-field w-full px-2 py-1 rounded text-sm"
            />
          </InputRow>
          <div className="pt-2 border-t border-gray-800">
            <div className="text-xs text-gray-500 mb-2">Preference Weights</div>
            <WeightSlider
              label="Rewards"
              value={user.preferenceWeights.rewards}
              onChange={v => onUserChange({
                ...user,
                preferenceWeights: { ...user.preferenceWeights, rewards: v }
              })}
              color="neon-green"
            />
            <WeightSlider
              label="Credit"
              value={user.preferenceWeights.credit}
              onChange={v => onUserChange({
                ...user,
                preferenceWeights: { ...user.preferenceWeights, credit: v }
              })}
              color="neon-cyan"
            />
            <WeightSlider
              label="Cashflow"
              value={user.preferenceWeights.cashflow}
              onChange={v => onUserChange({
                ...user,
                preferenceWeights: { ...user.preferenceWeights, cashflow: v }
              })}
              color="neon-orange"
            />
            <WeightSlider
              label="Risk"
              value={user.preferenceWeights.risk}
              onChange={v => onUserChange({
                ...user,
                preferenceWeights: { ...user.preferenceWeights, risk: v }
              })}
              color="neon-pink"
            />
          </div>
        </div>
      </Section>

      {/* Token Manager */}
      <Section
        title="Token Manager"
        expanded={expandedSections.tokens}
        onToggle={() => toggleSection('tokens')}
        badge={`${user.tokens.length} cards + ${user.drtTokens.length} DRT`}
      >
        <div className="space-y-2">
          {user.tokens.map(token => (
            <TokenCard
              key={token.id}
              token={token}
              onToggle={() => {
                const updated = user.tokens.map(t =>
                  t.id === token.id ? { ...t, isEligible: !t.isEligible } : t
                );
                onUserChange({ ...user, tokens: updated });
              }}
              onEdit={() => {/* TODO: Edit modal */}}
            />
          ))}
          {user.drtTokens.map(drt => (
            <DRTCard
              key={drt.id}
              drt={drt}
              onToggle={() => {
                const updated = user.drtTokens.map(d =>
                  d.id === drt.id ? { ...d, isEligible: !d.isEligible } : d
                );
                onUserChange({ ...user, drtTokens: updated });
              }}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  expanded,
  onToggle,
  badge,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full panel-header px-3 py-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-neon-cyan" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {badge && <span className="text-xs text-gray-500 font-mono">{badge}</span>}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-t border-gray-800/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-500 w-24 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer"
        style={{ accentColor: `var(--${color})` }}
      />
      <span className="text-xs font-mono text-gray-400 w-8">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function TokenCard({
  token,
  onToggle,
  onEdit,
}: {
  token: Token;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const networkColors: Record<string, string> = {
    visa: 'text-blue-400',
    mastercard: 'text-orange-400',
    amex: 'text-cyan-400',
    discover: 'text-amber-400',
  };

  return (
    <div className={`p-2 rounded border transition-all ${
      token.isEligible
        ? 'border-gray-700 bg-void-light/50'
        : 'border-gray-800 bg-void opacity-50'
    }`}>
      <div className="flex items-center gap-2">
        <CreditCard className={`w-4 h-4 ${networkColors[token.network] || 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{token.name}</div>
          <div className="text-xs text-gray-500 font-mono">{token.dpan}</div>
        </div>
        <button onClick={onToggle} className={`w-8 h-4 rounded-full transition-all ${
          token.isEligible ? 'bg-neon-green/30' : 'bg-gray-700'
        }`}>
          <div className={`w-3 h-3 rounded-full bg-white transition-all ${
            token.isEligible ? 'ml-4' : 'ml-0.5'
          }`} />
        </button>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
        <span>Util: {(token.utilization * 100).toFixed(0)}%</span>
        <span>Limit: ${token.limit.toLocaleString()}</span>
        {token.ftf > 0 && <span className="text-warn-amber">FTF: {token.ftf}%</span>}
      </div>
    </div>
  );
}

function DRTCard({
  drt,
  onToggle,
}: {
  drt: DRTToken;
  onToggle: () => void;
}) {
  return (
    <div className={`p-2 rounded border transition-all ${
      drt.isEligible
        ? 'border-neon-purple/50 bg-neon-purple/5'
        : 'border-gray-800 bg-void opacity-50'
    }`}>
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-neon-purple" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-neon-purple">{drt.name}</div>
          <div className="text-xs text-gray-500">{drt.childDPANs.length} child DPANs</div>
        </div>
        <button onClick={onToggle} className={`w-8 h-4 rounded-full transition-all ${
          drt.isEligible ? 'bg-neon-purple/30' : 'bg-gray-700'
        }`}>
          <div className={`w-3 h-3 rounded-full bg-white transition-all ${
            drt.isEligible ? 'ml-4' : 'ml-0.5'
          }`} />
        </button>
      </div>
      <div className="mt-2 pl-4 border-l border-neon-purple/30 space-y-1">
        {drt.childDPANs.map(child => (
          <div key={child.id} className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-purple/50" />
            {child.name}
          </div>
        ))}
      </div>
    </div>
  );
}
