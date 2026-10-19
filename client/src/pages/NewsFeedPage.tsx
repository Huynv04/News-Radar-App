import { useState, useEffect } from 'react';
import { articleApi } from '../services/articleApi';
import { crawlerSourceApi } from '../services/crawlerSourceApi';
import type { Article } from '../types/article';
import type { CrawlerSource } from '../types/crawlerSource';

export function NewsFeedPage() {
    // 1. Khai báo State (Nơi chứa dữ liệu)
    const [articles, setArticles] = useState<Article[]>([]);
    const [sources, setSources] = useState<CrawlerSource[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>('');
    const [keyword, setKeyword] = useState<string>('');

    // 2. Tải danh sách Nguồn tin (Chạy 1 lần duy nhất khi mở trang)
    useEffect(() => {
        crawlerSourceApi.getAll().then((data) => setSources(data));
    }, []);

    // 3. Tải bài viết từ API (Tự động chạy lại mỗi khi bấm chọn Nguồn tin mới)
    useEffect(() => {
        articleApi.getArticles({ sourceId: selectedSource, pageSize: 10 })
            .then((res) => setArticles(res.items));
    }, [selectedSource]);

    // 4. Xử lý khi nhấn nút Tìm kiếm
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        articleApi.getArticles({
            sourceId: selectedSource,
            searchKeyword: keyword,
            pageSize: 10
        }).then((res) => setArticles(res.items));
    };

    // 5. Render giao diện HTML thuần
    return (
        <div>
            <h1>Bảng Tin News Radar</h1>

            {/* Thanh Tìm Kiếm & Lọc Nguồn */}
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Nhập từ khóa tìm kiếm..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <button type="submit">Tìm kiếm</button>

                <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                    <option value="">-- Tất cả nguồn tin --</option>
                    {sources.map((src) => (
                        <option key={src.id} value={src.id}>
                            {src.name}
                        </option>
                    ))}
                </select>
            </form>

            <hr />

            {/* Danh sách bài viết */}
            {articles.length === 0 ? (
                <p>Không có bài viết nào.</p>
            ) : (
                <ul>
                    {articles.map((item) => (
                        <li key={item.id}>
                            <a href={item.url} target="_blank" rel="noreferrer">
                                <strong>{item.title}</strong>
                            </a>
                            <p>{item.sapo}</p>
                            <small>Nguồn: {item.crawlerSourceName} | Ngày: {new Date(item.publishedAt).toLocaleString('vi-VN')}</small>
                            <br /><br />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}