'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitBranch, Play, ArrowLeftRight, Trophy, TrendingUp, TrendingDown, Equal } from 'lucide-react';
import { ScoringWeights, TransactionContext, UserProfile, ScoreBreakdown } from '@/lib/types';
import { STOPEngine } from '@/lib/stopCore';

interface ABComparisonProps {
  baseWeights: ScoringWeights;
  context: TransactionContext;
  user: UserProfile;
  seed: number;
}

interface ComparisonResult {
  configName: string;
  weights: ScoringWeights;
  winner: ScoreBreakdown;
  runnerUp: ScoreBreakdown | null;
  allScores: ScoreBreakdown[];
}

const presetConfigs: { name: string; weights: ScoringWeights }[] = [
  { name: 'Balanced', weights: { rewards: 0.30, credit: 0.25, cashflow: 0.25, risk: 0.20 } },
  { name: 'Max Rewards', weights: { rewards: 0.60, credit: 0.15, cashflow: 0.15, risk: 0.10 } },
  { name: 'Credit First', weights: { rewards: 0.15, credit: 0.50, cashflow: 0.20, risk: 0.15 } },
  { name: 'Cash Flow Focus', weights: { rewards: 0.20, credit: 0.15, cashflow: 0.50, risk: 0.15 } },
  { name: 'Risk Averse', weights: { rewards: 0.15, credit: 0.25, cashflow: 0.20, risk: 0.40 } },
  { name: 'Aggressive', weights: { rewards: 0.50, credit: 0.10, cashflow: 0.30, risk: 0.10 } },
];

