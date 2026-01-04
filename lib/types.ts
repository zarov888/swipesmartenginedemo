// Core types for STOP Engine Lab

export interface Token {
  id: string;
  name: string;
  dpan: string;
  type: 'credit' | 'debit' | 'prepaid' | 'drt';
  network: 'visa' | 'mastercard' | 'amex' | 'discover';
  limit: number;
  balance: number;
  utilization: number;
  apr: number;
  ftf: number;
  blockedMCCs: number[];
  rewardsByCategory: Record<string, number>;
  isEligible: boolean;
  cashbackRate: number;
  signupBonus?: { threshold: number; current: number; reward: number };
  metadata?: Record<string, unknown>;
}

export interface DRTToken extends Token {
  type: 'drt';
  childDPANs: Token[];
  routingStrategy: 'optimal_score' | 'round_robin' | 'lowest_utilization';
}

export interface UserProfile {
  id: string;
  name: string;
  tokens: Token[];
  drtTokens: DRTToken[];
  cashBalance: number;
  daysToPaycheck: number;
  preferenceWeights: ScoringWeights;
  riskTolerance: 'low' | 'medium' | 'high';
  defaultToken?: string;
}

export interface ScoringWeights {
  rewards: number;
  credit: number;
  cashflow: number;
  risk: number;
}

export interface TransactionContext {
  amount: number;
  currency: string;
  merchant: string;
  mcc: number;
  category: string;
  country: string;
  walletType: 'apple_pay' | 'google_pay' | 'samsung_pay' | 'browser';
  isInPerson: boolean;
  riskFlags: string[];
  timestamp: number;
  correlationId: string;
}

export type RuleType = 'HARD' | 'SOFT';

export interface Rule {
  id: string;
  label: string;
  type: RuleType;
  priority: number;
  enabled: boolean;
  expiry?: number;
  condition: RuleCondition;
  action: RuleAction;
  compiledDSL?: string;
}

export interface RuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: unknown;
  and?: RuleCondition[];
  or?: RuleCondition[];
}

export interface RuleAction {
  type: 'FORCE' | 'EXCLUDE' | 'BOOST' | 'PENALIZE' | 'BLOCK';
  targetTokenId?: string;
  targetTokenProperty?: string;
  targetPropertyValue?: unknown;
  boostAmount?: number;
  penaltyAmount?: number;
  reason: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleLabel: string;
  ruleType: RuleType;
  matched: boolean;
  reason: string;
  action?: string;
  forcedToken?: string;
  excludedTokens?: string[];
  dslSnippet?: string;
}

export interface ViolationOverride {
  tokenId: string;
  tokenName: string;
  violationType: string;
  constraint: string;
  overriddenBy: string;
  ruleId: string;
  severity: 'warning' | 'critical';
}

export interface ExcludedToken {
  tokenId: string;
  tokenName: string;
  reason: string;
  ruleId?: string;
  stage: string;
}

export interface PolicyVersion {
  version: string;
  effectiveDate: number;
  signatureHash: string;
  rules: Rule[];
  description: string;
  isCached: boolean;
}

export interface SubscoreBreakdown {
  raw: number;
  normalized: number;
  weight: number;
  weighted: number;
  factors: string[];
}

export interface ScoreBreakdown {
  tokenId: string;
  tokenName: string;
  subscores: {
    rewards: SubscoreBreakdown;
    credit: SubscoreBreakdown;
    cashflow: SubscoreBreakdown;
    risk: SubscoreBreakdown;
  };
  bonuses: { label: string; amount: number; ruleId?: string }[];
  penalties: { label: string; amount: number; ruleId?: string }[];
  totalBonuses: number;
  totalPenalties: number;
  baseScore: number;
  finalScore: number;
  ranking: number;
  excluded: boolean;
  exclusionReason?: string;
  exclusionStage?: string;
}

export interface RiskAssessment {
  tokenId: string;
  riskScore: number;
  declineProbability: number;
  riskFactors: string[];
  vetoRecommendation: boolean;
  vetoReason?: string;
}

export interface DRTResolution {
  drtId: string;
  selectedChild: Token;
  childScores: ScoreBreakdown[];
  resolutionReason: string;
  timestamp: number;
}

export type StageStatus = 'pending' | 'active' | 'completed' | 'error' | 'warning' | 'skipped';

export interface StageError {
  code: string;
  message: string;
  ruleId?: string;
  tokenId?: string;
  dslSnippet?: string;
}

export interface StageResult {
  stageName: string;
  stageIndex: number;
  status: StageStatus;
  startTime: number;
  endTime: number;
  startOffset: number;
  endOffset: number;
  durationMs: number;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  logs: LogEntry[];
  errors: StageError[];
  warning?: string;
}

