import { Token, TransactionContext, RiskAssessment, UserProfile } from './types';
import { PRNG } from './prng';

export interface RiskEngineConfig {
  vetoThreshold: number;  // 0-1, above this = veto
  amountThresholds: { low: number; medium: number; high: number };
}

const defaultConfig: RiskEngineConfig = {
  vetoThreshold: 0.75,
  amountThresholds: { low: 100, medium: 500, high: 1500 },
};

export function assessRisk(
  token: Token,
  context: TransactionContext,
  user: UserProfile,
  prng: PRNG,
  config: RiskEngineConfig = defaultConfig
): RiskAssessment {
  const riskFactors: string[] = [];
  let riskPoints = 0;
  const maxPoints = 100;

  // Amount-based risk
  if (context.amount > config.amountThresholds.high) {
    riskPoints += 20;
    riskFactors.push(`High amount ($${context.amount.toFixed(0)})`);
  } else if (context.amount > config.amountThresholds.medium) {
    riskPoints += 10;
    riskFactors.push(`Medium amount ($${context.amount.toFixed(0)})`);
  } else if (context.amount > config.amountThresholds.low) {
    riskPoints += 3;
  }

  // International transaction
  if (context.country !== 'US') {
    riskPoints += 12;
    riskFactors.push(`International (${context.country})`);
  }

  // Card not present
  if (!context.isInPerson) {
    riskPoints += 8;
    riskFactors.push('Card not present');
  }

  // Risk flags
  if (context.riskFlags.includes('high_amount')) {
    riskPoints += 10;
    riskFactors.push('Amount anomaly');
  }
  if (context.riskFlags.includes('new_merchant')) {
    riskPoints += 12;
    riskFactors.push('New merchant');
  }
  if (context.riskFlags.includes('velocity_spike')) {
    riskPoints += 18;
    riskFactors.push('Velocity spike');
  }
  if (context.riskFlags.includes('geo_anomaly')) {
    riskPoints += 15;
    riskFactors.push('Geographic anomaly');
  }
  if (context.riskFlags.includes('time_anomaly')) {
    riskPoints += 6;
    riskFactors.push('Unusual time');
  }
  if (context.riskFlags.includes('device_change')) {
    riskPoints += 12;
    riskFactors.push('New device');
  }

  // Token-specific risk
  if (token.type === 'credit') {
    const projectedUtil = (token.balance + context.amount) / token.limit;
    if (projectedUtil > 0.9) {
      riskPoints += 15;
      riskFactors.push('Near credit limit');
    } else if (projectedUtil > 0.7) {
      riskPoints += 8;
      riskFactors.push('High utilization');
    }
  }

  if (token.type === 'debit' && token.balance < context.amount * 1.5) {
    riskPoints += 12;
    riskFactors.push('Low debit balance');
  }

  // Network acceptance
  if (token.network === 'discover') {
    riskPoints += 4;
    riskFactors.push('Lower network acceptance');
  }
  if (token.network === 'amex' && context.country !== 'US') {
    riskPoints += 6;
    riskFactors.push('Amex international');
  }

  // User risk tolerance adjustment
  const toleranceMultiplier = user.riskTolerance === 'low' ? 1.15 : user.riskTolerance === 'high' ? 0.85 : 1.0;
  riskPoints *= toleranceMultiplier;

  // Add PRNG variance (±5%)
  const variance = (prng.random() - 0.5) * 10;
  riskPoints += variance;

  // Normalize to 0-1
  const riskScore = Math.max(0, Math.min(1, riskPoints / maxPoints));
  
  // Decline probability closely tracks risk score (with slight variance)
  const declineVariance = (prng.random() - 0.5) * 0.05;
  const declineProbability = Math.max(0, Math.min(1, riskScore + declineVariance));

  // Veto if above threshold
  const vetoRecommendation = riskScore >= config.vetoThreshold;
  const vetoReason = vetoRecommendation
    ? `Risk ${(riskScore * 100).toFixed(1)}% exceeds threshold ${(config.vetoThreshold * 100).toFixed(0)}%`
    : undefined;

  return {
    tokenId: token.id,
    riskScore: Math.round(riskScore * 1000) / 1000,
    declineProbability: Math.round(declineProbability * 1000) / 1000,
    riskFactors,
    vetoRecommendation,
    vetoReason,
  };
}

export function assessAllTokenRisks(
  tokens: Token[],
  context: TransactionContext,
  user: UserProfile,
  prng: PRNG
): Map<string, RiskAssessment> {
  const assessments = new Map<string, RiskAssessment>();
  for (const token of tokens) {
    assessments.set(token.id, assessRisk(token, context, user, prng));
  }
  return assessments;
}

export function getLowestRiskToken(
  assessments: Map<string, RiskAssessment>,
  eligibleTokenIds: string[]
): string | null {
  let lowestRisk = Infinity;
  let lowestRiskToken: string | null = null;

  for (const tokenId of eligibleTokenIds) {
    const assessment = assessments.get(tokenId);
    if (assessment && assessment.riskScore < lowestRisk && !assessment.vetoRecommendation) {
      lowestRisk = assessment.riskScore;
      lowestRiskToken = tokenId;
    }
  }

  return lowestRiskToken;
}
