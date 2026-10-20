import type { Article } from './article';

export interface SentimentStat {
    sentiment: string;
    count: number;
}

export interface HotKeyword {
    keyword: string;
    count: number;
}

export interface DashboardAnalytics {
    totalArticles: number;
    sentimentStats: SentimentStat[];
    hotKeywords24h: HotKeyword[];
    topTrendingArticles: Article[];
}