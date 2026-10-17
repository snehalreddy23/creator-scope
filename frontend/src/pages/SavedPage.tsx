import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Sparkles,
  Calendar,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { SavedCreator } from '../types';
import { api } from '../services/api';

interface SavedPageProps {
  onAnalyzeCreator: (username: string) => void;
}

export const SavedPage: React.FC<SavedPageProps> = ({ onAnalyzeCreator }) => {
  const [savedList, setSavedList] = useState<SavedCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSavedCreators();
      setSavedList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved creators.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (username: string) => {
    try {
      await api.removeSavedCreator(username);
      setSavedList(savedList.filter((c) => c.username !== username));
    } catch (err: any) {
      alert(`Could not remove creator: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Saved Creators</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Persisted creator portfolio for ongoing campaign evaluation and monitoring.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {savedList.length} Saved
        </span>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 p-4" />
          ))}
        </div>
      )}

      {/* Grid of Saved Creators */}
      {!loading && savedList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedList.map((creator) => (
            <div
              key={creator.username}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {creator.profile_pic_url ? (
                    <img
                      src={creator.profile_pic_url}
                      alt={creator.username}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base">
                      {creator.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {creator.full_name || `@${creator.username}`}
                    </h3>
                    <div className="text-xs text-slate-500">@{creator.username}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(creator.username)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                  title="Remove saved creator"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Stats overview */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Followers:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {creator.follower_count ? creator.follower_count.toLocaleString() : 'Unavailable'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Est. Engagement:</span>{' '}
                  <span className="font-semibold text-indigo-600">
                    {creator.engagement_rate !== null && creator.engagement_rate !== undefined
                      ? `${creator.engagement_rate}%`
                      : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Tags & notes if present */}
              {(creator.notes || creator.tags) && (
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                  {creator.tags && (
                    <div className="flex items-center gap-1.5 text-indigo-700 font-medium text-[11px]">
                      <Tag className="w-3 h-3" />
                      <span>{creator.tags}</span>
                    </div>
                  )}
                  {creator.notes && (
                    <p className="text-slate-600 italic text-[11px]">{creator.notes}</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>Saved {new Date(creator.saved_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => onAnalyzeCreator(creator.username)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View Analysis</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && savedList.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Saved Creators Yet</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              When analyzing any Instagram profile, click "Save Creator" to bookmark them here for
              future campaigns or client audits.
            </p>
          </div>
          <button
            onClick={() => onAnalyzeCreator('natgeo')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Analyze a Creator Now
          </button>
        </div>
      )}
    </div>
  );
};
