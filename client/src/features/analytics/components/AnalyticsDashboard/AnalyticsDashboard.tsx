import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import './AnalyticsDashboard.css';

const SENTIMENT_COLORS: Record<string, string> = {
    Positive: '#16a34a',
    Neutral: '#64748b',
    Negative: '#dc2626',
};

const CATEGORY_COLORS = [
    '#2563eb',
    '#7c3aed',
    '#db2777',
    '#ea580c',
    '#059669',
    '#0891b2',
    '#d97706',
    '#4f46e5',
];

export const AnalyticsDashboard: React.FC = () => {
    const { data, loading, reprocessing, statusMessage, handleReprocess } = useAnalytics();

    if (loading && !data) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải dữ liệu phân tích NLP & Thống kê thông minh...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="dashboard-container">
                <p>Không có dữ liệu phân tích khả dụng.</p>
            </div>
        );
    }

    const totalPositive = data.sentimentStats.find((s) => s.sentiment === 'Positive')?.count || 0;
    const totalNegative = data.sentimentStats.find((s) => s.sentiment === 'Negative')?.count || 0;
    const totalNeutral = data.sentimentStats.find((s) => s.sentiment === 'Neutral')?.count || 0;
    const positivePercent = data.totalArticles > 0 ? Math.round((totalPositive / data.totalArticles) * 100) : 0;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Bảng Phân Tích NLP & Xu Hướng</h1>
                    <p className="dashboard-subtitle">
                        Phân tích cảm xúc, bóc tách Bigrams 24h, phân loại danh mục tự động và tính điểm Trend (Time-decay)
                    </p>
                </div>
                <button
                    className="btn-primary btn-reprocess"
                    onClick={handleReprocess}
                    disabled={reprocessing}
                >
                    {reprocessing ? '⚙️ Đang xử lý...' : '⚡ Chạy lại NLP & Lọc Trùng'}
                </button>
            </div>

            {statusMessage && (
                <div className="status-notification">
                    <span>ℹ️ {statusMessage}</span>
                </div>
            )}

            {/* KPI Summary Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Tổng bài viết độc bản</span>
                    <span className="kpi-value">{data.totalArticles.toLocaleString()}</span>
                    <span className="kpi-hint">Đã loại trùng SHA-256</span>
                </div>
                <div className="kpi-card kpi-positive">
                    <span className="kpi-label">Tích cực (Positive)</span>
                    <span className="kpi-value">{totalPositive}</span>
                    <span className="kpi-hint">{positivePercent}% tổng số tin</span>
                </div>
                <div className="kpi-card kpi-negative">
                    <span className="kpi-label">Tiêu cực (Negative)</span>
                    <span className="kpi-value">{totalNegative}</span>
                    <span className="kpi-hint">Tai nạn, khủng hoảng, thiệt hại</span>
                </div>
                <div className="kpi-card kpi-neutral">
                    <span className="kpi-label">Trung lập (Neutral)</span>
                    <span className="kpi-value">{totalNeutral}</span>
                    <span className="kpi-hint">Thông tin chính sự & thời sự</span>
                </div>
            </div>

            {/* Grid 2 Cột Biểu Đồ */}
            <div className="dashboard-grid">
                {/* 1. Biểu đồ Donut Sentiment */}
                <div className="dashboard-card">
                    <h2 className="card-title">Phân Bổ Sắc Thái Tin Tức (Sentiment Analysis)</h2>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data.sentimentStats}
                                    dataKey="count"
                                    nameKey="sentiment"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    label={({ name, percent }: { name?: string; percent?: number }) =>
                                        `${name ?? ''}: ${(((percent ?? 0) * 100)).toFixed(0)}%`
                                    }
                                >
                                    {data.sentimentStats.map((entry) => (
                                        <Cell
                                            key={entry.sentiment}
                                            fill={SENTIMENT_COLORS[entry.sentiment] || '#94a3b8'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => [`${value} bài viết`, 'Số lượng']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Biểu đồ Danh mục (Category Distribution) */}
                <div className="dashboard-card">
                    <h2 className="card-title">Phân Bổ Theo Danh Mục Tự Động (Auto-Categorization)</h2>
                    <div style={{ width: '100%', height: 280 }}>
                        {data.categoryStats && data.categoryStats.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart
                                    data={data.categoryStats}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="category"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        formatter={(val: any) => [`${val} bài`, 'Số lượng']}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {data.categoryStats.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">Chưa có dữ liệu danh mục</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tag Cloud & Top Trending Row */}
            <div className="dashboard-grid">
                {/* 3. Tag Cloud Từ khóa Hot 24h (Bigrams Extraction) */}
                <div className="dashboard-card">
                    <div className="card-header-flex">
                        <h2 className="card-title">☁️ Tag Cloud Từ Khóa Hot 24h</h2>
                        <span className="card-badge">NLP Bigrams</span>
                    </div>
                    {data.hotKeywords24h.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center', padding: '30px 0' }}>
                            Chưa đủ dữ liệu cụm từ lặp lại trong 24h qua.
                        </p>
                    ) : (
                        <div className="tag-cloud">
                            {data.hotKeywords24h.map((item, idx) => {
                                const size = Math.min(13 + item.count * 1.8, 22);
                                return (
                                    <span
                                        key={item.keyword}
                                        className="tag-item"
                                        style={{
                                            fontSize: `${size}px`,
                                            backgroundColor: idx < 3 ? '#eff6ff' : '#f8fafc',
                                            borderColor: idx < 3 ? '#bfdbfe' : '#e2e8f0',
                                            color: idx < 3 ? '#1d4ed8' : '#334155',
                                        }}
                                    >
                                        #{item.keyword} <small>({item.count})</small>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 4. Top 5 Bài Viết Trending */}
                <div className="dashboard-card">
                    <div className="card-header-flex">
                        <h2 className="card-title">🔥 Top Bài Viết Điểm Trend Cao Nhất</h2>
                        <span className="card-badge">Time-Decay</span>
                    </div>
                    <div className="trending-list">
                        {data.topTrendingArticles.map((art, index) => (
                            <div key={art.id} className="trending-item">
                                <div className="trending-rank">#{index + 1}</div>
                                <div className="trending-info">
                                    <a
                                        href={art.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="trending-link"
                                    >
                                        {art.title}
                                    </a>
                                    <div className="trending-meta">
                                        <span className="source-badge">{art.crawlerSourceName}</span>
                                        {art.category && <span className="category-tag">{art.category}</span>}
                                        <span className="trending-score">🔥 {art.trendScore} điểm</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
