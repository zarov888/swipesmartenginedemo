import { Rule, RuleCondition, TransactionContext, Token, UserProfile } from './types';

export interface CompiledRule {
  rule: Rule;
  predicate: (ctx: TransactionContext, token: Token, user: UserProfile) => boolean;
  dslSnippet: string;
}

// Compile a condition into a predicate function
function compileCondition(condition: RuleCondition): (ctx: TransactionContext, token: Token, user: UserProfile) => boolean {
  return (ctx, token, user) => {
    const value = resolveFieldValue(condition.field, ctx, token, user);
    const result = evaluateOperator(value, condition.operator, condition.value, ctx, token);

    // Handle AND conditions
    if (condition.and && condition.and.length > 0) {
      const andResults = condition.and.map(c => compileCondition(c)(ctx, token, user));
      return result && andResults.every(r => r);
    }

    // Handle OR conditions
    if (condition.or && condition.or.length > 0) {
      const orResults = condition.or.map(c => compileCondition(c)(ctx, token, user));
      return result || orResults.some(r => r);
    }

    return result;
  };
}

// Resolve field value from context, token, or user
function resolveFieldValue(field: string, ctx: TransactionContext, token: Token, user: UserProfile): unknown {
  // Context fields
  if (field in ctx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (ctx as any)[field];
  }

  // Special computed fields
  switch (field) {
    case 'projected_utilization':
      if (token.type === 'credit' && token.limit > 0) {
        return (token.balance + ctx.amount) / token.limit;
      }
      return 0;

    case 'has_active_signup_bonus':
      return token.signupBonus && token.signupBonus.current < token.signupBonus.threshold;

    case 'signup_bonus_remaining':
      if (token.signupBonus) {
        return token.signupBonus.threshold - token.signupBonus.current;
      }
      return 0;

    case 'network_acceptance_risk':
      // Discover has higher acceptance risk
      if (token.network === 'discover') return 'high';
      if (token.network === 'amex') return 'medium';
      return 'low';

    case 'debit_balance_low':
      if (token.type === 'debit') {
        return token.balance < ctx.amount * 2;
      }
      return false;

    case 'category_reward_rate':
      const category = ctx.category || 'default';
      return token.rewardsByCategory[category] || token.rewardsByCategory['default'] || 0;

    case 'days_to_paycheck':
      return user.daysToPaycheck;

    case 'cash_balance':
      return user.cashBalance;

    default:
      // Try token fields
      if (field in token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (token as any)[field];
      }

      // Handle nested fields like rewardsByCategory.dining
      if (field.includes('.')) {
        const parts = field.split('.');
        let value: unknown = token;
        for (const part of parts) {
          if (value && typeof value === 'object') {
            value = (value as Record<string, unknown>)[part];
          } else {
            return undefined;
          }
        }
        return value;
      }

      return undefined;
  }
}

// Evaluate operator
function evaluateOperator(
  fieldValue: unknown,
  operator: string,
  conditionValue: unknown,
  ctx: TransactionContext,
  token: Token
): boolean {
  switch (operator) {
    case 'eq':
      return fieldValue === conditionValue;

    case 'neq':
      return fieldValue !== conditionValue;

    case 'in':
      if (Array.isArray(conditionValue)) {
        return conditionValue.includes(fieldValue);
      }
      return false;

    case 'not_in':
      if (Array.isArray(conditionValue)) {
        return !conditionValue.includes(fieldValue);
      }
      return true;

    case 'gt':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number'
        ? fieldValue > conditionValue
        : false;

    case 'lt':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number'
        ? fieldValue < conditionValue
        : false;

    case 'gte':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number'
        ? fieldValue >= conditionValue
        : false;

    case 'lte':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number'
        ? fieldValue <= conditionValue
        : false;

    case 'contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(conditionValue);
      }
      return false;

    default:
      return false;
  }
}

// Generate DSL snippet from rule
export function generateDSLSnippet(rule: Rule): string {
  const condition = formatCondition(rule.condition);
  const action = formatAction(rule.action);
  return `IF ${condition} THEN ${action}`;
}

function formatCondition(condition: RuleCondition): string {
  const field = condition.field;
  const op = formatOperator(condition.operator);
  const value = formatValue(condition.value);

  let result = `${field} ${op} ${value}`;

  if (condition.and && condition.and.length > 0) {
    const andParts = condition.and.map(c => formatCondition(c));
    result = `(${result} AND ${andParts.join(' AND ')})`;
  }

  if (condition.or && condition.or.length > 0) {
    const orParts = condition.or.map(c => formatCondition(c));
    result = `(${result} OR ${orParts.join(' OR ')})`;
  }

  return result;
}

function formatOperator(op: string): string {
  const opMap: Record<string, string> = {
    eq: '=',
    neq: '!=',
    in: 'IN',
    not_in: 'NOT IN',
    gt: '>',
    lt: '<',
    gte: '>=',
    lte: '<=',
    contains: 'CONTAINS',
  };
  return opMap[op] || op;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if ('gt' in obj) return `> ${obj.gt}`;
    if ('lt' in obj) return `< ${obj.lt}`;
    if ('gte' in obj) return `>= ${obj.gte}`;
    if ('lte' in obj) return `<= ${obj.lte}`;
  }
  return String(value);
}

function formatAction(action: { type: string; targetTokenId?: string; targetTokenProperty?: string; targetPropertyValue?: unknown; boostAmount?: number; penaltyAmount?: number; reason: string }): string {
  switch (action.type) {
    case 'FORCE':
      return `FORCE ${action.targetTokenId || 'token'}`;
    case 'EXCLUDE':
      if (action.targetTokenProperty) {
        return `EXCLUDE tokens WHERE ${action.targetTokenProperty} ${formatValue(action.targetPropertyValue)}`;
      }
      return 'EXCLUDE token';
    case 'BOOST':
      return `BOOST score +${action.boostAmount || 0}`;
    case 'PENALIZE':
      return `PENALIZE score -${action.penaltyAmount || 0}`;
    case 'BLOCK':
      return 'BLOCK transaction';
    default:
      return action.type;
  }
}

// Compile a rule into a CompiledRule
export function compileRule(rule: Rule): CompiledRule {
  return {
    rule,
    predicate: compileCondition(rule.condition),
    dslSnippet: rule.compiledDSL || generateDSLSnippet(rule),
  };
}

// Compile all rules
export function compileRules(rules: Rule[]): CompiledRule[] {
  return rules
    .filter(r => r.enabled)
    .sort((a, b) => a.priority - b.priority)
    .map(compileRule);
}

// Check if a rule has expired
export function isRuleExpired(rule: Rule): boolean {
  if (!rule.expiry) return false;
  return Date.now() > rule.expiry;
}

// Validate rule syntax
export function validateRule(rule: Rule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.id) errors.push('Rule ID is required');
  if (!rule.label) errors.push('Rule label is required');
  if (!rule.type) errors.push('Rule type (HARD/SOFT) is required');
  if (!rule.condition) errors.push('Rule condition is required');
  if (!rule.action) errors.push('Rule action is required');

  if (rule.condition) {
    if (!rule.condition.field) errors.push('Condition field is required');
    if (!rule.condition.operator) errors.push('Condition operator is required');
  }

  if (rule.action) {
    if (!rule.action.type) errors.push('Action type is required');
    if (!rule.action.reason) errors.push('Action reason is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
