'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Zap, Play, Sliders, BarChart3, Shield, FileJson } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: typeof Zap;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: 'welcome',
    title: 'Welcome to SwipeSmart',
    description: 'This demo shows how intelligent payment routing works. We\'ll walk you through the key features.',
    icon: Zap,
    position: 'bottom',
  },
  {
    target: 'run-button',
    title: 'Run the Pipeline',
    description: 'Press the Run button (or hit Space) to execute a transaction routing decision.',
    icon: Play,
    position: 'bottom',
  },
  {
    target: 'scenarios',
    title: 'Choose a Scenario',
    description: 'Select different transaction scenarios to see how the routing changes based on context.',
    icon: Sliders,
    position: 'right',
  },
  {
    target: 'pipeline',
    title: 'Watch the Decision Flow',
    description: 'See the token scores, rule evaluations, and final selection in real-time.',
    icon: BarChart3,
    position: 'left',
  },
  {
    target: 'rules',
    title: 'Explore the Rules',
    description: 'Toggle rules on/off to see how policy changes affect routing decisions.',
    icon: Shield,
    position: 'top',
  },
  {
    target: 'export',
    title: 'Export for Analysis',
    description: 'Download the full audit trail and trace data as JSON for detailed analysis.',
    icon: FileJson,
    position: 'bottom',
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-void-light border border-neon-cyan/30 rounded-xl shadow-2xl shadow-neon-cyan/10 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-cyan/20 to-transparent p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-mono">
                        Step {currentStep + 1} of {tourSteps.length}
                      </div>
                      <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-300 leading-relaxed">{step.description}</p>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {tourSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentStep
                          ? 'bg-neon-cyan w-6'
                          : idx < currentStep
                          ? 'bg-neon-green'
                          : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-void border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Skip tour
                </button>
                <div className="flex items-center gap-2">
                  {!isFirst && (
                    <button
                      onClick={handlePrev}
                      className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-4 py-1.5 rounded bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/30 transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    {isLast ? 'Get Started' : 'Next'}
                    {!isLast && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TourTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/30 transition-all shadow-lg shadow-neon-cyan/20 flex items-center gap-2 text-sm font-mono"
    >
      <Zap className="w-4 h-4" />
      Take a Tour
    </button>
  );
}
