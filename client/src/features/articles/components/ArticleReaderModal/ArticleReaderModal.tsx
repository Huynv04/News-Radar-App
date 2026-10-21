import React, { useEffect } from 'react';
import type { Article } from '../../types';
import './ArticleReaderModal.css';
import { historyApi } from '../../../readinghistory/api/historyApi';
import { useAuth } from '../../../../providers/AuthProvider';


interface ArticleReaderModalProps {
    article: Article | null;
    onClose: () => void;
}

export const ArticleReaderModal:
    React.FC<ArticleReaderModalProps> = ({ article, onClose }) => {
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

        useEffect(() => {
            if (article && isAuthenticated) {
                historyApi.record(article.id).catch((err) => {
                    console.error('Lỗi lưu lịch sử đọc:', err);
                });
            }
        }, [article, isAuthenticated]);
        if (!article) return null;

        const contentParagraphs = article.content
            ? article.content.split('\n\n').filter((p) => p.trim().length > 0)
            : [];
        return (
            <div className="reader-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
                <div className="reader-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="reader-modal-header">
                        <div className="article-meta" style={{ margin: 0 }}>
                            <span className="source-badge">{article.crawlerSourceName || 'Radar Source'}</span>
                            {article.category && <span className="category-tag">{article.category}</span>}
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

                    <h1 className="reader-modal-title">{article.title}</h1>

                    {article.sapo && <div className="reader-modal-sapo">{article.sapo}</div>}

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
