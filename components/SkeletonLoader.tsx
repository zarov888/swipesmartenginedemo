'use client';

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type: 'card' | 'chart' | 'list' | 'banner';
}

export default function SkeletonLoader({ type }: SkeletonLoaderProps) {
  const shimmer = {
    initial: { x: '-100%' },
    animate: { x: '100%' },
    transition: { repeat: Infinity, duration: 1.5, ease: 'linear' },
  };

  if (type === 'banner') {
    return (
      <div className="bg-surface-50 rounded-xl border border-white/10 p-4 overflow-hidden relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded w-1/3" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          {...shimmer}
        />
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden relative">
        <div className="px-4 py-3 border-b border-white/5">
          <div className="h-4 bg-white/5 rounded w-1/4" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          {...shimmer}
        />
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden relative">
        <div className="px-4 py-3 border-b border-white/5">
          <div className="h-4 bg-white/5 rounded w-1/3" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-white/5 rounded w-24" />
                <div className="h-3 bg-white/5 rounded w-12" />
              </div>
              <div className="h-6 bg-white/5 rounded" style={{ width: `${90 - i * 20}%` }} />
            </div>
          ))}
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          {...shimmer}
        />
      </div>
    );
  }

  // list
  return (
    <div className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden relative">
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-white/5 rounded w-1/2" />
              <div className="h-2 bg-white/5 rounded w-1/3" />
            </div>
            <div className="h-4 bg-white/5 rounded w-12" />
          </div>
        ))}
      </div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        {...shimmer}
      />
    </div>
  );
}

export function PipelineSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonLoader type="banner" />
      <SkeletonLoader type="card" />
      <SkeletonLoader type="chart" />
      <div className="grid grid-cols-2 gap-4">
        <SkeletonLoader type="list" />
        <SkeletonLoader type="list" />
      </div>
    </div>
  );
}
