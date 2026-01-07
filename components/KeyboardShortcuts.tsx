'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  category: 'execution' | 'navigation' | 'export' | 'speed';
}

const shortcuts: Shortcut[] = [
  { key: 'Space / Enter', description: 'Run pipeline', category: 'execution' },
  { key: 'R', description: 'Replay with same seed', category: 'execution' },
  { key: 'N', description: 'Generate new seed', category: 'execution' },
  { key: '1', description: 'Normal speed', category: 'speed' },
  { key: '2', description: 'Fast speed', category: 'speed' },
  { key: '3', description: 'Turbo speed', category: 'speed' },
  { key: 'T', description: 'Export trace JSON', category: 'export' },
  { key: 'A', description: 'Export audit JSON', category: 'export' },
  { key: 'Esc', description: 'Close modals/panels', category: 'navigation' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'navigation' },
];

const categoryLabels = {
  execution: 'Execution',
  navigation: 'Navigation',
  export: 'Export',
  speed: 'Speed Control',
};

const categoryColors = {
  execution: 'accent-green',
  navigation: 'accent-blue',
  export: 'accent-purple',
  speed: 'accent-orange',
};

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

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
                  <Keyboard className="w-5 h-5 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                  <p className="text-xs text-text-secondary">Quick actions to speed up your workflow</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-text-tertiary hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full bg-${categoryColors[category as keyof typeof categoryColors]}`} />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm text-text-secondary">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.key.split(' / ').map((key, idx) => (
                            <span key={idx} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-text-tertiary text-xs mx-1">/</span>}
                              <kbd className="px-2 py-1 bg-surface-100 border border-white/10 rounded text-xs font-mono text-white">
                                {key}
                              </kbd>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 bg-black/20">
              <p className="text-[10px] text-text-tertiary text-center">
                Press <kbd className="px-1.5 py-0.5 bg-surface-100 border border-white/10 rounded text-[10px] font-mono">?</kbd> anytime to toggle this panel
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function KeyboardShortcutsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 text-text-tertiary hover:text-white transition-colors"
      title="Keyboard shortcuts (?)"
    >
      <Command className="w-4 h-4" />
    </button>
  );
}
