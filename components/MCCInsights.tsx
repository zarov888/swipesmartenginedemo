'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Trophy, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Token, ScoreBreakdown } from '@/lib/types';

interface MCCInsightsProps {
  tokens: Token[];
  currentMCC: string;
}

interface MCCCategory {
  code: string;
  range?: [number, number];
  name: string;
  icon: string;
  description: string;
  bestCards: { pattern: string; multiplier: string; reason: string }[];
}

const mccCategories: MCCCategory[] = [
  {
    code: '5812',
    name: 'Restaurants',
    icon: '🍽️',
    description: 'Full-service restaurants and dining establishments',
    bestCards: [
      { pattern: 'Sapphire', multiplier: '3x', reason: 'Chase dining bonus' },
      { pattern: 'Gold', multiplier: '4x', reason: 'Amex dining category' },
      { pattern: 'Savor', multiplier: '4%', reason: 'Capital One dining rewards' },
    ],
  },
  {
    code: '5814',
    name: 'Fast Food',
    icon: '🍔',
    description: 'Quick service restaurants and fast food chains',
    bestCards: [
      { pattern: 'Gold', multiplier: '4x', reason: 'Amex restaurants category' },
      { pattern: 'Freedom', multiplier: '5x', reason: 'Rotating category (when active)' },
    ],
  },
  {
    code: '5411',
    name: 'Grocery Stores',
    icon: '🛒',
    description: 'Supermarkets and grocery stores',
    bestCards: [
      { pattern: 'Blue Cash', multiplier: '6%', reason: 'Amex grocery bonus' },
      { pattern: 'Gold', multiplier: '4x', reason: 'Amex supermarkets' },
      { pattern: 'Freedom', multiplier: '5x', reason: 'Rotating category (when active)' },
    ],
  },
  {
    code: '5541',
    name: 'Gas Stations',
    icon: '⛽',
    description: 'Service stations with gas pumps',
    bestCards: [
      { pattern: 'Freedom', multiplier: '5x', reason: 'Rotating category (when active)' },
      { pattern: 'Costco', multiplier: '4%', reason: 'Citi Costco gas bonus' },
      { pattern: 'Discover', multiplier: '5%', reason: 'Rotating category' },
    ],
  },
  {
    range: [3000, 3999],
    code: '3xxx',
    name: 'Airlines',
    icon: '✈️',
    description: 'Airline purchases and travel bookings',
    bestCards: [
      { pattern: 'Venture', multiplier: '10x', reason: 'Capital One hotels/car' },
      { pattern: 'Sapphire', multiplier: '5x', reason: 'Chase travel portal' },
      { pattern: 'Platinum', multiplier: '5x', reason: 'Amex airline credit' },
    ],
  },
  {
    code: '4111',
    name: 'Transportation',
    icon: '🚇',
    description: 'Local transit, trains, and commuter services',
    bestCards: [
      { pattern: 'Sapphire', multiplier: '3x', reason: 'Chase travel category' },
      { pattern: 'Venture', multiplier: '2x', reason: 'All travel purchases' },
    ],
  },
  {
    code: '5311',
    name: 'Department Stores',
    icon: '🏬',
    description: 'Large retail department stores',
    bestCards: [
      { pattern: 'Double Cash', multiplier: '2%', reason: 'Flat rate everything' },
      { pattern: 'Freedom Unlimited', multiplier: '1.5%', reason: 'Base earning rate' },
    ],
  },
  {
    code: '5732',
    name: 'Electronics',
    icon: '💻',
    description: 'Consumer electronics and computer stores',
    bestCards: [
      { pattern: 'Freedom', multiplier: '5x', reason: 'Q4 rotating category' },
      { pattern: 'Double Cash', multiplier: '2%', reason: 'Flat rate cashback' },
    ],
  },
  {
    code: '7832',
    name: 'Entertainment',
    icon: '🎬',
    description: 'Movie theaters and entertainment venues',
    bestCards: [
      { pattern: 'Savor', multiplier: '4%', reason: 'Entertainment category' },
      { pattern: 'Gold', multiplier: '4x', reason: 'Dining/entertainment' },
    ],
  },
  {
    code: '5912',
    name: 'Pharmacies',
    icon: '💊',
    description: 'Drug stores and pharmacies',
    bestCards: [
      { pattern: 'Blue Cash', multiplier: '3%', reason: 'Amex drugstore bonus' },
      { pattern: 'Discover', multiplier: '5%', reason: 'Rotating category' },
    ],
  },
];

