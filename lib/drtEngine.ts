import { Token, DRTToken, TransactionContext, UserProfile, DRTResolution, ScoreBreakdown, RiskAssessment } from './types';
import { PRNG } from './prng';
import { scoreTokens, ScoringResult } from './scoringEngine';
import { RulesEngineResult } from './rulesEngine';
import { assessAllTokenRisks } from './riskEngine';

export interface DRTResolutionResult {
  resolution: DRTResolution;
  childScores: ScoreBreakdown[];
  selectedChild: Token;
}

export function isDRTToken(token: Token | DRTToken): token is DRTToken {
  return token.type === 'drt' && 'childDPANs' in token;
}

export function resolveDRT(
  drt: DRTToken,
  context: TransactionContext,
  user: UserProfile,
  rulesResult: RulesEngineResult,
  prng: PRNG
): DRTResolutionResult {
  const childTokens = drt.childDPANs.filter(c => c.isEligible);

  if (childTokens.length === 0) {
    throw new Error(`DRT ${drt.id} has no eligible child DPANs`);
  }

  let selectedChild: Token;
  let childScores: ScoreBreakdown[] = [];
  let resolutionReason: string;

  switch (drt.routingStrategy) {
    case 'optimal_score': {
      // Use the same scoring framework as main routing
      const riskAssessments = assessAllTokenRisks(childTokens, context, user, prng);
      const scoringResult = scoreTokens(childTokens, context, user, rulesResult, riskAssessments);
      childScores = scoringResult.scores;

      if (scoringResult.topCandidate) {
        selectedChild = childTokens.find(c => c.id === scoringResult.topCandidate!.tokenId)!;
        resolutionReason = `Optimal score: ${scoringResult.topCandidate.finalScore.toFixed(2)}`;
      } else {
        // Fallback to first eligible
        selectedChild = childTokens[0];
        resolutionReason = 'Fallback: no scored candidates';
      }
      break;
    }

    case 'round_robin': {
      // Deterministic round robin based on PRNG
      const index = prng.randomInt(0, childTokens.length - 1);
      selectedChild = childTokens[index];
      resolutionReason = `Round robin: index ${index}`;

      // Still compute scores for visibility
      const riskAssessments = assessAllTokenRisks(childTokens, context, user, prng);
      const scoringResult = scoreTokens(childTokens, context, user, rulesResult, riskAssessments);
      childScores = scoringResult.scores;
      break;
    }

    case 'lowest_utilization': {
      // Select child with lowest utilization
      const sortedByUtil = [...childTokens].sort((a, b) => a.utilization - b.utilization);
      selectedChild = sortedByUtil[0];
      resolutionReason = `Lowest utilization: ${(selectedChild.utilization * 100).toFixed(1)}%`;

      // Compute scores for visibility
      const riskAssessments = assessAllTokenRisks(childTokens, context, user, prng);
      const scoringResult = scoreTokens(childTokens, context, user, rulesResult, riskAssessments);
      childScores = scoringResult.scores;
      break;
    }

    default:
      selectedChild = childTokens[0];
      resolutionReason = 'Default: first eligible child';
  }

  return {
    resolution: {
      drtId: drt.id,
      selectedChild,
      childScores,
      resolutionReason,
      timestamp: Date.now(),
    },
    childScores,
    selectedChild,
  };
}

export function getDRTById(drtTokens: DRTToken[], drtId: string): DRTToken | undefined {
  return drtTokens.find(d => d.id === drtId);
}

export function getAllDRTChildren(drtTokens: DRTToken[]): Token[] {
  const children: Token[] = [];
  for (const drt of drtTokens) {
    children.push(...drt.childDPANs);
  }
  return children;
}

export function formatDRTResolution(result: DRTResolutionResult): string {
  const { resolution, selectedChild } = result;
  return `DRT[${resolution.drtId}] → ${selectedChild.name} (${selectedChild.dpan}) | ${resolution.resolutionReason}`;
}
