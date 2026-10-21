import React, { useState, useEffect } from 'react';
import { useArticles } from '../../hooks/useArticles';
import { ArticleFilterBar } from '../ArticleFilterBar';
import { ArticleCard } from '../ArticleCard';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { crawlerSourceApi } from '../../../crawler';
import type { Article } from '../../types';
import type { SourceOption } from '../ArticleFilterBar';
import './ArticleFeed.css';

export const ArticleFeed: React.FC = () => {
    const {
        articles,
        loading,
        loadingMore,
        error,
        hasNextPage,
        selectedCategory,
        setSelectedCategory,
        selectedSentiment,
        setSelectedSentiment,
        selectedSource,
        setSelectedSource,
        setSearchKeyword,
        refetch,
        loadMore,
        timeRange,
        setTimeRange,
        customFromDate,
        setCustomFromDate,
        customToDate,
        setCustomToDate,
    } = useArticles();

    const [sources, setSources] = useState<SourceOption[]>([]);
    const [activeKeyword, setActiveKeyword] = useState<string>('');
    const [readingArticle, setReadingArticle] = useState<Article | null>(null);

    // Lấy danh sách nguồn tin cho bộ lọc
    useEffect(() => {
        crawlerSourceApi
            .getAll()
            .then((data) => {
                setSources(data.map((s) => ({ id: s.id, name: s.name })));
            })
            .catch((err: unknown) => {
                console.error('Không thể nạp danh sách nguồn tin:', err);
            });
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchKeyword(activeKeyword);
    };

    const handleClearSearch = () => {
        setActiveKeyword('');
        setSearchKeyword('');
    };

    return (
        <div className="feed-container">
            <header className="feed-header">
                <h1 className="feed-title">Radar Tin Tức</h1>
                <p className="feed-subtitle">
                    Dòng chảy tin tức thời gian thực, tự động phân tích cảm xúc & chấm điểm xu hướng
                </p>
            </header>

            {/* Thanh tìm kiếm & bộ lọc */}
            <ArticleFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedSentiment={selectedSentiment}
                onSelectSentiment={setSelectedSentiment}
                selectedSource={selectedSource}
                onSelectSource={setSelectedSource}
                searchKeyword={activeKeyword}
                onSearchChange={setActiveKeyword}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                sources={sources}
                timeRange={timeRange}
                onSelectTimeRange={setTimeRange}
                customFromDate={customFromDate}
                onCustomFromDateChange={setCustomFromDate}
                customToDate={customToDate}
                onCustomToDateChange={setCustomToDate}
            />

            {/* Thông báo lỗi */}
            {error && (
                <div className="error-alert">
                    ⚠️ {error} — <button onClick={() => refetch()} style={{ background: 'none', border: 'none', color: '#b91c1c', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Thử lại</button>
                </div>
            )}

            {/* Loading trạng thái lần đầu */}
            {loading && articles.length === 0 ? (
                <div className="status-box">
                    <div className="loading-spinner"></div>
                    <p>Đang quét và đồng bộ tin tức mới nhất...</p>
                </div>
            ) : articles.length === 0 ? (
                <div className="status-box">
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 6px 0' }}>
                        Không tìm thấy bài viết nào
                    </p>
                    <p style={{ margin: 0 }}>
                        Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
                    </p>
                </div>
            ) : (
                <>
                    {/* Danh sách bài viết */}
                    <div className="article-list">
                        {articles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                onOpenReader={(art) => setReadingArticle(art)}
                            />
                        ))}
                    </div>

                    {/* Nút Xem Thêm (Phân trang) */}
                    {hasNextPage && (
                        <div className="load-more-wrapper">
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={loadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Đang tải thêm tin...' : 'Tải thêm bài viết'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Clean Reader Mode Modal */}
            <ArticleReaderModal
                article={readingArticle}
                onClose={() => setReadingArticle(null)}
            />
        </div>
    );
};
