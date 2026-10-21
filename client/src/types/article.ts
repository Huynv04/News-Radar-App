export interface Article {
    id: string;
    title: string;
    sapo: string;
    content?: string;
    url: string;
    category?: string;
    publishedAt: string;
    crawledAt: string;
    crawlerSourceId: string;
    crawlerSourceName: string;
    contentHash: string;
    sentimentLabel: 'Positive' | 'Negative' | 'Neutral';
    sentimentScore: number;
    trendScore: number;
    isPinned?: boolean;
}

export interface ArticleFilterParams {
    sourceId?: string;
    searchKeyword?: string;
    sentiment?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
    lastPublishedAt?: string;
    lastId?: string;
    pageSize?: number;
}

export interface CursorPagedResult<T> {
    items: T[];
    nextLastPublishedAt?: string;
    nextLastId?: string;
    hasNextPage: boolean;
}