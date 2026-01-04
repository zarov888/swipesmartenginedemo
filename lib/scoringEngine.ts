import { Token, TransactionContext, ScoreBreakdown, UserProfile, RiskAssessment, ScoringWeights, SubscoreBreakdown, SensitivityResult } from './types';
import { RulesEngineResult } from './rulesEngine';

export interface ScoringResult {
  scores: ScoreBreakdown[];
  topCandidate: ScoreBreakdown | null;
  candidateCount: number;
  excludedCount: number;
  weightsUsed: ScoringWeights;
}

function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const total = weights.rewards + weights.credit + weights.cashflow + weights.risk;
  if (total === 0) return { rewards: 0.25, credit: 0.25, cashflow: 0.25, risk: 0.25 };
  return {
    rewards: weights.rewards / total,
    credit: weights.credit / total,
    cashflow: weights.cashflow / total,
    risk: weights.risk / total,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calculateRewardsSubscore(token: Token, context: TransactionContext): SubscoreBreakdown {
  const factors: string[] = [];
  const category = context.category || 'default';
  const rewardRate = token.rewardsByCategory[category] || token.rewardsByCategory['default'] || 0;
  
  factors.push(`Category "${category}" rate: ${rewardRate}x`);
  
  // Base reward calculation (rate * amount normalized)
  let raw = rewardRate * 15; // Scale factor for normalization
  
  // Signup bonus boost
  if (token.signupBonus) {
    const remaining = token.signupBonus.threshold - token.signupBonus.current;
    if (remaining > 0 && context.amount <= remaining * 1.5) {
      raw += 20;
      factors.push(`Signup bonus: $${remaining} remaining to earn ${token.signupBonus.reward} pts`);
    }
  }
  
  // Cashback rate consideration
  if (token.cashbackRate > 0) {
    raw += token.cashbackRate * 5;
    factors.push(`Base cashback: ${token.cashbackRate}%`);
  }
  
  const normalized = clamp(raw, 0, 100);
  
  return { raw: round2(raw), normalized: round2(normalized), weight: 0, weighted: 0, factors };
}

function calculateCreditSubscore(token: Token, context: TransactionContext): SubscoreBreakdown {
  const factors: string[] = [];
  
  if (token.type !== 'credit') {
    factors.push('Non-credit card: neutral score');
    return { raw: 50, normalized: 50, weight: 0, weighted: 0, factors };
  }
  
  const projectedUtilization = (token.balance + context.amount) / token.limit;
  factors.push(`Current utilization: ${(token.utilization * 100).toFixed(1)}%`);
  factors.push(`Projected utilization: ${(projectedUtilization * 100).toFixed(1)}%`);
  
  let raw: number;
  if (projectedUtilization <= 0.10) {
    raw = 100;
    factors.push('Excellent: under 10% utilization');
  } else if (projectedUtilization <= 0.30) {
    raw = 90 - (projectedUtilization - 0.10) * 100;
    factors.push('Good: under 30% utilization');
  } else if (projectedUtilization <= 0.50) {
    raw = 70 - (projectedUtilization - 0.30) * 100;
    factors.push('Fair: under 50% utilization');
  } else if (projectedUtilization <= 0.70) {
    raw = 50 - (projectedUtilization - 0.50) * 150;
    factors.push('Warning: approaching high utilization');
  } else if (projectedUtilization <= 0.90) {
    raw = 20 - (projectedUtilization - 0.70) * 50;
    factors.push('Critical: high utilization impact');
  } else {
    raw = 5;
    factors.push('Near limit: severe credit impact');
  }
  
  const normalized = clamp(raw, 0, 100);
  return { raw: round2(raw), normalized: round2(normalized), weight: 0, weighted: 0, factors };
}

function calculateCashflowSubscore(token: Token, context: TransactionContext, user: UserProfile): SubscoreBreakdown {
  const factors: string[] = [];
  let raw: number;
  
  if (token.type === 'debit') {
    const remainingBalance = token.balance - context.amount;
    factors.push(`Balance: $${token.balance.toFixed(2)}`);
    factors.push(`After txn: $${remainingBalance.toFixed(2)}`);
    
    if (remainingBalance < 0) {
      raw = 0;
      factors.push('Insufficient funds');
    } else {
      const bufferRatio = remainingBalance / context.amount;
      if (bufferRatio >= 5) { raw = 95; factors.push('Excellent buffer (5x+)'); }
      else if (bufferRatio >= 3) { raw = 80; factors.push('Good buffer (3-5x)'); }
      else if (bufferRatio >= 2) { raw = 65; factors.push('Adequate buffer (2-3x)'); }
      else if (bufferRatio >= 1) { raw = 45; factors.push('Tight buffer (1-2x)'); }
      else { raw = 25; factors.push('Low buffer (<1x)'); }
    }
  } else if (token.type === 'credit') {
    factors.push(`Days to paycheck: ${user.daysToPaycheck}`);
    factors.push(`APR: ${token.apr}%`);
    
    // Credit cards are better for cashflow (defer payment)
    if (user.daysToPaycheck <= 3) {
      raw = 95;
      factors.push('Paycheck imminent: credit ideal');
    } else if (user.daysToPaycheck <= 7) {
      raw = 85;
      factors.push('Paycheck soon: credit preferred');
    } else if (user.daysToPaycheck <= 14) {
      raw = 70;
      factors.push('Mid-cycle: credit acceptable');
    } else {
      raw = 55;
      factors.push('Early cycle: consider APR cost');
    }
    
    // APR penalty for high rates
    if (token.apr > 25) {
      raw -= 10;
      factors.push('High APR penalty');
    }
  } else {
    raw = 50;
    factors.push('Prepaid: neutral cashflow');
  }
  
  const normalized = clamp(raw, 0, 100);
  return { raw: round2(raw), normalized: round2(normalized), weight: 0, weighted: 0, factors };
}

function calculateRiskSubscore(assessment: RiskAssessment | undefined): SubscoreBreakdown {
  const factors: string[] = [];
  
  if (!assessment) {
    return { raw: 50, normalized: 50, weight: 0, weighted: 0, factors: ['No risk assessment available'] };
  }
  
  // Risk score is 0-1 where 0 is best (no risk), 1 is worst
  // Convert to 0-100 where 100 is best (no risk)
  const raw = (1 - assessment.riskScore) * 100;
  factors.push(`Risk score: ${(assessment.riskScore * 100).toFixed(1)}%`);
  factors.push(`Decline probability: ${(assessment.declineProbability * 100).toFixed(1)}%`);
  
  if (assessment.riskFactors.length > 0) {
    factors.push(...assessment.riskFactors.slice(0, 3).map(f => `⚠ ${f}`));
  }
  
  if (assessment.vetoRecommendation) {
    factors.push('⛔ VETO RECOMMENDED');
  }
  
  const normalized = clamp(raw, 0, 100);
  return { raw: round2(raw), normalized: round2(normalized), weight: 0, weighted: 0, factors };
}

function createExcludedScore(token: Token, reason: string, stage: string): ScoreBreakdown {
  const zeroSubscore: SubscoreBreakdown = { raw: 0, normalized: 0, weight: 0, weighted: 0, factors: [] };
  return {
    tokenId: token.id,
    tokenName: token.name,
    subscores: { rewards: zeroSubscore, credit: zeroSubscore, cashflow: zeroSubscore, risk: zeroSubscore },
    bonuses: [],
    penalties: [],
    totalBonuses: 0,
    totalPenalties: 0,
    baseScore: 0,
    finalScore: 0,
    ranking: 999,
    excluded: true,
    exclusionReason: reason,
    exclusionStage: stage,
  };
}

export function scoreTokens(
  tokens: Token[],
  context: TransactionContext,
  user: UserProfile,
  rulesResult: RulesEngineResult,
  riskAssessments: Map<string, RiskAssessment>,
  forcedTokenId?: string
): ScoringResult {
  const scores: ScoreBreakdown[] = [];
  const weights = normalizeWeights(user.preferenceWeights);

  for (const token of tokens) {
    // Skip if not eligible (but don't exclude forced token)
    if (!token.isEligible && token.id !== forcedTokenId) {
      scores.push(createExcludedScore(token, 'Token not eligible', 'Profile Fetch'));
      continue;
    }

    // Check if excluded by rules (but don't exclude forced token)
    const exclusionReason = rulesResult.excludedTokens.get(token.id);
    if (exclusionReason && token.id !== forcedTokenId) {
      scores.push(createExcludedScore(token, exclusionReason, 'Rule Evaluation'));
      continue;
    }

    // Check if vetoed by risk (but don't exclude forced token)
    const riskAssessment = riskAssessments.get(token.id);
    if (riskAssessment?.vetoRecommendation && !rulesResult.hardRuleOverride && token.id !== forcedTokenId) {
      scores.push(createExcludedScore(token, riskAssessment.vetoReason || 'Risk veto', 'Candidate Filtering'));
      continue;
    }

    // Calculate subscores
    const rewardsSubscore = calculateRewardsSubscore(token, context);
    const creditSubscore = calculateCreditSubscore(token, context);
    const cashflowSubscore = calculateCashflowSubscore(token, context, user);
    const riskSubscore = calculateRiskSubscore(riskAssessment);

    // Apply weights
    rewardsSubscore.weight = weights.rewards;
    rewardsSubscore.weighted = round2(rewardsSubscore.normalized * weights.rewards);
    
    creditSubscore.weight = weights.credit;
    creditSubscore.weighted = round2(creditSubscore.normalized * weights.credit);
    
    cashflowSubscore.weight = weights.cashflow;
    cashflowSubscore.weighted = round2(cashflowSubscore.normalized * weights.cashflow);
    
    riskSubscore.weight = weights.risk;
    riskSubscore.weighted = round2(riskSubscore.normalized * weights.risk);

    // Base score is sum of weighted subscores (0-100)
    const baseScore = round2(
      rewardsSubscore.weighted +
      creditSubscore.weighted +
      cashflowSubscore.weighted +
      riskSubscore.weighted
    );

    // Collect bonuses and penalties
    const bonuses: { label: string; amount: number; ruleId?: string }[] = [];
    const penalties: { label: string; amount: number; ruleId?: string }[] = [];

    const ruleBoost = rulesResult.boosts.get(token.id);
    if (ruleBoost) {
      bonuses.push({ label: 'Rule boost', amount: ruleBoost, ruleId: rulesResult.boostRuleIds?.get(token.id) });
    }

    const rulePenalty = rulesResult.penalties.get(token.id);
    if (rulePenalty) {
      penalties.push({ label: 'Rule penalty', amount: rulePenalty, ruleId: rulesResult.penaltyRuleIds?.get(token.id) });
    }

    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);

    // Final score clamped to 0-100
    const finalScore = clamp(baseScore + totalBonuses - totalPenalties, 0, 100);

    scores.push({
      tokenId: token.id,
      tokenName: token.name,
      subscores: {
        rewards: rewardsSubscore,
        credit: creditSubscore,
        cashflow: cashflowSubscore,
        risk: riskSubscore,
      },
      bonuses,
      penalties,
      totalBonuses,
      totalPenalties,
      baseScore,
      finalScore: round2(finalScore),
      ranking: 0,
      excluded: false,
    });
  }

  // Sort by final score and assign rankings
  const activeScores = scores.filter(s => !s.excluded);
  activeScores.sort((a, b) => b.finalScore - a.finalScore);
  activeScores.forEach((s, i) => { s.ranking = i + 1; });

  return {
    scores,
    topCandidate: activeScores[0] || null,
    candidateCount: activeScores.length,
    excludedCount: scores.filter(s => s.excluded).length,
    weightsUsed: weights,
  };
}

