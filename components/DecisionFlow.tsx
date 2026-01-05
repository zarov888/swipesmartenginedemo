'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Filter, Calculator, Trophy, CheckCircle, XCircle, ArrowRight, Zap, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { ScoreBreakdown, RuleEvaluationResult, ExcludedToken, Token } from '@/lib/types';
import { CardVisual } from './CardBrand';

interface DecisionFlowProps {
  isVisible: boolean;
  scores: ScoreBreakdown[];
  matchedRules: RuleEvaluationResult[];
  excludedTokens: ExcludedToken[];
  selectedTokenId: string;
  selectedTokenName: string;
  isForced: boolean;
  forcingRule?: string;
}

export default function DecisionFlow({
  isVisible,
  scores,
  matchedRules,
  excludedTokens,
  selectedTokenId,
  selectedTokenName,
  isForced,
  forcingRule,
}: DecisionFlowProps) {
  if (!isVisible || scores.length === 0) return null;

  const eligibleTokens = scores.filter(s => !s.excluded);
  const topScorer = eligibleTokens.length > 0
    ? eligibleTokens.reduce((a, b) => a.finalScore > b.finalScore ? a : b)
    : null;

  const stages = [
    { id: 'tokens', label: 'Tokens', icon: CreditCard, count: scores.length },
    { id: 'rules', label: 'Rules', icon: Shield, count: matchedRules.length },
    { id: 'filter', label: 'Filter', icon: Filter, count: excludedTokens.length },
    { id: 'score', label: 'Score', icon: Calculator, count: eligibleTokens.length },
    { id: 'select', label: 'Select', icon: Trophy, count: 1 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-void-light border border-gray-800 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-neon-cyan" />
        <h3 className="text-sm font-semibold text-white">Decision Flow</h3>
        {isForced && (
          <span className="text-[10px] bg-warn-amber/20 text-warn-amber px-2 py-0.5 rounded-full">
            HARD OVERRIDE
          </span>
        )}
      </div>

      {/* Flow Stages */}
      <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="flex items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                idx === stages.length - 1
                  ? 'border-neon-green bg-neon-green/20'
                  : 'border-neon-cyan/50 bg-neon-cyan/10'
              }`}>
                <stage.icon className={`w-5 h-5 ${
                  idx === stages.length - 1 ? 'text-neon-green' : 'text-neon-cyan'
                }`} />
              </div>
              <span className="text-[10px] text-gray-400 mt-1">{stage.label}</span>
              <span className="text-xs font-mono text-neon-cyan">{stage.count}</span>
            </motion.div>
            {idx < stages.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: idx * 0.1 + 0.05 }}
                className="w-8 md:w-16 h-0.5 bg-gradient-to-r from-neon-cyan/50 to-neon-cyan/20 mx-1"
              />
            )}
          </div>
        ))}
      </div>

      {/* Token Flow Visualization */}
      <div className="relative">
        {/* All tokens flowing in */}
        <div className="flex flex-wrap gap-2 mb-3">
          {scores.map((score, idx) => (
            <motion.div
              key={score.tokenId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`px-2 py-1 rounded text-xs font-mono flex items-center gap-1 ${
                score.excluded
                  ? 'bg-error-red/10 border border-error-red/30 text-error-red line-through'
                  : score.tokenId === selectedTokenId
                  ? 'bg-neon-green/20 border border-neon-green/50 text-neon-green'
                  : 'bg-gray-800 border border-gray-700 text-gray-400'
              }`}
            >
              {score.excluded ? (
                <XCircle className="w-3 h-3" />
              ) : score.tokenId === selectedTokenId ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <CreditCard className="w-3 h-3" />
              )}
              <span className="truncate max-w-[80px]">{score.tokenName}</span>
              {!score.excluded && (
                <span className="text-[10px] opacity-70">{score.finalScore.toFixed(0)}</span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Exclusion reasons */}
        {excludedTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-3 p-2 bg-error-red/5 border border-error-red/20 rounded"
          >
            <div className="text-[10px] text-error-red font-semibold mb-1 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Excluded ({excludedTokens.length})
            </div>
            <div className="space-y-1">
              {excludedTokens.slice(0, 3).map(ex => (
                <div key={ex.tokenId} className="text-[10px] text-gray-500">
                  <span className="text-gray-400">{ex.tokenName}:</span> {ex.reason}
                </div>
              ))}
              {excludedTokens.length > 3 && (
                <div className="text-[10px] text-gray-600">+{excludedTokens.length - 3} more</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Winner announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className={`p-3 rounded-lg border ${
            isForced
              ? 'bg-warn-amber/10 border-warn-amber/30'
              : 'bg-neon-green/10 border-neon-green/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isForced ? 'bg-warn-amber/20' : 'bg-neon-green/20'
            }`}>
              <Trophy className={`w-5 h-5 ${isForced ? 'text-warn-amber' : 'text-neon-green'}`} />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Selected Route</div>
              <div className={`text-lg font-bold ${isForced ? 'text-warn-amber' : 'text-neon-green'}`}>
                {selectedTokenName}
              </div>
              {isForced && forcingRule && (
                <div className="text-xs text-warn-amber/80 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  Forced by: {forcingRule}
                </div>
              )}
              {!isForced && topScorer && (
                <div className="text-xs text-gray-500 mt-1">
                  Score: {topScorer.finalScore.toFixed(1)} / 100
                </div>
              )}
            </div>
            {topScorer && !isForced && (
              <div className="text-right">
                <ScoreMini label="RWD" value={topScorer.subscores.rewards.weighted} color="green" />
                <ScoreMini label="CRD" value={topScorer.subscores.credit.weighted} color="cyan" />
                <ScoreMini label="CSH" value={topScorer.subscores.cashflow.weighted} color="orange" />
                <ScoreMini label="RSK" value={topScorer.subscores.risk.weighted} color="pink" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ScoreMini({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'text-neon-green',
    cyan: 'text-neon-cyan',
    orange: 'text-neon-orange',
    pink: 'text-neon-pink',
  };

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="text-gray-500">{label}</span>
      <span className={colorClasses[color]}>{value.toFixed(1)}</span>
    </div>
  );
}
