import React, { useState } from 'react';
import type { Article } from '../../types';
import { BookmarkButton } from '../BookmarkButton';
import './ArticleCard.css';
import { useAuth } from '../../../../providers/AuthProvider';
import { articleApi } from '../../api/articleApi';

interface ArticleCardProps {
    article: Article;
    onOpenReader?: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onOpenReader }) => {
    const { user, isAuthenticated } = useAuth();
    const isAdmin = isAuthenticated && user?.role === 'Admin';

    // State Ghim bài viết
    const [isPinned, setIsPinned] = useState<boolean>(Boolean(article.isPinned));
    const [isPinning, setIsPinning] = useState<boolean>(false);

    // State Can thiệp thủ công (Manual Overrides) cho Admin
    const [category, setCategory] = useState<string>(article.category || 'Thời sự');
    const [sentiment, setSentiment] = useState<string>(article.sentimentLabel || 'Neutral');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const handleTogglePin = async () => {
        try {
            setIsPinning(true);
            const res = await articleApi.togglePin(article.id);
            setIsPinned(res.isPinned);
        } catch (err) {
            console.error('Lỗi khi ghim bài viết:', err);
            alert('Không thể thực hiện thao tác ghim bài viết.');
        } finally {
            setIsPinning(false);
        }
    };

    const handleSaveOverride = async () => {
        try {
            setIsSaving(true);
            await articleApi.overrideMetadata(article.id, {
                category,
                sentimentLabel: sentiment,
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Lỗi can thiệp dữ liệu:', err);
            alert('Không thể lưu can thiệp dữ liệu.');
        } finally {
            setIsSaving(false);
        }
    };

    const isHot = (article.trendScore ?? 0) >= 45 ||
        article.title.toLowerCase().includes('khẩn') ||
        article.title.toLowerCase().includes('nóng');

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('vi-VN', {
                dateStyle: 'medium',
                timeStyle: 'short',
            }).format(date);
        } catch {
            return dateString;
        }
    };

    return (
        <article className="article-card">
            <div className="article-meta">
                <span className="source-badge">{article.crawlerSourceName || 'Radar Source'}</span>
                {isPinned && <span className="pinned-badge">📌 ĐÃ GHIM</span>}

                {/* Hiển thị Category */}
                <span className="category-tag">{category}</span>

                {/* Hiển thị Sentiment */}
                <span className={`sentiment-tag sentiment-${sentiment.toLowerCase()}`}>
                    {sentiment === 'Positive' && '😊 Tích cực'}
                    {sentiment === 'Negative' && '⚠️ Tiêu cực'}
                    {sentiment === 'Neutral' && '⚖️ Trung lập'}
                </span>

                <span className={`trend-badge ${isHot ? 'trend-hot' : ''}`}>
                    {isHot ? '🔥 Hot ' : '📈 Trend: '}
                    {typeof article.trendScore === 'number' ? article.trendScore.toFixed(1) : '0.0'}
                </span>

                {/* Hiển thị Đa nguồn cùng đưa tin (Cosine Similarity Clustering) */}
                {(article.clusterCount ?? 1) > 1 && (
                    <span className="cluster-badge" title="Phát hiện sự kiện đa nguồn qua Cosine Similarity">
                        👥 {article.clusterCount} báo cùng đưa tin
                    </span>
                )}

                {/* Hiển thị Tác giả */}
                {article.author && (
                    <span className="author-badge" title={`Tác giả: ${article.author}`}>
                        ✍️ {article.author}
                    </span>
                )}

                <time className="publish-time" dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt)}
                </time>

                {/* Nút bật popup sửa - Chỉ hiển thị cho Admin */}
                {isAdmin && (
                    <button
                        type="button"
                        className="btn-admin-edit"
                        onClick={() => setIsEditing(!isEditing)}
                        title="Admin can thiệp sửa Category / Sentiment"
                    >
                        ✏️ Sửa nhãn
                    </button>
                )}
            </div>

            {/* Popup chỉnh sửa nhanh khi Admin bấm "Sửa nhãn" */}
            {isAdmin && isEditing && (
                <div className="admin-override-box">
                    <div className="override-row">
                        <label>Danh mục:</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="Thời sự">Thời sự</option>
                            <option value="Kinh doanh">Kinh doanh</option>
                            <option value="Công nghệ">Công nghệ</option>
                            <option value="Thế giới">Thế giới</option>
                            <option value="Giải trí">Giải trí</option>
                            <option value="Thể thao">Thể thao</option>
                            <option value="Sức khỏe">Sức khỏe</option>
                            <option value="Giáo dục">Giáo dục</option>
                            <option value="Pháp luật">Pháp luật</option>
                        </select>
                    </div>
                    <div className="override-row">
                        <label>Sắc thái:</label>
                        <select value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
                            <option value="Positive">😊 Tích cực (Positive)</option>
                            <option value="Neutral">⚖️ Trung lập (Neutral)</option>
                            <option value="Negative">⚠️ Tiêu cực (Negative)</option>
                        </select>
                    </div>
                    <div className="override-buttons">
                        <button
                            type="button"
                            className="btn-override-save"
                            onClick={handleSaveOverride}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                        </button>
                        <button
                            type="button"
                            className="btn-override-cancel"
                            onClick={() => setIsEditing(false)}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            <div className="article-body-wrapper" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', margin: '10px 0 16px 0' }}>
                {article.imageUrl && (
                    <div className="article-thumbnail-box" style={{ flexShrink: 0, width: '130px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                const parent = e.currentTarget.parentElement;
                                if (parent) parent.style.display = 'none';
                            }}
                        />
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="article-title" style={{ marginTop: 0 }}>
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="article-link"
                        >
                            {article.title}
                        </a>
                    </h2>
                    {article.sapo && <p className="article-sapo" style={{ margin: 0 }}>{article.sapo}</p>}
                </div>
            </div>

            <div className="article-actions">
                <button
                    type="button"
                    className="btn-reader-mode"
                    onClick={() => onOpenReader && onOpenReader(article)}
                >
                    📖 Đọc nhanh (Reader Mode)
                </button>
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-external-link"
                >
                    Mở bài gốc ↗
                </a>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Nút Ghim - Chỉ hiển thị cho Admin */}
                    {isAdmin && (
                        <button
                            type="button"
                            className={`btn-pin ${isPinned ? 'pinned' : ''}`}
                            onClick={handleTogglePin}
                            disabled={isPinning}
                            title={isPinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết lên đầu trang'}
                        >
                            {isPinned ? '📍 Đã ghim' : '📌 Ghim'}
                        </button>
                    )}
                    <BookmarkButton articleId={article.id} />
                </div>
            </div>
        </article>
    );
};
