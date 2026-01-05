'use client';

import { motion } from 'framer-motion';
import { ScoreBreakdown } from '@/lib/types';

interface ScoreChartProps {
  scores: ScoreBreakdown[];
  selectedTokenId: string;
}

export default function ScoreChart({ scores, selectedTokenId }: ScoreChartProps) {
  const eligibleScores = scores.filter(s => !s.excluded);
  const maxScore = Math.max(...eligibleScores.map(s => s.finalScore), 100);

  if (eligibleScores.length === 0) return null;

  return (
    <div className="bg-void-light border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Score Comparison</h3>
      <div className="space-y-3">
        {eligibleScores
          .sort((a, b) => b.finalScore - a.finalScore)
          .map((score, idx) => (
            <ScoreBar
              key={score.tokenId}
              score={score}
              maxScore={maxScore}
              isSelected={score.tokenId === selectedTokenId}
              rank={idx + 1}
            />
          ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-neon-green" />
          <span className="text-[10px] text-gray-500">Rewards</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-neon-cyan" />
          <span className="text-[10px] text-gray-500">Credit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-neon-orange" />
          <span className="text-[10px] text-gray-500">Cashflow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-neon-pink" />
          <span className="text-[10px] text-gray-500">Risk</span>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  score,
  maxScore,
  isSelected,
  rank,
}: {
  score: ScoreBreakdown;
  maxScore: number;
  isSelected: boolean;
  rank: number;
}) {
  const totalWidth = (score.finalScore / maxScore) * 100;
  const rewards = score.subscores.rewards.weighted;
  const credit = score.subscores.credit.weighted;
  const cashflow = score.subscores.cashflow.weighted;
  const risk = score.subscores.risk.weighted;
  const total = rewards + credit + cashflow + risk;

  const getPercent = (val: number) => total > 0 ? (val / score.finalScore) * totalWidth : 0;

  return (
    <div className={`${isSelected ? 'scale-[1.02]' : ''} transition-transform`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            rank === 1 ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-800 text-gray-500'
          }`}>
            {rank}
          </span>
          <span className={`text-sm truncate max-w-[120px] ${
            isSelected ? 'text-neon-green font-semibold' : 'text-gray-300'
          }`}>
            {score.tokenName}
          </span>
          {isSelected && (
            <span className="text-[10px] bg-neon-green/20 text-neon-green px-1.5 py-0.5 rounded">
              SELECTED
            </span>
          )}
        </div>
        <span className={`text-sm font-mono font-bold ${
          isSelected ? 'text-neon-green' : 'text-white'
        }`}>
          {score.finalScore.toFixed(1)}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-6 bg-gray-900 rounded-full overflow-hidden relative">
        <motion.div
          className="absolute inset-y-0 left-0 flex"
          initial={{ width: 0 }}
          animate={{ width: `${totalWidth}%` }}
          transition={{ duration: 0.5, delay: rank * 0.1 }}
        >
          <div
            className="h-full bg-neon-green"
            style={{ width: `${getPercent(rewards)}%` }}
          />
          <div
            className="h-full bg-neon-cyan"
            style={{ width: `${getPercent(credit)}%` }}
          />
          <div
            className="h-full bg-neon-orange"
            style={{ width: `${getPercent(cashflow)}%` }}
          />
          <div
            className="h-full bg-neon-pink"
            style={{ width: `${getPercent(risk)}%` }}
          />
        </motion.div>

        {/* Bonuses/Penalties indicator */}
        {(score.totalBonuses > 0 || score.totalPenalties > 0) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {score.totalBonuses > 0 && (
              <span className="text-[10px] text-neon-green font-mono">+{score.totalBonuses.toFixed(0)}</span>
            )}
            {score.totalPenalties > 0 && (
              <span className="text-[10px] text-error-red font-mono">-{score.totalPenalties.toFixed(0)}</span>
            )}
          </div>
        )}
      </div>

      {/* Subscore breakdown on hover/always for selected */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 grid grid-cols-4 gap-2 text-center"
        >
          <SubScore label="Rewards" raw={score.subscores.rewards.raw} weighted={rewards} color="green" />
          <SubScore label="Credit" raw={score.subscores.credit.raw} weighted={credit} color="cyan" />
          <SubScore label="Cashflow" raw={score.subscores.cashflow.raw} weighted={cashflow} color="orange" />
          <SubScore label="Risk" raw={score.subscores.risk.raw} weighted={risk} color="pink" />
        </motion.div>
      )}
    </div>
  );
}

function SubScore({
  label,
  raw,
  weighted,
  color,
}: {
  label: string;
  raw: number;
  weighted: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'border-neon-green/30 text-neon-green',
    cyan: 'border-neon-cyan/30 text-neon-cyan',
    orange: 'border-neon-orange/30 text-neon-orange',
    pink: 'border-neon-pink/30 text-neon-pink',
  };

  return (
    <div className={`p-1.5 rounded border ${colorClasses[color]} bg-void`}>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-sm font-mono font-bold">{weighted.toFixed(1)}</div>
      <div className="text-[9px] text-gray-600">raw: {raw.toFixed(0)}</div>
    </div>
  );
}
