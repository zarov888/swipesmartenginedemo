'use client';

import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { ScoreBreakdown } from '@/lib/types';

interface ConfidenceIndicatorProps {
  scores: ScoreBreakdown[];
  selectedTokenId: string;
}

export default function ConfidenceIndicator({ scores, selectedTokenId }: ConfidenceIndicatorProps) {
  const activeScores = scores.filter(s => !s.excluded).sort((a, b) => b.finalScore - a.finalScore);

  if (activeScores.length < 2) return null;

  const winner = activeScores[0];
  const runnerUp = activeScores[1];
  const margin = winner.finalScore - runnerUp.finalScore;

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  let confidenceLabel: string;
  let confidenceColor: string;
  let Icon: typeof CheckCircle;

  if (margin >= 15) {
    confidence = 'high';
    confidenceLabel = 'High Confidence';
    confidenceColor = 'accent-green';
    Icon = CheckCircle;
  } else if (margin >= 5) {
    confidence = 'medium';
    confidenceLabel = 'Moderate Confidence';
    confidenceColor = 'accent-orange';
    Icon = TrendingUp;
  } else {
    confidence = 'low';
    confidenceLabel = 'Close Call';
    confidenceColor = 'accent-pink';
    Icon = AlertTriangle;
  }

  const confidencePercent = Math.min(100, (margin / 25) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-blue" />
          <h3 className="text-sm font-semibold text-white">Decision Confidence</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-${confidenceColor}/10 border border-${confidenceColor}/20`}>
          <Icon className={`w-3 h-3 text-${confidenceColor}`} />
          <span className={`text-[10px] font-semibold text-${confidenceColor}`}>{confidenceLabel}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Main metric */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">Winning Margin</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-mono font-bold text-${confidenceColor}`}>
                +{margin.toFixed(1)}
              </span>
              <span className="text-sm text-text-tertiary">pts</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary mb-1">vs Runner-up</p>
            <p className="text-sm font-medium text-white">{runnerUp.tokenName}</p>
            <p className="text-xs text-text-tertiary font-mono">{runnerUp.finalScore.toFixed(1)} pts</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
            <span>Low</span>
            <span>High</span>
          </div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidencePercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${
                confidence === 'high' ? 'from-accent-green/60 to-accent-green' :
                confidence === 'medium' ? 'from-accent-orange/60 to-accent-orange' :
                'from-accent-pink/60 to-accent-pink'
              }`}
            />
          </div>
        </div>

        {/* Insight */}
        <div className={`p-3 rounded-lg bg-${confidenceColor}/5 border border-${confidenceColor}/10`}>
          <p className={`text-xs text-${confidenceColor}`}>
            {confidence === 'high' && (
              <>
                <strong>{winner.tokenName}</strong> is the clear optimal choice.
                Small input changes won't affect this selection.
              </>
            )}
            {confidence === 'medium' && (
              <>
                <strong>{winner.tokenName}</strong> leads, but <strong>{runnerUp.tokenName}</strong> is competitive.
                Weight adjustments could change the outcome.
              </>
            )}
            {confidence === 'low' && (
              <>
                Very close race between <strong>{winner.tokenName}</strong> and <strong>{runnerUp.tokenName}</strong>.
                Minor changes to weights or context could flip the selection.
              </>
            )}
          </p>
        </div>

        {/* Top 3 breakdown */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Score Ladder</p>
          <div className="space-y-2">
            {activeScores.slice(0, 3).map((score, idx) => (
              <div key={score.tokenId} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  idx === 0 ? 'bg-accent-green/20 text-accent-green' :
                  idx === 1 ? 'bg-white/10 text-text-secondary' :
                  'bg-white/5 text-text-tertiary'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score.finalScore}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-accent-green' :
                        idx === 1 ? 'bg-white/40' :
                        'bg-white/20'
                      }`}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono text-text-secondary w-16 text-right">
                  {score.finalScore.toFixed(1)}
                </span>
                <span className="text-xs text-text-tertiary w-20 truncate">
                  {score.tokenName.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
