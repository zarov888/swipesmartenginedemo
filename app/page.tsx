'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TopBar from '@/components/TopBar';
import InputPanel from '@/components/InputPanel';
import PipelinePanel from '@/components/PipelinePanel';
import TracePanel from '@/components/TracePanel';
import RulesDock from '@/components/RulesDock';
import DiffPanel from '@/components/DiffPanel';
import DecisionFlow from '@/components/DecisionFlow';
import ScoreChart from '@/components/ScoreChart';
import GuidedTour, { TourTrigger } from '@/components/GuidedTour';
import ScoringExplainer from '@/components/ScoringExplainer';
import WeightSliders from '@/components/WeightSliders';
import ConfidenceIndicator from '@/components/ConfidenceIndicator';
import RuleImpact from '@/components/RuleImpact';
import CostBenefitSummary from '@/components/CostBenefitSummary';
import ShadowWinnerBanner from '@/components/ShadowWinnerBanner';
import SensitivityAlerts from '@/components/SensitivityAlerts';
import ShareState, { useSharedState } from '@/components/ShareState';
import ExportReport from '@/components/ExportReport';
import ScenarioComparison from '@/components/ScenarioComparison';
import TokenCardGallery from '@/components/TokenCardGallery';
import RewardsTracker from '@/components/RewardsTracker';
import { PipelineSkeleton } from '@/components/SkeletonLoader';
import KeyboardShortcuts, { KeyboardShortcutsTrigger } from '@/components/KeyboardShortcuts';
import ABComparison from '@/components/ABComparison';
import RunHistory, { useRunHistory } from '@/components/RunHistory';
import RuleBuilder, { RuleBuilderTrigger } from '@/components/RuleBuilder';
import CardRecommendation from '@/components/CardRecommendation';
import MCCInsights from '@/components/MCCInsights';
import CreditImpactSimulator from '@/components/CreditImpactSimulator';
import SpendingHeatmap from '@/components/SpendingHeatmap';
import PerformanceProfiler from '@/components/PerformanceProfiler';
import RuleDebugger from '@/components/RuleDebugger';

import { TransactionContext, UserProfile, StageResult, TraceData, AuditRecord, LogEntry, DiffReport, RuleEvaluationResult, SensitivityResult, SelectionMethod, ScoringWeights } from '@/lib/types';
import { STOPEngine, SpeedMode } from '@/lib/stopCore';
import { generateSeed } from '@/lib/prng';
import { sampleUser, scenarios, getDefaultContext } from '@/lib/mockData';
import { getActivePolicy, isPolicyPinned, toggleRule } from '@/lib/policyRegistry';
import { computeSensitivity } from '@/lib/scoringEngine';

