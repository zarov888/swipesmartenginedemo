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
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-base font-semibold text-white">Token Comparison</h3>
        <p className="text-sm text-text-secondary mt-1">Ranked by final weighted score</p>
      </div>

      {/* Score bars */}
      <div className="p-5 space-y-6">
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
      <div className="px-5 py-4 border-t border-white/5 bg-black/20">
        <div className="flex flex-wrap items-center gap-6">
          <LegendItem icon={TrendingUp} label="Rewards" color="bg-accent-green" />
          <LegendItem icon={CreditCard} label="Credit" color="bg-accent-teal" />
          <LegendItem icon={Wallet} label="Cashflow" color="bg-accent-orange" />
          <LegendItem icon={Shield} label="Risk" color="bg-accent-pink" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ icon: Icon, label, color }: { icon: typeof TrendingUp; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-xs text-text-secondary">{label}</span>
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

  const segments = [
    { key: 'rewards', value: score.subscores.rewards.weighted, color: 'bg-accent-green', label: 'RWD' },
    { key: 'credit', value: score.subscores.credit.weighted, color: 'bg-accent-teal', label: 'CRD' },
    { key: 'cashflow', value: score.subscores.cashflow.weighted, color: 'bg-accent-orange', label: 'CSH' },
    { key: 'risk', value: score.subscores.risk.weighted, color: 'bg-accent-pink', label: 'RSK' },
  ];

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={`transition-all duration-200 ${isSelected ? 'scale-[1.01]' : ''}`}>
      {/* Token info row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`
            w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold
            ${rank === 1 ? 'bg-accent-green/20 text-accent-green' : 'bg-white/5 text-text-tertiary'}
          `}>
            {rank}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                {score.tokenName}
              </span>
              {isSelected && (
                <span className="flex items-center gap-1 text-[10px] bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full font-medium">
                  <Check className="w-3 h-3" />
                  Selected
                </span>
              )}
            </div>
            {(score.totalBonuses > 0 || score.totalPenalties > 0) && (
              <div className="flex items-center gap-2 mt-0.5">
                {score.totalBonuses > 0 && (
                  <span className="text-[10px] text-accent-green">+{score.totalBonuses.toFixed(0)} bonus</span>
                )}
                {score.totalPenalties > 0 && (
                  <span className="text-[10px] text-error-red">-{score.totalPenalties.toFixed(0)} penalty</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-mono font-bold ${isSelected ? 'text-accent-green' : 'text-white'}`}>
            {score.finalScore.toFixed(1)}
          </span>
          <span className="text-xs text-text-tertiary ml-1">/ 100</span>
        </div>
      </div>

      {/* Segmented bar with labels above */}
      <div className="space-y-1.5">
        {/* Labels row */}
        <div className="flex" style={{ width: `${totalWidth}%` }}>
          {segments.map((seg, idx) => {
            const segmentPercent = total > 0 ? (seg.value / total) * 100 : 25;
            return (
              <div
                key={seg.key}
                className="flex flex-col items-center justify-end"
                style={{ width: `${segmentPercent}%` }}
              >
                <span className={`text-[10px] font-mono font-medium ${
                  seg.key === 'rewards' ? 'text-accent-green' :
                  seg.key === 'credit' ? 'text-accent-teal' :
                  seg.key === 'cashflow' ? 'text-accent-orange' :
                  'text-accent-pink'
                }`}>
                  {seg.value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bar */}
        <div className="h-6 bg-black/30 rounded-lg overflow-hidden">
          <motion.div
            className="h-full flex"
            initial={{ width: 0 }}
            animate={{ width: `${totalWidth}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: rank * 0.1 }}
          >
            {segments.map((seg, idx) => {
              const segmentPercent = total > 0 ? (seg.value / total) * 100 : 25;
              return (
                <motion.div
                  key={seg.key}
                  className={`h-full ${seg.color} ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === segments.length - 1 ? 'rounded-r-lg' : ''}`}
                  style={{ width: `${segmentPercent}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                />
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Expanded details for selected token */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 grid grid-cols-4 gap-3"
        >
          <SubScoreCard
            icon={TrendingUp}
            label="Rewards"
            raw={score.subscores.rewards.raw}
            weighted={score.subscores.rewards.weighted}
            weight={score.subscores.rewards.weight}
            factors={score.subscores.rewards.factors}
            color="green"
          />
          <SubScoreCard
            icon={CreditCard}
            label="Credit"
            raw={score.subscores.credit.raw}
            weighted={score.subscores.credit.weighted}
            weight={score.subscores.credit.weight}
            factors={score.subscores.credit.factors}
            color="teal"
          />
          <SubScoreCard
            icon={Wallet}
            label="Cashflow"
            raw={score.subscores.cashflow.raw}
            weighted={score.subscores.cashflow.weighted}
            weight={score.subscores.cashflow.weight}
            factors={score.subscores.cashflow.factors}
            color="orange"
          />
          <SubScoreCard
            icon={Shield}
            label="Risk"
            raw={score.subscores.risk.raw}
            weighted={score.subscores.risk.weighted}
            weight={score.subscores.risk.weight}
            factors={score.subscores.risk.factors}
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
  factors,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  raw: number;
  weighted: number;
  weight: number;
  factors: string[];
  color: 'green' | 'teal' | 'orange' | 'pink';
}) {
  const colorClasses = {
    green: 'border-accent-green/30 bg-accent-green/10',
    teal: 'border-accent-teal/30 bg-accent-teal/10',
    orange: 'border-accent-orange/30 bg-accent-orange/10',
    pink: 'border-accent-pink/30 bg-accent-pink/10',
  };

  const textClasses = {
    green: 'text-accent-green',
    teal: 'text-accent-teal',
    orange: 'text-accent-orange',
    pink: 'text-accent-pink',
  };

  return (
    <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-4 h-4 ${textClasses[color]}`} />
        <span className={`text-xs font-semibold ${textClasses[color]}`}>{label}</span>
      </div>
      <div className={`text-2xl font-mono font-bold ${textClasses[color]}`}>
        {weighted.toFixed(1)}
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1">
        <span>Raw: {raw.toFixed(0)}</span>
        <span className="bg-white/5 px-1.5 py-0.5 rounded">{(weight * 100).toFixed(0)}%</span>
      </div>
      {factors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="text-[9px] text-text-tertiary leading-relaxed line-clamp-2">
            {factors[0]}
          </div>
        </div>
      )}
    </div>
  );
}
