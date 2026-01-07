'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, X, Play, ArrowRight, Trophy, TrendingUp } from 'lucide-react';
import { scenarios } from '@/lib/mockData';
import { TransactionContext, ScoreBreakdown } from '@/lib/types';

interface ComparisonResult {
  scenarioId: string;
  scenarioName: string;
  winner: string;
  winnerScore: number;
  runnerUp: string;
  runnerUpScore: number;
  margin: number;
}

interface ScenarioComparisonProps {
  currentScenario: string;
  onRunComparison: (scenarioId: string) => Promise<{
    winner: ScoreBreakdown;
    runnerUp: ScoreBreakdown | null;
  } | null>;
}

export default function ScenarioComparison({ currentScenario, onRunComparison }: ScenarioComparisonProps) {
  const [showModal, setShowModal] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  const availableScenarios = scenarios.filter(s => s.id !== 'custom');

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const runComparison = async () => {
    if (selectedScenarios.length === 0) return;

    setComparing(true);
    setResults([]);

    const newResults: ComparisonResult[] = [];

    for (const scenarioId of selectedScenarios) {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) continue;

      const result = await onRunComparison(scenarioId);
      if (result) {
        newResults.push({
          scenarioId,
          scenarioName: scenario.name,
          winner: result.winner.tokenName,
          winnerScore: result.winner.finalScore,
          runnerUp: result.runnerUp?.tokenName || 'N/A',
          runnerUpScore: result.runnerUp?.finalScore || 0,
          margin: result.winner.finalScore - (result.runnerUp?.finalScore || 0),
        });
      }
    }

    setResults(newResults);
    setComparing(false);
  };

  // Group results by winner
  const winnerGroups = results.reduce((acc, r) => {
    if (!acc[r.winner]) acc[r.winner] = [];
    acc[r.winner].push(r);
    return acc;
  }, {} as Record<string, ComparisonResult[]>);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono"
        title="Compare scenarios"
      >
        <GitCompare className="w-3.5 h-3.5" />
        Compare
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-surface-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                    <GitCompare className="w-5 h-5 text-accent-teal" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Scenario Comparison</h3>
                    <p className="text-xs text-text-secondary">See how different contexts affect token selection</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-tertiary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Scenario Selection */}
                <div className="mb-6">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">Select Scenarios to Compare</p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableScenarios.map(scenario => (
                      <button
                        key={scenario.id}
                        onClick={() => toggleScenario(scenario.id)}
                        disabled={comparing}
                        className={`p-3 rounded-lg text-left transition-all ${
                          selectedScenarios.includes(scenario.id)
                            ? 'bg-accent-teal/10 border border-accent-teal/30'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        } ${scenario.id === currentScenario ? 'ring-2 ring-accent-blue/30' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {scenario.icon && <span className="text-lg">{scenario.icon}</span>}
                          <div>
                            <p className="text-sm font-medium text-white">{scenario.name}</p>
                            <p className="text-[10px] text-text-tertiary">{scenario.description}</p>
                          </div>
                        </div>
                        {scenario.id === currentScenario && (
                          <span className="text-[9px] text-accent-blue mt-1 block">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Run Button */}
                <button
                  onClick={runComparison}
                  disabled={comparing || selectedScenarios.length === 0}
                  className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-accent-teal/20 text-accent-teal border border-accent-teal/30 hover:bg-accent-teal/30 transition-all disabled:opacity-50 mb-6"
                >
                  {comparing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Play className="w-4 h-4" />
                      </motion.div>
                      Running {selectedScenarios.length} scenarios...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Comparison ({selectedScenarios.length} selected)
                    </>
                  )}
                </button>

                {/* Results */}
                {results.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-xs text-text-tertiary uppercase tracking-wider">Results</p>

                    {/* Winner Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(winnerGroups).map(([winner, scenarios]) => (
                        <div key={winner} className="p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg text-center">
                          <Trophy className="w-5 h-5 text-accent-green mx-auto mb-1" />
                          <p className="text-sm font-medium text-white">{winner}</p>
                          <p className="text-xs text-accent-green">Won {scenarios.length}x</p>
                        </div>
                      ))}
                    </div>

                    {/* Detailed Results */}
                    <div className="space-y-2">
                      {results.map((result, idx) => (
                        <motion.div
                          key={result.scenarioId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{result.scenarioName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              result.margin > 10
                                ? 'bg-accent-green/10 text-accent-green'
                                : result.margin > 5
                                ? 'bg-accent-orange/10 text-accent-orange'
                                : 'bg-accent-pink/10 text-accent-pink'
                            }`}>
                              {result.margin > 10 ? 'Clear win' : result.margin > 5 ? 'Moderate' : 'Close'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3 h-3 text-accent-green" />
                              <span className="text-white">{result.winner}</span>
                              <span className="text-accent-green font-mono">{result.winnerScore.toFixed(1)}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-text-tertiary" />
                            <div className="text-text-secondary">
                              {result.runnerUp} ({result.runnerUpScore.toFixed(1)})
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
