import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  X,
  Download,
  Trophy,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { CreatorComparisonResult } from '../types';
import { api } from '../services/api';

interface ComparePageProps {
  initialCreators?: string[];
  onSelectCreator?: (username: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  initialCreators = ['natgeo', 'techinsider'],
  onSelectCreator,
}) => {
  const [creatorsList, setCreatorsList] = useState<string[]>(initialCreators);
  const [newCreatorInput, setNewCreatorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<CreatorComparisonResult | null>(null);

  useEffect(() => {
    if (creatorsList.length > 0) {
      runComparison(creatorsList);
    }
  }, []);

  const runComparison = async (listToCompare: string[]) => {
    if (listToCompare.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareCreators(listToCompare, false);
      setComparisonResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compare creators.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCreator = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCreatorInput.trim().replace(/^@/, '');
    if (!clean) return;

    if (creatorsList.map((c) => c.toLowerCase()).includes(clean.toLowerCase())) {
      setError(`@${clean} is already in the comparison list.`);
      return;
    }

    if (creatorsList.length >= 5) {
      setError('You can compare a maximum of 5 creators at once.');
      return;
    }

    const updated = [...creatorsList, clean];
    setCreatorsList(updated);
    setNewCreatorInput('');
    runComparison(updated);
  };

  const handleRemoveCreator = (usernameToRemove: string) => {
    const updated = creatorsList.filter(
      (c) => c.toLowerCase() !== usernameToRemove.toLowerCase()
    );
    setCreatorsList(updated);
    if (updated.length > 0) {
      runComparison(updated);
    } else {
      setComparisonResult(null);
    }
  };

  const handleDownloadCsv = async () => {
    if (creatorsList.length === 0) return;
    try {
      await api.downloadComparisonCsv(creatorsList);
    } catch (err: any) {
      alert(`Could not download CSV: ${err.message}`);
    }
  };

  // Prepare chart data for comparative visual
  const chartData = comparisonResult?.comparison_table.map((row) => ({
    name: `@${row.username}`,
    engagement: row.engagement_by_followers_pct ?? 0,
    cadence: row.posting_frequency_per_week ?? 0,
    followers: row.followers ? Math.round(row.followers / 1000) : 0, // in thousands
  })) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Tag Control */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">Compare Creators</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cross-evaluate up to 5 Instagram accounts side-by-side using consistent analytical methodology.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runComparison(creatorsList)}
              disabled={loading || creatorsList.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {comparisonResult && (
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Comparison CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Creators Tags & Add Input */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {creatorsList.map((creator) => (
            <span
              key={creator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
            >
              <span>@{creator}</span>
              <button
                onClick={() => handleRemoveCreator(creator)}
                className="hover:text-indigo-950 p-0.5 rounded transition"
                title="Remove creator"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {creatorsList.length < 5 && (
            <form onSubmit={handleAddCreator} className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="Add @username..."
                value={newCreatorInput}
                onChange={(e) => setNewCreatorInput(e.target.value)}
                className="px-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium w-36"
              />
              <button
                type="submit"
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Add creator"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}

          <span className="text-[11px] text-slate-400 ml-auto">
            {creatorsList.length}/5 creators selected
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="h-64 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 text-sm animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
          <span>Calculating multi-creator metrics...</span>
        </div>
      )}

      {/* Comparison View */}
      {comparisonResult && !loading && (
        <div className="space-y-8">
          {/* Highlights Cards */}
          {comparisonResult.highlights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparisonResult.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {highlight.metric_label}
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      @{highlight.leader_username} ({highlight.value_display})
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {highlight.context}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comparison Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Creator Benchmark Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Standardized side-by-side comparison across sample posts.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold tracking-wider uppercase text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4 text-right">Followers</th>
                    <th className="py-3 px-4 text-right">Est. Engagement</th>
                    <th className="py-3 px-4 text-right">Median Likes</th>
                    <th className="py-3 px-4 text-right">Average Likes</th>
                    <th className="py-3 px-4 text-right">Average Comments</th>
                    <th className="py-3 px-4 text-right">Reel Views</th>
                    <th className="py-3 px-4 text-right">Weekly Cadence</th>
                    <th className="py-3 px-4 text-center">Top Format</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonResult.comparison_table.map((row) => (
                    <tr key={row.username} className="hover:bg-slate-50/70 transition">
                      {/* Creator */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {row.profile_pic_url ? (
                            <img
                              src={row.profile_pic_url}
                              alt={row.username}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                              {row.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>@{row.username}</span>
                              {onSelectCreator && (
                                <button
                                  onClick={() => onSelectCreator(row.username)}
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition"
                                  title="View full analysis"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {row.full_name || 'Instagram Creator'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Followers */}
                      <td className="py-4 px-4 text-right font-medium text-slate-900">
                        {row.followers ? row.followers.toLocaleString() : 'Unavailable'}
                      </td>

                      {/* Engagement */}
                      <td className="py-4 px-4 text-right font-bold text-indigo-600">
                        {row.engagement_by_followers_pct !== null && row.engagement_by_followers_pct !== undefined
                          ? `${row.engagement_by_followers_pct}%`
                          : 'Unavailable'}
                      </td>

                      {/* Median Likes */}
                      <td className="py-4 px-4 text-right text-slate-800 font-semibold">
                        {row.median_likes ? row.median_likes.toLocaleString() : 'Unavailable'}
                      </td>

                      {/* Average Likes */}
                      <td className="py-4 px-4 text-right text-slate-700">
                        {row.average_likes ? row.average_likes.toLocaleString() : 'Unavailable'}
                      </td>

                      {/* Average Comments */}
                      <td className="py-4 px-4 text-right text-slate-700">
                        {row.average_comments ? row.average_comments.toLocaleString() : 'Unavailable'}
                      </td>

                      {/* Average Reel Views */}
                      <td className="py-4 px-4 text-right text-slate-700">
                        {row.average_reel_views ? row.average_reel_views.toLocaleString() : '—'}
                      </td>

                      {/* Cadence */}
                      <td className="py-4 px-4 text-right text-slate-700">
                        {row.posting_frequency_per_week !== null && row.posting_frequency_per_week !== undefined
                          ? `${row.posting_frequency_per_week}/wk`
                          : 'Unavailable'}
                      </td>

                      {/* Top Format */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {row.top_content_type || 'Mixed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Benchmark Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-900">
                Audience vs. Estimated Engagement Rate
              </h3>
              <p className="text-xs text-slate-500">
                Comparing interaction rate efficiency against total follower volume.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#6366f1" fontSize={11} tickLine={false} label={{ value: 'Engagement (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6366f1' } }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="engagement" name="Est. Engagement Rate (%)" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Methodology Notes */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <span>Comparative Analytics Methodology:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              {comparisonResult.methodology_notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
