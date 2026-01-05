'use client';

import { motion } from 'framer-motion';
import { TrendingUp, CreditCard, Wallet, Shield, Check } from 'lucide-react';
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
    <div className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Token Comparison</h3>
        <p className="text-xs text-text-secondary mt-0.5">Ranked by final weighted score</p>
      </div>

      {/* Score bars */}
      <div className="p-4 space-y-4">
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
      <div className="px-4 py-3 border-t border-white/5 bg-black/20">
        <div className="flex flex-wrap items-center gap-4">
          <LegendItem icon={TrendingUp} label="Rewards" color="text-accent-green" />
          <LegendItem icon={CreditCard} label="Credit" color="text-accent-teal" />
          <LegendItem icon={Wallet} label="Cashflow" color="text-accent-orange" />
          <LegendItem icon={Shield} label="Risk" color="text-accent-pink" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ icon: Icon, label, color }: { icon: typeof TrendingUp; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3 h-3 ${color}`} />
      <span className="text-[11px] text-text-secondary">{label}</span>
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

  // Calculate segment widths based on weighted contributions
  const total = score.subscores.rewards.weighted +
    score.subscores.credit.weighted +
    score.subscores.cashflow.weighted +
    score.subscores.risk.weighted;

  const getSegmentWidth = (weighted: number) => {
    if (total === 0) return 0;
    return (weighted / score.finalScore) * totalWidth;
  };

  return (
    <div className={`transition-all duration-200 ${isSelected ? 'scale-[1.01]' : ''}`}>
      {/* Token info row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`
            w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
            ${rank === 1 ? 'bg-accent-green/20 text-accent-green' : 'bg-white/5 text-text-tertiary'}
          `}>
            {rank}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
              {score.tokenName}
            </span>
            {isSelected && (
              <span className="flex items-center gap-1 text-[10px] bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                Selected
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-mono font-bold ${isSelected ? 'text-accent-green' : 'text-white'}`}>
            {score.finalScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-text-tertiary ml-1">/ 100</span>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-8 bg-black/30 rounded-lg overflow-hidden relative">
        <motion.div
          className="absolute inset-y-0 left-0 flex"
          initial={{ width: 0 }}
          animate={{ width: `${totalWidth}%` }}
          transition={{ duration: 0.5, delay: rank * 0.08 }}
        >
          <div
            className="h-full bg-accent-green"
            style={{ width: `${getSegmentWidth(score.subscores.rewards.weighted)}%` }}
          />
          <div
            className="h-full bg-accent-teal"
            style={{ width: `${getSegmentWidth(score.subscores.credit.weighted)}%` }}
          />
          <div
            className="h-full bg-accent-orange"
            style={{ width: `${getSegmentWidth(score.subscores.cashflow.weighted)}%` }}
          />
          <div
            className="h-full bg-accent-pink"
            style={{ width: `${getSegmentWidth(score.subscores.risk.weighted)}%` }}
          />
        </motion.div>

        {/* Score labels inside bar */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <div className="flex items-center gap-3 text-[10px] font-mono text-white/80">
            <span>{score.subscores.rewards.weighted.toFixed(1)}</span>
            <span>{score.subscores.credit.weighted.toFixed(1)}</span>
            <span>{score.subscores.cashflow.weighted.toFixed(1)}</span>
            <span>{score.subscores.risk.weighted.toFixed(1)}</span>
          </div>
          {(score.totalBonuses > 0 || score.totalPenalties > 0) && (
            <div className="flex items-center gap-1 text-[10px] font-mono">
              {score.totalBonuses > 0 && (
                <span className="text-accent-green">+{score.totalBonuses.toFixed(0)}</span>
              )}
              {score.totalPenalties > 0 && (
                <span className="text-error-red">-{score.totalPenalties.toFixed(0)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded details for selected token */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 grid grid-cols-4 gap-2"
        >
          <SubScoreCard
            icon={TrendingUp}
            label="Rewards"
            raw={score.subscores.rewards.raw}
            weighted={score.subscores.rewards.weighted}
            weight={score.subscores.rewards.weight}
            color="green"
          />
          <SubScoreCard
            icon={CreditCard}
            label="Credit"
            raw={score.subscores.credit.raw}
            weighted={score.subscores.credit.weighted}
            weight={score.subscores.credit.weight}
            color="teal"
          />
          <SubScoreCard
            icon={Wallet}
            label="Cashflow"
            raw={score.subscores.cashflow.raw}
            weighted={score.subscores.cashflow.weighted}
            weight={score.subscores.cashflow.weight}
            color="orange"
          />
          <SubScoreCard
            icon={Shield}
            label="Risk"
            raw={score.subscores.risk.raw}
            weighted={score.subscores.risk.weighted}
            weight={score.subscores.risk.weight}
            color="pink"
          />
        </motion.div>
      )}
    </div>
  );
}

function SubScoreCard({
  icon: Icon,
  label,
  raw,
  weighted,
  weight,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  raw: number;
  weighted: number;
  weight: number;
  color: 'green' | 'teal' | 'orange' | 'pink';
}) {
  const colorClasses = {
    green: 'border-accent-green/20 bg-accent-green/5 text-accent-green',
    teal: 'border-accent-teal/20 bg-accent-teal/5 text-accent-teal',
    orange: 'border-accent-orange/20 bg-accent-orange/5 text-accent-orange',
    pink: 'border-accent-pink/20 bg-accent-pink/5 text-accent-pink',
  };

  return (
    <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-medium truncate">{label}</span>
      </div>
      <div className="text-lg font-mono font-bold">{weighted.toFixed(1)}</div>
      <div className="flex items-center justify-between text-[9px] text-text-tertiary mt-0.5">
        <span>raw: {raw.toFixed(0)}</span>
        <span>{(weight * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