export function selectBestToken(scoringResult: ScoringResult, rulesResult: RulesEngineResult): string | null {
  if (rulesResult.hardRuleOverride && rulesResult.forcedToken) {
    return rulesResult.forcedToken;
  }
  return scoringResult.topCandidate?.tokenId || null;
}

export function computeSensitivity(
  scores: ScoreBreakdown[],
  weightsUsed: ScoringWeights,
  perturbation: number = 0.10
): SensitivityResult[] {
  const results: SensitivityResult[] = [];
  const activeScores = scores.filter(s => !s.excluded);
  if (activeScores.length < 2) return results;

  const originalWinner = activeScores[0];
  const criteria = ['rewards', 'credit', 'cashflow', 'risk'] as const;

  for (const criterion of criteria) {
    for (const direction of ['increase', 'decrease'] as const) {
      const newWeights = { ...weightsUsed };
      const delta = direction === 'increase' ? perturbation : -perturbation;
      newWeights[criterion] = clamp(newWeights[criterion] + delta, 0, 1);

      // Renormalize
      const total = newWeights.rewards + newWeights.credit + newWeights.cashflow + newWeights.risk;
      if (total > 0) {
        newWeights.rewards /= total;
        newWeights.credit /= total;
        newWeights.cashflow /= total;
        newWeights.risk /= total;
      }

      // Recompute scores
      const recomputedScores = activeScores.map(s => {
        const base =
          s.subscores.rewards.normalized * newWeights.rewards +
          s.subscores.credit.normalized * newWeights.credit +
          s.subscores.cashflow.normalized * newWeights.cashflow +
          s.subscores.risk.normalized * newWeights.risk;
        return {
          tokenId: s.tokenId,
          tokenName: s.tokenName,
          score: clamp(base + s.totalBonuses - s.totalPenalties, 0, 100),
        };
      });

      recomputedScores.sort((a, b) => b.score - a.score);
      const newWinner = recomputedScores[0];

      results.push({
        criterion,
        direction,
        perturbation,
        originalWinner: originalWinner.tokenId,
        newWinner: newWinner.tokenId,
        winnerChanged: newWinner.tokenId !== originalWinner.tokenId,
        newScore: round2(newWinner.score),
      });
    }
  }

  return results;
}
