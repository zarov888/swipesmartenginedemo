'use client';

import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, TrendingDown, Shuffle } from 'lucide-react';
import { SensitivityResult } from '@/lib/types';

interface SensitivityAlertsProps {
  sensitivity: SensitivityResult[];
  currentWinnerName: string;
}

export default function SensitivityAlerts({ sensitivity, currentWinnerName }: SensitivityAlertsProps) {
  // Filter to only show alerts where winner would change
  const criticalAlerts = sensitivity.filter(s => s.winnerChanged);

  if (criticalAlerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-accent-green">Stable Selection</p>
            <p className="text-xs text-text-secondary">
              Weight changes of ±10% would not change the winning token
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const criterionLabels: Record<string, string> = {
    rewards: 'Rewards',
    credit: 'Credit Health',
    cashflow: 'Cash Flow',
    risk: 'Risk Aversion',
  };

  const criterionColors: Record<string, string> = {
    rewards: 'accent-green',
    credit: 'accent-teal',
    cashflow: 'accent-orange',
    risk: 'accent-pink',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 bg-accent-orange/5">
        <AlertCircle className="w-4 h-4 text-accent-orange" />
        <span className="text-sm font-semibold text-white">Sensitivity Alerts</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-accent-orange/10 text-accent-orange border border-accent-orange/20">
          {criticalAlerts.length} potential flip{criticalAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-text-secondary mb-3">
          These weight adjustments would change the selected token:
        </p>

        {criticalAlerts.map((alert, idx) => (
          <motion.div
            key={`${alert.criterion}-${alert.direction}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-3 rounded-lg bg-${criterionColors[alert.criterion]}/5 border border-${criterionColors[alert.criterion]}/20`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {alert.direction === 'increase' ? (
                  <TrendingUp className={`w-4 h-4 text-${criterionColors[alert.criterion]}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 text-${criterionColors[alert.criterion]}`} />
                )}
                <span className="text-sm font-medium text-white">
                  {criterionLabels[alert.criterion]} {alert.direction === 'increase' ? '+' : '-'}10%
                </span>
              </div>
              <Shuffle className="w-4 h-4 text-accent-orange" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-secondary">{currentWinnerName}</span>
              <span className="text-accent-orange">→</span>
              <span className="text-white font-medium">{alert.newWinner}</span>
              <span className="text-text-tertiary ml-auto font-mono">
                ({alert.newScore.toFixed(1)} pts)
              </span>
            </div>
          </motion.div>
        ))}

        <p className="text-[10px] text-text-tertiary pt-2 border-t border-white/5">
          Based on ±10% weight perturbation analysis
        </p>
      </div>
    </motion.div>
  );
}
