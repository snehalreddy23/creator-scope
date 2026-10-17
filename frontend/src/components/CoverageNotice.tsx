import React from 'react';
import { ShieldAlert, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { DataCoverage } from '../types';

interface CoverageNoticeProps {
  coverage: DataCoverage;
  retrievedAt: string;
  isCached: boolean;
  dataSource: string;
}

export const CoverageNotice: React.FC<CoverageNoticeProps> = ({
  coverage,
  retrievedAt,
  isCached,
  dataSource,
}) => {
  const formattedDate = new Date(retrievedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-bold text-slate-900">
            Sample Coverage & Methodology Limitations
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Retrieved: {formattedDate}</span>
          {isCached && (
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
              Cached (TTL active)
            </span>
          )}
        </div>
      </div>

      {/* Stats pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="text-slate-400 font-medium">Sample Size</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {coverage.posts_analyzed} Posts
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="text-slate-400 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Observed Window</span>
          </div>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {coverage.date_range_days ? `${coverage.date_range_days} Days` : 'N/A'}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="text-slate-400 font-medium">Missing Like Counts</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {coverage.missing_like_counts} Hidden
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="text-slate-400 font-medium">Data Provider</div>
          <div className="text-xs font-semibold text-indigo-700 truncate mt-1">
            {dataSource}
          </div>
        </div>
      </div>

      {/* Explicit limitation bullet points */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Compliance & Analytical Integrity Notes:
        </p>
        <ul className="text-xs text-slate-600 space-y-1">
          {coverage.limitations_notes.map((note, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
