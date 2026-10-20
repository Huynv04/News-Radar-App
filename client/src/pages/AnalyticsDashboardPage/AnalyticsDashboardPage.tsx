import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../../services/analyticsApi';
import type { DashboardAnalytics } from '../../types/analytics';
import './AnalyticsDashboardPage.css';

const COLORS: Record<string, string> = {
    Positive: '#16a34a', // Xanh lá
    Neutral: '#64748b',  // Xám
    Negative: '#dc2626', // Đỏ
};

export function AnalyticsDashboardPage() {
    const [data, setData] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const loadDashboard = () => {
        setLoading(true);
        analyticsApi.getDashboard()
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const handleReprocess = () => {
        analyticsApi.reprocessArticles().then(() => {
            loadDashboard();
            alert('Đã chạy lại phân tích NLP & lọc trùng SHA-256!');
        });
    };

    if (loading || !data) {
        return <div className="dashboard-container">Đang tải dữ liệu phân tích NLP...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ margin: '0 0 6px 0' }}>Thống Kê NLP & Xu Hướng</h1>
                    <p style={{ margin: 0, color: '#64748b' }}>
                        Tổng số bài viết độc bản (SHA-256): <strong>{data.totalArticles}</strong>
                    </p>
                </div>
                <button className="btn-primary" onClick={handleReprocess}>
                    Chạy lại NLP & Lọc trùng
                </button>
            </div>

            <div className="dashboard-grid">
                {/* Biểu đồ Sắc thái (Recharts) */}
                <div className="dashboard-card">
                    <h3 className="card-title">Biểu đồ Sắc thái Tin tức (Sentiment)</h3>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data.sentimentStats}
                                    dataKey="count"
                                    nameKey="sentiment"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={85}
                                    label
                                >
                                    {data.sentimentStats.map((entry) => (
                                        <Cell key={entry.sentiment} fill={COLORS[entry.sentiment] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tag Cloud Từ khóa Hot 24h */}
                <div className="dashboard-card">
                    <h3 className="card-title">Tag Cloud Từ khóa Hot 24h</h3>
                    {data.hotKeywords24h.length === 0 ? (
                        <p style={{ color: '#64748b' }}>Chưa đủ dữ liệu cụm từ lặp lại.</p>
                    ) : (
                        <div className="tag-cloud">
                            {data.hotKeywords24h.map((item) => (
                                <span
                                    key={item.keyword}
                                    className="tag-item"
                                    style={{ fontSize: `${Math.min(12 + item.count * 2, 22)}px` }}
                                >
                                    #{item.keyword} ({item.count})
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top 5 Bài viết có Điểm Trend cao nhất */}
            <div className="dashboard-card">
                <h3 className="card-title">🔥 Top 5 Bài Viết Điểm Trend Cao Nhất (Time-Decay)</h3>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {data.topTrendingArticles.map((art) => (
                        <li key={art.id} style={{ marginBottom: '10px' }}>
                            <a href={art.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: '#0f172a' }}>
                                {art.title}
                            </a>{' '}
                            — <span style={{ color: '#ea580c', fontWeight: 700 }}>🔥 {art.trendScore} điểm</span>{' '}
                            <small style={{ color: '#64748b' }}>({art.crawlerSourceName})</small>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}