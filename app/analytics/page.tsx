'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, CreditCard, TrendingUp, Activity, Bug, Sparkles, Calendar } from 'lucide-react';
import TokenCardGallery from '@/components/TokenCardGallery';
import RewardsTracker from '@/components/RewardsTracker';
import CardRecommendation from '@/components/CardRecommendation';
import CreditImpactSimulator from '@/components/CreditImpactSimulator';
import SpendingHeatmap from '@/components/SpendingHeatmap';
import PerformanceProfiler from '@/components/PerformanceProfiler';
import RuleDebugger from '@/components/RuleDebugger';
import { sampleUser, getDefaultContext } from '@/lib/mockData';
import { Token, TransactionContext, RuleEvaluationResult, StageResult } from '@/lib/types';

export default function AnalyticsPage() {
  const [context] = useState<TransactionContext>(getDefaultContext());
  const tokens: Token[] = [...sampleUser.tokens, ...sampleUser.drtTokens];
  const selectedTokenId = tokens[0]?.id || '';

  // Sample data for demonstration
  const createSubscore = (value: number) => ({
    raw: value,
    normalized: value / 100,
    weight: 0.25,
    weighted: value * 0.25,
    factors: [],
  });

  const sampleScores = tokens.map((token, idx) => {
    const rewards = 70 + Math.random() * 30;
    const credit = 60 + Math.random() * 40;
    const cashflow = 50 + Math.random() * 50;
    const risk = 80 + Math.random() * 20;
    const finalScore = 65 + Math.random() * 35;

    return {
      tokenId: token.id,
      tokenName: token.name,
      subscores: {
        rewards: createSubscore(rewards),
        credit: createSubscore(credit),
        cashflow: createSubscore(cashflow),
        risk: createSubscore(risk),
      },
      bonuses: [],
      penalties: [],
      totalBonuses: 0,
      totalPenalties: 0,
      baseScore: finalScore,
      finalScore,
      ranking: idx + 1,
      excluded: false,
    };
  });

  const sampleRuleEvaluations: RuleEvaluationResult[] = [
    {
      ruleId: 'rule_1',
      ruleLabel: 'High Value Transaction Check',
      ruleType: 'HARD',
      matched: true,
      reason: 'Transaction amount $150 exceeds threshold',
      action: 'FLAG_REVIEW',
    },
    {
      ruleId: 'rule_2',
      ruleLabel: 'Category Rewards Boost',
      ruleType: 'SOFT',
      matched: true,
      reason: 'Dining category matches card bonus',
      action: 'BOOST_SCORE',
    },
    {
      ruleId: 'rule_3',
      ruleLabel: 'Utilization Guard',
      ruleType: 'HARD',
      matched: false,
      reason: 'Current utilization 25% below threshold',
    },
  ];

  const createStageResult = (name: string, index: number, duration: number, actual: number): StageResult => ({
    stageName: name,
    stageIndex: index,
    status: 'completed',
    startTime: Date.now() - 1000,
    endTime: Date.now(),
    startOffset: index * 50,
    endOffset: index * 50 + duration,
    durationMs: duration,
    actualDurationMs: actual,
    inputs: {},
    outputs: {},
    logs: [],
    errors: [],
  });

  const sampleStageResults: StageResult[] = [
    createStageResult('Context Build', 0, 12, 2),
    createStageResult('Policy Load', 1, 25, 3),
    createStageResult('Rule Evaluation', 2, 45, 5),
    createStageResult('Candidate Filtering', 3, 18, 2),
    createStageResult('Optimization Scoring', 4, 65, 8),
    createStageResult('Route Selection', 5, 8, 1),
    createStageResult('Authorization Gateway', 6, 120, 15),
  ];

  return (
    <div className="min-h-screen bg-void grid-bg">
      {/* Header */}
      <div className="border-b border-neon-cyan/20 bg-void-light sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-neon-cyan" />
            <h1 className="font-display text-lg font-bold text-neon-cyan neon-text">SwipeSmart</h1>
            <span className="text-gray-500 text-sm font-mono">/ Analytics</span>
          </div>
          <Link href="/" className="btn-primary px-3 py-1.5 rounded flex items-center gap-2 text-xs font-mono">
            <ArrowLeft className="w-4 h-4" /> Back to Demo
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Wallet Analytics</h2>
          <p className="text-gray-400 text-sm">
            Deep insights into your payment credentials, spending patterns, and optimization opportunities.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={CreditCard} label="Active Cards" value={tokens.length.toString()} color="cyan" />
          <StatCard icon={TrendingUp} label="Avg Rewards" value="3.2%" color="green" />
          <StatCard icon={Activity} label="Transactions" value="47" color="purple" />
          <StatCard icon={Calendar} label="This Month" value="$2,340" color="blue" />
        </div>

        {/* Main Grid */}
        <div className="space-y-8">
          {/* Wallet & Rewards Row */}
          <Section title="Wallet Overview" icon={CreditCard}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TokenCardGallery
                tokens={tokens}
                scores={sampleScores}
                selectedTokenId={selectedTokenId}
              />
              <RewardsTracker
                scores={sampleScores}
                selectedTokenId={selectedTokenId}
                context={context}
                transactionCount={47}
              />
            </div>
          </Section>

          {/* Recommendations */}
          <Section title="Smart Recommendations" icon={Sparkles}>
            <CardRecommendation
              scores={sampleScores}
              context={context}
              userTokens={tokens}
            />
          </Section>

          {/* Credit & Spending Row */}
          <Section title="Credit & Spending Analysis" icon={TrendingUp}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <CreditImpactSimulator
                tokens={tokens}
                selectedTokenId={selectedTokenId}
                context={context}
              />
              <SpendingHeatmap />
            </div>
          </Section>

          {/* Performance & Debugging Row */}
          <Section title="Engine Performance" icon={Activity}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PerformanceProfiler
                stageResults={sampleStageResults}
                isRunning={false}
              />
              <RuleDebugger
                evaluations={sampleRuleEvaluations}
                context={context}
                tokens={tokens}
              />
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Run transactions in the main demo to see real-time analytics data.
          </p>
          <Link href="/" className="text-neon-cyan hover:underline font-mono text-sm">
            Go to SwipeSmart Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof CreditCard; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-neon-cyan" />
        <h3 className="text-lg font-display font-semibold text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof CreditCard; label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    cyan: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20',
    green: 'text-neon-green bg-neon-green/10 border-neon-green/20',
    purple: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20',
    blue: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} bg-void-light`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-mono font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</p>
    </div>
  );
}
