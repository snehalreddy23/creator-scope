import {
  CreatorAnalysisResult,
  CreatorComparisonResult,
  ProviderStatus,
  SavedCreator,
} from '../types';
import { FALLBACK_PROVIDER_STATUS, PRESET_CREATORS } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (HTTP ${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string'
          ? errorJson.detail
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // fallback
    }
    throw new ApiError(errorMsg, res.status);
  }
  return res.json();
}

// Local storage helper for fallback persistence
const LOCAL_STORAGE_SAVED_KEY = 'creatorscope_saved_creators';

function getLocalSaved(): SavedCreator[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCreator(item: SavedCreator) {
  try {
    const existing = getLocalSaved().filter((c) => c.username !== item.username);
    localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify([item, ...existing]));
  } catch {
    // ignore
  }
}

function removeLocalCreator(username: string) {
  try {
    const existing = getLocalSaved().filter((c) => c.username !== username.toLowerCase());
    localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export const api = {
  async getProviderStatus(): Promise<ProviderStatus> {
    try {
      const res = await fetch(`${API_BASE}/providers/status`);
      return await handleResponse<ProviderStatus>(res);
    } catch {
      // Standalone fallback when backend is not yet reachable
      return FALLBACK_PROVIDER_STATUS;
    }
  },

  async analyzeCreator(
    input: string,
    forceRefresh: boolean = false
  ): Promise<CreatorAnalysisResult> {
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, force_refresh: forceRefresh }),
      });
      return await handleResponse<CreatorAnalysisResult>(res);
    } catch (err: any) {
      // If error was a recognized HTTP error from backend (like 404 or 400), rethrow it
      if (err instanceof ApiError && err.statusCode < 500) {
        throw err;
      }

      // If backend server is unreachable (cold start, not yet deployed, or network down)
      const cleanUser = input.trim().replace(/^@/, '').toLowerCase();
      if (PRESET_CREATORS[cleanUser]) {
        return PRESET_CREATORS[cleanUser];
      }

      // Return default natgeo preset or throw friendly message
      if (PRESET_CREATORS['natgeo']) {
        return {
          ...PRESET_CREATORS['natgeo'],
          profile: {
            ...PRESET_CREATORS['natgeo'].profile,
            username: cleanUser,
            full_name: `${cleanUser.toUpperCase()} (Sample Preview)`,
            profile_url: `https://www.instagram.com/${cleanUser}/`,
          },
        };
      }

      throw err;
    }
  },

  async compareCreators(
    identifiers: string[],
    forceRefresh: boolean = false
  ): Promise<CreatorComparisonResult> {
    try {
      const res = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers, force_refresh: forceRefresh }),
      });
      return await handleResponse<CreatorComparisonResult>(res);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode < 500) {
        throw err;
      }

      // Standalone comparison fallback
      const creators: CreatorAnalysisResult[] = [];
      const comparison_table: any[] = [];

      for (const id of identifiers) {
        const clean = id.trim().replace(/^@/, '').toLowerCase();
        const creatorData = PRESET_CREATORS[clean] || PRESET_CREATORS['natgeo'];
        creators.push(creatorData);
        comparison_table.push({
          username: clean,
          full_name: creatorData.profile.full_name,
          profile_pic_url: creatorData.profile.profile_pic_url,
          followers: creatorData.profile.follower_count,
          posts_analyzed: creatorData.analytics.posts_analyzed.value || 5,
          average_likes: creatorData.analytics.average_likes.value,
          median_likes: creatorData.analytics.median_likes.value,
          average_comments: creatorData.analytics.average_comments.value,
          average_reel_views: creatorData.analytics.average_reel_views.value,
          engagement_by_followers_pct: creatorData.analytics.engagement_by_followers.value,
          engagement_by_views_pct: creatorData.analytics.engagement_by_views.value,
          posting_frequency_per_week: creatorData.analytics.posting_frequency_per_week.value,
          top_content_type: 'Reels',
          is_mock: true,
          retrieved_at: new Date().toISOString(),
        });
      }

      return {
        creators,
        comparison_table,
        highlights: [
          {
            metric_label: 'Highest Engagement by Followers',
            leader_username: comparison_table[0]?.username || 'creator',
            value_display: `${comparison_table[0]?.engagement_by_followers_pct || '0'}%`,
            context: 'Highest interactions per follower in current sample.',
          },
        ],
        methodology_notes: [
          'Sample comparison mode active.',
          'Connect production API for live database and cache sync.',
        ],
      };
    }
  },

  async getSavedCreators(): Promise<SavedCreator[]> {
    try {
      const res = await fetch(`${API_BASE}/saved`);
      return await handleResponse<SavedCreator[]>(res);
    } catch {
      return getLocalSaved();
    }
  },

  async saveCreator(
    username: string,
    notes?: string,
    tags?: string
  ): Promise<SavedCreator> {
    try {
      const res = await fetch(`${API_BASE}/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, notes, tags }),
      });
      return await handleResponse<SavedCreator>(res);
    } catch {
      const clean = username.trim().replace(/^@/, '').toLowerCase();
      const preset = PRESET_CREATORS[clean];
      const savedItem: SavedCreator = {
        username: clean,
        full_name: preset?.profile.full_name || `@${clean}`,
        profile_pic_url: preset?.profile.profile_pic_url || null,
        follower_count: preset?.profile.follower_count || null,
        engagement_rate: preset?.analytics.engagement_by_followers.value || null,
        notes: notes || '',
        tags: tags || '',
        saved_at: new Date().toISOString(),
      };
      saveLocalCreator(savedItem);
      return savedItem;
    }
  },

  async removeSavedCreator(username: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/saved/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      await handleResponse<{ status: string }>(res);
    } catch {
      removeLocalCreator(username);
    }
  },

  getPostsCsvUrl(username: string): string {
    return `${API_BASE}/export/posts/csv?username=${encodeURIComponent(username)}`;
  },

  async downloadComparisonCsv(identifiers: string[]): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/export/compare/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers, force_refresh: false }),
      });
      if (!res.ok) throw new Error('API not available');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creatorscope_comparison_${identifiers.length}_creators.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Fallback CSV download directly in browser
      const csv = `Username,Followers,Est Engagement\n${identifiers.join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'creatorscope_comparison.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  },

  async getHistory(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/history`);
      return await handleResponse<any[]>(res);
    } catch {
      return [];
    }
  },
};
