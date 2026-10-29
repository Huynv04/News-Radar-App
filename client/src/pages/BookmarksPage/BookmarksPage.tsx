import { useEffect, useState } from 'react';
import { bookmarkApi } from '../../features/bookmarks';
import type { BookmarkDto } from '../../types/auth';
import { formatDate, decodeHtmlEntities } from '../../utils';
import './BookmarksPage.css';

export function BookmarksPage() {
    const [bookmarks, setBookmarks] = useState<BookmarkDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        loadBookmarks();
    }, []);

    const loadBookmarks = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await bookmarkApi.getAll();
            setBookmarks(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách bookmark.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (articleId: string) => {
        setRemovingId(articleId);
        try {
            await bookmarkApi.remove(articleId);
            setBookmarks(prev => prev.filter(b => b.articleId !== articleId));
        } catch (err: unknown) {
            console.error('Remove bookmark error:', err);
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="bookmarks-page">
            <div className="bookmarks-header">
                <div className="bookmarks-header-icon">🔖</div>
                <div>
                    <h2 className="bookmarks-title">Bài Viết Đã Lưu</h2>
                    <p className="bookmarks-subtitle">
                        {bookmarks.length} bài viết trong thư viện của bạn
                    </p>
                </div>
            </div>

            {isLoading && (
                <div className="bookmarks-loading">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bookmark-skeleton" />
                    ))}
                </div>
            )}

            {error && (
                <div className="bookmarks-error">⚠️ {error}</div>
            )}

            {!isLoading && !error && bookmarks.length === 0 && (
                <div className="bookmarks-empty">
                    <div className="bookmarks-empty-icon">📚</div>
                    <h3>Chưa có bài viết nào được lưu</h3>
                    <p>Nhấn vào biểu tượng bookmark trên bài viết để lưu lại đọc sau.</p>
                </div>
            )}

            <div className="bookmarks-grid">
                {bookmarks.map(bookmark => (
                    <article key={bookmark.id} className="bookmark-card">
                        <div className="bookmark-card-meta">
                            <span className="bookmark-source">{bookmark.crawlerSourceName}</span>
                            <span className="bookmark-date">📅 {formatDate(bookmark.publishedAt)}</span>
                        </div>

                        <a
                            href={bookmark.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bookmark-card-title"
                        >
                            {decodeHtmlEntities(bookmark.articleTitle)}
                        </a>

                        <p className="bookmark-card-sapo">{decodeHtmlEntities(bookmark.articleSapo)}</p>

                        <div className="bookmark-card-footer">
                            <span className="bookmark-saved-at">
                                🔖 Đã lưu {formatDate(bookmark.savedAt)}
                            </span>
                            <button
                                id={`remove-bookmark-${bookmark.articleId}`}
                                className="bookmark-remove-btn"
                                onClick={() => handleRemove(bookmark.articleId)}
                                disabled={removingId === bookmark.articleId}
                                title="Xóa khỏi danh sách đã lưu"
                            >
                                {removingId === bookmark.articleId
                                    ? <span className="btn-spinner" />
                                    : '🗑️ Xóa'}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
