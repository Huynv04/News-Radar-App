export interface ReadingHistoryItem {
    id: string;
    articleId: string;
    articleTitle: string;
    articleUrl: string;
    articleSapo: string;
    category?: string;
    crawlerSourceName: string;
    publishedAt: string;
    readAt: string;
}