export default function MCCInsights({ tokens, currentMCC }: MCCInsightsProps) {
  const [showModal, setShowModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const currentCategory = useMemo(() => {
    const mccNum = parseInt(currentMCC);
    return mccCategories.find(cat => {
      if (cat.range) {
        return mccNum >= cat.range[0] && mccNum <= cat.range[1];
      }
      return cat.code === currentMCC;
    });
  }, [currentMCC]);

  const matchingCards = useMemo(() => {
    if (!currentCategory) return [];
    return tokens.filter(token => {
      const name = token.name.toLowerCase();
      return currentCategory.bestCards.some(bc =>
        name.includes(bc.pattern.toLowerCase())
      );
    }).map(token => {
      const matchedCard = currentCategory.bestCards.find(bc =>
        token.name.toLowerCase().includes(bc.pattern.toLowerCase())
      );
      return {
        token,
        multiplier: matchedCard?.multiplier || '1x',
        reason: matchedCard?.reason || 'Base earning',
      };
    });
  }, [currentCategory, tokens]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono"
        title="MCC category insights"
      >
        <Tag className="w-3.5 h-3.5" />
        MCC
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-surface-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-accent-teal" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">MCC Category Insights</h3>
                    <p className="text-xs text-text-secondary">Best cards for each merchant category</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-tertiary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current MCC Highlight */}
              {currentCategory && (
                <div className="px-5 py-4 bg-accent-teal/5 border-b border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{currentCategory.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{currentCategory.name}</h4>
                        <span className="px-1.5 py-0.5 bg-accent-teal/20 text-accent-teal text-[10px] rounded font-mono">
                          MCC {currentMCC}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{currentCategory.description}</p>
                    </div>
                  </div>

                  {matchingCards.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Your matching cards:</p>
                      <div className="flex flex-wrap gap-2">
                        {matchingCards.map(({ token, multiplier, reason }) => (
                          <div key={token.id} className="flex items-center gap-2 px-2 py-1.5 bg-white/10 rounded-lg">
                            <Trophy className="w-3 h-3 text-accent-green" />
                            <span className="text-xs text-white">{token.name}</span>
                            <span className="text-xs font-mono text-accent-green">{multiplier}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingCards.length === 0 && (
                    <div className="mt-3 p-2 bg-accent-orange/10 border border-accent-orange/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-accent-orange" />
                        <p className="text-xs text-accent-orange">
                          You don't have any bonus cards for this category
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Categories */}
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">All Categories</p>
                <div className="space-y-2">
                  {mccCategories.map((category) => {
                    const isExpanded = expandedCategory === category.code;
                    const isCurrent = category.code === currentMCC || (
                      category.range && parseInt(currentMCC) >= category.range[0] && parseInt(currentMCC) <= category.range[1]
                    );

                    return (
                      <motion.div
                        key={category.code}
                        className={`rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-accent-teal/10 border-accent-teal/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : category.code)}
                          className="w-full p-3 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{category.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{category.name}</span>
                                <span className="text-[10px] text-text-tertiary font-mono">
                                  {category.range ? `${category.range[0]}-${category.range[1]}` : category.code}
                                </span>
                              </div>
                              <p className="text-xs text-text-secondary">{category.description}</p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-text-tertiary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-text-tertiary" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-1 border-t border-white/5">
                                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Recommended Cards</p>
                                <div className="space-y-1.5">
                                  {category.bestCards.map((card, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3 text-accent-green" />
                                        <span className="text-xs text-white">{card.pattern}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-mono text-accent-green">{card.multiplier}</span>
                                        <p className="text-[9px] text-text-tertiary">{card.reason}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
