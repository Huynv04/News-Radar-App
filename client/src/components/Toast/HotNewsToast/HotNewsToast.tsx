import React from 'react';
import type { HotNewsNotification } from '../../../providers/SignalRProvider';
import './HotNewsToast.css';

interface HotNewsToastProps {
    item: HotNewsNotification | null;
    onClose: () => void;
    onClickItem?: (articleId: string) => void;
}

export const HotNewsToast: React.FC<HotNewsToastProps> = ({ item, onClose, onClickItem }) => {
    if (!item) return null;

    return (
        <div className="hot-news-toast" role="alert" aria-live="polite">
            <div
                className="toast-content"
                style={{ cursor: onClickItem ? 'pointer' : 'default' }}
                onClick={() => onClickItem && onClickItem(item.articleId)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="toast-badge">🔥 TIN NÓNG REAL-TIME</span>
                    <span className="toast-trend">Điểm: {item.trendScore}</span>
                </div>
                <p className="toast-title">
                    <strong>[{item.sourceName}]</strong> {item.title}
                </p>
                <span className="toast-hint">Nhấp để xem chi tiết bài viết →</span>
            </div>
            <button
                className="toast-close"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                aria-label="Đóng thông báo"
            >
                &times;
            </button>
        </div>
    );
};