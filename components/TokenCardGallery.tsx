'use client';

import { motion } from 'framer-motion';
import { Check, X, Trophy, CreditCard } from 'lucide-react';
import { Token, ScoreBreakdown } from '@/lib/types';
import CardBrand from './CardBrand';

interface TokenCardGalleryProps {
  tokens: Token[];
  scores: ScoreBreakdown[];
  selectedTokenId: string;
}

function getNetworkFromToken(token: Token): 'visa' | 'mastercard' | 'amex' | 'discover' {
  const name = token.name.toLowerCase();
  if (name.includes('amex') || name.includes('american express') || name.includes('platinum') || name.includes('gold')) return 'amex';
  if (name.includes('mastercard') || name.includes('world')) return 'mastercard';
  if (name.includes('discover')) return 'discover';
  return 'visa';
}

export default function TokenCardGallery({ tokens, scores, selectedTokenId }: TokenCardGalleryProps) {
  // Sort tokens by score
  const sortedTokens = [...tokens].sort((a, b) => {
    const scoreA = scores.find(s => s.tokenId === a.id)?.finalScore || 0;
    const scoreB = scores.find(s => s.tokenId === b.id)?.finalScore || 0;
    return scoreB - scoreA;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-50 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-accent-blue" />
          <h3 className="text-sm font-semibold text-white">Your Wallet</h3>
        </div>
        <span className="text-[10px] text-text-tertiary">{tokens.length} cards</span>
      </div>

      {/* Card Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedTokens.map((token, idx) => {
          const score = scores.find(s => s.tokenId === token.id);
          const isSelected = token.id === selectedTokenId;
          const isExcluded = score?.excluded;
          const network = getNetworkFromToken(token);
          const rank = scores.filter(s => !s.excluded).findIndex(s => s.tokenId === token.id) + 1;

          return (
            <motion.div
              key={token.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative group ${isExcluded ? 'opacity-50' : ''}`}
            >
              {/* Card */}
              <div
                className={`
                  relative aspect-[1.6/1] rounded-xl overflow-hidden transition-all duration-300
                  ${isSelected
                    ? 'ring-2 ring-accent-green shadow-lg shadow-accent-green/20 scale-105'
                    : 'hover:scale-102 hover:shadow-lg'}
                  ${isExcluded ? 'grayscale' : ''}
                `}
              >
                {/* Card Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  network === 'visa' ? 'from-blue-900 via-blue-800 to-blue-950' :
                  network === 'mastercard' ? 'from-gray-900 via-gray-800 to-gray-950' :
                  network === 'amex' ? 'from-slate-700 via-slate-600 to-slate-800' :
                  'from-orange-900 via-orange-800 to-orange-950'
                }`} />

                {/* Card Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-3 left-3 w-10 h-7 rounded bg-gradient-to-br from-yellow-400 to-yellow-600" />
                  <div className="absolute top-3 right-3">
                    <CardBrand network={network} size="sm" />
                  </div>
                </div>

                {/* Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-white text-xs font-medium truncate">{token.name}</p>
                  <p className="text-white/50 text-[10px] font-mono mt-0.5">{token.dpan}</p>
                </div>

                {/* Rank Badge */}
                {!isExcluded && rank > 0 && (
                  <div className={`absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    rank === 1 ? 'bg-accent-green text-black' :
                    rank === 2 ? 'bg-white/20 text-white' :
                    'bg-black/40 text-white/60'
                  }`}>
                    {rank === 1 ? <Trophy className="w-3 h-3" /> : rank}
                  </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent-green flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-black" />
                  </motion.div>
                )}

                {/* Excluded Overlay */}
                {isExcluded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-10 h-10 rounded-full border-2 border-error-red/50 flex items-center justify-center bg-black/50">
                      <X className="w-5 h-5 text-error-red" />
                    </div>
                  </div>
                )}
              </div>

              {/* Score Badge */}
              {score && !isExcluded && (
                <div className={`mt-2 text-center ${isSelected ? 'text-accent-green' : 'text-text-secondary'}`}>
                  <span className="text-lg font-mono font-bold">{score.finalScore.toFixed(1)}</span>
                  <span className="text-[10px] text-text-tertiary ml-1">pts</span>
                </div>
              )}

              {/* Exclusion Reason */}
              {isExcluded && score?.exclusionReason && (
                <p className="mt-1 text-[9px] text-error-red text-center truncate px-1">
                  {score.exclusionReason}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-white/5 bg-black/20 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent-green flex items-center justify-center">
            <Check className="w-3 h-3 text-black" />
          </div>
          <span className="text-[10px] text-text-tertiary">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent-green/20 flex items-center justify-center">
            <Trophy className="w-3 h-3 text-accent-green" />
          </div>
          <span className="text-[10px] text-text-tertiary">Top Ranked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-error-red/20 flex items-center justify-center">
            <X className="w-3 h-3 text-error-red" />
          </div>
          <span className="text-[10px] text-text-tertiary">Excluded</span>
        </div>
      </div>
    </motion.div>
  );
}
