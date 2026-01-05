'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CreditCard, Wallet, Shield, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ScoreBreakdown } from '@/lib/types';

interface ScoringExplainerProps {
  scores: ScoreBreakdown[];
  selectedTokenId: string;
}

export default function ScoringExplainer({ scores, selectedTokenId }: ScoringExplainerProps) {
  const [expanded, setExpanded] = useState(true);
  const selectedScore = scores.find(s => s.tokenId === selectedTokenId && !s.excluded);

  if (!selectedScore) return null;

  const components = [
    {
      id: 'rewards',
      icon: TrendingUp,
      label: 'Rewards',
      color: 'green',
      colorClass: 'text-accent-green bg-accent-green/10 border-accent-green/20',
      raw: selectedScore.subscores.rewards.raw,
      weighted: selectedScore.subscores.rewards.weighted,
      weight: selectedScore.subscores.rewards.weight,
      factors: selectedScore.subscores.rewards.factors,
      description: 'Based on category multipliers, signup bonus progress, and cashback rates',
    },
    {
      id: 'credit',
      icon: CreditCard,
      label: 'Credit Health',
      color: 'teal',
      colorClass: 'text-accent-teal bg-accent-teal/10 border-accent-teal/20',
      raw: selectedScore.subscores.credit.raw,
      weighted: selectedScore.subscores.credit.weighted,
      weight: selectedScore.subscores.credit.weight,
      factors: selectedScore.subscores.credit.factors,
      description: 'Protects credit score by avoiding high utilization thresholds',
    },
    {
      id: 'cashflow',
      icon: Wallet,
      label: 'Cash Flow',
      color: 'orange',
      colorClass: 'text-accent-orange bg-accent-orange/10 border-accent-orange/20',
      raw: selectedScore.subscores.cashflow.raw,
      weighted: selectedScore.subscores.cashflow.weighted,
      weight: selectedScore.subscores.cashflow.weight,
      factors: selectedScore.subscores.cashflow.factors,
      description: 'Optimizes payment timing based on available balance and paycheck cycle',
    },
    {
      id: 'risk',
      icon: Shield,
      label: 'Risk',
      color: 'pink',
      colorClass: 'text-accent-pink bg-accent-pink/10 border-accent-pink/20',
      raw: selectedScore.subscores.risk.raw,
      weighted: selectedScore.subscores.risk.weighted,
      weight: selectedScore.subscores.risk.weight,
      factors: selectedScore.subscores.risk.factors,
      description: 'Evaluates transaction risk and decline probability',
    },
  ];

  return (
    <div className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-accent-blue" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">How Scoring Works</h3>
            <p className="text-xs text-text-secondary">Understanding the selection for {selectedScore.tokenName}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-text-tertiary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-tertiary" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Formula explanation */}
              <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                <p className="text-xs text-text-secondary mb-2">Final Score Calculation</p>
                <code className="text-xs font-mono text-white">
                  Final = (Rewards × {(components[0].weight * 100).toFixed(0)}%) +
                  (Credit × {(components[1].weight * 100).toFixed(0)}%) +
                  (Cashflow × {(components[2].weight * 100).toFixed(0)}%) +
                  (Risk × {(components[3].weight * 100).toFixed(0)}%)
                  {selectedScore.totalBonuses > 0 && ` + ${selectedScore.totalBonuses.toFixed(0)} bonus`}
                  {selectedScore.totalPenalties > 0 && ` - ${selectedScore.totalPenalties.toFixed(0)} penalty`}
                </code>
                <div className="mt-2 text-sm font-mono font-bold text-accent-green">
                  = {selectedScore.finalScore.toFixed(1)} / 100
                </div>
              </div>

              {/* Score Components */}
              <div className="space-y-3">
                {components.map(comp => (
                  <ScoreComponent key={comp.id} {...comp} />
                ))}
              </div>

              {/* Bonuses & Penalties */}
              {(selectedScore.bonuses.length > 0 || selectedScore.penalties.length > 0) && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-text-secondary mb-2">Rule Adjustments</p>
                  <div className="space-y-1">
                    {selectedScore.bonuses.map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{b.label}</span>
                        <span className="text-accent-green font-mono">+{b.amount.toFixed(0)}</span>
                      </div>
                    ))}
                    {selectedScore.penalties.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{p.label}</span>
                        <span className="text-error-red font-mono">-{p.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreComponent({
  icon: Icon,
  label,
  colorClass,
  raw,
  weighted,
  weight,
  factors,
  description,
}: {
  icon: typeof TrendingUp;
  label: string;
  colorClass: string;
  raw: number;
  weighted: number;
  weight: number;
  factors: string[];
  description: string;
}) {
  const [showFactors, setShowFactors] = useState(false);

  return (
    <div className={`p-3 rounded-lg border ${colorClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-[10px] text-text-tertiary bg-white/5 px-1.5 py-0.5 rounded">
            {(weight * 100).toFixed(0)}% weight
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-bold">{weighted.toFixed(1)}</div>
          <div className="text-[10px] text-text-tertiary">raw: {raw.toFixed(0)}</div>
        </div>
      </div>

      <p className="text-[11px] text-text-secondary mb-2">{description}</p>

      {/* Progress bar */}
      <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(raw, 100)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: 'currentColor', opacity: 0.6 }}
        />
      </div>

      {/* Factors toggle */}
      {factors.length > 0 && (
        <button
          onClick={() => setShowFactors(!showFactors)}
          className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          {showFactors ? 'Hide' : 'Show'} {factors.length} factor{factors.length !== 1 ? 's' : ''}
        </button>
      )}

      <AnimatePresence>
        {showFactors && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {factors.map((factor, i) => (
              <div key={i} className="text-[10px] text-text-tertiary pl-2 border-l border-white/10">
                {factor}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
