'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, Shield, CreditCard, TrendingUp, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-void grid-bg">
      {/* Header */}
      <div className="border-b border-neon-cyan/20 bg-void-light">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-neon-cyan" />
            <h1 className="font-display text-lg font-bold text-neon-cyan neon-text">SwipeSmart</h1>
          </div>
          <Link href="/" className="btn-primary px-3 py-1.5 rounded flex items-center gap-2 text-xs font-mono">
            <ArrowLeft className="w-4 h-4" /> Back to Demo
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h2 className="text-3xl font-display font-bold text-white mb-4">About SwipeSmart Engine</h2>
          <p className="text-lg text-gray-300 mb-6">
            A simulation of a wallet-layer routing protocol that decides <em className="text-neon-cyan">which credential should fund a payment</em> before authorization.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard icon={TrendingUp} title="Maximize Rewards" description="Route to cards with the best category multipliers" />
            <FeatureCard icon={Shield} title="Protect Credit" description="Avoid pushing cards over utilization thresholds" />
            <FeatureCard icon={DollarSign} title="Optimize Cash Flow" description="Balance APR costs against paycheck timing" />
          </div>
        </div>

        {/* Core Idea */}
        <Section title="Core Idea: Make the Wallet Choose Intelligently">
          <p className="text-gray-300">
            Most wallets present a static default card. STOP introduces a decision step that can optimize for rewards, credit health, cash flow, and risk — using rules that can be versioned and audited.
          </p>
        </Section>

        {/* Definitions */}
        <Section title="Key Concepts">
          <div className="space-y-4">
            <DefinitionCard
              term="STOP"
              expansion="Smart Token Orchestration Protocol"
              description="A policy-driven decision protocol that selects the optimal token for a specific transaction, using context (merchant, amount, MCC, location), user state, and risk signals."
            />
            <DefinitionCard
              term="DRA"
              expansion="Delegated Routing Authority"
              description="An issuer-side enforcement layer that applies STOP decisions consistently and records an audit trail. Think 'policy execution + observability' for routing decisions."
            />
            <DefinitionCard
              term="DRT"
              expansion="Delegated Routing Token"
              description="A special token that represents 'route me first.' It resolves into a specific child token dynamically for each transaction based on the routing strategy."
            />
          </div>
        </Section>

        {/* How It Works */}
        <Section title="How It Works">
          <div className="space-y-3">
            {[
              { step: 1, title: 'Ingest Event', desc: 'A payment intent arrives with merchant, amount, and context.' },
              { step: 2, title: 'Load Policy', desc: 'A signed, versioned policy is retrieved (cached or fetched).' },
              { step: 3, title: 'Evaluate Rules', desc: 'Hard rules can force or block tokens; soft rules boost or penalize.' },
              { step: 4, title: 'Score Candidates', desc: 'Tokens are ranked using weighted subscores (rewards, credit, cash flow, risk).' },
              { step: 5, title: 'Select Route', desc: 'The engine chooses the winning token (or applies a hard override).' },
              { step: 6, title: 'DRT Resolution', desc: 'If applicable, a routing token resolves into a specific child DPAN.' },
              { step: 7, title: 'Authorization', desc: 'Approval/decline is simulated based on risk profile.' },
              { step: 8, title: 'Audit Output', desc: 'The system emits a trace, stage timings, and full score breakdown.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4 p-3 rounded bg-void-light border border-gray-800">
                <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-mono font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{title}</h4>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* What Makes This Different */}
        <Section title="What Makes This Different">
          <ul className="space-y-3">
            {[
              { title: 'Pre-authorization decisioning', desc: 'Routing happens before authorization, not after the fact.' },
              { title: 'Policy versioning', desc: 'Decisions are reproducible, signed, and can be pinned to a specific version.' },
              { title: 'Explainability', desc: 'Every decision includes scoring and rule-level reasoning.' },
              { title: 'Issuer-grade controls', desc: 'Hard constraints can veto or force behavior, with override tracking.' },
              { title: 'DRT model', desc: 'One "parent" token can dynamically resolve into child credentials.' },
            ].map(({ title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-medium">{title}:</span>{' '}
                  <span className="text-gray-400">{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* What You're Seeing */}
        <Section title="What You're Seeing in the Demo">
          <p className="text-gray-300 mb-4">When you run a scenario, the UI shows:</p>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> The selected route + reason</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Rule matches and exclusions</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Per-token score breakdown (rewards / credit / cash flow / risk)</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Stage-by-stage timing (simulated pipeline latency)</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Full audit record for replay and analysis</li>
          </ul>
        </Section>

        {/* Disclaimer */}
        <div className="mt-12 p-4 rounded bg-warn-amber/10 border border-warn-amber/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warn-amber flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-warn-amber font-semibold mb-1">Disclaimer</h4>
              <p className="text-gray-400 text-sm">
                This is a product simulation for demonstration purposes. It does not process real card credentials, does not connect to payment networks, and all data shown is synthetic.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <Link href="/" className="text-neon-cyan hover:underline font-mono text-sm">
            ← Return to SwipeSmart Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-neon-cyan rounded-full" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof TrendingUp; title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-void-light border border-gray-800 hover:border-neon-cyan/30 transition-colors">
      <Icon className="w-8 h-8 text-neon-cyan mb-3" />
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function DefinitionCard({ term, expansion, description }: { term: string; expansion: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-void-light border border-gray-800">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-neon-green font-mono font-bold text-lg">{term}</span>
        <span className="text-gray-500 text-sm">({expansion})</span>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
