'use client';

import { motion } from 'framer-motion';
import { Scale, Plus, Minus, Ban, Zap, ChevronRight } from 'lucide-react';
import { RuleEvaluationResult, ScoreBreakdown } from '@/lib/types';

interface RuleImpactProps {
  evaluations: RuleEvaluationResult[];
  scores: ScoreBreakdown[];
}

export default function RuleImpact({ evaluations, scores }: RuleImpactProps) {
  const matchedRules = evaluations.filter(e => e.matched);
  const failedRules = evaluations.filter(e => !e.matched);

  // Calculate total impact per rule
  const ruleImpacts = matchedRules.map(rule => {
    let totalBoost = 0;
    let totalPenalty = 0;
    let exclusions = 0;
    const affectedTokens: string[] = [];

    scores.forEach(score => {
      score.bonuses.forEach(b => {
        if (b.ruleId === rule.ruleId) {
          totalBoost += b.amount;
          if (!affectedTokens.includes(score.tokenName)) {
            affectedTokens.push(score.tokenName);
          }
        }
      });
      score.penalties.forEach(p => {
        if (p.ruleId === rule.ruleId) {
          totalPenalty += p.amount;
          if (!affectedTokens.includes(score.tokenName)) {
            affectedTokens.push(score.tokenName);
          }
        }
      });
      if (score.excluded && score.exclusionReason?.includes(rule.ruleLabel)) {
        exclusions++;
      }
    });

    return {
      ...rule,
      totalBoost,
      totalPenalty,
      exclusions,
      affectedTokens,
      netImpact: totalBoost - totalPenalty,
    };
  });

  // Sort by absolute impact
  ruleImpacts.sort((a, b) => Math.abs(b.netImpact) - Math.abs(a.netImpact));

  if (matchedRules.length === 0 && failedRules.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-accent-purple" />
          <h3 className="text-sm font-semibold text-white">Rule Impact Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">
            {matchedRules.length} matched
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-tertiary border border-white/10">
            {failedRules.length} inactive
          </span>
        </div>
      </div>

      <div className="p-4">
        {ruleImpacts.length === 0 ? (
          <p className="text-xs text-text-tertiary text-center py-4">No rules affected scoring</p>
        ) : (
          <div className="space-y-3">
            {ruleImpacts.map((rule, idx) => (
              <motion.div
                key={rule.ruleId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg border ${
                  rule.netImpact > 0 ? 'bg-accent-green/5 border-accent-green/20' :
                  rule.netImpact < 0 ? 'bg-accent-pink/5 border-accent-pink/20' :
                  rule.exclusions > 0 ? 'bg-accent-orange/5 border-accent-orange/20' :
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {rule.ruleType === 'HARD' ? (
                      <Zap className="w-4 h-4 text-accent-orange" />
                    ) : (
                      <Scale className="w-4 h-4 text-accent-blue" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{rule.ruleLabel}</p>
                      <p className="text-[10px] text-text-tertiary">{rule.ruleType} rule</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.totalBoost > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-mono text-accent-green">
                        <Plus className="w-3 h-3" />
                        {rule.totalBoost.toFixed(0)}
                      </span>
                    )}
                    {rule.totalPenalty > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-mono text-accent-pink">
                        <Minus className="w-3 h-3" />
                        {rule.totalPenalty.toFixed(0)}
                      </span>
                    )}
                    {rule.exclusions > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-mono text-accent-orange">
                        <Ban className="w-3 h-3" />
                        {rule.exclusions}
                      </span>
                    )}
                  </div>
                </div>

                {rule.affectedTokens.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                    <ChevronRight className="w-3 h-3" />
                    Affected: {rule.affectedTokens.slice(0, 3).join(', ')}
                    {rule.affectedTokens.length > 3 && ` +${rule.affectedTokens.length - 3} more`}
                  </div>
                )}

                {rule.ruleType === 'HARD' && rule.matched && (
                  <div className="mt-2 px-2 py-1 bg-accent-orange/10 rounded text-[10px] text-accent-orange">
                    Hard rule enforced selection
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {ruleImpacts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-accent-green">
                +{ruleImpacts.reduce((sum, r) => sum + r.totalBoost, 0).toFixed(0)}
              </p>
              <p className="text-[10px] text-text-tertiary">Total Boosts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-accent-pink">
                -{ruleImpacts.reduce((sum, r) => sum + r.totalPenalty, 0).toFixed(0)}
              </p>
              <p className="text-[10px] text-text-tertiary">Total Penalties</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-accent-orange">
                {ruleImpacts.reduce((sum, r) => sum + r.exclusions, 0)}
              </p>
              <p className="text-[10px] text-text-tertiary">Exclusions</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
