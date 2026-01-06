'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { ShadowOptimization } from '@/lib/types';

interface ShadowWinnerBannerProps {
  shadow: ShadowOptimization;
}

export default function ShadowWinnerBanner({ shadow }: ShadowWinnerBannerProps) {
  const scoreDiff = shadow.wouldHaveScore - shadow.actualScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-gradient-to-r from-accent-orange/10 via-accent-orange/5 to-transparent border border-accent-orange/30 rounded-xl overflow-hidden"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-accent-orange/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-accent-orange" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-accent-orange uppercase tracking-wider">
              Rule Override Active
            </span>
            <Zap className="w-3 h-3 text-accent-orange" />
          </div>

          <p className="text-sm text-white mb-3">
            The optimizer would have selected <strong className="text-accent-green">{shadow.wouldHaveSelectedName}</strong> but
            a hard rule enforced <strong className="text-accent-blue">{shadow.actualSelectedName}</strong> instead.
          </p>

          {/* Comparison */}
          <div className="flex items-center gap-4 p-3 bg-black/20 rounded-lg">
            {/* Would have selected */}
            <div className="flex-1">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Optimizer Choice</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-green" />
                <span className="text-sm font-medium text-white">{shadow.wouldHaveSelectedName}</span>
              </div>
              <p className="text-lg font-mono font-bold text-accent-green mt-1">
                {shadow.wouldHaveScore.toFixed(1)} pts
              </p>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <ArrowRight className="w-5 h-5 text-accent-orange" />
              <span className="text-[10px] text-accent-orange font-mono mt-1">
                {scoreDiff > 0 ? `-${scoreDiff.toFixed(1)}` : `+${Math.abs(scoreDiff).toFixed(1)}`}
              </span>
            </div>

            {/* Actually selected */}
            <div className="flex-1 text-right">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Rule Selection</p>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-medium text-white">{shadow.actualSelectedName}</span>
                <Zap className="w-4 h-4 text-accent-orange" />
              </div>
              <p className="text-lg font-mono font-bold text-accent-blue mt-1">
                {shadow.actualScore.toFixed(1)} pts
              </p>
            </div>
          </div>

          {/* Reason */}
          <p className="text-[11px] text-text-secondary mt-2 italic">
            {shadow.reason}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
