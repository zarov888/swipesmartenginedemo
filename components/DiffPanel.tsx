'use client';

import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { DiffReport } from '@/lib/types';

interface DiffPanelProps {
  diff: DiffReport | null;
  onClose: () => void;
}

export default function DiffPanel({ diff, onClose }: DiffPanelProps) {
  if (!diff) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[600px] bg-void-light border border-neon-orange/30 rounded-lg shadow-2xl z-50"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-orange animate-pulse" />
          <span className="font-mono text-sm text-neon-orange">Route Changed</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Selection change */}
        <div className="flex items-center justify-center gap-4">
          <div className="px-3 py-2 bg-error-red/10 border border-error-red/30 rounded">
            <span className="text-xs text-gray-500 block">Previous</span>
            <span className="font-mono text-sm text-error-red">{diff.previousSelection || 'none'}</span>
          </div>
          <ArrowRight className="w-5 h-5 text-neon-orange" />
          <div className="px-3 py-2 bg-neon-green/10 border border-neon-green/30 rounded">
            <span className="text-xs text-gray-500 block">New</span>
            <span className="font-mono text-sm text-neon-green">{diff.newSelection}</span>
          </div>
        </div>

        {/* Change reason */}
        <div className="text-center">
          <span className="text-xs text-gray-500">Changed at: </span>
          <span className="text-xs font-mono text-neon-cyan">{diff.changedAtStage}</span>
          <p className="text-sm text-gray-400 mt-1">{diff.reason}</p>
        </div>

        {/* Score deltas */}
        {diff.scoreDeltas.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">Score Changes</div>
            <div className="grid gap-1">
              {diff.scoreDeltas.slice(0, 5).map(delta => (
                <div key={delta.tokenId} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-gray-400 w-32 truncate">{delta.tokenId}</span>
                  <span className="text-gray-500">{delta.previousScore.toFixed(1)}</span>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-400">{delta.newScore.toFixed(1)}</span>
                  <span className={`flex items-center gap-0.5 ${
                    delta.delta > 0 ? 'text-neon-green' : delta.delta < 0 ? 'text-error-red' : 'text-gray-500'
                  }`}>
                    {delta.delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {delta.delta > 0 ? '+' : ''}{delta.delta.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
