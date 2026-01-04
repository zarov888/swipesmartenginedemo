'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StageResult, STAGE_NAMES, StageStatus } from '@/lib/types';

interface PipelinePanelProps {
  stageResults: StageResult[];
  currentStageIndex: number;
  isRunning: boolean;
}

export default function PipelinePanel({
  stageResults,
  currentStageIndex,
  isRunning,
}: PipelinePanelProps) {
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());

  const toggleStage = (index: number) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const totalDuration = stageResults.reduce((sum, s) => sum + s.durationMs, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="panel-header px-4 py-3 flex items-center justify-between border-b border-neon-cyan/20">
        <div className="flex items-center gap-2">
          <div className={`status-dot ${isRunning ? 'active' : stageResults.length > 0 ? 'success' : ''}`} />
          <span className="font-mono text-sm">Pipeline Execution</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
          <span>Stages: {stageResults.length}/{STAGE_NAMES.length}</span>
          <span>Total: {totalDuration}ms</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-void-lighter">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-cyan to-neon-green"
          initial={{ width: 0 }}
          animate={{ width: `${(stageResults.length / STAGE_NAMES.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Stages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {STAGE_NAMES.map((stageName, index) => {
          const result = stageResults.find(r => r.stageIndex === index);
          const isActive = isRunning && currentStageIndex === index;
          const isPending = !result && !isActive;
          const isExpanded = expandedStages.has(index);

          return (
            <StageCard
              key={index}
              index={index}
              name={stageName}
              result={result}
              isActive={isActive}
              isPending={isPending}
              isExpanded={isExpanded}
              onToggle={() => toggleStage(index)}
            />
          );
        })}
      </div>
    </div>
  );
}

function StageCard({
  index,
  name,
  result,
  isActive,
  isPending,
  isExpanded,
  onToggle,
}: {
  index: number;
  name: string;
  result?: StageResult;
  isActive: boolean;
  isPending: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const status = result?.status || (isActive ? 'active' : 'pending');
  const StatusIcon = getStatusIcon(status);
  const statusColor = getStatusColor(status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`stage-card rounded overflow-hidden ${status}`}
    >
      <button
        onClick={onToggle}
        disabled={isPending}
        className="w-full px-3 py-2 flex items-center gap-3 text-left"
      >
        {/* Stage number */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          isPending ? 'bg-gray-800 text-gray-600' : `bg-${statusColor}/20 text-${statusColor}`
        }`}>
          {index + 1}
        </div>

        {/* Status icon */}
        <StatusIcon className={`w-4 h-4 ${isPending ? 'text-gray-600' : `text-${statusColor}`} ${
          isActive ? 'animate-pulse' : ''
        }`} />

        {/* Stage name */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isPending ? 'text-gray-600' : 'text-gray-200'}`}>
            {name}
          </div>
          {result && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 font-mono">{result.durationMs}ms</span>
              {result.warning && (
                <span className="text-xs text-warn-amber">⚠ {result.warning.slice(0, 30)}</span>
              )}
            </div>
          )}
        </div>

        {/* Expand icon */}
        {result && (
          <div className="text-gray-500">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-gray-800/50">
              {/* Timing */}
              <div className="grid grid-cols-3 gap-2 py-2 text-xs">
                <div>
                  <span className="text-gray-500">Start:</span>
                  <span className="ml-1 font-mono text-gray-400">t+{result.startTime - (result.startTime - result.durationMs)}ms</span>
                </div>
                <div>
                  <span className="text-gray-500">End:</span>
                  <span className="ml-1 font-mono text-gray-400">t+{result.endTime - (result.startTime - result.durationMs)}ms</span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-1 font-mono text-neon-cyan">{result.durationMs}ms</span>
                </div>
              </div>

              {/* Inputs */}
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Inputs</div>
                <div className="json-viewer max-h-32 overflow-auto">
                  <JsonDisplay data={result.inputs} />
                </div>
              </div>

              {/* Outputs */}
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Outputs</div>
                <div className="json-viewer max-h-32 overflow-auto">
                  <JsonDisplay data={result.outputs} />
                </div>
              </div>

              {/* Logs */}
              {result.logs.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Logs ({result.logs.length})</div>
                  <div className="space-y-0.5 max-h-24 overflow-auto">
                    {result.logs.map((log, i) => (
                      <div key={i} className={`log-entry ${log.level}`}>
                        <span className="text-gray-500">t+{log.offsetMs}ms</span>
                        <span className="mx-1.5">|</span>
                        <span className={`uppercase text-xs ${
                          log.level === 'error' ? 'text-error-red' :
                          log.level === 'warn' ? 'text-warn-amber' :
                          log.level === 'debug' ? 'text-gray-500' : 'text-neon-cyan'
                        }`}>{log.level}</span>
                        <span className="mx-1.5">|</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getStatusIcon(status: StageStatus) {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'error': return XCircle;
    case 'warning': return AlertTriangle;
    case 'skipped': return SkipForward;
    case 'active': return Clock;
    default: return Clock;
  }
}

function getStatusColor(status: StageStatus): string {
  switch (status) {
    case 'completed': return 'neon-green';
    case 'error': return 'error-red';
    case 'warning': return 'warn-amber';
    case 'skipped': return 'gray-500';
    case 'active': return 'neon-cyan';
    default: return 'gray-600';
  }
}

function JsonDisplay({ data }: { data: unknown }) {
  const format = (value: unknown, indent = 0): React.ReactNode => {
    if (value === null) return <span className="json-null">null</span>;
    if (value === undefined) return <span className="json-null">undefined</span>;
    if (typeof value === 'boolean') return <span className="json-boolean">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="json-number">{value}</span>;
    if (typeof value === 'string') return <span className="json-string">"{value.length > 50 ? value.slice(0, 50) + '...' : value}"</span>;
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (value.length > 5) {
        return (
          <span>
            [{value.slice(0, 3).map((v, i) => (
              <span key={i}>{format(v)}{i < 2 ? ', ' : ''}</span>
            ))}... +{value.length - 3} more]
          </span>
        );
      }
      return (
        <span>
          [{value.map((v, i) => (
            <span key={i}>{format(v)}{i < value.length - 1 ? ', ' : ''}</span>
          ))}]
        </span>
      );
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      return (
        <div style={{ marginLeft: indent * 8 }}>
          {'{'}
          {entries.slice(0, 6).map(([key, val], i) => (
            <div key={key} style={{ marginLeft: 8 }}>
              <span className="json-key">{key}</span>: {format(val, indent + 1)}
              {i < Math.min(entries.length - 1, 5) ? ',' : ''}
            </div>
          ))}
          {entries.length > 6 && <div style={{ marginLeft: 8 }} className="text-gray-500">... +{entries.length - 6} more</div>}
          {'}'}
        </div>
      );
    }
    
    return String(value);
  };

  return <>{format(data)}</>;
}
