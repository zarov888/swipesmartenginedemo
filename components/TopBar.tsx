'use client';

import { Play, Pause, SkipForward, RefreshCw, Repeat, Download, FileJson, Zap, Gauge, Info } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SelectionMethod } from '@/lib/types';
import type { SpeedMode } from '@/lib/stopCore';

interface TopBarProps {
  correlationId: string;
  seed: number;
  policyVersion: string;
  policySignature: string;
  policyCacheHit: boolean;
  isPinned: boolean;
  simulatedLatency: number;
  actualLatency: number;
  authResult: string;
  authProbability: number;
  selectedRoute: string;
  selectionMethod: SelectionMethod | null;
  isRunning: boolean;
  isPaused: boolean;
  speedMode: SpeedMode;
  onSpeedModeChange: (mode: SpeedMode) => void;
  onRun: () => void;
  onStep: () => void;
  onPause: () => void;
  onReplay: () => void;
  onNewSeed: () => void;
  onExportTrace: () => void;
  onExportAudit: () => void;
}

export default function TopBar({
  correlationId, seed, policyVersion, policySignature, policyCacheHit, isPinned,
  simulatedLatency, actualLatency, authResult, authProbability, selectedRoute, selectionMethod,
  isRunning, isPaused, speedMode, onSpeedModeChange, onRun, onStep, onPause, onReplay, onNewSeed, onExportTrace, onExportAudit,
}: TopBarProps) {
  const speedModes: SpeedMode[] = ['normal', 'fast', 'turbo'];
  const speedLabels: Record<SpeedMode, string> = { normal: '1x', fast: '4x', turbo: 'MAX' };
  const speedColors: Record<SpeedMode, string> = {
    normal: 'text-gray-400',
    fast: 'text-neon-cyan',
    turbo: 'text-neon-green'
  };
  const selectionLabel = selectionMethod
    ? selectionMethod.type === 'FORCED'
      ? `FORCED by ${selectionMethod.ruleLabel}`
      : 'AUTO optimizer'
    : '—';

  return (
    <div className="h-auto min-h-[64px] bg-void-light border-b border-neon-cyan/20 px-4 py-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Title */}
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-neon-cyan" />
          <div>
            <h1 className="font-display text-lg font-bold text-neon-cyan neon-text">SwipeSmart</h1>
            <span className="text-[10px] text-gray-500 font-mono">Intelligent payment routing engine with deterministic replay</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button onClick={onRun} disabled={isRunning && !isPaused} className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <Play className="w-3.5 h-3.5" /> Run
          </button>
          <button onClick={onStep} disabled={isRunning && !isPaused} className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <SkipForward className="w-3.5 h-3.5" /> Step
          </button>
          <button onClick={onPause} disabled={!isRunning} className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <Pause className="w-3.5 h-3.5" /> {isPaused ? 'Resume' : 'Pause'}
          </button>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <button onClick={onReplay} className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <Repeat className="w-3.5 h-3.5" /> Replay
          </button>
          <button onClick={onNewSeed} className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5" /> New Seed
          </button>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          {/* Speed Mode Toggle */}
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-void border border-gray-700">
            <Gauge className={`w-3.5 h-3.5 ${speedColors[speedMode]}`} />
            {speedModes.map((mode) => (
              <button
                key={mode}
                onClick={() => onSpeedModeChange(mode)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  speedMode === mode
                    ? mode === 'turbo'
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                      : mode === 'fast'
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                      : 'bg-gray-700 text-white border border-gray-600'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {speedLabels[mode]}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <button onClick={onExportTrace} className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <Download className="w-3.5 h-3.5" /> Trace
          </button>
          <button onClick={onExportAudit} className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <FileJson className="w-3.5 h-3.5" /> Audit
          </button>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <Link href="/about" className="btn-primary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono">
            <Info className="w-3.5 h-3.5" /> About
          </Link>
        </div>
      </div>

      {/* Telemetry Chips Row */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <Chip label="correlation_id" value={correlationId.slice(0, 8) || '—'} />
        <Chip label="seed" value={seed.toString()} />
        <Chip label="policy" value={`v${policyVersion}`} variant={isPinned ? 'warning' : 'default'} />
        <Chip label="cache" value={policyCacheHit ? 'HIT' : 'MISS'} variant={policyCacheHit ? 'success' : 'default'} />
        <Chip label="sig" value={policySignature || '—'} mono />
        {isPinned && <Chip label="pinned" value="✓" variant="warning" />}
        <Chip label="actual" value={`${actualLatency.toFixed(0)}ms`} variant={actualLatency > 100 ? 'warning' : 'success'} />
        <Chip label="simulated" value={`${simulatedLatency}ms`} variant={simulatedLatency > 400 ? 'warning' : 'default'} />
        <Chip label="auth" value={authResult || '—'} variant={authResult === 'APPROVED' ? 'success' : authResult === 'DECLINED' ? 'error' : 'default'} />
        <Chip label="P(decline)" value={`${(authProbability * 100).toFixed(1)}%`} variant={authProbability > 0.3 ? 'warning' : 'default'} />
        <Chip label="route" value={selectedRoute.slice(0, 15) || '—'} variant="success" />
        <Chip label="method" value={selectionLabel} variant={selectionMethod?.type === 'FORCED' ? 'warning' : 'default'} />
      </div>
    </div>
  );
}

function Chip({ label, value, variant = 'default', mono = false }: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'error'; mono?: boolean }) {
  const colors = {
    default: 'border-neon-cyan/30 text-neon-cyan',
    success: 'border-neon-green/30 text-neon-green bg-neon-green/5',
    warning: 'border-warn-amber/30 text-warn-amber bg-warn-amber/5',
    error: 'border-error-red/30 text-error-red bg-error-red/5',
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${colors[variant]}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <span className="text-gray-500">{label}:</span>
      <span className={`font-semibold ${mono ? 'tracking-tight' : ''}`}>{value}</span>
    </motion.div>
  );
}
