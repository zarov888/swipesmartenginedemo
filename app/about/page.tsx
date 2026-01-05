'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, Shield, CreditCard, TrendingUp, DollarSign, AlertTriangle, ChevronRight, Lock, Clock, FileCheck } from 'lucide-react';

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
          <h2 className="text-3xl font-display font-bold text-white mb-2">About STOP</h2>
          <p className="text-gray-500 text-sm mb-4 font-mono">Smart Token Orchestration Protocol (formerly SW-TOP)</p>
          <p className="text-lg text-gray-300 mb-6">
            STOP is a <em className="text-neon-cyan">wallet-layer decision protocol</em> that automatically selects the best payment token at tap time, before authorization — using transaction context, user state, and a deterministic local policy.
          </p>
          <div className="p-4 rounded-lg bg-void-light border border-gray-800 mb-6">
            <p className="text-gray-400">
              Modern wallets store multiple tokens, but selection is manual. STOP turns the wallet into a decision engine: <span className="text-white">evaluate context → score eligible tokens → select one token → inject into the standard authorization flow</span>, with no required changes to payment networks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard icon={TrendingUp} title="Maximize Rewards" description="Route to cards with the best category multipliers" />
            <FeatureCard icon={Shield} title="Protect Credit" description="Avoid pushing cards over utilization thresholds" />
            <FeatureCard icon={DollarSign} title="User Objectives" description="Support user-defined goals via policy weights" />
          </div>
        </div>

        {/* What It Optimizes */}
        <Section title="What STOP Optimizes">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Reward-aware routing:</span>{' '}
                <span className="text-gray-400">Choose the token expected to maximize category rewards.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Utilization-aware constraints:</span>{' '}
                <span className="text-gray-400">Avoid decisions that push accounts past credit thresholds.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">User-objective optimization:</span>{' '}
                <span className="text-gray-400">Support user-defined goals via policy parameters (weights, constraints, overrides).</span>
              </div>
            </li>
          </ul>
        </Section>

        {/* How It Works */}
        <Section title="How It Works">
          <div className="space-y-3">
            {[
              { step: 1, title: 'Tap Event Occurs', desc: 'Wallet constructs a context vector (merchant/MCC, amount, time, location, etc.)' },
              { step: 2, title: 'Load Local Policy', desc: 'Rule set or scoring model is loaded from on-device storage.' },
              { step: 3, title: 'Evaluate Utility', desc: 'Each token is scored deterministically based on context and policy.' },
              { step: 4, title: 'Select Token', desc: 'One token is selected (argmax utility subject to constraints).' },
              { step: 5, title: 'Inject into Auth', desc: 'Selected token is injected into the normal authorization request.' },
              { step: 6, title: 'Audit Metadata', desc: 'Optional: policy version + selection logged for explanation/replay.' },
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

        {/* Key Properties */}
        <Section title="Key Properties">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PropertyCard
              icon={FileCheck}
              title="Deterministic"
              description="Identical inputs produce identical selection — fully reproducible decisions."
            />
            <PropertyCard
              icon={Shield}
              title="Auditable"
              description="Policy version + selected token can be logged for explanation and replay."
            />
            <PropertyCard
              icon={Lock}
              title="Privacy-Preserving"
              description="Decisioning happens locally; no need to send transaction context externally."
            />
            <PropertyCard
              icon={CreditCard}
              title="Compatible"
              description="No changes required to merchant terminals or network message formats."
            />
            <PropertyCard
              icon={Clock}
              title="Latency-Bounded"
              description="Must finish within tap-to-pay expectations; defaults used if unavailable."
            />
            <PropertyCard
              icon={TrendingUp}
              title="Reliable Fallbacks"
              description="Graceful degradation when context or policy is unavailable."
            />
          </div>
        </Section>

        {/* Policy Versioning */}
        <Section title="Policy Lifecycle">
          <div className="p-4 rounded-lg bg-void-light border border-gray-800">
            <p className="text-gray-400">
              Policies can be stored and edited on-device, and optionally updated via an external distribution service — but <span className="text-white">real-time selection remains local</span>, and the protocol stays deterministic with respect to on-device inputs.
            </p>
          </div>
        </Section>

        {/* Extensions */}
        <Section title="Optional Extensions">
          <p className="text-gray-500 text-sm mb-4">
            The following concepts extend the core STOP protocol and are demonstrated in this simulation:
          </p>
          <div className="space-y-4">
            <ExtensionCard
              term="DRA"
              expansion="Delegated Routing Authority"
              description="An issuer-side policy enforcement and observability layer that can standardize how routing decisions are applied and logged across transactions. Not required by the core protocol."
            />
            <ExtensionCard
              term="DRT"
              expansion="Delegated Routing Token"
              description="A parent 'route-me-first' token that resolves into a child credential dynamically per transaction. Useful for card-linked wallets with multiple underlying accounts."
            />
          </div>
        </Section>

        {/* What You're Seeing */}
        <Section title="What You're Seeing in This Demo">
          <p className="text-gray-300 mb-4">When you run a scenario, the UI shows:</p>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> The selected route and selection reason</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Rule matches, exclusions, and overrides</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Per-token score breakdown (rewards / credit / cash flow / risk)</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Stage-by-stage timing (simulated pipeline latency)</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Full audit record for replay and analysis</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> Deterministic replay via seed parameter</li>
          </ul>
        </Section>

        {/* Disclaimer */}
        <div className="mt-12 p-4 rounded bg-warn-amber/10 border border-warn-amber/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warn-amber flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-warn-amber font-semibold mb-1">Disclaimer</h4>
              <p className="text-gray-400 text-sm">
                This is a simulation for demonstration purposes. It does not process real credentials or connect to payment networks. All data and outputs are synthetic.
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

function PropertyCard({ icon: Icon, title, description }: { icon: typeof TrendingUp; title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-void-light border border-gray-800 flex items-start gap-3">
      <Icon className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-white font-semibold text-sm">{title}</h4>
        <p className="text-gray-500 text-xs">{description}</p>
      </div>
    </div>
  );
}

function ExtensionCard({ term, expansion, description }: { term: string; expansion: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-void-light border border-dashed border-gray-700">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-gray-400 font-mono font-bold">{term}</span>
        <span className="text-gray-600 text-sm">({expansion})</span>
        <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded font-mono">EXTENSION</span>
      </div>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}
