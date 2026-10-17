import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { MetricCard, MetricIntegrityType } from '../types';

interface MetricCardViewProps<T> {
  card: MetricCard<T>;
  suffix?: string;
  isPercentage?: boolean;
}

const BADGE_STYLES: Record<MetricIntegrityType, { bg: string; text: string; border: string; label: string }> = {
  observed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Observed',
  },
  calculated: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    label: 'Calculated',
  },
  estimated: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    label: 'Estimated',
  },
  unavailable: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    label: 'Unavailable',
  },
  manually_entered: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'User Provided',
  },
};

export function MetricCardView<T>({
  card,
  suffix = '',
  isPercentage = false,
}: MetricCardViewProps<T>) {
  const [showDetails, setShowDetails] = useState(false);
  const badge = BADGE_STYLES[card.category] || BADGE_STYLES.unavailable;

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return 'Unavailable';
    if (typeof val === 'number') {
      if (isPercentage) {
        return `${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
      }
      return `${val.toLocaleString()}${suffix}`;
    }
    return `${val}${suffix}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition relative flex flex-col justify-between">
      {/* Header: Label & Integrity Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {card.label}
        </span>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Main KPI Value */}
      <div className="my-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {formatValue(card.value)}
        </div>
      </div>

      {/* Footer & Methodology Toggle */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="truncate max-w-[190px]" title={card.description}>
          {card.sample_size !== null && card.sample_size !== undefined
            ? `Sample: ${card.sample_size} posts`
            : card.description}
        </span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-slate-400 hover:text-indigo-600 p-1 rounded transition"
          title="View formula & calculation methodology"
          aria-label="View methodology"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Methodology Drawer */}
      {showDetails && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 animate-fadeIn">
          <div className="flex items-start gap-2 mb-1.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="font-medium text-slate-900">{card.description}</p>
          </div>
          {card.formula && (
            <div className="mt-2 bg-white p-2 rounded border border-slate-200 font-mono text-[11px] text-slate-600 overflow-x-auto">
              <span className="text-indigo-600 font-bold">Formula: </span>
              {card.formula}
            </div>
          )}
          {card.sample_size !== null && card.sample_size !== undefined && (
            <p className="mt-2 text-slate-500 text-[11px]">
              Computed across {card.sample_size} observed records in this sample.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
