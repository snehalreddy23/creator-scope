import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Film,
  Layers,
  Video,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ContentType, InstagramPost } from '../types';

interface PostTableProps {
  posts: InstagramPost[];
  creatorUsername: string;
}

type SortField = 'date' | 'likes' | 'comments' | 'views' | 'engagement';
type SortOrder = 'asc' | 'desc';

export const PostTable: React.FC<PostTableProps> = ({ posts }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter posts
  const filteredPosts = useMemo(() => {
    if (filterType === 'all') return posts;
    return posts.filter((p) => p.media_type.toLowerCase() === filterType.toLowerCase());
  }, [posts, filterType]);

  // Sort posts
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      switch (sortField) {
        case 'date':
          valA = a.timestamp || 0;
          valB = b.timestamp || 0;
          break;
        case 'likes':
          valA = a.like_count ?? -1;
          valB = b.like_count ?? -1;
          break;
        case 'comments':
          valA = a.comment_count ?? -1;
          valB = b.comment_count ?? -1;
          break;
        case 'views':
          valA = a.view_count ?? -1;
          valB = b.view_count ?? -1;
          break;
        case 'engagement':
          valA = a.engagement_by_followers_pct ?? -1;
          valB = b.engagement_by_followers_pct ?? -1;
          break;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [filteredPosts, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / pageSize));
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-indigo-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-indigo-600" />
    );
  };

  const renderTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'reel':
        return <Film className="w-3.5 h-3.5 text-pink-500" />;
      case 'carousel':
        return <Layers className="w-3.5 h-3.5 text-sky-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Control Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Analyzed Posts ({posts.length})
          </h3>
          <p className="text-xs text-slate-500">
            Individual post metrics, publication dates, and calculated engagement rates.
          </p>
        </div>

        {/* Content Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Type:</span>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Content</option>
            <option value="reel">Reels Only</option>
            <option value="image">Photos Only</option>
            <option value="carousel">Carousels Only</option>
            <option value="video">Videos Only</option>
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
              <th className="py-3 px-4">Type</th>
              <th
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                onClick={() => toggleSort('date')}
              >
                Date {renderSortIcon('date')}
              </th>
              <th className="py-3 px-4 min-w-[200px]">Caption</th>
              <th
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition text-right"
                onClick={() => toggleSort('likes')}
              >
                Likes {renderSortIcon('likes')}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition text-right"
                onClick={() => toggleSort('comments')}
              >
                Comments {renderSortIcon('comments')}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition text-right"
                onClick={() => toggleSort('views')}
              >
                Views {renderSortIcon('views')}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition text-right"
                onClick={() => toggleSort('engagement')}
              >
                Engagement {renderSortIcon('engagement')}
              </th>
              <th className="py-3 px-4 text-center">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {paginatedPosts.length > 0 ? (
              paginatedPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/60 transition">
                  {/* Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 capitalize text-[11px]">
                      {renderTypeIcon(post.media_type)}
                      {post.media_type}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                    {post.published_at ? (
                      new Date(post.published_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    ) : (
                      <span className="text-slate-400">Unavailable</span>
                    )}
                  </td>

                  {/* Caption */}
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={post.caption || ''}>
                    {post.caption || <span className="text-slate-400 italic">No caption provided</span>}
                  </td>

                  {/* Likes */}
                  <td className="py-3 px-4 text-right font-medium text-slate-900">
                    {post.like_count !== null && post.like_count !== undefined ? (
                      post.like_count.toLocaleString()
                    ) : (
                      <span className="text-slate-400">Hidden</span>
                    )}
                  </td>

                  {/* Comments */}
                  <td className="py-3 px-4 text-right text-slate-700">
                    {post.comment_count !== null && post.comment_count !== undefined ? (
                      post.comment_count.toLocaleString()
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Views */}
                  <td className="py-3 px-4 text-right text-slate-700">
                    {post.view_count !== null && post.view_count !== undefined ? (
                      <span className="font-medium text-pink-600">{post.view_count.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Calculated Engagement */}
                  <td className="py-3 px-4 text-right">
                    {post.engagement_by_followers_pct !== null && post.engagement_by_followers_pct !== undefined ? (
                      <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {post.engagement_by_followers_pct}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Permalink Link */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {post.permalink ? (
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-slate-400 hover:text-indigo-600 p-1 rounded transition"
                        title="Open on Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No posts match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {sortedPosts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedPosts.length)} of {sortedPosts.length} posts
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
