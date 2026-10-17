import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  Download,
  Bookmark,
  Printer,
  RefreshCw,
  AlertCircle,
  Check,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { CreatorAnalysisResult } from '../types';
import { api } from '../services/api';
import { MetricCardView } from '../components/MetricCardView';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { PostTable } from '../components/PostTable';
import { CoverageNotice } from '../components/CoverageNotice';
import { ReportModal } from '../components/ReportModal';

interface AnalyzePageProps {
  initialUsername?: string;
  onNavigateToCompare?: (username: string) => void;
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  initialUsername = '',
  onNavigateToCompare,
}) => {
  const [searchInput, setSearchInput] = useState(initialUsername || 'natgeo');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatorAnalysisResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Auto-run if initialUsername is provided on mount
  React.useEffect(() => {
    if (initialUsername) {
      handleAnalyze(initialUsername);
    } else if (!result) {
      handleAnalyze('natgeo');
    }
  }, [initialUsername]);

  const handleAnalyze = async (queryToRun?: string) => {
    const target = queryToRun || searchInput;
    if (!target.trim()) return;

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const data = await api.analyzeCreator(target.trim(), forceRefresh);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze creator.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await api.saveCreator(result.profile.username);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Could not save creator: ${err.message}`);
    }
  };

  const samplePresets = ['natgeo', 'techinsider', 'fitcoach_alex', 'culinary_wanderer'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search & Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Instagram username (e.g. natgeo) or full URL..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none px-2">
              <input
                type="checkbox"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Bypass Cache</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
            </button>
          </div>
        </form>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span className="font-medium">Quick examples:</span>
          {samplePresets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setSearchInput(preset);
                handleAnalyze(preset);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition text-[11px] font-medium"
            >
              @{preset}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 p-4" />
            ))}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && !loading && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Analysis Could Not Complete</h4>
            <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Profile & Analytics View */}
      {result && !loading && (
        <div className="space-y-8">
          {/* Mock Notice Banner if in mock mode */}
          {result.is_mock && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Sample data notice:</strong> Operating with verified sample dataset. Live
                  Instagram data requires configured GramScraper credentials.
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold bg-amber-200/60 px-2 py-0.5 rounded text-amber-800">
                Mock Mode
              </span>
            </div>
          )}

          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              {result.profile.profile_pic_url ? (
                <img
                  src={result.profile.profile_pic_url}
                  alt={result.profile.username}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl shrink-0">
                  {result.profile.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {result.profile.full_name || `@${result.profile.username}`}
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    @{result.profile.username}
                  </span>
                  {result.profile.is_verified && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                      Verified
                    </span>
                  )}
                  {result.profile.category && (
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {result.profile.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {result.profile.biography || 'No biography text available.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <a
                    href={result.profile.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <span>instagram.com/{result.profile.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {result.profile.external_url && (
                    <a
                      href={result.profile.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                    >
                      <span className="truncate max-w-[200px]">{result.profile.external_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleSave}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  savedSuccess
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{savedSuccess ? 'Saved' : 'Save Creator'}</span>
              </button>

              <a
                href={api.getPostsCsvUrl(result.profile.username)}
                download
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>

              <button
                onClick={() => setShowReport(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Executive Brief</span>
              </button>

              {onNavigateToCompare && (
                <button
                  onClick={() => onNavigateToCompare(result.profile.username)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Compare</span>
                </button>
              )}
            </div>
          </div>

          {/* Section: KPI Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Audience & Engagement Metrics
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {result.analytics.posts_analyzed.value} Posts in Analytical Sample
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCardView card={result.analytics.followers} />
              <MetricCardView
                card={result.analytics.engagement_by_followers}
                isPercentage={true}
              />
              <MetricCardView card={result.analytics.median_likes} />
              <MetricCardView card={result.analytics.average_likes} />

              <MetricCardView card={result.analytics.average_comments} />
              <MetricCardView card={result.analytics.average_reel_views} />
              <MetricCardView
                card={result.analytics.engagement_by_views}
                isPercentage={true}
              />
              <MetricCardView
                card={result.analytics.posting_frequency_per_week}
                suffix=" posts/wk"
              />
            </div>
          </div>

          {/* Section: Visualizations */}
          <AnalyticsCharts
            posts={result.posts}
            contentDistribution={result.analytics.content_distribution}
          />

          {/* Section: Detailed Post Table */}
          <PostTable posts={result.posts} creatorUsername={result.profile.username} />

          {/* Section: Limitations and Coverage Notice */}
          <CoverageNotice
            coverage={result.analytics.coverage}
            retrievedAt={result.retrieved_at}
            isCached={result.is_cached}
            dataSource={result.data_source}
          />

          {/* Modal: Printable Executive Brief */}
          {showReport && (
            <ReportModal result={result} onClose={() => setShowReport(false)} />
          )}
        </div>
      )}
    </div>
  );
};
