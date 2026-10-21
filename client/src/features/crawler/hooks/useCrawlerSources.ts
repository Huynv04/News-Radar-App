import { useState, useEffect, useCallback } from 'react';
import { crawlerSourceApi } from '../api/crawlerSourceApi';
import type { CrawlerSource, CreateCrawlerSourceDto } from '../types';

export function useCrawlerSources() {
    const [sources, setSources] = useState<CrawlerSource[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [statusMsg, setStatusMsg] = useState<string>('');

    const fetchSources = useCallback(async () => {
        try {
            setLoading(true);
            const data = await crawlerSourceApi.getAll();
            setSources(data);
        } catch (error) {
            console.error('Lỗi tải danh sách nguồn cào:', error);
            setStatusMsg('Không thể tải danh sách nguồn từ máy chủ.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSources();
    }, [fetchSources]);

    const createSource = async (formData: CreateCrawlerSourceDto) => {
        const created = await crawlerSourceApi.create(formData);
        setStatusMsg(`Đã tạo thành công nguồn '${formData.name}'`);
        fetchSources();
        setTimeout(() => setStatusMsg(''), 4000);
        return created;
    };

    const toggleStatus = async (source: CrawlerSource) => {
        const nextStatus = !source.isActive;
        await crawlerSourceApi.toggleStatus(source.id, nextStatus);
        setSources((prev) =>
            prev.map((s) => (s.id === source.id ? { ...s, isActive: nextStatus } : s))
        );
    };

    const deleteSource = async (id: string, name: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nguồn cào "${name}" (${id})?`)) return;
        await crawlerSourceApi.delete(id);
        setStatusMsg(`Đã xóa nguồn '${name}'`);
        fetchSources();
        setTimeout(() => setStatusMsg(''), 4000);
    };

    return {
        sources,
        loading,
        statusMsg,
        createSource,
        toggleStatus,
        deleteSource,
        refetch: fetchSources,
    };
}