export interface LogEntry {
  timestamp: number;
  offsetMs: number;
  correlationId: string;
  stage: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  tokenId?: string;
  data?: Record<string, unknown>;
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime: number;
  startOffset: number;
  endOffset: number;
  durationMs: number;
  status: StageStatus;
  tags: Record<string, string>;
  logs: LogEntry[];
}

export interface TraceData {
  traceId: string;
  correlationId: string;
  seed: number;
  startTime: number;
  endTime: number;
  totalDurationMs: number;
  spans: Span[];
  stageResults: StageResult[];
}

export interface AuthorizationResult {
  approved: boolean;
  authCode?: string;
  declineReason?: string;
  responseCode: string;
  processingTimeMs: number;
  declineProbability: number;
}

export type SelectionMethod = 
  | { type: 'FORCED'; ruleId: string; ruleLabel: string }
  | { type: 'AUTO'; reason: string };

export interface ShadowOptimization {
  wouldHaveSelected: string;
  wouldHaveSelectedName: string;
  wouldHaveScore: number;
  actualSelected: string;
  actualSelectedName: string;
  actualScore: number;
  reason: string;
}

export interface SensitivityResult {
  criterion: string;
  direction: 'increase' | 'decrease';
  perturbation: number;
  originalWinner: string;
  newWinner: string;
  winnerChanged: boolean;
  newScore: number;
}

export interface AuditRecord {
  correlationId: string;
  replaySeed: number;
  userId: string;
  policyVersion: string;
  policySignatureShort: string;
  policyCacheHit: boolean;
  pinnedPolicy: boolean;
  selectedRoute: string;
  selectedRouteName: string;
  selectedDpan: string;
  selectionMethod: SelectionMethod;
  isDRT: boolean;
  drtId?: string;
  resolvedChildToken?: string;
  resolvedChildName?: string;
  hardRuleOverride: boolean;
  shadowOptimization?: ShadowOptimization;
  matchedRules: RuleEvaluationResult[];
  failedRules: RuleEvaluationResult[];
  weightsUsed: ScoringWeights;
  scoreBreakdown: ScoreBreakdown[];
  candidateScores: ScoreBreakdown[];
  excludedTokens: ExcludedToken[];
  violationsOverridden: ViolationOverride[];
  riskScore: number;
  declineProbability: number;
  authResult: AuthorizationResult;
  processingTimeMs: number;
  stageTimings: { stage: string; startOffset: number; endOffset: number; durationMs: number }[];
  spans: Span[];
  errors: StageError[];
  timestamp: number;
}

export interface DiffReport {
  previousSelection: string;
  newSelection: string;
  changedAtStage: string;
  reason: string;
  scoreDeltas: { tokenId: string; tokenName: string; previousScore: number; newScore: number; delta: number }[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  expectedOutcome: string;
  context: Partial<TransactionContext>;
}

export const STAGE_NAMES = [
  'Ingest Event',
  'Context Extraction',
  'Profile Fetch',
  'Policy Load (Registry)',
  'Rule Compile',
  'Rule Evaluation',
  'Candidate Filtering',
  'Optimization Scoring',
  'Route Selection',
  'DRT Resolution',
  'DPAN Swap / Injection',
  'Authorization Gateway',
  'Audit Record Emit',
] as const;

export type StageName = typeof STAGE_NAMES[number];

export const STAGE_LATENCY_RANGES: Record<StageName, [number, number]> = {
  'Ingest Event': [2, 6],
  'Context Extraction': [6, 12],
  'Profile Fetch': [10, 25],
  'Policy Load (Registry)': [14, 30],
  'Rule Compile': [8, 16],
  'Rule Evaluation': [4, 10],
  'Candidate Filtering': [6, 14],
  'Optimization Scoring': [18, 45],
  'Route Selection': [3, 8],
  'DRT Resolution': [5, 12],
  'DPAN Swap / Injection': [7, 15],
  'Authorization Gateway': [80, 220],
  'Audit Record Emit': [4, 10],
};

export const SCORING_GLOSSARY = {
  rewards: {
    name: 'Rewards Score',
    short: 'RWD',
    description: 'Expected reward value for this transaction based on category multipliers, caps, and point valuation.',
    formula: 'min(100, categoryRate × baseValue + signupBonus)',
  },
  credit: {
    name: 'Credit Health Score',
    short: 'CRD',
    description: 'Projected credit utilization impact. Penalizes cards approaching limits.',
    formula: '100 × (1 - projectedUtilization) with threshold penalties',
  },
  cashflow: {
    name: 'Cash Flow Score',
    short: 'CSH',
    description: 'Carry cost proxy based on APR and days to paycheck.',
    formula: 'Balance buffer ratio × paycheck timing factor',
  },
  risk: {
    name: 'Risk Score',
    short: 'RSK',
    description: 'Decline probability (0-1). May veto unless hard-rule forced.',
    formula: 'Σ(risk factors) normalized to 0-1',
  },
};
