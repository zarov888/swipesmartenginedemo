'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Shield, DollarSign, TrendingUp, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { ScoreBreakdown, TransactionContext } from '@/lib/types';

interface RewardsTrackerProps {
  scores: ScoreBreakdown[];
  selectedTokenId: string;
  context: TransactionContext;
  transactionCount: number;
}

interface SessionStats {
  totalRewardsEarned: number;
  totalCreditProtected: number;
  totalOptimized: number;
  transactionCount: number;
  approvedCount: number;
}

// Persist stats in localStorage
const STORAGE_KEY = 'swipesmart-session-stats';

function getStoredStats(): SessionStats {
  if (typeof window === 'undefined') {
    return { totalRewardsEarned: 0, totalCreditProtected: 0, totalOptimized: 0, transactionCount: 0, approvedCount: 0 };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { totalRewardsEarned: 0, totalCreditProtected: 0, totalOptimized: 0, transactionCount: 0, approvedCount: 0 };
}

function saveStats(stats: SessionStats) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export default function RewardsTracker({ scores, selectedTokenId, context, transactionCount }: RewardsTrackerProps) {
  const [stats, setStats] = useState<SessionStats>(getStoredStats);
  const [expanded, setExpanded] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<{ field: string; delta: number } | null>(null);

  const selectedScore = scores.find(s => s.tokenId === selectedTokenId);

  // Calculate current transaction value
  const currentRewards = selectedScore
    ? (selectedScore.subscores.rewards.normalized / 100) * context.amount * 0.02 // ~2% effective rewards
    : 0;

  const currentCreditSaved = selectedScore?.subscores.credit.normalized || 0;

  // Compare to worst option to show optimization
  const worstScore = scores.filter(s => !s.excluded).sort((a, b) => a.finalScore - b.finalScore)[0];
  const optimizationGain = selectedScore && worstScore
    ? selectedScore.finalScore - worstScore.finalScore
    : 0;

  // Update stats when transaction count changes
  useEffect(() => {
    if (transactionCount > stats.transactionCount && selectedScore) {
      const newStats = {
        totalRewardsEarned: stats.totalRewardsEarned + currentRewards,
        totalCreditProtected: stats.totalCreditProtected + (currentCreditSaved > 70 ? 1 : 0),
        totalOptimized: stats.totalOptimized + optimizationGain,
        transactionCount: transactionCount,
        approvedCount: stats.approvedCount + 1,
      };
      setStats(newStats);
      saveStats(newStats);
      setLastUpdate({ field: 'rewards', delta: currentRewards });
      setTimeout(() => setLastUpdate(null), 2000);
    }
  }, [transactionCount]);

  const resetStats = () => {
    const fresh = { totalRewardsEarned: 0, totalCreditProtected: 0, totalOptimized: 0, transactionCount: 0, approvedCount: 0 };
    setStats(fresh);
    saveStats(fresh);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-accent-purple/10 via-surface-50 to-accent-blue/10 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-purple" />
          <h3 className="text-sm font-semibold text-white">Session Rewards</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">{stats.transactionCount} transactions</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Rewards Earned */}
                <div className="p-3 bg-accent-green/10 rounded-xl border border-accent-green/20 text-center relative overflow-hidden">
                  <Gift className="w-5 h-5 text-accent-green mx-auto mb-1" />
                  <motion.p
                    key={stats.totalRewardsEarned}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-xl font-mono font-bold text-accent-green"
                  >
                    ${stats.totalRewardsEarned.toFixed(2)}
                  </motion.p>
                  <p className="text-[10px] text-text-tertiary">Rewards Value</p>
                  {lastUpdate?.field === 'rewards' && (
                    <motion.div
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -20 }}
                      className="absolute top-1 right-1 text-[10px] text-accent-green font-mono"
                    >
                      +${lastUpdate.delta.toFixed(2)}
                    </motion.div>
                  )}
                </div>

                {/* Credit Protected */}
                <div className="p-3 bg-accent-teal/10 rounded-xl border border-accent-teal/20 text-center">
                  <Shield className="w-5 h-5 text-accent-teal mx-auto mb-1" />
                  <p className="text-xl font-mono font-bold text-accent-teal">
                    {stats.totalCreditProtected}
                  </p>
                  <p className="text-[10px] text-text-tertiary">Credit Protected</p>
                </div>

                {/* Optimization Score */}
                <div className="p-3 bg-accent-purple/10 rounded-xl border border-accent-purple/20 text-center">
                  <TrendingUp className="w-5 h-5 text-accent-purple mx-auto mb-1" />
                  <p className="text-xl font-mono font-bold text-accent-purple">
                    +{stats.totalOptimized.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-text-tertiary">Pts Optimized</p>
                </div>
              </div>

              {/* Current Transaction */}
              {selectedScore && (
                <div className="p-3 bg-black/20 rounded-lg mb-3">
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">This Transaction</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Gift className="w-3 h-3 text-accent-green" />
                        <span className="text-xs text-white font-mono">+${currentRewards.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-accent-teal" />
                        <span className="text-xs text-white font-mono">{currentCreditSaved.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-accent-purple" />
                        <span className="text-xs text-white font-mono">+{optimizationGain.toFixed(1)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-accent-green font-medium">
                      {selectedScore.tokenName}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
                  <span>Session Progress</span>
                  <span>{stats.approvedCount} approved</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.approvedCount / 10) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-accent-green via-accent-teal to-accent-purple rounded-full"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetStats}
                className="w-full py-2 text-[10px] text-text-tertiary hover:text-white transition-colors"
              >
                Reset Session Stats
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
