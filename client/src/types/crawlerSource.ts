export interface CrawlerSource {
    id: string;
    name: string;
    rssUrl: string;
    baseUrl: string;
    isActive: boolean;
    scanIntervalMinutes: number;
    selectors: string;
    createdAt?: string;
    updatedAt?: string;
}

export type CreateCrawlerSourceDto = Omit<CrawlerSource, 'createdAt' | 'updatedAt'>;