import { Rule, RuleEvaluationResult, TransactionContext, Token, UserProfile, ViolationOverride, ExcludedToken } from './types';
import { CompiledRule, compileRules, isRuleExpired, generateDSLSnippet } from './rulesDsl';

export interface RulesEngineResult {
  hardRuleOverride: boolean;
  forcedToken?: string;
  forcedTokenName?: string;
  forcingRule?: { ruleId: string; ruleLabel: string };
  excludedTokens: Map<string, string>;
  excludedTokensList: ExcludedToken[];
  violationsOverridden: ViolationOverride[];
  boosts: Map<string, number>;
  boostRuleIds: Map<string, string>;
  penalties: Map<string, number>;
  penaltyRuleIds: Map<string, string>;
  matchedRules: RuleEvaluationResult[];
  failedRules: RuleEvaluationResult[];
}

export function evaluateRules(
  rules: Rule[],
  context: TransactionContext,
  tokens: Token[],
  user: UserProfile
): RulesEngineResult {
  const compiledRules = compileRules(rules);
  const result: RulesEngineResult = {
    hardRuleOverride: false,
    excludedTokens: new Map(),
    excludedTokensList: [],
    violationsOverridden: [],
    boosts: new Map(),
    boostRuleIds: new Map(),
    penalties: new Map(),
    penaltyRuleIds: new Map(),
    matchedRules: [],
    failedRules: [],
  };

  // Track which tokens would be excluded if not forced
  const potentialExclusions = new Map<string, { reason: string; ruleId: string; tokenName: string }>();

  for (const compiled of compiledRules) {
    if (isRuleExpired(compiled.rule)) {
      result.failedRules.push({
        ruleId: compiled.rule.id,
        ruleLabel: compiled.rule.label,
        ruleType: compiled.rule.type,
        matched: false,
        reason: 'Rule has expired',
        dslSnippet: compiled.dslSnippet,
      });
      continue;
    }

    let ruleMatched = false;
    const rule = compiled.rule;

    for (const token of tokens) {
      if (!token.isEligible) continue;

      const matched = compiled.predicate(context, token, user);
      if (!matched) continue;

      ruleMatched = true;

      switch (rule.action.type) {
        case 'FORCE':
          if (rule.type === 'HARD') {
            result.hardRuleOverride = true;
            result.forcedToken = rule.action.targetTokenId;
            result.forcedTokenName = tokens.find(t => t.id === rule.action.targetTokenId)?.name;
            result.forcingRule = { ruleId: rule.id, ruleLabel: rule.label };
          }
          break;

        case 'EXCLUDE':
          if (shouldExcludeToken(rule, token)) {
            potentialExclusions.set(token.id, {
              reason: rule.action.reason,
              ruleId: rule.id,
              tokenName: token.name,
            });
          }
          break;

        case 'BOOST':
          if (shouldApplyModifier(rule, token)) {
            const current = result.boosts.get(token.id) || 0;
            result.boosts.set(token.id, current + (rule.action.boostAmount || 0));
            result.boostRuleIds.set(token.id, rule.id);
          }
          break;

        case 'PENALIZE':
          if (shouldApplyModifier(rule, token)) {
            const current = result.penalties.get(token.id) || 0;
            result.penalties.set(token.id, current + (rule.action.penaltyAmount || 0));
            result.penaltyRuleIds.set(token.id, rule.id);
          }
          break;

        case 'BLOCK':
          potentialExclusions.set(token.id, {
            reason: 'Transaction blocked by rule',
            ruleId: rule.id,
            tokenName: token.name,
          });
          break;
      }
    }

    // Also check global rule match (not per-token specific)
    if (!ruleMatched) {
      const globalMatch = evaluateGlobalRule(compiled, context, user);
      if (globalMatch) ruleMatched = true;
    }

    if (ruleMatched) {
      result.matchedRules.push({
        ruleId: rule.id,
        ruleLabel: rule.label,
        ruleType: rule.type,
        matched: true,
        reason: rule.action.reason,
        action: rule.action.type,
        forcedToken: rule.action.type === 'FORCE' ? rule.action.targetTokenId : undefined,
        dslSnippet: compiled.dslSnippet,
      });
    } else {
      result.failedRules.push({
        ruleId: rule.id,
        ruleLabel: rule.label,
        ruleType: rule.type,
        matched: false,
        reason: 'Condition not satisfied',
        dslSnippet: compiled.dslSnippet,
      });
    }
  }

  // Process exclusions: if token is forced, move exclusion to violations list
for (const [tokenId, exclusion] of Array.from(potentialExclusions.entries())) {
    if (result.hardRuleOverride && tokenId === result.forcedToken) {
      // This is a violation that was overridden by hard rule
      result.violationsOverridden.push({
        tokenId,
        tokenName: exclusion.tokenName,
        violationType: 'EXCLUSION_OVERRIDE',
        constraint: exclusion.reason,
        overriddenBy: result.forcingRule?.ruleLabel || 'Hard Rule',
        ruleId: exclusion.ruleId,
        severity: 'warning',
      });
    } else {
      // Normal exclusion
      result.excludedTokens.set(tokenId, exclusion.reason);
      result.excludedTokensList.push({
        tokenId,
        tokenName: exclusion.tokenName,
        reason: exclusion.reason,
        ruleId: exclusion.ruleId,
        stage: 'Rule Evaluation',
      });
    }
  }

  return result;
}

