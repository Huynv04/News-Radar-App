import React, { useEffect } from 'react';
import type { Article } from '../../types';
import './ArticleReaderModal.css';
import { historyApi } from '../../../readinghistory/api/historyApi';
import { useAuth } from '../../../../providers/AuthProvider';
import { decodeHtmlEntities, estimateReadingTime } from '../../../../utils';

interface ArticleReaderModalProps {
    article: Article | null;
    onClose: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({ article, onClose }) => {
    const { isAuthenticated } = useAuth();

    // 1. Hook xử lý phím ESC và cuộn trang
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (article) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [article, onClose]);

    // 2. Ghi nhận lịch sử đọc tin
    useEffect(() => {
        if (article && isAuthenticated) {
            historyApi.record(article.id).catch((err) => {
                console.error('Lỗi lưu lịch sử đọc:', err);
            });
        }
    }, [article, isAuthenticated]);

    if (!article) return null;

    const readingTime = estimateReadingTime(article.content);

    const contentParagraphs = article.content
        ? decodeHtmlEntities(article.content)
            .split('\n\n')
            .filter((p) => p.trim().length > 0)
        : [];

    return (
        <div className="reader-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="reader-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="reader-modal-header">
                    <div className="article-meta" style={{ margin: 0 }}>
                        <span className="source-badge">{article.crawlerSourceName || 'Radar Source'}</span>
                        {article.category && <span className="category-tag">{article.category}</span>}
                        {(article.clusterCount ?? 1) > 1 && (
                            <span className="cluster-badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                                👥 {article.clusterCount} báo cùng đưa tin
                            </span>
                        )}
                        {article.author && (
                            <span className="author-badge" style={{ color: '#64748b', fontSize: '12.5px' }}>
                                ✍️ {article.author}
                            </span>
                        )}
                        {readingTime > 0 && (
                            <span className="reading-time-badge" style={{ color: '#64748b', fontSize: '12.5px' }}>
                                ⏱️ {readingTime} phút đọc
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        className="reader-close-btn"
                        onClick={onClose}
                        aria-label="Đóng đọc nhanh"
                    >
                        ✕
                    </button>
                </div>

                <h1 className="reader-modal-title">{decodeHtmlEntities(article.title)}</h1>

                {article.imageUrl && (
                    <div className="reader-modal-image" style={{ margin: '16px 0', borderRadius: '12px', overflow: 'hidden', maxHeight: '380px', background: '#f1f5f9' }}>
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                        />
                    </div>
                )}

                {article.sapo && <div className="reader-modal-sapo">{decodeHtmlEntities(article.sapo)}</div>}

                <div className="reader-modal-body">
                    {contentParagraphs.length > 0 ? (
                        contentParagraphs.map((para, idx) => <p key={idx}>{para}</p>)
                    ) : (
                        <p style={{ fontStyle: 'italic', color: '#64748b' }}>
                            Nội dung chi tiết chưa được cào toàn bộ hoặc là bản tin tóm tắt. Bạn có thể mở bài viết gốc để xem chi tiết.
                        </p>
                    )}
                </div>

                <div className="reader-modal-footer">
                    <button type="button" className="btn-outline" onClick={onClose}>
                        Đóng
                    </button>
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                        Đến trang gốc ↗
                    </a>
                </div>
            </div>
        </div>
    );
};
