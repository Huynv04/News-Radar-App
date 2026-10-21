import { useEffect, useState } from 'react';
import { historyApi } from '../../features/readinghistory/api/historyApi';
import type { ReadingHistoryItem } from '../../features/readinghistory/types/ReadingHistoryItem';
import './ReadingHistoryPage.css';

export function ReadingHistoryPage() {
    const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await historyApi.getAll(50);
            setHistory(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải lịch sử đọc tin.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleClear = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đọc tin không?')) return;
        try {
            await historyApi.clearAll();
            setHistory([]);
        } catch (err) {
            console.error('Lỗi xóa lịch sử:', err);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins} phút trước`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} giờ trước`;
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div className="history-page">
            <div className="history-header">
                <div className="history-header-left">
                    <span style={{ fontSize: '2rem' }}>🕒</span>
                    <div>
                        <h1 className="history-title">Lịch Sử Đọc Tin</h1>
                        <p className="history-subtitle">Các bài viết bạn đã xem gần đây ({history.length})</p>
                    </div>
                </div>
                {history.length > 0 && (
                    <button className="btn-clear-history" onClick={handleClear}>
                        🗑️ Xóa lịch sử
                    </button>
                )}
            </div>

            {isLoading && <p style={{ color: '#94a3b8' }}>Đang tải lịch sử đọc...</p>}
            {error && <p style={{ color: '#ef4444' }}>⚠️ {error}</p>}

            {!isLoading && !error && history.length === 0 && (
                <div className="history-empty">
                    <p style={{ fontSize: '2rem' }}>📖</p>
                    <h3>Chưa có bài viết nào trong lịch sử</h3>
                    <p>Khi bạn nhấp đọc các bài viết, chúng sẽ được lưu lại tại đây.</p>
                </div>
            )}

            <div className="history-list">
                {history.map((item) => (
                    <div key={item.id} className="history-item">
                        <div className="history-item-top">
                            <span className="history-item-source">{item.crawlerSourceName}</span>
                            <span>Đã đọc: {formatTimeAgo(item.readAt)}</span>
                        </div>
                        <a
                            href={item.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="history-item-title"
                        >
                            {item.articleTitle}
                        </a>
                        {item.articleSapo && <p className="history-item-sapo">{item.articleSapo}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ReadingHistoryPage;
