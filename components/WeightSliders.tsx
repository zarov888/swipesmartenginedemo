'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CreditCard, Wallet, Shield, RotateCcw, Sparkles } from 'lucide-react';
import { ScoringWeights } from '@/lib/types';

interface WeightSlidersProps {
  weights: ScoringWeights;
  onChange: (weights: ScoringWeights) => void;
  disabled?: boolean;
}

const PRESETS: { name: string; weights: ScoringWeights; icon: string }[] = [
  { name: 'Balanced', weights: { rewards: 0.25, credit: 0.25, cashflow: 0.25, risk: 0.25 }, icon: '⚖️' },
  { name: 'Maximize Rewards', weights: { rewards: 0.50, credit: 0.15, cashflow: 0.15, risk: 0.20 }, icon: '🎁' },
  { name: 'Protect Credit', weights: { rewards: 0.15, credit: 0.50, cashflow: 0.15, risk: 0.20 }, icon: '🛡️' },
  { name: 'Cash Conservative', weights: { rewards: 0.15, credit: 0.20, cashflow: 0.45, risk: 0.20 }, icon: '💵' },
  { name: 'Safety First', weights: { rewards: 0.10, credit: 0.25, cashflow: 0.20, risk: 0.45 }, icon: '🔒' },
];

export default function WeightSliders({ weights, onChange, disabled }: WeightSlidersProps) {
  const [localWeights, setLocalWeights] = useState(weights);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleSliderChange = (key: keyof ScoringWeights, value: number) => {
    const newWeights = { ...localWeights, [key]: value };
    // Normalize
    const total = newWeights.rewards + newWeights.credit + newWeights.cashflow + newWeights.risk;
    if (total > 0) {
      newWeights.rewards /= total;
      newWeights.credit /= total;
      newWeights.cashflow /= total;
      newWeights.risk /= total;
    }
    setLocalWeights(newWeights);
    setActivePreset(null);
    onChange(newWeights);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setLocalWeights(preset.weights);
    setActivePreset(preset.name);
    onChange(preset.weights);
  };

  const sliders = [
    { key: 'rewards' as const, label: 'Rewards', icon: TrendingUp, color: 'accent-green', gradient: 'from-accent-green/20 to-accent-green/5' },
    { key: 'credit' as const, label: 'Credit Health', icon: CreditCard, color: 'accent-teal', gradient: 'from-accent-teal/20 to-accent-teal/5' },
    { key: 'cashflow' as const, label: 'Cash Flow', icon: Wallet, color: 'accent-orange', gradient: 'from-accent-orange/20 to-accent-orange/5' },
    { key: 'risk' as const, label: 'Risk Aversion', icon: Shield, color: 'accent-pink', gradient: 'from-accent-pink/20 to-accent-pink/5' },
  ];

  return (
    <div className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-purple" />
          <h3 className="text-sm font-semibold text-white">Priority Weights</h3>
        </div>
        <button
          onClick={() => applyPreset(PRESETS[0])}
          className="text-[10px] text-text-tertiary hover:text-white flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Presets */}
      <div className="px-4 py-3 border-b border-white/5 bg-black/20">
        <p className="text-[10px] text-text-tertiary mb-2 uppercase tracking-wider">Quick Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              disabled={disabled}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                activePreset === preset.name
                  ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <span className="mr-1">{preset.icon}</span>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="p-4 space-y-4">
        {sliders.map(({ key, label, icon: Icon, color, gradient }) => (
          <div key={key} className={`p-3 rounded-lg bg-gradient-to-r ${gradient} border border-white/5`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 text-${color}`} />
                <span className="text-xs font-medium text-white">{label}</span>
              </div>
              <span className={`text-sm font-mono font-bold text-${color}`}>
                {(localWeights[key] * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localWeights[key] * 100}
              onChange={(e) => handleSliderChange(key, Number(e.target.value) / 100)}
              disabled={disabled}
              className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-black/30
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-${color}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-accent-green"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-[10px] text-text-tertiary">Adjustments update scores in real-time</span>
      </div>
    </div>
  );
}
