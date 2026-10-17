import React from 'react';
import { X, Printer, Compass, ShieldCheck } from 'lucide-react';
import { CreatorAnalysisResult } from '../types';

interface ReportModalProps {
  result: CreatorAnalysisResult;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ result, onClose }) => {
  const { profile, analytics, retrieved_at, data_source } = result;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Modal Action Header (hidden in print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Creator Executive Brief
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-8 space-y-6">
          {/* Header branding */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">CreatorScope</h1>
                <p className="text-xs text-slate-500">Audit & Analytics Report</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Generated: {new Date(retrieved_at).toLocaleDateString()}</div>
              <div className="font-medium text-slate-700">{data_source}</div>
            </div>
          </div>

          {/* Profile Summary Card */}
          <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {profile.profile_pic_url ? (
              <img
                src={profile.profile_pic_url}
                alt={profile.username}
                className="w-16 h-16 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xl">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {profile.full_name || `@${profile.username}`}
                </h2>
                <span className="text-xs text-slate-500">@{profile.username}</span>
                {profile.is_verified && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">{profile.biography || 'No bio text'}</p>
              <div className="text-xs text-indigo-600 font-medium">
                {profile.profile_url}
              </div>
            </div>
          </div>

          {/* Metrics Matrix Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Analytical Metrics Overview
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500">Followers</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {profile.follower_count?.toLocaleString() || 'Unavailable'}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-1">Observed</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500">Est. Engagement</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {analytics.engagement_by_followers.value !== null && analytics.engagement_by_followers.value !== undefined
                    ? `${analytics.engagement_by_followers.value}%`
                    : 'Unavailable'}
                </div>
                <div className="text-[10px] text-amber-600 font-medium mt-1">Estimated</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500">Median Likes</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {analytics.median_likes.value?.toLocaleString() || 'Unavailable'}
                </div>
                <div className="text-[10px] text-sky-600 font-medium mt-1">Calculated</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500">Average Likes</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {analytics.average_likes.value?.toLocaleString() || 'Unavailable'}
                </div>
                <div className="text-[10px] text-sky-600 font-medium mt-1">Calculated</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500">Average Comments</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {analytics.average_comments.value?.toLocaleString() || 'Unavailable'}
                </div>
                <div className="text-[10px] text-sky-600 font-medium mt-1">Calculated</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500">Weekly Cadence</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {analytics.posting_frequency_per_week.value !== null && analytics.posting_frequency_per_week.value !== undefined
                    ? `${analytics.posting_frequency_per_week.value} posts/wk`
                    : 'Unavailable'}
                </div>
                <div className="text-[10px] text-sky-600 font-medium mt-1">Calculated</div>
              </div>
            </div>
          </div>

          {/* Top Posts Section */}
          {analytics.top_posts_by_likes.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Top Performing Posts (By Likes)
              </h3>
              <div className="space-y-2">
                {analytics.top_posts_by_likes.slice(0, 3).map((post, idx) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100"
                  >
                    <div className="flex items-center gap-2 max-w-md truncate">
                      <span className="font-bold text-slate-400">#{idx + 1}</span>
                      <span className="capitalize font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                        {post.media_type}
                      </span>
                      <span className="text-slate-800 truncate">{post.caption || 'No caption'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="font-bold text-slate-900">
                        {post.like_count?.toLocaleString()} likes
                      </span>
                      <span className="text-slate-500">
                        {post.comment_count?.toLocaleString()} comments
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification & Ethics Stamp */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Metrics computed by CreatorScope analytics engine. No private data accessed.</span>
            </div>
            <div>Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
