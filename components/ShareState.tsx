'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Check, Copy, Share2 } from 'lucide-react';
import { TransactionContext, ScoringWeights } from '@/lib/types';

interface ShareStateProps {
  context: TransactionContext;
  weights: ScoringWeights;
  seed: number;
  scenario: string;
}

export default function ShareState({ context, weights, seed, scenario }: ShareStateProps) {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const generateShareUrl = () => {
    const params = new URLSearchParams();
    params.set('seed', seed.toString());
    params.set('scenario', scenario);
    params.set('amount', context.amount.toString());
    params.set('merchant', context.merchant);
    params.set('category', context.category || '');
    params.set('country', context.country);
    params.set('rw', weights.rewards.toFixed(2));
    params.set('cr', weights.credit.toFixed(2));
    params.set('cf', weights.cashflow.toFixed(2));
    params.set('rs', weights.risk.toFixed(2));

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}?${params.toString()}`;
  };

  const handleCopy = async () => {
    const url = generateShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareUrl = generateShareUrl();

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono"
        title="Share configuration"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowPanel(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface-50 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Share Configuration</h3>
                    <p className="text-xs text-text-secondary">Copy this URL to share your exact setup</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-text-tertiary hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* URL Display */}
                <div className="bg-black/30 rounded-lg p-3 mb-4">
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Shareable URL</p>
                  <p className="text-xs font-mono text-text-secondary break-all">
                    {shareUrl}
                  </p>
                </div>

                {/* Encoded params */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-[10px] text-text-tertiary mb-1">Transaction</p>
                    <p className="text-sm text-white">${context.amount} at {context.merchant}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-[10px] text-text-tertiary mb-1">Seed</p>
                    <p className="text-sm font-mono text-white">{seed}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg col-span-2">
                    <p className="text-[10px] text-text-tertiary mb-1">Weights</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-accent-green">RWD: {(weights.rewards * 100).toFixed(0)}%</span>
                      <span className="text-accent-teal">CRD: {(weights.credit * 100).toFixed(0)}%</span>
                      <span className="text-accent-orange">CSH: {(weights.cashflow * 100).toFixed(0)}%</span>
                      <span className="text-accent-pink">RSK: {(weights.risk * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    copied
                      ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                      : 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30 hover:bg-accent-blue/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy URL
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook to parse URL params on load
export function useSharedState() {
  const [sharedState, setSharedState] = useState<{
    seed?: number;
    scenario?: string;
    context?: Partial<TransactionContext>;
    weights?: ScoringWeights;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return;

    const seed = params.get('seed');
    const scenario = params.get('scenario');
    const amount = params.get('amount');
    const merchant = params.get('merchant');
    const category = params.get('category');
    const country = params.get('country');
    const rw = params.get('rw');
    const cr = params.get('cr');
    const cf = params.get('cf');
    const rs = params.get('rs');

    const state: typeof sharedState = {};

    if (seed) state.seed = parseInt(seed, 10);
    if (scenario) state.scenario = scenario;

    if (amount || merchant || category || country) {
      state.context = {};
      if (amount) state.context.amount = parseFloat(amount);
      if (merchant) state.context.merchant = merchant;
      if (category) state.context.category = category;
      if (country) state.context.country = country;
    }

    if (rw && cr && cf && rs) {
      state.weights = {
        rewards: parseFloat(rw),
        credit: parseFloat(cr),
        cashflow: parseFloat(cf),
        risk: parseFloat(rs),
      };
    }

    if (Object.keys(state).length > 0) {
      setSharedState(state);
      // Clear URL params after loading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return sharedState;
}
