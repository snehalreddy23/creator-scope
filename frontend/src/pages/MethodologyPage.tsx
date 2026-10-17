import React from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Methodology & Metric Integrity Guide
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          CreatorScope strictly adheres to data transparency and mathematical rigor. We document
          our exact calculation rules and explicitly identify what public data can and cannot provide.
        </p>
      </div>

      {/* 1. Integrity Categories */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>The Five Data Integrity Classifications</span>
        </h2>
        <p className="text-xs text-slate-600">
          Every number rendered in CreatorScope is categorized into one of five integrity tiers:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              1. Observed
            </span>
            <p className="text-xs text-slate-700 font-medium pt-1">
              Directly returned by provider endpoints (e.g. current followers, visible likes, visible comments).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
              2. Calculated
            </span>
            <p className="text-xs text-slate-700 font-medium pt-1">
              Derived purely from observed values using documented formulas (e.g. arithmetic mean, median, video interactions-to-views ratio).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              3. Estimated
            </span>
            <p className="text-xs text-slate-700 font-medium pt-1">
              Derived using approximations, such as calculating historical post engagement using the current follower count denominator.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
              4. Unavailable
            </span>
            <p className="text-xs text-slate-700 font-medium pt-1">
              Explicitly marked when not returned or cannot be reliably computed. We never substitute placeholder zeros for missing data.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Mathematical Formulas */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Core Analytics Formulas</span>
        </h2>

        {/* Formula 1: Engagement by Followers */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Estimated Engagement by Followers (%)
          </h3>
          <p className="text-xs text-slate-600">
            Estimates how actively a creator's audience interacts with their content:
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
            Engagement Rate = (Total Sample Interactions / (Posts Analyzed × Current Followers)) × 100
          </div>
          <p className="text-[11px] text-amber-700">
            * Labeled "Estimated" because public endpoints only return current followers, not historical followers at the exact time older posts were published.
          </p>
        </div>

        {/* Formula 2: Median vs Mean Likes */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Average Likes vs. Median Likes
          </h3>
          <p className="text-xs text-slate-600">
            Viral posts can inflate the arithmetic mean by 500%+. CreatorScope computes both:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              Mean = Sum(likes) / Count(posts)
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              Median = Middle value of sorted likes
            </div>
          </div>
        </div>

        {/* Formula 3: Interactions to Views Ratio */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Interactions per View (%) [Reels & Video]
          </h3>
          <p className="text-xs text-slate-600">
            Measures viewer engagement efficiency on video content without depending on follower count:
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
            Interactions per View = (Total Video Likes + Comments / Total Observed Video Views) × 100
          </div>
        </div>
      </section>

      {/* 3. Private Data Limits */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Boundaries of Public Instagram Data</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Public profile data does not grant access to private Meta account Insights. Many platforms
          guess or fabricate these values. CreatorScope refuses to deceive users.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
            <span className="font-semibold text-rose-300">Unavailable from Public APIs:</span>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px] pt-1">
              <li>Unique Accounts Reached</li>
              <li>Story Views & Exits</li>
              <li>Post Saves & Direct Shares</li>
              <li>Audience Demographics & Locations</li>
              <li>Historical follower counts</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
            <span className="font-semibold text-emerald-300">Legitimately Available:</span>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px] pt-1">
              <li>Public Follower & Following count</li>
              <li>Verified status & Category</li>
              <li>Public likes & comments per post</li>
              <li>Public Reel play counts</li>
              <li>Publication timestamps & content types</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
