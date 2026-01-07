'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface SpendingData {
  category: string;
  icon: string;
  amounts: number[]; // 7 days of data
  total: number;
  trend: number; // percentage change
}

// Mock spending data - in production this would come from transaction history
const mockSpendingData: SpendingData[] = [
  { category: 'Dining', icon: '🍽️', amounts: [45, 0, 32, 78, 0, 125, 55], total: 335, trend: 12 },
  { category: 'Grocery', icon: '🛒', amounts: [0, 156, 0, 0, 89, 0, 234], total: 479, trend: -5 },
  { category: 'Gas', icon: '⛽', amounts: [52, 0, 0, 48, 0, 0, 55], total: 155, trend: 8 },
  { category: 'Shopping', icon: '🛍️', amounts: [0, 0, 299, 0, 0, 156, 0], total: 455, trend: 25 },
  { category: 'Travel', icon: '✈️', amounts: [0, 0, 0, 0, 0, 850, 0], total: 850, trend: 100 },
  { category: 'Entertainment', icon: '🎬', amounts: [15, 0, 0, 22, 35, 0, 18], total: 90, trend: -15 },
  { category: 'Subscriptions', icon: '📱', amounts: [0, 45, 0, 0, 0, 0, 0], total: 45, trend: 0 },
  { category: 'Other', icon: '📦', amounts: [0, 25, 0, 88, 0, 0, 45], total: 158, trend: 10 },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SpendingHeatmap() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const maxAmount = useMemo(() => {
    return Math.max(...mockSpendingData.flatMap(d => d.amounts));
  }, []);

  const totalSpending = useMemo(() => {
    return mockSpendingData.reduce((sum, d) => sum + d.total, 0);
  }, []);

  const getHeatColor = (amount: number): string => {
    if (amount === 0) return 'bg-white/5';
    const intensity = amount / maxAmount;
    if (intensity > 0.7) return 'bg-accent-purple';
    if (intensity > 0.4) return 'bg-accent-blue';
    if (intensity > 0.2) return 'bg-accent-teal';
    return 'bg-accent-green/50';
  };

  const selectedData = selectedCategory
    ? mockSpendingData.find(d => d.category === selectedCategory)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-accent-purple/10 via-surface-50 to-accent-blue/10 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-accent-purple" />
          <h3 className="text-sm font-semibold text-white">Spending Heatmap</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-2 py-0.5 text-[10px] rounded ${
              timeRange === 'week' ? 'bg-accent-purple/20 text-accent-purple' : 'text-text-tertiary'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-2 py-0.5 text-[10px] rounded ${
              timeRange === 'month' ? 'bg-accent-purple/20 text-accent-purple' : 'text-text-tertiary'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Summary */}
        <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase">Total This Week</p>
            <p className="text-xl font-mono font-bold text-white">${totalSpending.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-text-tertiary">Highest Day</p>
              <p className="text-sm font-mono text-accent-purple">Saturday</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-tertiary">Top Category</p>
              <p className="text-sm font-mono text-accent-purple">Travel</p>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mb-4">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="text-[10px] text-text-tertiary" />
            {days.map(day => (
              <div key={day} className="text-[10px] text-text-tertiary text-center">{day}</div>
            ))}
          </div>

          {/* Category rows */}
          {mockSpendingData.map((data, rowIdx) => (
            <motion.div
              key={data.category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIdx * 0.03 }}
              className={`grid grid-cols-8 gap-1 mb-1 cursor-pointer rounded transition-all ${
                selectedCategory === data.category ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              onClick={() => setSelectedCategory(selectedCategory === data.category ? null : data.category)}
            >
              {/* Category label */}
              <div className="flex items-center gap-1 text-[10px] text-text-secondary truncate pr-1">
                <span>{data.icon}</span>
                <span className="truncate">{data.category}</span>
              </div>

              {/* Heat cells */}
              {data.amounts.map((amount, dayIdx) => (
                <motion.div
                  key={dayIdx}
                  whileHover={{ scale: 1.1 }}
                  className={`aspect-square rounded-sm ${getHeatColor(amount)} relative group`}
                  title={`$${amount}`}
                >
                  {amount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-mono text-white font-bold">${amount}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[10px] text-text-tertiary">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5" />
            <div className="w-3 h-3 rounded-sm bg-accent-green/50" />
            <div className="w-3 h-3 rounded-sm bg-accent-teal" />
            <div className="w-3 h-3 rounded-sm bg-accent-blue" />
            <div className="w-3 h-3 rounded-sm bg-accent-purple" />
          </div>
          <span className="text-[10px] text-text-tertiary">More</span>
        </div>

        {/* Selected Category Detail */}
        {selectedData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-white/5 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedData.icon}</span>
                <span className="text-sm font-medium text-white">{selectedData.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className={`w-3 h-3 ${selectedData.trend >= 0 ? 'text-accent-green' : 'text-error-red'}`} />
                <span className={`text-xs font-mono ${selectedData.trend >= 0 ? 'text-accent-green' : 'text-error-red'}`}>
                  {selectedData.trend >= 0 ? '+' : ''}{selectedData.trend}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-text-tertiary">Weekly Total</p>
                <p className="text-sm font-mono text-white">${selectedData.total}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary">Daily Avg</p>
                <p className="text-sm font-mono text-white">${Math.round(selectedData.total / 7)}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary">Active Days</p>
                <p className="text-sm font-mono text-white">{selectedData.amounts.filter(a => a > 0).length}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
