import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import type { DashboardAnalytics } from '../types';

export function useAnalytics() {
    const [data, setData] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [reprocessing, setReprocessing] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await analyticsApi.getDashboard();
            setData(res);
        } catch (err) {
            console.error('Lỗi tải dữ liệu Analytics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const handleReprocess = async () => {
        if (!window.confirm('Bạn có chắc muốn chạy lại toàn bộ thuật toán NLP và lọc bài viết trùng cho database?')) {
            return;
        }

        setReprocessing(true);
        setStatusMessage('Đang phân tích lại NLP và deduplication...');
        try {
            const res = await analyticsApi.reprocessArticles();
            setStatusMessage(`Hoàn tất: ${res.message} (Còn lại ${res.totalRemaining} bài độc bản)`);
            loadDashboard();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Lỗi không xác định';
            setStatusMessage(`Lỗi chạy lại NLP: ${message}`);
        } finally {
            setReprocessing(false);
            setTimeout(() => setStatusMessage(''), 8000);
        }
    };

    return {
        data,
        loading,
        reprocessing,
        statusMessage,
        loadDashboard,
        handleReprocess,
    };
}
