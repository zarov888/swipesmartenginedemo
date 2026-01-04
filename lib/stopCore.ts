import {
  TransactionContext, UserProfile, Token, DRTToken, Rule,
  StageResult, LogEntry, Span, TraceData, AuditRecord,
  AuthorizationResult, StageError,
  STAGE_NAMES, STAGE_LATENCY_RANGES, StageName, StageStatus,
  SelectionMethod, ShadowOptimization,
} from './types';
import { PRNG, generateSeed } from './prng';
import { getActivePolicy, isPolicyPinned, getPinnedVersion } from './policyRegistry';
import { compileRules } from './rulesDsl';
import { evaluateRules, RulesEngineResult } from './rulesEngine';
import { assessAllTokenRisks } from './riskEngine';
import { scoreTokens, selectBestToken, ScoringResult } from './scoringEngine';
import { resolveDRT, isDRTToken, DRTResolutionResult } from './drtEngine';

export interface PipelineResult {
  trace: TraceData;
  auditRecord: AuditRecord;
  stageResults: StageResult[];
  selectedRoute: string;
  selectedDpan: string;
  isDRT: boolean;
  drtResolution?: DRTResolutionResult;
  scoringResult: ScoringResult;
  rulesResult: RulesEngineResult;
}

export type StageCallback = (stageResult: StageResult, stageIndex: number) => void;

export class STOPEngine {
  private prng: PRNG;
  private seed: number;
  private pipelineStartTime: number = 0;
  private currentOffset: number = 0;
  private stageLogs: LogEntry[] = [];
  private spans: Span[] = [];
  private stageResults: StageResult[] = [];
  private errors: StageError[] = [];
  private correlationId: string = '';
  private context: TransactionContext | null = null;
  private user: UserProfile | null = null;
  private rules: Rule[] = [];
  private rulesResult: RulesEngineResult | null = null;
  private riskAssessments: Map<string, import('./types').RiskAssessment> = new Map();
  private scoringResult: ScoringResult | null = null;
  private selectedTokenId: string | null = null;
  private drtResolution: DRTResolutionResult | null = null;
  private authResult: AuthorizationResult | null = null;
  private policyCacheHit: boolean = false;

  constructor(seed?: number) {
    this.seed = seed ?? generateSeed();
    this.prng = new PRNG(this.seed);
  }

  getSeed(): number { return this.seed; }
  getCorrelationId(): string { return this.correlationId; }

  private log(level: LogEntry['level'], stage: string, message: string, tokenId?: string): void {
    const logOffset = this.currentOffset + this.prng.randomInt(1, 3);
    this.stageLogs.push({
      timestamp: this.pipelineStartTime + logOffset,
      offsetMs: logOffset,
      correlationId: this.correlationId,
      stage, level, message, tokenId,
    });
  }

  private getLatency(stageName: StageName): number {
    const range = STAGE_LATENCY_RANGES[stageName];
    return this.prng.getLatency(range[0], range[1]);
  }

