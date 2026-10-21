import type { Article } from './article';

export interface SentimentStat {
    sentiment: string;
    count: number;
}

export interface CategoryStat {
    category: string;
    count: number;
}

export interface HotKeyword {
    keyword: string;
    count: number;
}

export interface DashboardAnalytics {
    totalArticles: number;
    sentimentStats: SentimentStat[];
    categoryStats?: CategoryStat[];
    hotKeywords24h: HotKeyword[];
    topTrendingArticles: Article[];
}