import {
  CreatorAnalysisResult,
  CreatorComparisonResult,
  ProviderStatus,
  SavedCreator,
} from '../types';

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

export const api = {
  async getProviderStatus(): Promise<ProviderStatus> {
    const res = await fetch(`${API_BASE}/providers/status`);
    return handleResponse<ProviderStatus>(res);
  },

  async analyzeCreator(
    input: string,
    forceRefresh: boolean = false
  ): Promise<CreatorAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, force_refresh: forceRefresh }),
    });
    return handleResponse<CreatorAnalysisResult>(res);
  },

  async compareCreators(
    identifiers: string[],
    forceRefresh: boolean = false
  ): Promise<CreatorComparisonResult> {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers, force_refresh: forceRefresh }),
    });
    return handleResponse<CreatorComparisonResult>(res);
  },

  async getSavedCreators(): Promise<SavedCreator[]> {
    const res = await fetch(`${API_BASE}/saved`);
    return handleResponse<SavedCreator[]>(res);
  },

  async saveCreator(
    username: string,
    notes?: string,
    tags?: string
  ): Promise<SavedCreator> {
    const res = await fetch(`${API_BASE}/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, notes, tags }),
    });
    return handleResponse<SavedCreator>(res);
  },

  async removeSavedCreator(username: string): Promise<void> {
    const res = await fetch(`${API_BASE}/saved/${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
    await handleResponse<{ status: string }>(res);
  },

  getPostsCsvUrl(username: string): string {
    return `${API_BASE}/export/posts/csv?username=${encodeURIComponent(username)}`;
  },

  async downloadComparisonCsv(identifiers: string[]): Promise<void> {
    const res = await fetch(`${API_BASE}/export/compare/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers, force_refresh: false }),
    });
    if (!res.ok) {
      throw new ApiError('Failed to generate comparison CSV.', res.status);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creatorscope_comparison_${identifiers.length}_creators.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async getHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/history`);
    return handleResponse<any[]>(res);
  },
};
