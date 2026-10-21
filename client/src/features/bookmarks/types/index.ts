// ── Bookmark Types ────────────────────────────────────────────────────────────

export interface BookmarkDto {
    id: string;
    articleId: string;
    articleTitle: string;
    articleUrl: string;
    articleSapo: string;
    crawlerSourceName: string;
    publishedAt: string;
    savedAt: string;
}

export interface AddBookmarkRequest {
    articleId: string;
}