export default function ABComparison({ baseWeights, context, user, seed }: ABComparisonProps) {
  const [showModal, setShowModal] = useState(false);
  const [configA, setConfigA] = useState<string>('current');
  const [configB, setConfigB] = useState<string>('Max Rewards');
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<{ a: ComparisonResult | null; b: ComparisonResult | null }>({ a: null, b: null });

  const getWeights = (configName: string): ScoringWeights => {
    if (configName === 'current') return baseWeights;
    return presetConfigs.find(p => p.name === configName)?.weights || baseWeights;
  };

  const runComparison = useCallback(async () => {
    setComparing(true);
    setResults({ a: null, b: null });

    const runWithWeights = async (configName: string, weights: ScoringWeights): Promise<ComparisonResult | null> => {
      const testUser = { ...user, preferenceWeights: weights };
      const engine = new STOPEngine(seed, 'turbo');

      try {
        const result = await engine.runPipeline(context, testUser, () => {});
        const activeScores = result.scoringResult.scores.filter(s => !s.excluded).sort((a, b) => b.finalScore - a.finalScore);
        return {
          configName,
          weights,
          winner: activeScores[0],
          runnerUp: activeScores[1] || null,
          allScores: result.scoringResult.scores,
        };
      } catch {
        return null;
      }
    };

    const [resultA, resultB] = await Promise.all([
      runWithWeights(configA, getWeights(configA)),
      runWithWeights(configB, getWeights(configB)),
    ]);

    setResults({ a: resultA, b: resultB });
    setComparing(false);
  }, [configA, configB, context, user, seed, baseWeights]);

  const sameWinner = results.a && results.b && results.a.winner.tokenId === results.b.winner.tokenId;
  const scoreDiff = results.a && results.b
    ? results.a.winner.finalScore - results.b.winner.finalScore
    : 0;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono"
        title="A/B weight comparison"
      >
        <GitBranch className="w-3.5 h-3.5" />
        A/B Test
      </button>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] bg-surface-50 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-accent-purple" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">A/B Weight Comparison</h3>
                    <p className="text-xs text-text-secondary">Compare how different weight configurations affect routing</p>
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
                {/* Config Selection */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Config A */}
                  <div>
                    <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Configuration A</label>
                    <select
                      value={configA}
                      onChange={(e) => setConfigA(e.target.value)}
                      disabled={comparing}
                      className="w-full px-3 py-2 bg-surface-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-purple/50"
                    >
                      <option value="current">Current Settings</option>
                      {presetConfigs.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                      {Object.entries(getWeights(configA)).map(([key, value]) => (
                        <div key={key} className="flex justify-between px-2 py-1 bg-white/5 rounded">
                          <span className="text-text-tertiary capitalize">{key}</span>
                          <span className="text-white font-mono">{(value * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Config B */}
                  <div>
                    <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Configuration B</label>
                    <select
                      value={configB}
                      onChange={(e) => setConfigB(e.target.value)}
                      disabled={comparing}
                      className="w-full px-3 py-2 bg-surface-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-purple/50"
                    >
                      <option value="current">Current Settings</option>
                      {presetConfigs.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                      {Object.entries(getWeights(configB)).map(([key, value]) => (
                        <div key={key} className="flex justify-between px-2 py-1 bg-white/5 rounded">
                          <span className="text-text-tertiary capitalize">{key}</span>
                          <span className="text-white font-mono">{(value * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Run Button */}
                <button
                  onClick={runComparison}
                  disabled={comparing || configA === configB}
                  className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-accent-purple/20 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/30 transition-all disabled:opacity-50 mb-6"
                >
                  {comparing ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Play className="w-4 h-4" />
                      </motion.div>
                      Running comparison...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-4 h-4" />
                      Compare Configurations
                    </>
                  )}
                </button>

                {/* Results */}
                {results.a && results.b && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className={`p-4 rounded-xl border ${
                      sameWinner
                        ? 'bg-accent-blue/10 border-accent-blue/20'
                        : 'bg-accent-orange/10 border-accent-orange/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        {sameWinner ? (
                          <>
                            <Equal className="w-5 h-5 text-accent-blue" />
                            <div>
                              <p className="text-sm font-medium text-white">Same Winner: {results.a.winner.tokenName}</p>
                              <p className="text-xs text-text-secondary">
                                Both configurations select the same card (score diff: {Math.abs(scoreDiff).toFixed(1)} pts)
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <ArrowLeftRight className="w-5 h-5 text-accent-orange" />
                            <div>
                              <p className="text-sm font-medium text-white">Different Winners</p>
                              <p className="text-xs text-text-secondary">
                                Config A: {results.a.winner.tokenName} vs Config B: {results.b.winner.tokenName}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Side by Side Results */}
                    <div className="grid grid-cols-2 gap-4">
                      {[results.a, results.b].map((result, idx) => (
                        <div key={idx} className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-blue/20 text-accent-blue'
                            }`}>
                              {idx === 0 ? 'A' : 'B'}
                            </span>
                            <span className="text-sm font-medium text-white">{result.configName}</span>
                          </div>

                          {/* Winner */}
                          <div className="p-3 bg-accent-green/10 border border-accent-green/20 rounded-lg mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="w-4 h-4 text-accent-green" />
                              <span className="text-sm font-medium text-white">{result.winner.tokenName}</span>
                            </div>
                            <p className="text-lg font-mono font-bold text-accent-green">{result.winner.finalScore.toFixed(1)} pts</p>
                          </div>

                          {/* Score Breakdown */}
                          <div className="space-y-1.5">
                            {result.allScores.filter(s => !s.excluded).slice(0, 4).map((score, sIdx) => (
                              <div key={score.tokenId} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                    sIdx === 0 ? 'bg-accent-green text-black' : 'bg-white/10 text-white'
                                  }`}>
                                    {sIdx + 1}
                                  </span>
                                  <span className="text-text-secondary truncate max-w-[120px]">{score.tokenName}</span>
                                </div>
                                <span className="font-mono text-white">{score.finalScore.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Weight Differences Impact */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">Weight Differences</p>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.keys(getWeights(configA)).map((key) => {
                          const weightKey = key as keyof ScoringWeights;
                          const diff = getWeights(configB)[weightKey] - getWeights(configA)[weightKey];
                          return (
                            <div key={key} className="text-center">
                              <p className="text-[10px] text-text-tertiary capitalize mb-1">{key}</p>
                              <div className={`flex items-center justify-center gap-1 ${
                                diff > 0 ? 'text-accent-green' : diff < 0 ? 'text-error-red' : 'text-text-secondary'
                              }`}>
                                {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                                <span className="text-sm font-mono">{diff > 0 ? '+' : ''}{(diff * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
