import { useState, useEffect } from 'react';
import { articleApi } from '../../services/articleApi';
import { crawlerSourceApi } from '../../services/crawlerSourceApi';
import type { Article } from '../../types/article';
import type { CrawlerSource } from '../../types/crawlerSource';
import './NewsFeedPage.css';

export function NewsFeedPage() {
    // 1. Các State lưu dữ liệu cơ bản
    const [articles, setArticles] = useState<Article[]>([]);
    const [sources, setSources] = useState<CrawlerSource[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>('');
    const [keyword, setKeyword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');

    // 2. State lưu con trỏ (Cursor) để phân trang
    const [nextLastPublishedAt, setNextLastPublishedAt] = useState<string | undefined>();
    const [nextLastId, setNextLastId] = useState<string | undefined>();
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);

    // 3. Tải danh sách nguồn tin vào Dropdown khi mở trang
    useEffect(() => {
        crawlerSourceApi.getAll()
            .then((data) => {
                if (Array.isArray(data)) setSources(data);
            })
            .catch(() => setErrorMsg('Không thể tải danh sách nguồn tin từ máy chủ.'));
    }, []);

    // Hàm dùng chung để lấy trang đầu tiên
    const fetchFirstPage = (sourceId: string, searchKeyword: string) => {
        setLoading(true);
        setErrorMsg('');

        articleApi.getArticles({
            sourceId: sourceId || undefined,
            searchKeyword: searchKeyword || undefined,
            pageSize: 10,
        })
            .then((res) => {
                setArticles(res.items || []);
                setNextLastPublishedAt(res.nextLastPublishedAt);
                setNextLastId(res.nextLastId);
                setHasNextPage(res.hasNextPage);
            })
            .catch(() => setErrorMsg('Lỗi khi tải danh sách bài viết.'))
            .finally(() => setLoading(false));
    };

    // 4. Tự động tải lại bài viết mỗi khi đổi Nguồn tin trên Dropdown
    useEffect(() => {
        fetchFirstPage(selectedSource, keyword);
    }, [selectedSource]);

    // 5. Xử lý khi bấm nút Tìm kiếm
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFirstPage(selectedSource, keyword);
    };

    // 6. Xử lý khi bấm nút "Xem thêm tin cũ hơn" (Keyset Pagination)
    const handleLoadMore = () => {
        if (!hasNextPage) return;

        articleApi.getArticles({
            sourceId: selectedSource || undefined,
            searchKeyword: keyword || undefined,
            lastPublishedAt: nextLastPublishedAt,
            lastId: nextLastId,
            pageSize: 10,
        })
            .then((res) => {
                // Nối thêm bài viết mới vào cuối danh sách hiện tại
                setArticles((prev) => [...prev, ...(res.items || [])]);
                setNextLastPublishedAt(res.nextLastPublishedAt);
                setNextLastId(res.nextLastId);
                setHasNextPage(res.hasNextPage);
            });
    };

    return (
        <div className="feed-container">
            {/* Tiêu đề trang */}
            <div className="feed-header">
                <h1 className="feed-title">Bảng Tin Tổng Hợp</h1>
                <p className="feed-subtitle">Cập nhật tin tức tự động theo thời gian thực</p>
            </div>

            {errorMsg && <div className="error-alert">{errorMsg}</div>}

            {/* Thanh Tìm kiếm & Lọc Nguồn */}
            <form className="filter-bar" onSubmit={handleSearch}>
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Nhập từ khóa tiêu đề hoặc nội dung..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button type="submit" className="btn-primary">
                        Tìm kiếm
                    </button>
                </div>

                <select
                    className="source-select"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                >
                    <option value="">Tất cả nguồn báo</option>
                    {sources.map((src) => (
                        <option key={src.id} value={src.id}>
                            {src.name}
                        </option>
                    ))}
                </select>
            </form>

            {/* Danh sách Bài viết */}
            {loading ? (
                <div className="status-box">Đang tải dữ liệu bài viết...</div>
            ) : articles.length === 0 ? (
                <div className="status-box">Không tìm thấy bài viết nào phù hợp.</div>
            ) : (
                <ul className="article-list">
                    {articles.map((item) => (
                        <li key={item.id} className="article-card">
                            <div className="article-meta">
                                <span className="source-badge">{item.crawlerSourceName}</span>
                                <span className="publish-time">
                                    {new Date(item.publishedAt).toLocaleString('vi-VN')}
                                </span>
                            </div>

                            <h3 className="article-title">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="article-link"
                                >
                                    {item.title}
                                </a>
                            </h3>

                            <p className="article-sapo">{item.sapo}</p>
                        </li>
                    ))}
                </ul>
            )}

            {/* Nút Phân trang (Load More) */}
            {hasNextPage && (
                <div className="load-more-wrapper">
                    <button onClick={handleLoadMore} className="btn-outline">
                        Xem thêm tin cũ hơn
                    </button>
                </div>
            )}
        </div>
    );
}