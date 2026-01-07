'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, CreditCard, AlertTriangle, Shield, Info } from 'lucide-react';
import { Token, TransactionContext } from '@/lib/types';

interface CreditImpactSimulatorProps {
  tokens: Token[];
  selectedTokenId: string;
  context: TransactionContext;
}

interface CreditProjection {
  month: number;
  utilization: number;
  scoreImpact: number;
  cumulativeImpact: number;
}

export default function CreditImpactSimulator({ tokens, selectedTokenId, context }: CreditImpactSimulatorProps) {
  const [monthsAhead, setMonthsAhead] = useState(6);
  const [monthlySpend, setMonthlySpend] = useState(context.amount);

  const selectedToken = tokens.find(t => t.id === selectedTokenId);

  const projections = useMemo((): CreditProjection[] => {
    if (!selectedToken) return [];

    const creditLimit = selectedToken.limit || 10000;
    const currentBalance = selectedToken.balance || 0;
    const currentUtilization = (currentBalance / creditLimit) * 100;

    const results: CreditProjection[] = [];
    let runningBalance = currentBalance;

    for (let month = 1; month <= monthsAhead; month++) {
      // Simulate spending and partial payoff (assume 70% payoff each month)
      runningBalance = runningBalance + monthlySpend;
      const payoff = runningBalance * 0.7;
      runningBalance = runningBalance - payoff;

      const utilization = Math.min(100, (runningBalance / creditLimit) * 100);

      // Simplified FICO impact model
      let scoreImpact = 0;
      if (utilization < 10) scoreImpact = 20;
      else if (utilization < 30) scoreImpact = 10;
      else if (utilization < 50) scoreImpact = 0;
      else if (utilization < 75) scoreImpact = -15;
      else scoreImpact = -30;

      const cumulativeImpact = results.length > 0
        ? results[results.length - 1].cumulativeImpact + (scoreImpact - (results[results.length - 1].scoreImpact || 0)) * 0.3
        : scoreImpact;

      results.push({
        month,
        utilization,
        scoreImpact,
        cumulativeImpact: Math.round(cumulativeImpact),
      });
    }

    return results;
  }, [selectedToken, monthlySpend, monthsAhead]);

  const finalProjection = projections[projections.length - 1];
  const utilizationTrend = finalProjection
    ? finalProjection.utilization > 30 ? 'high' : finalProjection.utilization > 10 ? 'moderate' : 'low'
    : 'unknown';

  if (!selectedToken) return null;

  const currentUtilization = ((selectedToken.balance || 0) / (selectedToken.limit || 10000)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-accent-blue/10 via-surface-50 to-accent-teal/10 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent-blue" />
          <h3 className="text-sm font-semibold text-white">Credit Impact Simulator</h3>
        </div>
        <span className="text-[10px] text-text-tertiary">{selectedToken.name}</span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Current Status */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <p className="text-[10px] text-text-tertiary uppercase mb-1">Current Util.</p>
            <p className={`text-lg font-mono font-bold ${
              currentUtilization > 50 ? 'text-error-red' :
              currentUtilization > 30 ? 'text-accent-orange' : 'text-accent-green'
            }`}>
              {currentUtilization.toFixed(0)}%
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <p className="text-[10px] text-text-tertiary uppercase mb-1">Credit Limit</p>
            <p className="text-lg font-mono font-bold text-white">
              ${((selectedToken.limit || 10000) / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <p className="text-[10px] text-text-tertiary uppercase mb-1">Balance</p>
            <p className="text-lg font-mono font-bold text-white">
              ${(selectedToken.balance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-text-tertiary uppercase block mb-1">Monthly Spend</label>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={monthlySpend}
              onChange={(e) => setMonthlySpend(Number(e.target.value))}
              className="w-full accent-accent-blue"
            />
            <p className="text-xs text-white font-mono text-center mt-1">${monthlySpend}</p>
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary uppercase block mb-1">Months Ahead</label>
            <input
              type="range"
              min={3}
              max={12}
              step={1}
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(Number(e.target.value))}
              className="w-full accent-accent-blue"
            />
            <p className="text-xs text-white font-mono text-center mt-1">{monthsAhead} months</p>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="mb-4">
          <p className="text-[10px] text-text-tertiary uppercase mb-2">Utilization Projection</p>
          <div className="h-24 flex items-end gap-1">
            {projections.map((proj, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, proj.utilization)}%` }}
                  transition={{ delay: idx * 0.05 }}
                  className={`w-full rounded-t ${
                    proj.utilization > 50 ? 'bg-error-red' :
                    proj.utilization > 30 ? 'bg-accent-orange' : 'bg-accent-green'
                  }`}
                />
                <span className="text-[8px] text-text-tertiary">M{proj.month}</span>
              </div>
            ))}
          </div>
          {/* Threshold lines */}
          <div className="relative h-0 -mt-24 pointer-events-none">
            <div className="absolute w-full border-t border-dashed border-accent-orange/30" style={{ bottom: '30%' }} />
            <div className="absolute w-full border-t border-dashed border-error-red/30" style={{ bottom: '50%' }} />
          </div>
        </div>

        {/* Projected Impact */}
        {finalProjection && (
          <div className={`p-3 rounded-lg border ${
            finalProjection.cumulativeImpact > 0
              ? 'bg-accent-green/10 border-accent-green/20'
              : finalProjection.cumulativeImpact < -10
              ? 'bg-error-red/10 border-error-red/20'
              : 'bg-accent-orange/10 border-accent-orange/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {finalProjection.cumulativeImpact > 0 ? (
                  <TrendingUp className="w-4 h-4 text-accent-green" />
                ) : finalProjection.cumulativeImpact < -10 ? (
                  <TrendingDown className="w-4 h-4 text-error-red" />
                ) : (
                  <Minus className="w-4 h-4 text-accent-orange" />
                )}
                <span className="text-sm font-medium text-white">Projected Score Impact</span>
              </div>
              <span className={`text-lg font-mono font-bold ${
                finalProjection.cumulativeImpact > 0 ? 'text-accent-green' :
                finalProjection.cumulativeImpact < -10 ? 'text-error-red' : 'text-accent-orange'
              }`}>
                {finalProjection.cumulativeImpact > 0 ? '+' : ''}{finalProjection.cumulativeImpact}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {utilizationTrend === 'low'
                ? 'Excellent! Low utilization supports credit score growth.'
                : utilizationTrend === 'moderate'
                ? 'Good utilization. Consider spreading across cards for optimization.'
                : 'High utilization may impact your score. Consider increasing payments.'}
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-3 flex items-start gap-2 p-2 bg-white/5 rounded-lg">
          <Info className="w-3 h-3 text-text-tertiary mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-text-tertiary">
            Keep utilization below 30% for optimal credit score. This simulation assumes 70% monthly payoff.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
