'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import TopBar from '@/components/TopBar';
import InputPanel from '@/components/InputPanel';
import PipelinePanel from '@/components/PipelinePanel';
import TracePanel from '@/components/TracePanel';
import RulesDock from '@/components/RulesDock';
import DiffPanel from '@/components/DiffPanel';

import { TransactionContext, UserProfile, StageResult, TraceData, AuditRecord, LogEntry, DiffReport, RuleEvaluationResult, SensitivityResult, SelectionMethod } from '@/lib/types';
import { STOPEngine } from '@/lib/stopCore';
import { generateSeed } from '@/lib/prng';
import { sampleUser, scenarios, getDefaultContext } from '@/lib/mockData';
import { getActivePolicy, isPolicyPinned } from '@/lib/policyRegistry';
import { computeSensitivity } from '@/lib/scoringEngine';

export default function Home() {
  const engineRef = useRef<STOPEngine | null>(null);
  const [seed, setSeed] = useState(() => generateSeed());
  const [correlationId, setCorrelationId] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const [rulesDockExpanded, setRulesDockExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

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

  const policy = getActivePolicy();
  const totalLatency = stageResults.reduce((sum, s) => sum + s.durationMs, 0);
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

    const engine = new STOPEngine(seed);
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
  }, [seed, context, user, isRunning, isPaused, auditRecord, previousRun]);

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

  const handleToggleRule = useCallback((ruleId: string) => {
    console.log('Toggle rule:', ruleId);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-void grid-bg overflow-hidden">
      <TopBar
        correlationId={correlationId}
        seed={seed}
        policyVersion={policy.version}
        policySignature={auditRecord?.policySignatureShort || ''}
        policyCacheHit={auditRecord?.policyCacheHit || false}
        isPinned={isPolicyPinned()}
        totalLatency={totalLatency}
        authResult={authResult}
        authProbability={auditRecord?.declineProbability || 0}
        selectedRoute={selectedRoute}
        selectionMethod={selectionMethod}
        isRunning={isRunning}
        isPaused={isPaused}
        onRun={runPipeline}
        onStep={() => {}}
        onPause={() => setIsPaused(!isPaused)}
        onReplay={handleReplay}
        onNewSeed={handleNewSeed}
        onExportTrace={handleExportTrace}
        onExportAudit={handleExportAudit}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-gray-800 overflow-hidden flex flex-col">
          <div className="panel-header px-3 py-2 border-b border-gray-800">
            <span className="font-mono text-xs text-gray-500">INPUTS</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <InputPanel
              context={context}
              user={user}
              selectedScenario={selectedScenario}
              onContextChange={setContext}
              onUserChange={setUser}
              onScenarioSelect={handleScenarioSelect}
            />
          </div>
        </div>

        <div className="flex-1 border-r border-gray-800 overflow-hidden flex flex-col">
          <div className="panel-header px-3 py-2 border-b border-gray-800">
            <span className="font-mono text-xs text-gray-500">PIPELINE VISUALIZATION</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PipelinePanel stageResults={stageResults} currentStageIndex={currentStageIndex} isRunning={isRunning} />
          </div>
        </div>

        <div className="w-[420px] overflow-hidden flex flex-col">
          <div className="panel-header px-3 py-2 border-b border-gray-800">
            <span className="font-mono text-xs text-gray-500">TRACE + STATE INSPECTOR</span>
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
