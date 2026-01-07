'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { StageResult } from '@/lib/types';

interface PerformanceProfilerProps {
  stageResults: StageResult[];
  isRunning: boolean;
}

interface StageMetrics {
  name: string;
  duration: number;
  actualDuration: number;
  percentage: number;
  status: 'fast' | 'normal' | 'slow';
}

export default function PerformanceProfiler({ stageResults, isRunning }: PerformanceProfilerProps) {
  const metrics = useMemo((): StageMetrics[] => {
    if (stageResults.length === 0) return [];

    const totalDuration = stageResults.reduce((sum, s) => sum + s.durationMs, 0);

    return stageResults.map(stage => {
      const percentage = (stage.durationMs / totalDuration) * 100;
      let status: 'fast' | 'normal' | 'slow' = 'normal';

      // Determine status based on typical expected durations
      if (stage.durationMs < 20) status = 'fast';
      else if (stage.durationMs > 100) status = 'slow';

      return {
        name: stage.stageName,
        duration: stage.durationMs,
        actualDuration: stage.actualDurationMs || 0,
        percentage,
        status,
      };
    });
  }, [stageResults]);

  const totalSimulated = stageResults.reduce((sum, s) => sum + s.durationMs, 0);
  const totalActual = stageResults.reduce((sum, s) => sum + (s.actualDurationMs || 0), 0);
  const slowestStage = [...metrics].sort((a, b) => b.duration - a.duration)[0];
  const avgDuration = metrics.length > 0 ? totalSimulated / metrics.length : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fast': return 'text-accent-green bg-accent-green';
      case 'slow': return 'text-accent-orange bg-accent-orange';
      default: return 'text-accent-blue bg-accent-blue';
    }
  };

  if (stageResults.length === 0 && !isRunning) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-accent-orange/10 via-surface-50 to-accent-pink/10 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-orange" />
          <h3 className="text-sm font-semibold text-white">Performance Profiler</h3>
        </div>
        {isRunning && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-1 text-accent-orange"
          >
            <div className="w-2 h-2 rounded-full bg-accent-orange" />
            <span className="text-[10px]">Profiling...</span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-2 bg-white/5 rounded-lg text-center">
            <Clock className="w-4 h-4 text-accent-blue mx-auto mb-1" />
            <p className="text-lg font-mono font-bold text-white">{totalSimulated}</p>
            <p className="text-[9px] text-text-tertiary">Total (sim) ms</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg text-center">
            <Zap className="w-4 h-4 text-accent-green mx-auto mb-1" />
            <p className="text-lg font-mono font-bold text-white">{totalActual}</p>
            <p className="text-[9px] text-text-tertiary">Total (actual) ms</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg text-center">
            <Activity className="w-4 h-4 text-accent-purple mx-auto mb-1" />
            <p className="text-lg font-mono font-bold text-white">{avgDuration.toFixed(0)}</p>
            <p className="text-[9px] text-text-tertiary">Avg Stage ms</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg text-center">
            <AlertTriangle className="w-4 h-4 text-accent-orange mx-auto mb-1" />
            <p className="text-sm font-mono font-bold text-white truncate">{slowestStage?.name || '-'}</p>
            <p className="text-[9px] text-text-tertiary">Slowest Stage</p>
          </div>
        </div>

        {/* Flame Graph Style Visualization */}
        <div className="mb-4">
          <p className="text-[10px] text-text-tertiary uppercase mb-2">Execution Timeline</p>
          <div className="h-8 bg-black/30 rounded-lg overflow-hidden flex">
            {metrics.map((stage, idx) => (
              <motion.div
                key={stage.name}
                initial={{ width: 0 }}
                animate={{ width: `${stage.percentage}%` }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={`h-full ${getStatusColor(stage.status).split(' ')[1]}/60 border-r border-black/20 flex items-center justify-center group relative cursor-pointer hover:brightness-110`}
                title={`${stage.name}: ${stage.duration}ms`}
              >
                {stage.percentage > 10 && (
                  <span className="text-[9px] text-white font-mono truncate px-1">
                    {stage.name.split(' ')[0]}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-surface-100 border border-white/20 rounded px-2 py-1 text-[10px] whitespace-nowrap">
                    <p className="text-white font-medium">{stage.name}</p>
                    <p className="text-text-tertiary">{stage.duration}ms ({stage.percentage.toFixed(1)}%)</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2">
          <p className="text-[10px] text-text-tertiary uppercase">Stage Breakdown</p>
          {metrics.map((stage, idx) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
            >
              {/* Status indicator */}
              <div className={`w-2 h-2 rounded-full ${getStatusColor(stage.status).split(' ')[1]}`} />

              {/* Stage name */}
              <span className="text-xs text-text-secondary flex-1 truncate">{stage.name}</span>

              {/* Bar */}
              <div className="w-24 h-2 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.percentage}%` }}
                  className={`h-full ${getStatusColor(stage.status).split(' ')[1]}/80 rounded-full`}
                />
              </div>

              {/* Duration */}
              <span className={`text-xs font-mono w-12 text-right ${getStatusColor(stage.status).split(' ')[0]}`}>
                {stage.duration}ms
              </span>

              {/* Status icon */}
              {stage.status === 'fast' && <CheckCircle className="w-3 h-3 text-accent-green" />}
              {stage.status === 'slow' && <AlertTriangle className="w-3 h-3 text-accent-orange" />}
            </motion.div>
          ))}
        </div>

        {/* Performance Tips */}
        {slowestStage && slowestStage.status === 'slow' && (
          <div className="mt-4 p-3 bg-accent-orange/10 border border-accent-orange/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-accent-orange" />
              <span className="text-xs font-medium text-accent-orange">Performance Insight</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              {slowestStage.name} took {slowestStage.duration}ms ({slowestStage.percentage.toFixed(1)}% of total).
              Consider optimizing this stage for better overall performance.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
