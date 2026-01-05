'use client';

interface CardBrandProps {
  network: 'visa' | 'mastercard' | 'amex' | 'discover';
  size?: 'sm' | 'md' | 'lg';
}

export default function CardBrand({ network, size = 'sm' }: CardBrandProps) {
  const sizes = {
    sm: 'w-8 h-5',
    md: 'w-12 h-7',
    lg: 'w-16 h-10',
  };

  const sizeClass = sizes[size];

  switch (network) {
    case 'visa':
      return (
        <div className={`${sizeClass} rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center`}>
          <span className="text-white font-bold italic text-[10px] tracking-tight">VISA</span>
        </div>
      );
    case 'mastercard':
      return (
        <div className={`${sizeClass} rounded bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute w-4 h-4 rounded-full bg-red-500 opacity-90 -left-0.5" />
          <div className="absolute w-4 h-4 rounded-full bg-yellow-500 opacity-90 left-1.5" />
        </div>
      );
    case 'amex':
      return (
        <div className={`${sizeClass} rounded bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center`}>
          <span className="text-white font-bold text-[8px] tracking-tight">AMEX</span>
        </div>
      );
    case 'discover':
      return (
        <div className={`${sizeClass} rounded bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center`}>
          <span className="text-white font-bold text-[7px] tracking-tight">DISCOVER</span>
        </div>
      );
    default:
      return (
        <div className={`${sizeClass} rounded bg-gray-700 flex items-center justify-center`}>
          <span className="text-gray-400 text-[8px]">CARD</span>
        </div>
      );
  }
}

export function CardVisual({
  network,
  name,
  dpan,
  isSelected = false,
  isExcluded = false,
}: {
  network: 'visa' | 'mastercard' | 'amex' | 'discover';
  name: string;
  dpan: string;
  isSelected?: boolean;
  isExcluded?: boolean;
}) {
  const networkGradients: Record<string, string> = {
    visa: 'from-blue-900 via-blue-800 to-blue-900',
    mastercard: 'from-gray-900 via-gray-800 to-gray-900',
    amex: 'from-cyan-900 via-cyan-800 to-cyan-900',
    discover: 'from-orange-900 via-orange-800 to-orange-900',
  };

  const networkAccents: Record<string, string> = {
    visa: 'border-blue-500/30',
    mastercard: 'border-red-500/30',
    amex: 'border-cyan-500/30',
    discover: 'border-orange-500/30',
  };

  return (
    <div
      className={`
        relative w-full aspect-[1.6/1] rounded-lg overflow-hidden
        bg-gradient-to-br ${networkGradients[network]}
        border ${isSelected ? 'border-neon-green ring-2 ring-neon-green/30' : isExcluded ? 'border-error-red/50 opacity-50' : networkAccents[network]}
        transition-all duration-300
        ${isSelected ? 'scale-105 shadow-lg shadow-neon-green/20' : ''}
        ${isExcluded ? 'grayscale' : ''}
      `}
    >
      {/* Card pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-2 w-8 h-6 rounded bg-white/20" />
        <div className="absolute top-2 right-2">
          <CardBrand network={network} size="sm" />
        </div>
      </div>

      {/* Card content */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="text-white text-xs font-medium truncate">{name}</div>
        <div className="text-white/60 text-[10px] font-mono">{dpan}</div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-neon-green flex items-center justify-center">
          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Excluded indicator */}
      {isExcluded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-error-red/50 flex items-center justify-center bg-black/50">
            <svg className="w-6 h-6 text-error-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
