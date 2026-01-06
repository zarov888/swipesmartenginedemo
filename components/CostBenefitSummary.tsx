'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Percent, Gift, AlertCircle } from 'lucide-react';
import { ScoreBreakdown, TransactionContext, Token } from '@/lib/types';

interface CostBenefitSummaryProps {
  score: ScoreBreakdown;
  context: TransactionContext;
  token?: Token;
}

export default function CostBenefitSummary({ score, context, token }: CostBenefitSummaryProps) {
  // Calculate estimated benefits
  const categoryRate = token?.rewardsByCategory[context.category || 'default'] || token?.rewardsByCategory['default'] || 1;
  const estimatedPoints = Math.round(context.amount * categoryRate);
  const pointValue = 0.01; // Assume 1 cent per point
  const estimatedRewardsValue = estimatedPoints * pointValue;

  // Calculate cashback if applicable
  const cashbackRate = token?.cashbackRate || 0;
  const estimatedCashback = context.amount * (cashbackRate / 100);

  // Calculate credit impact
  const currentUtil = token?.utilization || 0;
  const projectedUtil = token?.type === 'credit' && token.limit > 0
    ? ((token.balance || 0) + context.amount) / token.limit
    : 0;
  const utilizationIncrease = projectedUtil - currentUtil;

  // Estimate credit score impact (simplified model)
  let creditImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let creditImpactText = 'No impact';
  if (token?.type === 'credit') {
    if (projectedUtil > 0.50) {
      creditImpact = 'negative';
      creditImpactText = '-5 to -15 pts estimated';
    } else if (projectedUtil > 0.30) {
      creditImpact = 'negative';
      creditImpactText = '-2 to -5 pts estimated';
    } else if (projectedUtil < 0.10) {
      creditImpact = 'positive';
      creditImpactText = 'Optimal utilization maintained';
    }
  }

  // Calculate APR cost if carried
  const apr = token?.apr || 0;
  const monthlyRate = apr / 100 / 12;
  const interestCost30Days = context.amount * monthlyRate;

  // Signup bonus progress
  const signupBonus = token?.signupBonus;
  const bonusProgress = signupBonus
    ? Math.min(100, ((signupBonus.current + context.amount) / signupBonus.threshold) * 100)
    : null;
  const bonusRemaining = signupBonus
    ? Math.max(0, signupBonus.threshold - signupBonus.current - context.amount)
    : null;

  const benefits = [
    {
      icon: Gift,
      label: 'Rewards Earned',
      value: `${estimatedPoints.toLocaleString()} pts`,
      subtext: `≈ $${estimatedRewardsValue.toFixed(2)} value`,
      color: 'accent-green',
      show: estimatedPoints > 0,
    },
    {
      icon: Percent,
      label: 'Cash Back',
      value: `$${estimatedCashback.toFixed(2)}`,
      subtext: `${cashbackRate}% rate`,
      color: 'accent-teal',
      show: cashbackRate > 0,
    },
    {
      icon: TrendingUp,
      label: 'Bonus Progress',
      value: bonusProgress ? `${bonusProgress.toFixed(0)}%` : '—',
      subtext: bonusRemaining !== null && bonusRemaining > 0
        ? `$${bonusRemaining.toFixed(0)} to ${signupBonus?.reward.toLocaleString()} pts`
        : bonusProgress && bonusProgress >= 100 ? 'Bonus unlocked!' : 'No active bonus',
      color: 'accent-purple',
      show: !!signupBonus,
    },
  ].filter(b => b.show);

  const costs = [
    {
      icon: CreditCard,
      label: 'Credit Utilization',
      value: `${(projectedUtil * 100).toFixed(1)}%`,
      subtext: `+${(utilizationIncrease * 100).toFixed(1)}% from current`,
      color: projectedUtil > 0.30 ? 'accent-orange' : 'accent-teal',
      show: token?.type === 'credit',
    },
    {
      icon: TrendingDown,
      label: 'Credit Score Impact',
      value: creditImpactText,
      subtext: creditImpact === 'negative' ? 'Consider lower utilization' : '',
      color: creditImpact === 'negative' ? 'accent-pink' : creditImpact === 'positive' ? 'accent-green' : 'text-secondary',
      show: token?.type === 'credit',
    },
    {
      icon: DollarSign,
      label: 'Interest if Carried (30d)',
      value: `$${interestCost30Days.toFixed(2)}`,
      subtext: `${apr}% APR`,
      color: apr > 20 ? 'accent-orange' : 'text-secondary',
      show: token?.type === 'credit' && apr > 0,
    },
  ].filter(c => c.show);

  const totalBenefit = estimatedRewardsValue + estimatedCashback;
  const totalCost = interestCost30Days;
  const netValue = totalBenefit - totalCost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-accent-green" />
          <h3 className="text-sm font-semibold text-white">Cost/Benefit Analysis</h3>
        </div>
        <span className="text-xs text-text-secondary">{score.tokenName}</span>
      </div>

      <div className="p-4">
        {/* Net Value Hero */}
        <div className={`p-4 rounded-xl mb-4 ${
          netValue >= 0 ? 'bg-accent-green/10 border border-accent-green/20' : 'bg-accent-pink/10 border border-accent-pink/20'
        }`}>
          <p className="text-xs text-text-secondary mb-1">Estimated Net Value</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold ${netValue >= 0 ? 'text-accent-green' : 'text-accent-pink'}`}>
              {netValue >= 0 ? '+' : ''}{netValue.toFixed(2)}
            </span>
            <span className="text-sm text-text-tertiary">for this transaction</span>
          </div>
        </div>

        {/* Benefits */}
        {benefits.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Benefits</p>
            <div className="space-y-2">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center justify-between p-2 rounded-lg bg-${benefit.color}/5 border border-${benefit.color}/10`}
                >
                  <div className="flex items-center gap-2">
                    <benefit.icon className={`w-4 h-4 text-${benefit.color}`} />
                    <div>
                      <p className="text-xs font-medium text-white">{benefit.label}</p>
                      {benefit.subtext && (
                        <p className="text-[10px] text-text-tertiary">{benefit.subtext}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-mono font-bold text-${benefit.color}`}>
                    {benefit.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Costs */}
        {costs.length > 0 && (
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Costs & Considerations</p>
            <div className="space-y-2">
              {costs.map((cost, idx) => (
                <motion.div
                  key={cost.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (benefits.length + idx) * 0.05 }}
                  className={`flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10`}
                >
                  <div className="flex items-center gap-2">
                    <cost.icon className={`w-4 h-4 text-${cost.color}`} />
                    <div>
                      <p className="text-xs font-medium text-white">{cost.label}</p>
                      {cost.subtext && (
                        <p className="text-[10px] text-text-tertiary">{cost.subtext}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-mono text-${cost.color}`}>
                    {cost.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Optimal timing hint */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-blue/5 border border-accent-blue/10">
            <Calendar className="w-4 h-4 text-accent-blue mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white">Payment Timing</p>
              <p className="text-[10px] text-text-secondary">
                {token?.type === 'credit'
                  ? `Statement closes in ~${Math.floor(Math.random() * 15) + 10} days. Pay before to avoid interest.`
                  : 'Immediate debit - funds available now.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