function shouldExcludeToken(rule: Rule, token: Token): boolean {
  const action = rule.action;
  if (!action.targetTokenProperty) return true;

const tokenValue = (token as unknown as Record<string, unknown>)[action.targetTokenProperty];
  const targetValue = action.targetPropertyValue;

  if (typeof targetValue === 'object' && targetValue !== null) {
    const filter = targetValue as Record<string, number>;
    if ('gt' in filter) return (tokenValue as number) > filter.gt;
    if ('lt' in filter) return (tokenValue as number) < filter.lt;
    if ('gte' in filter) return (tokenValue as number) >= filter.gte;
    if ('lte' in filter) return (tokenValue as number) <= filter.lte;
  }

  return tokenValue === targetValue;
}

function shouldApplyModifier(rule: Rule, token: Token): boolean {
  const action = rule.action;
  if (!action.targetTokenProperty) return true;

const tokenValue = (token as unknown as Record<string, unknown>)[action.targetTokenProperty];
  const targetValue = action.targetPropertyValue;

  if (typeof targetValue === 'object' && targetValue !== null) {
    const filter = targetValue as Record<string, number>;
    if ('gt' in filter) return (tokenValue as number) > filter.gt;
    if ('lt' in filter) return (tokenValue as number) < filter.lt;
  }

  return tokenValue === targetValue;
}

function evaluateGlobalRule(compiled: CompiledRule, context: TransactionContext, user: UserProfile): boolean {
  const dummyToken: Token = {
    id: 'dummy', name: 'Dummy', dpan: '**** 0000', type: 'credit', network: 'visa',
    limit: 0, balance: 0, utilization: 0, apr: 0, ftf: 0, blockedMCCs: [],
    rewardsByCategory: {}, isEligible: true, cashbackRate: 0,
  };
  return compiled.predicate(context, dummyToken, user);
}

export function getRulesSummary(result: RulesEngineResult): {
  totalMatched: number;
  hardOverrides: number;
  exclusions: number;
  violationsOverridden: number;
  boosts: number;
  penalties: number;
} {
  return {
    totalMatched: result.matchedRules.length,
    hardOverrides: result.hardRuleOverride ? 1 : 0,
    exclusions: result.excludedTokens.size,
    violationsOverridden: result.violationsOverridden.length,
    boosts: result.boosts.size,
    penalties: result.penalties.size,
  };
}
