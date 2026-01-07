'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, CreditCard, TrendingUp, Star, Plus, ExternalLink } from 'lucide-react';
import { ScoreBreakdown, TransactionContext, Token } from '@/lib/types';

interface CardRecommendationProps {
  scores: ScoreBreakdown[];
  context: TransactionContext;
  userTokens: Token[];
}

interface CardSuggestion {
  name: string;
  network: 'visa' | 'mastercard' | 'amex' | 'discover';
  reason: string;
  expectedBoost: number;
  categories: string[];
  annualFee: number;
  signupBonus?: string;
}

// Mock card database - in real app this would come from an API
const cardDatabase: CardSuggestion[] = [
  {
    name: 'Chase Sapphire Reserve',
    network: 'visa',
    reason: 'Excellent travel rewards with 3x points on dining and travel',
    expectedBoost: 15,
    categories: ['travel', 'dining'],
    annualFee: 550,
    signupBonus: '60,000 points',
  },
  {
    name: 'Amex Gold Card',
    network: 'amex',
    reason: '4x points on restaurants and supermarkets',
    expectedBoost: 18,
    categories: ['dining', 'grocery'],
    annualFee: 250,
    signupBonus: '75,000 points',
  },
  {
    name: 'Citi Double Cash',
    network: 'mastercard',
    reason: '2% cash back on everything, no annual fee',
    expectedBoost: 8,
    categories: ['general'],
    annualFee: 0,
  },
  {
    name: 'Capital One Venture X',
    network: 'visa',
    reason: '10x on hotels, 5x on flights, excellent travel benefits',
    expectedBoost: 20,
    categories: ['travel'],
    annualFee: 395,
    signupBonus: '75,000 miles',
  },
  {
    name: 'Discover it Cash Back',
    network: 'discover',
    reason: '5% rotating categories, first year cash back match',
    expectedBoost: 12,
    categories: ['rotating'],
    annualFee: 0,
    signupBonus: 'Cash back match',
  },
  {
    name: 'Blue Cash Preferred',
    network: 'amex',
    reason: '6% at supermarkets, 6% on streaming',
    expectedBoost: 14,
    categories: ['grocery', 'streaming'],
    annualFee: 95,
    signupBonus: '$350 back',
  },
];

const mccToCategory: Record<string, string[]> = {
  '5812': ['dining'],
  '5814': ['dining'],
  '5411': ['grocery'],
  '5541': ['gas'],
  '5542': ['gas'],
  '3000-3999': ['travel'],
  '4111': ['travel'],
  '4121': ['travel'],
  '5311': ['general'],
  '5732': ['electronics'],
};

function getMccCategories(mcc: string): string[] {
  if (mccToCategory[mcc]) return mccToCategory[mcc];
  const mccNum = parseInt(mcc);
  if (mccNum >= 3000 && mccNum <= 3999) return ['travel'];
  if (mccNum >= 5800 && mccNum <= 5899) return ['dining'];
  return ['general'];
}

export default function CardRecommendation({ scores, context, userTokens }: CardRecommendationProps) {
  const recommendations = useMemo(() => {
    const currentCategories = getMccCategories(String(context.mcc));
    const userCardNames = userTokens.map(t => t.name.toLowerCase());

    // Filter out cards user already has
    const availableCards = cardDatabase.filter(card =>
      !userCardNames.some(name => name.includes(card.name.toLowerCase().split(' ')[0].toLowerCase()))
    );

    // Score cards based on relevance to current transaction
    const scoredCards = availableCards.map(card => {
      let relevanceScore = 0;

      // Check category match
      const categoryMatch = card.categories.some(cat =>
        currentCategories.includes(cat) || cat === 'general' || cat === 'rotating'
      );
      if (categoryMatch) relevanceScore += 30;

      // Consider annual fee vs expected boost
      if (card.annualFee === 0) relevanceScore += 15;
      else if (card.annualFee < 100) relevanceScore += 10;
      else if (card.annualFee < 300) relevanceScore += 5;

      // Signup bonus value
      if (card.signupBonus) relevanceScore += 10;

      // Expected boost
      relevanceScore += card.expectedBoost;

      return { ...card, relevanceScore };
    });

    // Sort by relevance and return top 3
    return scoredCards
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }, [context.mcc, userTokens]);

  const currentBestScore = scores.filter(s => !s.excluded).sort((a, b) => b.finalScore - a.finalScore)[0];

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-accent-purple/10 via-surface-50 to-accent-pink/10 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-accent-purple" />
        <h3 className="text-sm font-semibold text-white">Card Recommendations</h3>
        <span className="text-[10px] text-text-tertiary ml-auto">Based on your spending</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {recommendations.map((card, idx) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-5 rounded flex items-center justify-center text-[8px] font-bold ${
                  card.network === 'visa' ? 'bg-blue-900 text-white' :
                  card.network === 'mastercard' ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' :
                  card.network === 'amex' ? 'bg-slate-600 text-white' :
                  'bg-orange-600 text-white'
                }`}>
                  {card.network.toUpperCase().slice(0, 4)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{card.name}</p>
                  <p className="text-[10px] text-text-tertiary">
                    {card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/year`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-accent-green">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-mono">+{card.expectedBoost}</span>
                </div>
                <p className="text-[9px] text-text-tertiary">pts potential</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary mb-2">{card.reason}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {card.categories.map(cat => (
                  <span key={cat} className="px-1.5 py-0.5 bg-accent-purple/10 text-accent-purple text-[9px] rounded capitalize">
                    {cat}
                  </span>
                ))}
              </div>
              {card.signupBonus && (
                <div className="flex items-center gap-1 text-accent-orange text-[10px]">
                  <Star className="w-3 h-3" />
                  {card.signupBonus}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Projected Impact */}
        {currentBestScore && (
          <div className="mt-4 p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-accent-green" />
              <span className="text-xs font-medium text-white">With top recommendation:</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs">
                Current best: {currentBestScore.tokenName}
              </span>
              <span className="text-accent-green font-mono text-sm">
                {currentBestScore.finalScore.toFixed(1)} → {(currentBestScore.finalScore + recommendations[0].expectedBoost).toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
