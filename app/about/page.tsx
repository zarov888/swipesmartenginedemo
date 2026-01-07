'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, Shield, CreditCard, TrendingUp, DollarSign, AlertTriangle, ChevronRight, Lock, Clock, FileCheck, Layers, Key, Server, Eye } from 'lucide-react';

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
          <h2 className="text-3xl font-display font-bold text-white mb-2">About SwipeSmart</h2>
          <p className="text-gray-500 text-sm mb-4 font-mono">Tapd + STOP + DRA + DRT</p>
          <p className="text-lg text-gray-300 mb-6">
            SwipeSmart is a <em className="text-neon-cyan">wallet-layer routing stack</em> that decides which credential funds a payment at tap time, before authorization. The core protocol is STOP (Smart Token Optimization Protocol): it selects the best token using transaction context, user state, and a deterministic policy — then continues through the normal authorization flow.
          </p>

          {/* Alignment Note */}
          <div className="p-4 rounded-lg bg-void-light border border-gray-800 mb-6">
            <p className="text-gray-400 text-sm">
              <span className="text-white font-medium">Note:</span> In the whitepaper, STOP appears under an earlier name (SW-TOP: Smart Wallet Token Optimization Protocol). This page reflects the current naming, with the same underlying mechanics.
            </p>
          </div>

          <p className="text-gray-300 mb-6">
            This demo shows how STOP can power a full product stack: a consumer card experience (Tapd), a wallet decision protocol (STOP), and optional issuer-side controls (DRA) plus dynamic "route-me-first" tokens (DRT).
          </p>
        </div>

        {/* The Stack */}
        <Section title="The Stack (How the Pieces Fit)">
          <div className="space-y-4">
            <StackCard
              number={1}
              term="Tapd Card"
              subtitle="Consumer Product Layer"
              description="A consumer-facing card experience that benefits from STOP routing. A single 'Tapd default' in the wallet can still intelligently choose the best underlying credential for each purchase — without the user manually switching cards."
            />
            <StackCard
              number={2}
              term="STOP"
              subtitle="Core Protocol"
              description="Smart Token Optimization Protocol. A wallet-native decision step that: context → evaluate eligible tokens → score/choose → inject selected token → authorize. No network message-format changes required; the routing happens before authorization."
            />
            <StackCard
              number={3}
              term="DRA"
              subtitle="Issuer / Program Control Layer"
              description="Delegated Routing Authority is an issuer-side enforcement + logging layer that can apply routing constraints consistently and produce an audit trail. It's not required for STOP, but it's how an issuer/program operator can standardize policy execution and observability across transactions."
            />
            <StackCard
              number={4}
              term="DRT"
              subtitle="Routing Token"
              description="Delegated Routing Token is a parent 'route-me-first' token that resolves into a child credential per transaction. It allows a single wallet token to represent multiple underlying DPANs/credentials while still selecting dynamically."
            />
          </div>
        </Section>

        {/* What STOP Optimizes */}
        <Section title="What STOP Optimizes">
          <p className="text-gray-400 mb-4">
            STOP is designed to optimize token choice using a policy that can encode goals like:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Rewards:</span>{' '}
                <span className="text-gray-400">choose the token expected to maximize category rewards</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Credit health:</span>{' '}
                <span className="text-gray-400">avoid pushing utilization past thresholds</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Cash flow:</span>{' '}
                <span className="text-gray-400">trade off APR cost vs timing (e.g., statement cycles / liquidity preference)</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Risk:</span>{' '}
                <span className="text-gray-400">avoid tokens with higher decline probability or risk flags</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">User objectives:</span>{' '}
                <span className="text-gray-400">tune weights/constraints to match user preferences</span>
              </div>
            </li>
          </ul>
        </Section>

        {/* How the System Works */}
        <Section title="How the System Works">
          <div className="space-y-3">
            {[
              { step: 1, title: 'Tap event occurs', desc: 'Wallet constructs a context vector (merchant/MCC, amount, time, location, device signals).' },
              { step: 2, title: 'Policy is loaded', desc: 'A deterministic policy is available locally (and may be periodically updated/distributed).' },
              { step: 3, title: 'Eligibility + constraints', desc: 'Rules/constraints remove tokens that shouldn\'t be used (hard blocks, thresholds, overrides).' },
              { step: 4, title: 'Token scoring', desc: 'Remaining tokens are scored based on weighted objectives (rewards / utilization / cash flow / risk).' },
              { step: 5, title: 'Route selection (pre-authorization)', desc: 'The best token is selected (or a hard override applies).' },
              { step: 6, title: 'DRT resolution (if used)', desc: 'If the selected token is a routing token, it resolves to a child credential/DPAN.' },
              { step: 7, title: 'Standard authorization flow', desc: 'The chosen token proceeds through the normal issuer authorization path.' },
              { step: 8, title: 'Audit + explainability', desc: 'The decision can be logged with policy version + rationale for replay/analysis.' },
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

        {/* Policy + Determinism */}
        <Section title="Policy + Determinism">
          <div className="p-4 rounded-lg bg-void-light border border-gray-800 mb-4">
            <p className="text-gray-300">
              A STOP decision is intended to be <span className="text-white font-medium">deterministic</span>: identical inputs produce identical outputs. That enables:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PropertyCard
              icon={FileCheck}
              title="Reproducibility"
              description="Replay a decision later"
            />
            <PropertyCard
              icon={Eye}
              title="Explainability"
              description="Understand why a token won"
            />
            <PropertyCard
              icon={Shield}
              title="Operational safety"
              description="Bounded behavior under tap-time latency constraints"
            />
          </div>
        </Section>

        {/* Deployment Modes */}
        <Section title="Deployment Modes">
          <p className="text-gray-400 mb-4">
            STOP can run in different modes depending on latency, privacy, and system design:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PropertyCard
              icon={Lock}
              title="On-device"
              description="Policy evaluation happens locally for minimal latency + privacy"
            />
            <PropertyCard
              icon={Server}
              title="Cloud-assisted"
              description="Decisioning can be computed remotely when acceptable"
            />
            <PropertyCard
              icon={Layers}
              title="Hybrid"
              description="Local default with cloud enrichment or periodic policy updates"
            />
          </div>
          <div className="p-3 rounded-lg bg-void-light border border-gray-800">
            <p className="text-gray-500 text-sm">
              (Regardless of mode, the "selection step" is still a pre-authorization decision.)
            </p>
          </div>
        </Section>

        {/* What Makes This Different */}
        <Section title="What Makes This Different">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Pre-authorization routing:</span>{' '}
                <span className="text-gray-400">selection happens before auth, not after</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Wallet-layer control:</span>{' '}
                <span className="text-gray-400">decisions happen where token choice actually occurs</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Network-compatible:</span>{' '}
                <span className="text-gray-400">no merchant terminal or message-format changes required</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Policy-driven + reproducible:</span>{' '}
                <span className="text-gray-400">versionable, explainable decisions</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Optional issuer-grade enforcement:</span>{' '}
                <span className="text-gray-400">DRA can enforce constraints + produce auditability</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Optional routing-token model:</span>{' '}
                <span className="text-gray-400">DRT enables dynamic child-credential resolution</span>
              </div>
            </li>
          </ul>
        </Section>

        {/* What You're Seeing */}
        <Section title="What You're Seeing in the Demo">
          <p className="text-gray-300 mb-4">When you run a scenario, the UI shows:</p>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> selected route + reason</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> matched rules, exclusions, and overrides</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> per-token score breakdown (rewards / credit / cash flow / risk)</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> stage-by-stage timing (simulated)</li>
            <li className="flex items-center gap-2"><span className="text-neon-cyan">•</span> audit record for replay and analysis</li>
          </ul>
        </Section>

        {/* Disclaimer */}
        <div className="mt-12 p-4 rounded bg-warn-amber/10 border border-warn-amber/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warn-amber flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-warn-amber font-semibold mb-1">Disclaimer</h4>
              <p className="text-gray-400 text-sm">
                This is a simulation for demonstration purposes. It does not process real card credentials, does not connect to payment networks, and all data shown is synthetic.
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

function StackCard({ number, term, subtitle, description }: { number: number; term: string; subtitle: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-void-light border border-gray-800">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-mono font-bold text-sm flex-shrink-0">
          {number}
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-white font-semibold">{term}</span>
            <span className="text-gray-500 text-sm">({subtitle})</span>
          </div>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
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