export default function Home() {
  const engineRef = useRef<STOPEngine | null>(null);
  const [seed, setSeed] = useState(() => generateSeed());
  const [correlationId, setCorrelationId] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal');
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const [rulesDockExpanded, setRulesDockExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [mobileTab, setMobileTab] = useState<'inputs' | 'pipeline' | 'results'>('pipeline');
  const [showTour, setShowTour] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  // Run history hook
  const { history, addEntry, clearHistory } = useRunHistory();

  // Load shared state from URL
  const sharedState = useSharedState();
  useEffect(() => {
    if (sharedState) {
      if (sharedState.seed) setSeed(sharedState.seed);
      if (sharedState.scenario) setSelectedScenario(sharedState.scenario);
      if (sharedState.context) setContext(prev => ({ ...prev, ...sharedState.context }));
      if (sharedState.weights) setUser(prev => ({ ...prev, preferenceWeights: sharedState.weights! }));
    }
  }, [sharedState]);

  // Show tour on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('swipesmart-tour-seen');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem('swipesmart-tour-seen', 'true');
  };

  const [selectedScenario, setSelectedScenario] = useState('scenario_dining_domestic');
  const [context, setContext] = useState<TransactionContext>(() => {
    const scenario = scenarios.find(s => s.id === 'scenario_dining_domestic');
    return { ...getDefaultContext(), ...scenario?.context };
  });
  const [user, setUser] = useState<UserProfile>(() => ({ ...sampleUser }));

  const [trace, setTrace] = useState<TraceData | null>(null);
  const [auditRecord, setAuditRecord] = useState<AuditRecord | null>(null);
  const [previousRun, setPreviousRun] = useState<{ selectedRoute: string; scores: unknown[] } | null>(null);
  const [diff, setDiff] = useState<DiffReport | null>(null);
  const [ruleEvaluations, setRuleEvaluations] = useState<RuleEvaluationResult[]>([]);
  const [sensitivity, setSensitivity] = useState<SensitivityResult[]>([]);
  const [transactionCount, setTransactionCount] = useState(0);

  const policy = getActivePolicy();
  const simulatedLatency = stageResults.reduce((sum, s) => sum + s.durationMs, 0);
  const actualLatency = stageResults.reduce((sum, s) => sum + (s.actualDurationMs || 0), 0);
  const authResult = auditRecord?.authResult.approved ? 'APPROVED' : auditRecord?.authResult.approved === false ? 'DECLINED' : '';
  const selectedRoute = auditRecord?.selectedRouteName || '';
  const selectionMethod: SelectionMethod | null = auditRecord?.selectionMethod || null;

  const logs = {
    decision: stageResults.flatMap(s => s.logs.filter(l => ['Route Selection', 'Optimization Scoring', 'Candidate Filtering', 'Rule Evaluation'].includes(l.stage))),
    policy: stageResults.flatMap(s => s.logs.filter(l => ['Policy Load (Registry)', 'Rule Compile'].includes(l.stage))),
    risk: stageResults.flatMap(s => s.logs.filter(l => l.message.toLowerCase().includes('risk') || l.stage === 'Authorization Gateway')),
  };

  const handleScenarioSelect = useCallback((scenarioId: string) => {
    setSelectedScenario(scenarioId);
    if (scenarioId === 'custom') return;
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) setContext(prev => ({ ...prev, ...scenario.context }));
  }, []);

  const runPipeline = useCallback(async () => {
    if (isRunning && !isPaused) return;

    if (auditRecord) {
      setPreviousRun({ selectedRoute: auditRecord.selectedRoute, scores: auditRecord.scoreBreakdown });
    }

    setIsRunning(true);
    setIsPaused(false);
    setStageResults([]);
    setCurrentStageIndex(0);
    setTrace(null);
    setAuditRecord(null);
    setDiff(null);
    setRuleEvaluations([]);
    setSensitivity([]);

    const engine = new STOPEngine(seed, speedMode);
    engineRef.current = engine;
    setCorrelationId(engine.getCorrelationId());

    try {
      const result = await engine.runPipeline(context, user, (stageResult, index) => {
        setCurrentStageIndex(index);
        setStageResults(prev => [...prev, stageResult]);
      });

      setTrace(result.trace);
      setAuditRecord(result.auditRecord);
      setCorrelationId(result.auditRecord.correlationId);

      // Set rule evaluations
      const allEvals = [...result.auditRecord.matchedRules, ...result.auditRecord.failedRules];
      setRuleEvaluations(allEvals);

      // Compute sensitivity
      if (result.scoringResult.candidateCount >= 2) {
        const sens = computeSensitivity(result.scoringResult.scores, result.scoringResult.weightsUsed, 0.10);
        setSensitivity(sens);
      }

      // Increment transaction count for rewards tracking
      setTransactionCount(prev => prev + 1);

      // Add to run history
      addEntry(result.auditRecord, context, selectedScenario, simulatedLatency);

      // Compute diff
      if (previousRun && previousRun.selectedRoute !== result.auditRecord.selectedRoute) {
        const scoreDeltas = result.auditRecord.scoreBreakdown.map(score => {
          const prev = (previousRun.scores as { tokenId: string; finalScore: number }[]).find(p => p.tokenId === score.tokenId);
          return {
            tokenId: score.tokenId,
            tokenName: score.tokenName,
            previousScore: prev?.finalScore || 0,
            newScore: score.finalScore,
            delta: score.finalScore - (prev?.finalScore || 0),
          };
        }).filter(d => Math.abs(d.delta) > 0.5);

        setDiff({
          previousSelection: previousRun.selectedRoute,
          newSelection: result.auditRecord.selectedRoute,
          changedAtStage: result.auditRecord.hardRuleOverride ? 'Rule Evaluation' : 'Optimization Scoring',
          reason: result.auditRecord.hardRuleOverride ? 'Hard rule override changed selection' : 'Score optimization resulted in different winner',
          scoreDeltas,
        });
        setShowDiff(true);
      }
    } catch (error) {
      console.error('Pipeline error:', error);
    } finally {
      setIsRunning(false);
      setCurrentStageIndex(-1);
    }
  }, [seed, context, user, isRunning, isPaused, auditRecord, previousRun, speedMode]);

  const handleReplay = useCallback(() => { runPipeline(); }, [runPipeline]);

  const handleNewSeed = useCallback(() => {
    const newSeed = generateSeed();
    setSeed(newSeed);
    setCorrelationId('');
    setStageResults([]);
    setTrace(null);
    setAuditRecord(null);
    setPreviousRun(null);
    setDiff(null);
    setSensitivity([]);
  }, []);

  const handleExportTrace = useCallback(() => {
    if (!trace) return;
    const data = JSON.stringify(trace, null, 2);
    downloadJson(data, `stop-trace-${correlationId.slice(0, 8)}.json`);
  }, [trace, correlationId]);

  const handleExportAudit = useCallback(() => {
    if (!auditRecord) return;
    const data = JSON.stringify(auditRecord, null, 2);
    downloadJson(data, `stop-audit-${correlationId.slice(0, 8)}.json`);
  }, [auditRecord, correlationId]);

  const [rulesVersion, setRulesVersion] = useState(0);

  const handleToggleRule = useCallback((ruleId: string) => {
    toggleRule(ruleId);
    setRulesVersion(v => v + 1); // Force re-render
  }, []);

  // Handle weight changes - update user profile
  const handleWeightChange = useCallback((newWeights: ScoringWeights) => {
    setUser(prev => ({
      ...prev,
      preferenceWeights: newWeights,
    }));
  }, []);

  // Get selected token for cost/benefit
  const selectedToken = useMemo(() => {
    if (!auditRecord) return undefined;
    return user.tokens.find(t => t.id === auditRecord.selectedRoute) ||
           user.drtTokens.find(t => t.id === auditRecord.selectedRoute);
  }, [auditRecord, user]);

  const selectedScore = useMemo(() => {
    if (!auditRecord) return undefined;
    return auditRecord.scoreBreakdown.find(s => s.tokenId === auditRecord.selectedRoute);
  }, [auditRecord]);

  // Run comparison for a specific scenario
  const runScenarioComparison = useCallback(async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return null;

    const testContext = { ...context, ...scenario.context };
    const engine = new STOPEngine(seed, 'turbo');

    try {
      const result = await engine.runPipeline(testContext, user, () => {});
      const activeScores = result.scoringResult.scores.filter(s => !s.excluded).sort((a, b) => b.finalScore - a.finalScore);
      return {
        winner: activeScores[0],
        runnerUp: activeScores[1] || null,
      };
    } catch {
      return null;
    }
  }, [context, user, seed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'enter':
          e.preventDefault();
          if (!isRunning) runPipeline();
          break;
        case 'r':
          e.preventDefault();
          handleReplay();
          break;
        case 'n':
          e.preventDefault();
          handleNewSeed();
          break;
        case '1':
          setSpeedMode('normal');
          break;
        case '2':
          setSpeedMode('fast');
          break;
        case '3':
          setSpeedMode('turbo');
          break;
        case 'escape':
          setShowDiff(false);
          setRulesDockExpanded(false);
          break;
        case 't':
          handleExportTrace();
          break;
        case 'a':
          handleExportAudit();
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, runPipeline, handleReplay, handleNewSeed, handleExportTrace, handleExportAudit]);

  // Handle replay from history
  const handleHistoryReplay = useCallback((entry: { context: TransactionContext; scenario: string }) => {
    setContext(entry.context);
    setSelectedScenario(entry.scenario);
    setTimeout(() => runPipeline(), 100);
  }, [runPipeline]);

  return (
    <div className="h-screen flex flex-col bg-void grid-bg overflow-hidden">
      <TopBar
        correlationId={correlationId}
        seed={seed}
        policyVersion={policy.version}
        policySignature={auditRecord?.policySignatureShort || ''}
        policyCacheHit={auditRecord?.policyCacheHit || false}
        isPinned={isPolicyPinned()}
        simulatedLatency={simulatedLatency}
        actualLatency={actualLatency}
        authResult={authResult}
        authProbability={auditRecord?.declineProbability || 0}
        selectedRoute={selectedRoute}
        selectionMethod={selectionMethod}
        isRunning={isRunning}
        isPaused={isPaused}
        speedMode={speedMode}
        onSpeedModeChange={setSpeedMode}
        onRun={runPipeline}
        onStep={() => {}}
        onPause={() => setIsPaused(!isPaused)}
        onReplay={handleReplay}
        onNewSeed={handleNewSeed}
        onExportTrace={handleExportTrace}
        onExportAudit={handleExportAudit}
        extraActions={
          <>
            <ABComparison
              baseWeights={user.preferenceWeights}
              context={context}
              user={user}
              seed={seed}
            />
            <ScenarioComparison
              currentScenario={selectedScenario}
              onRunComparison={runScenarioComparison}
            />
            <MCCInsights
              tokens={[...user.tokens, ...user.drtTokens]}
              currentMCC={String(context.mcc)}
            />
            <RuleBuilderTrigger onClick={() => setShowRuleBuilder(true)} />
            <RunHistory
              history={history}
              onReplay={handleHistoryReplay}
              onClear={clearHistory}
            />
            <ShareState
              context={context}
              weights={user.preferenceWeights}
              seed={seed}
              scenario={selectedScenario}
            />
            <ExportReport auditRecord={auditRecord} context={context} />
            <KeyboardShortcutsTrigger onClick={() => setShowKeyboardShortcuts(true)} />
          </>
        }
      />

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex border-b border-gray-800 bg-void-light">
        {(['inputs', 'pipeline', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
              mobileTab === tab
                ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Inputs Panel */}
        <div className={`${mobileTab === 'inputs' ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 border-r border-white/5 overflow-hidden flex-col bg-surface-100/50`}>
          <div className="panel-header px-4 py-3 border-b border-white/5 hidden lg:block bg-surface-50/50">
            <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">Transaction Inputs</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <InputPanel
              context={context}
              user={user}
              selectedScenario={selectedScenario}
              onContextChange={setContext}
              onUserChange={setUser}
              onScenarioSelect={handleScenarioSelect}
            />
            {/* Weight Sliders */}
            <div className="p-3 border-t border-white/5">
              <WeightSliders
                weights={user.preferenceWeights}
                onChange={handleWeightChange}
                disabled={isRunning}
              />
            </div>
          </div>
        </div>

        {/* Pipeline Panel - Main Content */}
        <div className={`${mobileTab === 'pipeline' ? 'flex' : 'hidden'} lg:flex flex-1 border-r border-white/5 overflow-hidden flex-col`}>
          <div className="panel-header px-4 py-3 border-b border-white/5 hidden lg:flex items-center justify-between bg-surface-50/50">
            <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">Decision Engine Visualization</span>
            {auditRecord && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-[10px] text-text-secondary">Result:</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  auditRecord.authResult.approved
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                    : 'bg-error-red/10 text-error-red border border-error-red/20'
                }`}>
                  {auditRecord.authResult.approved ? 'APPROVED' : 'DECLINED'}
                </span>
              </motion.div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Empty State */}
            {!auditRecord && !isRunning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Optimize</h3>
                <p className="text-sm text-text-secondary mb-4 max-w-sm">
                  Configure your transaction inputs and click <strong>Run</strong> to see the intelligent payment routing engine in action.
                </p>
                <button
                  onClick={runPipeline}
                  className="px-4 py-2 bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 rounded-lg text-accent-blue font-medium text-sm transition-colors"
                >
                  Run Pipeline
                </button>
              </motion.div>
            )}

            {/* Loading Skeleton */}
            {isRunning && stageResults.length === 0 && (
              <PipelineSkeleton />
            )}

            {/* Shadow Winner Banner - when rule overrides optimizer */}
            {auditRecord?.shadowOptimization && (
              <ShadowWinnerBanner shadow={auditRecord.shadowOptimization} />
            )}

            {/* Decision Flow Visualization */}
            <AnimatePresence>
              {auditRecord && (
                <DecisionFlow
                  isVisible={!!auditRecord}
                  scores={auditRecord.scoreBreakdown}
                  matchedRules={auditRecord.matchedRules}
                  excludedTokens={auditRecord.excludedTokens}
                  selectedTokenId={auditRecord.selectedRoute}
                  selectedTokenName={auditRecord.selectedRouteName}
                  isForced={auditRecord.hardRuleOverride}
                  forcingRule={auditRecord.selectionMethod.type === 'FORCED' ? auditRecord.selectionMethod.ruleLabel : undefined}
                />
              )}
            </AnimatePresence>

            {/* Confidence Indicator */}
            {auditRecord && auditRecord.scoreBreakdown.length >= 2 && (
              <ConfidenceIndicator
                scores={auditRecord.scoreBreakdown}
                selectedTokenId={auditRecord.selectedRoute}
              />
            )}

            {/* Score Chart */}
            {auditRecord && auditRecord.scoreBreakdown.length > 0 && (
              <ScoreChart
                scores={auditRecord.scoreBreakdown}
                selectedTokenId={auditRecord.selectedRoute}
              />
            )}

            {/* Two Column Layout for Insights */}
            {auditRecord && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Rule Impact */}
                <RuleImpact
                  evaluations={ruleEvaluations}
                  scores={auditRecord.scoreBreakdown}
                />

                {/* Cost/Benefit Summary */}
                {selectedScore && (
                  <CostBenefitSummary
                    score={selectedScore}
                    context={context}
                    token={selectedToken}
                  />
                )}
              </div>
            )}

            {/* Scoring Explainer */}
            {auditRecord && auditRecord.scoreBreakdown.length > 0 && (
              <ScoringExplainer
                scores={auditRecord.scoreBreakdown}
                selectedTokenId={auditRecord.selectedRoute}
              />
            )}

            {/* Two Column Layout for Wallet & Rewards */}
            {auditRecord && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Token Card Gallery */}
                <TokenCardGallery
                  tokens={[...user.tokens, ...user.drtTokens]}
                  scores={auditRecord.scoreBreakdown}
                  selectedTokenId={auditRecord.selectedRoute}
                />

                {/* Rewards Tracker */}
                <RewardsTracker
                  scores={auditRecord.scoreBreakdown}
                  selectedTokenId={auditRecord.selectedRoute}
                  context={context}
                  transactionCount={transactionCount}
                />
              </div>
            )}

            {/* Sensitivity Alerts */}
            {auditRecord && sensitivity.length > 0 && (
              <SensitivityAlerts
                sensitivity={sensitivity}
                currentWinnerName={auditRecord.selectedRouteName}
              />
            )}

            {/* Card Recommendations */}
            {auditRecord && (
              <CardRecommendation
                scores={auditRecord.scoreBreakdown}
                context={context}
                userTokens={[...user.tokens, ...user.drtTokens]}
              />
            )}

            {/* Advanced Analytics Grid */}
            {auditRecord && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Credit Impact Simulator */}
                <CreditImpactSimulator
                  tokens={[...user.tokens, ...user.drtTokens]}
                  selectedTokenId={auditRecord.selectedRoute}
                  context={context}
                />

                {/* Spending Heatmap */}
                <SpendingHeatmap />
              </div>
            )}

            {/* Developer Tools Grid */}
            {(auditRecord || stageResults.length > 0) && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Performance Profiler */}
                <PerformanceProfiler
                  stageResults={stageResults}
                  isRunning={isRunning}
                />

                {/* Rule Debugger */}
                {auditRecord && (
                  <RuleDebugger
                    evaluations={ruleEvaluations}
                    context={context}
                    tokens={[...user.tokens, ...user.drtTokens]}
                  />
                )}
              </div>
            )}

            {/* Pipeline Stages */}
            {(isRunning || stageResults.length > 0) && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-accent-blue rounded-full" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Pipeline Stages</span>
                </div>
                <PipelinePanel stageResults={stageResults} currentStageIndex={currentStageIndex} isRunning={isRunning} />
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className={`${mobileTab === 'results' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[400px] overflow-hidden flex-col bg-surface-100/50`}>
          <div className="panel-header px-4 py-3 border-b border-white/5 hidden lg:block bg-surface-50/50">
            <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">Trace Inspector</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <TracePanel trace={trace} auditRecord={auditRecord} logs={logs} sensitivity={sensitivity} />
          </div>
        </div>
      </div>

      <RulesDock
        rules={policy.rules}
        evaluationResults={ruleEvaluations}
        isExpanded={rulesDockExpanded}
        onToggleExpand={() => setRulesDockExpanded(!rulesDockExpanded)}
        onToggleRule={handleToggleRule}
      />

      <AnimatePresence>
        {showDiff && diff && <DiffPanel diff={diff} onClose={() => setShowDiff(false)} />}
      </AnimatePresence>

      {/* Guided Tour */}
      <GuidedTour isOpen={showTour} onClose={handleCloseTour} onRunDemo={runPipeline} />
      {!showTour && <TourTrigger onClick={() => setShowTour(true)} />}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* Rule Builder Modal */}
      <RuleBuilder
        isOpen={showRuleBuilder}
        onClose={() => setShowRuleBuilder(false)}
        onApplyRules={() => {}}
      />
    </div>
  );
}

function downloadJson(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