  private async runStage(
    index: number,
    name: StageName,
    executor: () => Promise<{ inputs: Record<string, unknown>; outputs: Record<string, unknown>; status?: StageStatus }>,
    onComplete?: StageCallback
  ): Promise<StageResult> {
    const duration = this.getLatency(name);
    const startOffset = this.currentOffset;
    const endOffset = startOffset + duration;
    this.currentOffset = endOffset;

    this.stageLogs = [];
    await this.delay(duration);

    try {
      const result = await executor();
      const status = result.status || 'completed';
      const logs = this.stageLogs.filter(l => l.offsetMs >= startOffset && l.offsetMs <= endOffset);
      
      const stageResult: StageResult = {
        stageName: name, stageIndex: index, status,
        startTime: this.pipelineStartTime + startOffset,
        endTime: this.pipelineStartTime + endOffset,
        startOffset, endOffset, durationMs: duration,
        inputs: result.inputs, outputs: result.outputs,
        logs, errors: [],
      };
      
      this.stageResults.push(stageResult);
      this.spans.push({
        spanId: `span_${this.prng.randomInt(10000, 99999)}`,
        operationName: name,
        startTime: stageResult.startTime, endTime: stageResult.endTime,
        startOffset, endOffset, durationMs: duration, status,
        tags: { correlationId: this.correlationId }, logs,
      });

      if (onComplete) onComplete(stageResult, index);
      return stageResult;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const stageResult: StageResult = {
        stageName: name, stageIndex: index, status: 'error',
        startTime: this.pipelineStartTime + startOffset,
        endTime: this.pipelineStartTime + endOffset,
        startOffset, endOffset, durationMs: duration,
        inputs: {}, outputs: {}, logs: this.stageLogs,
        errors: [{ code: 'STAGE_ERROR', message: errMsg }],
      };
      this.stageResults.push(stageResult);
      if (onComplete) onComplete(stageResult, index);
      return stageResult;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.max(1, ms / 8)));
  }

  async runPipeline(inputContext: TransactionContext, user: UserProfile, onStageComplete?: StageCallback): Promise<PipelineResult> {
    this.prng = new PRNG(this.seed);
    this.pipelineStartTime = Date.now();
    this.currentOffset = 0;
    this.correlationId = this.prng.generateCorrelationId();
    this.stageResults = [];
    this.spans = [];
    this.errors = [];
    this.user = user;

    const allTokens: Token[] = [...user.tokens, ...user.drtTokens];
    const policy = getActivePolicy();

    await this.runStage(0, 'Ingest Event', async () => {
      this.log('info', 'Ingest Event', `Received: ${inputContext.merchant} $${inputContext.amount}`);
      return { inputs: { rawEvent: inputContext }, outputs: { acknowledged: true, correlationId: this.correlationId } };
    }, onStageComplete);

    await this.runStage(1, 'Context Extraction', async () => {
      this.context = { ...inputContext, correlationId: this.correlationId, timestamp: Date.now() };
      this.log('info', 'Context Extraction', `Extracted: $${this.context.amount}, MCC=${this.context.mcc}, ${this.context.country}`);
      return { inputs: { rawContext: inputContext }, outputs: { enrichedContext: this.context } };
    }, onStageComplete);

    await this.runStage(2, 'Profile Fetch', async () => {
      this.log('info', 'Profile Fetch', `Loaded ${user.tokens.length} tokens, ${user.drtTokens.length} DRTs`);
      return { inputs: { userId: user.id }, outputs: { tokenCount: allTokens.length } };
    }, onStageComplete);

    await this.runStage(3, 'Policy Load (Registry)', async () => {
      this.rules = policy.rules;
      this.policyCacheHit = policy.isCached;
      this.log('info', 'Policy Load (Registry)', `v${policy.version} ${this.policyCacheHit ? '[CACHE HIT]' : '[FETCHED]'}${isPolicyPinned() ? ' [PINNED]' : ''}`);
      return { inputs: {}, outputs: { version: policy.version, cacheHit: this.policyCacheHit, signature: policy.signatureHash } };
    }, onStageComplete);

    await this.runStage(4, 'Rule Compile', async () => {
      const compiled = compileRules(this.rules);
      this.log('info', 'Rule Compile', `Compiled ${compiled.length} rules`);
      return { inputs: { ruleCount: this.rules.length }, outputs: { compiledCount: compiled.length } };
    }, onStageComplete);

    await this.runStage(5, 'Rule Evaluation', async () => {
      this.rulesResult = evaluateRules(this.rules, this.context!, allTokens, user);
      this.log('info', 'Rule Evaluation', `Matched: ${this.rulesResult.matchedRules.length}`);
      if (this.rulesResult.hardRuleOverride) {
        this.log('warn', 'Rule Evaluation', `HARD OVERRIDE: ${this.rulesResult.forcingRule?.ruleLabel}`);
      }
      return { inputs: {}, outputs: { hardOverride: this.rulesResult.hardRuleOverride, forcedToken: this.rulesResult.forcedToken } };
    }, onStageComplete);

    await this.runStage(6, 'Candidate Filtering', async () => {
      this.riskAssessments = assessAllTokenRisks(allTokens, this.context!, user, this.prng);
      const excluded = this.rulesResult!.excludedTokensList.length;
      this.log('info', 'Candidate Filtering', `${allTokens.length - excluded} candidates (${excluded} excluded)`);
      return { inputs: {}, outputs: { excludedCount: excluded } };
    }, onStageComplete);

    await this.runStage(7, 'Optimization Scoring', async () => {
      this.scoringResult = scoreTokens(allTokens, this.context!, user, this.rulesResult!, this.riskAssessments, this.rulesResult?.forcedToken);
      this.log('info', 'Optimization Scoring', `Top: ${this.scoringResult.topCandidate?.tokenName} (${this.scoringResult.topCandidate?.finalScore.toFixed(1)}/100)`);
      return { inputs: {}, outputs: { topScore: this.scoringResult.topCandidate?.finalScore } };
    }, onStageComplete);

    const shadowWinner = this.scoringResult!.topCandidate;
    let shadowOpt: ShadowOptimization | undefined;

    await this.runStage(8, 'Route Selection', async () => {
      this.selectedTokenId = selectBestToken(this.scoringResult!, this.rulesResult!);
      const selectedToken = allTokens.find(t => t.id === this.selectedTokenId);
      
      if (this.rulesResult!.hardRuleOverride && shadowWinner && shadowWinner.tokenId !== this.selectedTokenId) {
        shadowOpt = {
          wouldHaveSelected: shadowWinner.tokenId,
          wouldHaveSelectedName: shadowWinner.tokenName,
          wouldHaveScore: shadowWinner.finalScore,
          actualSelected: this.selectedTokenId!,
          actualSelectedName: selectedToken?.name || '',
          actualScore: this.scoringResult!.scores.find(s => s.tokenId === this.selectedTokenId)?.finalScore || 0,
          reason: `Hard rule override by ${this.rulesResult!.forcingRule?.ruleLabel}`,
        };
        this.log('warn', 'Route Selection', `Shadow winner: ${shadowWinner.tokenName} (${shadowWinner.finalScore.toFixed(1)})`);
      }
      
      this.log('info', 'Route Selection', `Selected: ${selectedToken?.name}`);
      return { inputs: {}, outputs: { selectedToken: this.selectedTokenId, isDRT: selectedToken ? isDRTToken(selectedToken) : false } };
    }, onStageComplete);

    const selectedToken = allTokens.find(t => t.id === this.selectedTokenId);
    const isDRT = selectedToken ? isDRTToken(selectedToken) : false;

    await this.runStage(9, 'DRT Resolution', async () => {
      if (!isDRT || !selectedToken) {
        this.log('info', 'DRT Resolution', 'Skipped (not DRT)');
        return { inputs: {}, outputs: { skipped: true }, status: 'skipped' as StageStatus };
      }
      this.drtResolution = resolveDRT(selectedToken as DRTToken, this.context!, user, this.rulesResult!, this.prng);
      this.log('info', 'DRT Resolution', `Resolved → ${this.drtResolution.selectedChild.name}`);
      return { inputs: {}, outputs: { selectedChild: this.drtResolution.selectedChild.id } };
    }, onStageComplete);

    await this.runStage(10, 'DPAN Swap / Injection', async () => {
      const finalToken = isDRT && this.drtResolution ? this.drtResolution.selectedChild : selectedToken;
      this.log('info', 'DPAN Swap / Injection', `Injecting: ${finalToken?.dpan}`);
      return { inputs: {}, outputs: { finalDPAN: finalToken?.dpan } };
    }, onStageComplete);

    await this.runStage(11, 'Authorization Gateway', async () => {
      const finalToken = isDRT && this.drtResolution ? this.drtResolution.selectedChild : selectedToken;
      const risk = finalToken ? this.riskAssessments.get(finalToken.id) : null;
      const declineProb = risk?.declineProbability || 0.05;
      const approved = this.prng.simulateAuthResult(declineProb);
      
      this.authResult = {
        approved,
        authCode: approved ? `AUTH${this.prng.randomInt(100000, 999999)}` : undefined,
        declineReason: approved ? undefined : 'Issuer declined',
        responseCode: approved ? '00' : '05',
        processingTimeMs: this.getLatency('Authorization Gateway'),
        declineProbability: declineProb,
      };
      
      this.log(approved ? 'info' : 'warn', 'Authorization Gateway', approved ? `Approved: ${this.authResult.authCode}` : 'Declined');
  return {
  inputs: { declineProbability: declineProb } as Record<string, unknown>,
  outputs: this.authResult as unknown as Record<string, unknown>,
};

    }, onStageComplete);

    const finalToken = isDRT && this.drtResolution ? this.drtResolution.selectedChild : selectedToken;
    const totalTime = this.stageResults.reduce((sum, s) => sum + s.durationMs, 0);
    const finalRisk = finalToken ? this.riskAssessments.get(finalToken.id) : null;

    const selectionMethod: SelectionMethod = this.rulesResult!.hardRuleOverride
      ? { type: 'FORCED', ruleId: this.rulesResult!.forcingRule!.ruleId, ruleLabel: this.rulesResult!.forcingRule!.ruleLabel }
      : { type: 'AUTO', reason: 'Optimization scoring' };

    const auditRecord: AuditRecord = {
      correlationId: this.correlationId,
      replaySeed: this.seed,
      userId: user.id,
      policyVersion: policy.version,
      policySignatureShort: policy.signatureHash.slice(7, 15),
      policyCacheHit: this.policyCacheHit,
      pinnedPolicy: isPolicyPinned(),
      selectedRoute: this.selectedTokenId || 'none',
      selectedRouteName: selectedToken?.name || 'none',
      selectedDpan: finalToken?.dpan || 'N/A',
      selectionMethod,
      isDRT,
      drtId: isDRT ? this.selectedTokenId! : undefined,
      resolvedChildToken: isDRT && this.drtResolution ? this.drtResolution.selectedChild.id : undefined,
      resolvedChildName: isDRT && this.drtResolution ? this.drtResolution.selectedChild.name : undefined,
      hardRuleOverride: this.rulesResult!.hardRuleOverride,
      shadowOptimization: shadowOpt,
      matchedRules: this.rulesResult!.matchedRules,
      failedRules: this.rulesResult!.failedRules,
      weightsUsed: this.scoringResult!.weightsUsed,
      scoreBreakdown: this.scoringResult!.scores,
      candidateScores: this.scoringResult!.scores.filter(s => !s.excluded),
      excludedTokens: this.rulesResult!.excludedTokensList,
      violationsOverridden: this.rulesResult!.violationsOverridden,
      riskScore: finalRisk?.riskScore || 0,
      declineProbability: finalRisk?.declineProbability || 0,
      authResult: this.authResult!,
      processingTimeMs: totalTime,
      stageTimings: this.stageResults.map(s => ({ stage: s.stageName, startOffset: s.startOffset, endOffset: s.endOffset, durationMs: s.durationMs })),
      spans: this.spans,
      errors: this.errors,
      timestamp: Date.now(),
    };

    await this.runStage(12, 'Audit Record Emit', async () => {
      this.log('info', 'Audit Record Emit', `Emitted: ${totalTime}ms total`);
      return { inputs: {}, outputs: { totalTimeMs: totalTime } };
    }, onStageComplete);

    const trace: TraceData = {
      traceId: this.correlationId, correlationId: this.correlationId, seed: this.seed,
      startTime: this.pipelineStartTime, endTime: Date.now(),
      totalDurationMs: this.currentOffset, spans: this.spans, stageResults: this.stageResults,
    };

    return {
      trace, auditRecord, stageResults: this.stageResults,
      selectedRoute: this.selectedTokenId || 'none',
      selectedDpan: finalToken?.dpan || 'N/A',
      isDRT, drtResolution: this.drtResolution || undefined,
      scoringResult: this.scoringResult!, rulesResult: this.rulesResult!,
    };
  }
}
