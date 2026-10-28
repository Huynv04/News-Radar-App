export interface CrawlerSource {
    id: string;
    name: string;
    rssUrl: string;
    baseUrl: string;
    isActive: boolean;
    scanIntervalMinutes: number;
    selectors: string;
    consecutiveFailures?: number;
    lastScannedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type CreateCrawlerSourceDto = Omit<CrawlerSource, 'createdAt' | 'updatedAt' | 'lastScannedAt' | 'consecutiveFailures'>;

export interface CrawlerLogDto {
    id: string;
    crawlerSourceId: string;
    scannedAt: string;
    articlesFound: number;
    articlesInserted: number;
    durationMs: number;
    isSuccess: boolean;
    errorMessage?: string;
    httpStatusCode?: number;
}

export interface CrawlerHourlyStatDto {
    hour: string;
    successCount: number;
    failureCount: number;
    totalArticlesInserted: number;
}