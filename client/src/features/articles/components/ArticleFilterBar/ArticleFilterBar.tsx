import React from 'react';
import './ArticleFilterBar.css';

const CATEGORIES = [
    'Tất cả',
    'Thời sự',
    'Kinh tế',
    'Công nghệ',
    'Thể thao',
    'Giải trí',
    'Thế giới',
    'Sức khỏe',
    'Giáo dục',
];

const SENTIMENTS = [
    { label: 'Tất cả cảm xúc', value: '' },
    { label: '🟢 Tích cực', value: 'Positive' },
    { label: '🔴 Tiêu cực', value: 'Negative' },
    { label: '⚪ Trung lập', value: 'Neutral' },
];

export interface SourceOption {
    id: string;
    name: string;
}

export interface ArticleFilterBarProps {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    selectedSentiment: string;
    onSelectSentiment: (sentiment: string) => void;
    selectedSource: string;
    onSelectSource: (sourceId: string) => void;
    searchKeyword: string;
    onSearchChange: (keyword: string) => void;
    onSearchSubmit: (e: React.FormEvent) => void;
    onClearSearch: () => void;
    sources: SourceOption[];
    timeRange: string;
    onSelectTimeRange: (range: string) => void;
    customFromDate: string;
    onCustomFromDateChange: (date: string) => void;
    customToDate: string;
    onCustomToDateChange: (date: string) => void;

}

export const ArticleFilterBar: React.FC<ArticleFilterBarProps> = ({
    selectedCategory,
    onSelectCategory,
    selectedSentiment,
    onSelectSentiment,
    selectedSource,
    onSelectSource,
    searchKeyword,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    sources,
    timeRange,
    onSelectTimeRange,
    customFromDate,
    onCustomFromDateChange,
    customToDate,
    onCustomToDateChange,
}) => {

    return (
        <div>
            {/* Category Pills Bar */}
            <div className="category-scroll-bar">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => onSelectCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Time Filter Bar - Modern Glassmorphism */}
            <div className="time-filter-bar">
                <div className="time-filter-main">
                    <div className="time-filter-header">
                        <span className="time-filter-icon">🕒</span>
                        <span className="time-filter-label">Thời gian:</span>
                    </div>
                    <div className="time-pills">
                        {[
                            { label: 'Tất cả', value: 'all' },
                            { label: '24h qua', value: '24h' },
                            { label: '3 ngày qua', value: '3d' },
                            { label: '7 ngày qua', value: '7d' },
                            { label: '📅 Tùy chỉnh ngày', value: 'custom' },
                        ].map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className={`time-pill ${timeRange === item.value ? 'active' : ''}`}
                                onClick={() => onSelectTimeRange(item.value)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ô chọn ngày khi người dùng chọn Tùy chỉnh */}
                {timeRange === 'custom' && (
                    <div className="custom-date-container">
                        <div className="date-field">
                            <span className="date-label">Từ:</span>
                            <input
                                type="date"
                                className="date-input"
                                value={customFromDate}
                                onChange={(e) => onCustomFromDateChange(e.target.value)}
                            />
                        </div>
                        <span className="date-separator">→</span>
                        <div className="date-field">
                            <span className="date-label">Đến:</span>
                            <input
                                type="date"
                                className="date-input"
                                value={customToDate}
                                onChange={(e) => onCustomToDateChange(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Search and Secondary Filters */}
            <form className="filter-bar" onSubmit={onSearchSubmit}>
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Tìm kiếm tiêu đề, trích yếu hoặc từ khóa..."
                        value={searchKeyword}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchKeyword && (
                        <button type="button" className="btn-clear" onClick={onClearSearch} title="Xóa tìm kiếm">
                            ✕
                        </button>
                    )}
                    <button type="submit" className="btn-primary">
                        Tìm kiếm
                    </button>
                </div>

                <div className="filter-controls">
                    <select
                        className="source-select"
                        value={selectedSentiment}
                        onChange={(e) => onSelectSentiment(e.target.value)}
                    >
                        {SENTIMENTS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>

                    <select
                        className="source-select"
                        value={selectedSource}
                        onChange={(e) => onSelectSource(e.target.value)}
                    >
                        <option value="">Tất cả nguồn tin</option>
                        {sources.map((src) => (
                            <option key={src.id} value={src.id}>
                                {src.name}
                            </option>
                        ))}
                    </select>
                </div>
            </form>
        </div>
    );
};
