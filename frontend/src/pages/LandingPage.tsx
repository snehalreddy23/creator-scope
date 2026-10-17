import React, { useState } from 'react';
import {
  Compass,
  Search,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Download,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface LandingPageProps {
  onAnalyze: (input: string) => void;
  onExploreCompare: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onAnalyze,
  onExploreCompare,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onAnalyze(inputVal.trim());
    }
  };

  const sampleHandles = [
    { name: '@natgeo', desc: 'Wildlife & Nature (Mega)' },
    { name: '@techinsider', desc: 'Tech & AI (Publication)' },
    { name: '@fitcoach_alex', desc: 'Fitness & Mobility (Mid-tier)' },
    { name: '@culinary_wanderer', desc: 'Food & Travel (Micro)' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Professional Instagram Creator Analytics SaaS</span>
        </div>

        {/* Headline & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Make smarter creator decisions.
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Evaluate influencer partnerships with reproducible analytics, verified interaction rates,
          and transparent data methodology. No fabricated vanity metrics.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl border border-slate-300 shadow-lg shadow-slate-200/50"
        >
          <div className="flex items-center gap-3 w-full pl-3 pr-2">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Enter Instagram username (e.g. natgeo) or URL..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md shadow-indigo-200 shrink-0"
          >
            <span>Analyze</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Sample Presets */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span>Try popular creators:</span>
          {sampleHandles.map((handle) => (
            <button
              key={handle.name}
              onClick={() => onAnalyze(handle.name)}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition font-medium shadow-2xs"
            >
              {handle.name}
            </button>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Influencer Marketing Teams & Brands
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Everything agencies and brand managers need to evaluate creator partnerships objectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Median & Average Metrics
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Viral posts distort simple averages. CreatorScope calculates both median and mean
              engagement so you see true typical performance.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Side-by-Side Comparison
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compare up to 5 creators simultaneously. Benchmarks highlight who has highest audience
              interaction versus raw vanity follower counts.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              100% Metric Integrity
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every card shows whether data is Observed, Calculated, or Estimated. We never fabricate
              private metrics like reach or impressions.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Data Disclosure Banner */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Commercial SaaS Data Policy</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Transparent, Legitimate Public Data
            </h3>
            <p className="text-xs text-indigo-200 max-w-lg leading-relaxed">
              CreatorScope connects to verified public data providers (such as GramScraper) or
              explicitly labeled sample datasets. We respect platform terms and never guess private
              Insights.
            </p>
          </div>
          <button
            onClick={onExploreCompare}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 transition shrink-0"
          >
            Compare Creators Now
          </button>
        </div>
      </section>
    </div>
  );
};
