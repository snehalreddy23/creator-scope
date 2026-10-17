import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { InstagramPost } from '../types';

interface AnalyticsChartsProps {
  posts: InstagramPost[];
  contentDistribution: Record<string, number>;
}

const PIE_COLORS: Record<string, string> = {
  image: '#6366f1', // indigo
  reel: '#ec4899', // pink
  carousel: '#0ea5e9', // sky
  video: '#f59e0b', // amber
  unknown: '#94a3b8', // slate
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  posts,
  contentDistribution,
}) => {
  // 1. Process posts for interaction trend chart (ordered chronologically)
  const sortedPosts = [...posts]
    .filter((p) => p.published_at || p.timestamp)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .slice(-15); // Last 15 posts

  const interactionTrendData = sortedPosts.map((p, idx) => {
    let dateLabel = `Post #${idx + 1}`;
    if (p.published_at) {
      const d = new Date(p.published_at);
      dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
    }
    return {
      name: dateLabel,
      likes: p.like_count ?? 0,
      comments: p.comment_count ?? 0,
      views: p.view_count ?? 0,
      type: p.media_type,
    };
  });

  // 2. Process video/reel views
  const videoPosts = posts
    .filter((p) => p.view_count && p.view_count > 0)
    .slice(-10)
    .map((p, idx) => ({
      name: p.shortcode || `Reel #${idx + 1}`,
      views: p.view_count,
      likes: p.like_count ?? 0,
    }));

  // 3. Process content distribution for pie chart
  const pieData = Object.entries(contentDistribution).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    key: type.toLowerCase(),
    value: count,
  }));

  const totalContentCount = Object.values(contentDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Interaction Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Interactions Over Time (Likes & Comments)
            </h3>
            <p className="text-xs text-slate-500">
              Chronological engagement across recent sample posts.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {interactionTrendData.length} Posts Sampled
          </span>
        </div>

        {interactionTrendData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={interactionTrendData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val: any) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val: any) => [val.toLocaleString(), '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="likes" name="Likes" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Line type="monotone" dataKey="comments" name="Comments" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-slate-400">
            Insufficient post interaction history to display timeline chart.
          </div>
        )}
      </div>

      {/* Grid: Reel Views & Content Type Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reel / Video Views Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reel & Video Play Counts
                </h3>
                <p className="text-xs text-slate-500">
                  Public views observed for recent video and Reel posts.
                </p>
              </div>
            </div>

            {videoPosts.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={videoPosts} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val: any) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [val.toLocaleString(), 'Views']}
                    />
                    <Bar dataKey="views" name="Public Views" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                <p className="text-sm font-medium text-slate-600">No public Reel views available</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  This creator either has not published Reels recently, or the provider did not return view counts for these media objects.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Content Type Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Content-Type Mix
                </h3>
                <p className="text-xs text-slate-500">
                  Distribution of photos, carousels, reels, and videos.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {totalContentCount} Total Sampled
              </span>
            </div>

            {pieData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-around h-60 gap-4">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={`cell-${entry.key}`}
                            fill={PIE_COLORS[entry.key] || '#94a3b8'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `${val} posts (${Math.round((val / totalContentCount) * 100)}%)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  {pieData.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[item.key] || '#94a3b8' }}
                      />
                      <span className="font-medium text-slate-700">{item.name}:</span>
                      <span className="font-bold text-slate-900">{item.value}</span>
                      <span className="text-slate-400">
                        ({Math.round((item.value / totalContentCount) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                No content distribution data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
