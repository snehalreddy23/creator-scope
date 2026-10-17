export type MetricIntegrityType =
  | 'observed'
  | 'calculated'
  | 'estimated'
  | 'manually_entered'
  | 'unavailable';

export type ContentType = 'image' | 'video' | 'reel' | 'carousel' | 'unknown';

export interface InstagramProfile {
  username: string;
  full_name?: string | null;
  biography?: string | null;
  profile_pic_url?: string | null;
  external_url?: string | null;
  category?: string | null;
  is_verified: boolean;
  is_private: boolean;
  follower_count?: number | null;
  following_count?: number | null;
  media_count?: number | null;
  profile_url: string;
}

export interface InstagramPost {
  id: string;
  shortcode?: string | null;
  permalink?: string | null;
  caption?: string | null;
  media_type: ContentType;
  timestamp?: number | null;
  published_at?: string | null;
  like_count?: number | null;
  comment_count?: number | null;
  view_count?: number | null;
  engagement_by_followers_pct?: number | null;
  engagement_by_views_pct?: number | null;
}

export interface DataCoverage {
  posts_analyzed: number;
  earliest_post_date?: string | null;
  latest_post_date?: string | null;
  date_range_days?: number | null;
  missing_like_counts: number;
  missing_comment_counts: number;
  missing_view_counts: number;
  is_partial: boolean;
  limitations_notes: string[];
}

export interface MetricCard<T> {
  value?: T | null;
  category: MetricIntegrityType;
  label: string;
  description: string;
  formula?: string | null;
  sample_size?: number | null;
  is_available: boolean;
}

export interface ProfileAnalytics {
  followers: MetricCard<number>;
  following: MetricCard<number>;
  total_posts_count: MetricCard<number>;
  posts_analyzed: MetricCard<number>;
  average_likes: MetricCard<number>;
  median_likes: MetricCard<number>;
  average_comments: MetricCard<number>;
  average_reel_views: MetricCard<number>;
  median_reel_views: MetricCard<number>;
  engagement_by_followers: MetricCard<number>;
  engagement_by_views: MetricCard<number>;
  posting_frequency_per_week: MetricCard<number>;
  posting_frequency_per_month: MetricCard<number>;
  content_distribution: Record<string, number>;
  top_posts_by_likes: InstagramPost[];
  top_posts_by_comments: InstagramPost[];
  top_posts_by_views: InstagramPost[];
  top_posts_by_engagement: InstagramPost[];
  coverage: DataCoverage;
}

export interface CreatorAnalysisResult {
  profile: InstagramProfile;
  analytics: ProfileAnalytics;
  posts: InstagramPost[];
  data_source: string;
  is_mock: boolean;
  retrieved_at: string;
  retrievedAt?: string;
  is_cached: boolean;
}

export interface CreatorComparisonRow {
  username: string;
  full_name?: string | null;
  profile_pic_url?: string | null;
  followers?: number | null;
  posts_analyzed: number;
  average_likes?: number | null;
  median_likes?: number | null;
  average_comments?: number | null;
  average_reel_views?: number | null;
  engagement_by_followers_pct?: number | null;
  engagement_by_views_pct?: number | null;
  posting_frequency_per_week?: number | null;
  top_content_type?: string | null;
  is_mock: boolean;
  retrieved_at: string;
}

export interface ComparisonHighlight {
  metric_label: string;
  leader_username: string;
  value_display: string;
  context: string;
}

export interface CreatorComparisonResult {
  creators: CreatorAnalysisResult[];
  comparison_table: CreatorComparisonRow[];
  highlights: ComparisonHighlight[];
  methodology_notes: string[];
}

export interface SavedCreator {
  username: string;
  full_name?: string | null;
  profile_pic_url?: string | null;
  follower_count?: number | null;
  engagement_rate?: number | null;
  notes?: string;
  tags?: string;
  saved_at: string;
}

export interface ProviderStatus {
  configured_provider: string;
  is_live_provider: boolean;
  api_key_configured: boolean;
  cache_ttl_seconds: number;
  provider_display_name: string;
  quota_notice: string;
}
